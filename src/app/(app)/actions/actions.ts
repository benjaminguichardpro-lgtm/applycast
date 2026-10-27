"use server";

import { z } from "zod";
import { DROP_REASONS } from "@/lib/action-meta";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const statusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("open") }),
  z.object({ status: z.literal("done") }),
  z.object({ status: z.literal("postponed"), until: isoDate }),
  z.object({ status: z.literal("dropped"), reason: z.enum(DROP_REASONS) }),
]);

type Result = { ok: true } | { ok: false; error: string };

// One click sets a status, a second click clears it back to open ("open" resets the extra fields).
export async function setActionStatus(id: string, input: unknown): Promise<Result> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await getCurrentUser())) return { ok: false, error: "unauthenticated" };

  const v = parsed.data;
  if (v.status === "postponed" && v.until < new Date().toISOString().slice(0, 10)) return { ok: false, error: "past_date" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update({
      status: v.status,
      postponed_until: v.status === "postponed" ? `${v.until}T00:00:00Z` : null,
      drop_reason: v.status === "dropped" ? v.reason : null,
    })
    .eq("id", id);
  return error ? { ok: false, error: "failed" } : { ok: true };
}

export async function carryOverAction(id: string): Promise<Result> {
  const until = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  return setActionStatus(id, { status: "postponed", until });
}

const checkinSchema = z.object({
  outcome: z.enum(["worked", "no_effect", "too_early", "failed"]),
  metricBefore: z.string().trim().min(1).max(60),
  metricAfter: z.string().trim().max(60).optional(),
  resultLine: z.string().trim().min(1).max(120),
});

export async function saveCheckin(planId: string, input: unknown): Promise<Result> {
  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("id, status").eq("id", planId).maybeSingle();
  if (!plan || plan.status !== "validated") return { ok: false, error: "not_found" };
  const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true }).eq("plan_id", planId);
  if (count) return { ok: false, error: "already_saved" };

  const { data: actions } = await supabase.from("actions").select("status").eq("plan_id", planId);
  const { error } = await supabase.from("checkins").insert({
    user_id: user.id,
    plan_id: planId,
    outcome: parsed.data.outcome,
    metric_before: parsed.data.metricBefore,
    metric_after: parsed.data.metricAfter || null,
    result_line: parsed.data.resultLine,
    actions_total: actions?.length ?? 0,
    actions_done: actions?.filter((a) => a.status === "done").length ?? 0,
  });
  return error ? { ok: false, error: "failed" } : { ok: true };
}

// "Ask me tomorrow": pushes the check-in back a day and lets the email go out again.
export async function snoozeCheckin(planId: string): Promise<Result> {
  if (!(await getCurrentUser())) return { ok: false, error: "unauthenticated" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ checkin_due_at: new Date(Date.now() + 86_400_000).toISOString(), checkin_emailed_at: null })
    .eq("id", planId)
    .eq("status", "validated");
  return error ? { ok: false, error: "failed" } : { ok: true };
}
