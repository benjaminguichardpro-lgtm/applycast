"use server";

import { after } from "next/server";
import { getProfile, isProfileComplete } from "@/lib/profile-db";
import { runAnalysis } from "@/lib/pipeline/run";
import { getAnalysesLeft } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { parseVideoId } from "@/lib/youtube";

export type StartResult =
  | { ok: true; id: string }
  | { ok: false; error: "invalid_url" | "profile_incomplete" | "unauthenticated" | "db_error" | "quota_exceeded" };

export async function startAnalysis(url: string): Promise<StartResult> {
  const videoId = parseVideoId(url);
  if (!videoId) return { ok: false, error: "invalid_url" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const profile = await getProfile(supabase, user.id);
  if (!isProfileComplete(profile)) return { ok: false, error: "profile_incomplete" };

  // Free plan: once the monthly analyses are used, a new analysis needs Pro. Plans, actions and check-ins are never gated.
  const quota = await getAnalysesLeft(supabase, user.id);
  if (quota.left === 0) return { ok: false, error: "quota_exceeded" };

  const { data, error } = await supabase
    .from("analyses")
    .insert({ user_id: user.id, video_id: videoId, status: "running", step: "fetching" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("startAnalysis insert failed:", error?.message);
    return { ok: false, error: "db_error" };
  }

  after(() => runAnalysis({ supabase, analysisId: data.id, videoId, profile }));
  return { ok: true, id: data.id };
}

export async function submitPastedTranscript(
  analysisId: string,
  text: string,
): Promise<{ ok: true } | { ok: false; error: "too_short" | "too_long" | "not_found" | "profile_incomplete" | "quota_exceeded" }> {
  const trimmed = text.trim();
  if (trimmed.length < 200) return { ok: false, error: "too_short" };
  if (trimmed.length > 400_000) return { ok: false, error: "too_long" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_found" };

  const { data: row } = await supabase
    .from("analyses")
    .select("id, video_id, status")
    .eq("id", analysisId)
    .maybeSingle();
  if (!row || row.status !== "failed") return { ok: false, error: "not_found" };

  const profile = await getProfile(supabase, user.id);
  if (!isProfileComplete(profile)) return { ok: false, error: "profile_incomplete" };
  const quota = await getAnalysesLeft(supabase, user.id);
  if (quota.left === 0) return { ok: false, error: "quota_exceeded" };

  // created_at restarts so the stale-run check below measures this attempt, not the failed one.
  await supabase
    .from("analyses")
    .update({ status: "running", step: "fetching", error_code: null, created_at: new Date().toISOString() })
    .eq("id", analysisId);
  after(() => runAnalysis({ supabase, analysisId, videoId: row.video_id, profile, pastedTranscript: trimmed }));
  return { ok: true };
}

export type AnalysisStatus = {
  status: "running" | "done" | "failed";
  step: string | null;
  errorCode: string | null;
  title: string | null;
};

const STALE_AFTER_MS = 5 * 60_000;

export async function getAnalysisStatus(id: string): Promise<AnalysisStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analyses")
    .select("status, step, error_code, title, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  // A run that never reported back (server restart, timeout) is surfaced as failed instead of spinning forever.
  if (data.status === "running" && Date.now() - new Date(data.created_at).getTime() > STALE_AFTER_MS) {
    await supabase.from("analyses").update({ status: "failed", step: null, error_code: "pipeline_error" }).eq("id", id);
    return { status: "failed", step: null, errorCode: "pipeline_error", title: data.title };
  }
  return { status: data.status, step: data.step, errorCode: data.error_code, title: data.title };
}
