import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../profile";
import { getTranscript, TranscriptUnavailableError } from "../transcript";
import { parsePastedTranscript } from "../transcript/parse";
import { fetchOEmbed, fetchVideoMeta } from "../transcript/supadata";
import type { Transcript } from "../transcript/types";
import { formatTime } from "../youtube";
import { ExtractionError, extractPoints } from "./extract";
import { scorePoints } from "./verdict";

export type StepName = "fetching" | "summarizing" | "matching" | "scoring";
export type ErrorCode = "no_transcript" | "extraction_failed" | "pipeline_error";

type RunInput = {
  supabase: SupabaseClient;
  analysisId: string;
  videoId: string;
  profile: Profile;
  pastedTranscript?: string;
};

// Runs the whole analysis and records progress on the analyses row; never throws.
export async function runAnalysis({ supabase, analysisId, videoId, profile, pastedTranscript }: RunInput) {
  const update = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from("analyses").update(patch).eq("id", analysisId);
    if (error) console.error("analysis update failed:", error.message);
  };
  const fail = (code: ErrorCode) => update({ status: "failed", step: null, error_code: code });

  try {
    await update({ status: "running", step: "fetching", error_code: null });

    let transcript: Transcript;
    if (pastedTranscript) {
      transcript = { segments: parsePastedTranscript(pastedTranscript), lang: null, source: "pasted" };
    } else {
      try {
        transcript = await getTranscript(videoId);
      } catch (e) {
        if (e instanceof TranscriptUnavailableError) {
          const meta = await fetchOEmbed(videoId);
          await update({ title: meta.title, channel: meta.channel });
          return fail("no_transcript");
        }
        throw e;
      }
      const meta = await fetchVideoMeta(videoId);
      await update({ title: meta.title, channel: meta.channel, published_at: meta.publishedAt, duration: meta.duration });
    }
    await update({
      source: transcript.source,
      transcript_text: transcript.segments
        .map((s) => (s.start === null ? s.text : `[${formatTime(s.start)}] ${s.text}`))
        .join("\n"),
    });

    await update({ step: "summarizing" });
    const points = await extractPoints(transcript);

    await update({ step: "matching" });
    const scored = await scorePoints(profile, points);

    await update({ step: "scoring" });
    await supabase.from("insights").delete().eq("analysis_id", analysisId);
    const { data: rows, error: insertError } = await supabase
      .from("insights")
      .insert(
        scored.points.map((p, i) => ({
          analysis_id: analysisId,
          position: i,
          ts_seconds: p.tsSeconds,
          text: p.text,
          kind: p.kind,
          tag: p.tag,
          reason: p.reason,
          is_key: p.isKey,
          key_reason: p.keyReason,
        })),
      )
      .select("id");
    if (insertError || !rows) throw new Error(insertError?.message ?? "could not save insights");

    await update({
      status: "done",
      step: null,
      verdict: scored.verdict,
      verdict_reason: scored.verdictReason,
      goal_metric: scored.goalMetric,
      goal_snapshot: profile.active_goal,
      constraint_snapshot: profile.constraint_text,
    });
    // Counted only now, and only if there is something to apply: a failed analysis or a Low match never uses the free quota.
    if (scored.verdict !== "low") {
      const { error: usageError } = await supabase.rpc("consume_analysis");
      if (usageError) console.error("consume_analysis failed:", usageError.message);
    }
  } catch (e) {
    console.error("analysis failed:", e instanceof Error ? e.message : e);
    await fail(e instanceof ExtractionError ? "extraction_failed" : "pipeline_error");
  }
}
