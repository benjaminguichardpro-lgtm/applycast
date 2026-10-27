"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { EFFORT_OPTIONS, groupForDay } from "@/lib/effort";
import { adaptPoints, dropContradictions, type ApplyPoint } from "@/lib/pipeline/adapt";
import { expandPoint as expandPointText, type PointDetail } from "@/lib/pipeline/expand";
import { buildPlanSteps, MAX_DAYS, MAX_STEPS, MIN_DAYS, type Plan } from "@/lib/pipeline/plan";
import { getProfile } from "@/lib/profile-db";
import { createClient } from "@/lib/supabase/server";

type Fail<E extends string> = { ok: false; error: E };

async function session() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, supabase: await createClient() };
}

// ---- Adaptations (step C) -------------------------------------------------

export async function generateAdaptations(analysisId: string): Promise<{ ok: true } | Fail<"not_found" | "nothing_to_adapt" | "failed">> {
  const s = await session();
  if (!s) return { ok: false, error: "not_found" };
  const { supabase, user } = s;

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, status, verdict")
    .eq("id", analysisId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!analysis || analysis.status !== "done" || analysis.verdict === "low") return { ok: false, error: "not_found" };

  const { count } = await supabase.from("adaptations").select("id", { count: "exact", head: true }).eq("analysis_id", analysisId);
  if (count) return { ok: true };

  const { data: insights } = await supabase
    .from("insights")
    .select("id, text, tag, reason, kind")
    .eq("analysis_id", analysisId)
    .order("position", { ascending: true });
  const points: ApplyPoint[] = (insights ?? [])
    .filter((i) => i.kind === "apply")
    .map((i, n) => ({ index: n + 1, insightId: i.id, text: i.text, tag: i.tag, reason: i.reason }));
  if (points.length === 0) return { ok: false, error: "nothing_to_adapt" };

  try {
    const profile = await getProfile(supabase, user.id);
    const drafted = await adaptPoints(profile, points);
    const rows = await dropContradictions(profile, drafted);
    if (rows.length === 0) return { ok: false, error: "nothing_to_adapt" };

    const { error } = await supabase.from("adaptations").insert(
      rows.map((r) => ({
        analysis_id: analysisId,
        insight_id: r.insightId,
        target: r.target,
        category: r.category,
        text: r.text,
        effort_hours: r.effort,
      })),
    );
    if (error) throw new Error(error.message);

    // A point whose adaptations were all dropped contradicted the goal: mark it against.
    const kept = new Set(rows.map((r) => r.insightId));
    const dropped = points.filter((p) => !kept.has(p.insightId)).map((p) => p.insightId);
    if (dropped.length) await supabase.from("insights").update({ kind: "against" }).in("id", dropped);
    return { ok: true };
  } catch (e) {
    console.error("generateAdaptations failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "failed" };
  }
}

export async function setAdaptationSelected(id: string, selected: boolean): Promise<{ ok: boolean }> {
  const s = await session();
  if (!s) return { ok: false };
  const { error } = await s.supabase.from("adaptations").update({ selected }).eq("id", id);
  return { ok: !error };
}

// ---- Plan (step D) --------------------------------------------------------

type Target = "business" | "profile";

async function selectedAdaptations(supabase: SupabaseClient, analysisId: string, target: Target) {
  const { data } = await supabase
    .from("adaptations")
    .select("text, effort_hours, target")
    .eq("analysis_id", analysisId)
    .eq("target", target)
    .eq("selected", true);
  return (data ?? []).map((a) => ({ text: a.text as string, effort: Number(a.effort_hours), target: a.target as string }));
}

async function writeSteps(supabase: SupabaseClient, planId: string, plan: Plan) {
  await supabase.from("plan_steps").delete().eq("plan_id", planId);
  const { error } = await supabase.from("plan_steps").insert(
    plan.steps.map((st, i) => ({ plan_id: planId, position: i + 1, day: st.day, text: st.text, effort_hours: st.effort })),
  );
  if (error) throw new Error(error.message);
  await supabase.from("plans").update({ duration_days: plan.durationDays }).eq("id", planId);
}

const targetSchema = z.enum(["business", "profile"]);

export async function buildPlan(
  analysisId: string,
  target: Target,
): Promise<{ ok: true } | Fail<"not_found" | "none_selected" | "already_validated" | "failed">> {
  const s = await session();
  if (!s || !targetSchema.safeParse(target).success) return { ok: false, error: "not_found" };
  const { supabase, user } = s;

  const { data: plans } = await supabase.from("plans").select("id, status").eq("analysis_id", analysisId);
  if (plans?.some((p) => p.status === "validated")) return { ok: false, error: "already_validated" };

  const selected = await selectedAdaptations(supabase, analysisId, target);
  if (selected.length === 0) return { ok: false, error: "none_selected" };

  try {
    const profile = await getProfile(supabase, user.id);
    const plan = await buildPlanSteps(profile, selected, null);

    // One draft per analysis: a new build replaces the previous one.
    await supabase.from("plans").delete().eq("analysis_id", analysisId).eq("status", "draft");
    const { data: row, error } = await supabase
      .from("plans")
      .insert({ analysis_id: analysisId, duration_days: plan.durationDays, status: "draft", target })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "could not create plan");
    await writeSteps(supabase, row.id, plan);
    return { ok: true };
  } catch (e) {
    console.error("buildPlan failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "failed" };
  }
}

export async function regeneratePlan(
  planId: string,
  days: number | null,
): Promise<{ ok: true } | Fail<"invalid_days" | "not_found" | "none_selected" | "failed">> {
  if (days !== null && (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS)) return { ok: false, error: "invalid_days" };
  const s = await session();
  if (!s) return { ok: false, error: "not_found" };
  const { supabase, user } = s;

  const { data: plan } = await supabase.from("plans").select("id, analysis_id, status, target").eq("id", planId).maybeSingle();
  if (!plan || plan.status !== "draft" || !plan.target) return { ok: false, error: "not_found" };

  const selected = await selectedAdaptations(supabase, plan.analysis_id, plan.target);
  if (selected.length === 0) return { ok: false, error: "none_selected" };

  try {
    const profile = await getProfile(supabase, user.id);
    await writeSteps(supabase, planId, await buildPlanSteps(profile, selected, days));
    return { ok: true };
  } catch (e) {
    console.error("regeneratePlan failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "failed" };
  }
}

const validateSchema = z
  .object({
    durationDays: z.number().int().min(MIN_DAYS).max(MAX_DAYS),
    steps: z
      .array(
        z.object({
          day: z.number().int().min(1),
          text: z.string().trim().min(3).max(300),
          effort: z.number().refine((n) => (EFFORT_OPTIONS as readonly number[]).includes(n)),
        }),
      )
      .min(1)
      .max(MAX_STEPS),
  })
  .refine((v) => v.steps.every((st) => st.day <= v.durationDays));

const DAY_MS = 86_400_000;

// Validating creates the actions and sets the day-7 check-in date.
export async function validatePlan(
  planId: string,
  input: unknown,
): Promise<{ ok: true } | Fail<"invalid" | "not_found" | "failed">> {
  const parsed = validateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const s = await session();
  if (!s) return { ok: false, error: "not_found" };
  const { supabase } = s;

  const { data: plan } = await supabase.from("plans").select("id, status").eq("id", planId).maybeSingle();
  if (!plan || plan.status !== "draft") return { ok: false, error: "not_found" };

  try {
    const { durationDays, steps } = parsed.data;
    const ordered = [...steps].sort((a, b) => a.day - b.day);
    await supabase.from("plan_steps").delete().eq("plan_id", planId);
    const { data: rows, error } = await supabase
      .from("plan_steps")
      .insert(ordered.map((st, i) => ({ plan_id: planId, position: i + 1, day: st.day, text: st.text, effort_hours: st.effort })))
      .select("id, position")
      .order("position", { ascending: true });
    if (error || !rows) throw new Error(error?.message ?? "could not save steps");

    const now = Date.now();
    const { error: actionsError } = await supabase.from("actions").insert(
      ordered.map((st, i) => ({
        plan_id: planId,
        step_id: rows[i].id,
        title: st.text,
        group: groupForDay(st.day),
        due_date: new Date(now + (st.day - 1) * DAY_MS).toISOString(),
        status: "open",
        effort_hours: st.effort,
      })),
    );
    if (actionsError) throw new Error(actionsError.message);

    const { error: planError } = await supabase
      .from("plans")
      .update({
        status: "validated",
        duration_days: durationDays,
        validated_at: new Date(now).toISOString(),
        checkin_due_at: new Date(now + 7 * DAY_MS).toISOString(),
      })
      .eq("id", planId);
    if (planError) throw new Error(planError.message);
    return { ok: true };
  } catch (e) {
    console.error("validatePlan failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "failed" };
  }
}

// ---- Longer summary of one point (generated on click, then cached) --------

export async function expandPoint(insightId: string): Promise<{ ok: true; detail: PointDetail } | Fail<"not_found" | "failed">> {
  const s = await session();
  if (!s) return { ok: false, error: "not_found" };
  const { supabase } = s;

  const { data: insight } = await supabase
    .from("insights")
    .select("id, analysis_id, text, ts_seconds, detail")
    .eq("id", insightId)
    .maybeSingle();
  if (!insight) return { ok: false, error: "not_found" };
  if (insight.detail) return { ok: true, detail: insight.detail as PointDetail };

  const { data: analysis } = await supabase.from("analyses").select("transcript_text").eq("id", insight.analysis_id).maybeSingle();
  if (!analysis?.transcript_text) return { ok: false, error: "not_found" };

  try {
    const detail = await expandPointText(insight.text, analysis.transcript_text, insight.ts_seconds);
    await supabase.from("insights").update({ detail }).eq("id", insightId);
    return { ok: true, detail };
  } catch (e) {
    console.error("expandPoint failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "failed" };
  }
}
