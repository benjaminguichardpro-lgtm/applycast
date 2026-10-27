import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAnalysesLeft } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { AnalysisStepper } from "@/components/analysis-stepper";
import { formatTime, thumbnailUrl, watchUrl } from "@/lib/youtube";
import { AnalyzeFlow } from "../analyze-flow";
import { ExpandProvider, PointToggle } from "./point-detail";

export const maxDuration = 120;

type Verdict = "strong" | "partial" | "low";

const BADGE: Record<Verdict, { label: string; icon: string }> = {
  strong: { label: "Strong match", icon: "✓" },
  partial: { label: "Partial match", icon: "◐" },
  low: { label: "Low match", icon: "⊖" },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: a } = await supabase.from("analyses").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!a) notFound();

  if (a.status !== "done") {
    return (
      <section>
        <h1 className="text-4xl font-medium tracking-tight">Analyzing your video</h1>
        <div className="mt-6 max-w-3xl">
          <AnalyzeFlow profileReady resumeId={id} />
        </div>
      </section>
    );
  }

  const { data: insights } = await supabase
    .from("insights")
    .select("id, ts_seconds, text, kind, tag, reason")
    .eq("analysis_id", id)
    .order("position", { ascending: true });
  const points = insights ?? [];
  const quota = await getAnalysesLeft(supabase, user.id);
  const applied = points.filter((p) => p.kind === "apply").length;
  const verdict = a.verdict as Verdict;
  const low = verdict === "low";
  const badge = BADGE[verdict];
  const published = a.published_at
    ? new Date(a.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AnalysisStepper analysisId={id} current="result" />
          <h1 className="mt-2 text-4xl font-medium tracking-tight">What this video says, and whether it’s for you</h1>
        </div>
        <Link href="/analyze" className="rounded-full border border-line px-4 py-2 text-sm">
          ← New analysis
        </Link>
      </div>

      <ExpandProvider videoId={a.video_id}>
      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-5 rounded-shell bg-card p-5 sm:flex-row">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-chip sm:w-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnailUrl(a.video_id)} alt="" className="h-full w-full object-cover" />
              {a.duration != null && (
                <span className="absolute bottom-2 right-2 rounded-full bg-navy px-2.5 py-0.5 text-xs text-on-navy">
                  {formatTime(a.duration)}
                </span>
              )}
            </div>
            <div className="min-w-0 self-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Video</p>
              <h2 className="mt-1 text-xl font-medium leading-snug">{a.title ?? "Untitled video"}</h2>
              <p className="mt-1 text-sm text-muted">{[a.channel, published].filter(Boolean).join(" · ")}</p>
              <a
                href={watchUrl(a.video_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-primary underline"
              >
                Open on YouTube ↗
              </a>
            </div>
          </div>

          <div className="rounded-shell bg-card p-6">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h2 className="text-xl font-medium">Summary</h2>
              <span className="text-xs text-muted">{points.length} points · click a time to jump</span>
            </div>
            <ol className="divide-y divide-line">
              {points.map((p) => (
                <li key={p.id} className="flex items-baseline gap-4 py-3.5 text-sm">
                  {p.ts_seconds != null ? (
                    <a
                      href={watchUrl(a.video_id, p.ts_seconds)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open the video at ${formatTime(p.ts_seconds)}`}
                      className="shrink-0 rounded-full bg-chip px-3 py-1 text-xs font-medium tabular-nums text-primary hover:underline"
                    >
                      {formatTime(p.ts_seconds)}
                    </a>
                  ) : (
                    <span className="shrink-0 rounded-full bg-chip px-3 py-1 text-xs text-muted" title="No timestamp in the pasted transcript">
                      —
                    </span>
                  )}
                  <PointToggle id={p.id} text={p.text} tone="light" />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className={`rounded-shell p-6 ${low ? "border border-line bg-card" : "bg-navy text-on-navy"}`}>
          <h2 className="text-lg font-medium">Verdict</h2>
          <p
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              low ? "border border-ink/40" : verdict === "strong" ? "bg-white text-navy" : "bg-navy-soft"
            }`}
          >
            <span aria-hidden="true">{badge.icon}</span>
            {badge.label}
          </p>
          <p className="mt-4 text-2xl font-light leading-snug">
            {low
              ? applied === 0
                ? "Low match: nothing to apply."
                : `Low match: only ${applied} of ${points.length} points applies.`
              : `${applied} of ${points.length} points apply to you.`}
          </p>
          <p className={`mt-3 text-sm ${low ? "text-muted" : "opacity-85"}`}>{a.verdict_reason}</p>

          <p className={`mt-5 text-[10px] font-semibold uppercase tracking-wider ${low ? "text-muted" : "opacity-80"}`}>
            Point by point{a.goal_metric ? ` · Goal metric: ${a.goal_metric}` : ""}
          </p>
          <ul className="mt-2 space-y-2">
            {points.map((p) => (
              <li key={p.id} className={`rounded-2xl p-3 text-sm ${low ? "bg-field" : "bg-navy-soft"}`}>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 tabular-nums opacity-70">{p.ts_seconds != null ? formatTime(p.ts_seconds) : "—"}</span>
                  <PointToggle id={p.id} text={p.text} tone={low ? "light" : "dark"} />
                </div>
                {p.kind === "apply" && (
                  <p className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-navy">
                    ↑ Moves {p.tag ?? "your goal"}
                  </p>
                )}
                {p.kind === "against" && (
                  <p className="mt-2 inline-block rounded-full border border-dashed border-current px-3 py-1 text-xs font-medium">
                    ↓ Works against your goal{p.tag ? ` (${p.tag})` : ""}
                  </p>
                )}
                {p.reason && (
                  <p className="mt-1.5 text-xs opacity-80">
                    {p.kind === "na" ? "— Not relevant — " : ""}
                    {p.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className={`mt-4 rounded-2xl border p-3 text-xs ${low ? "border-line" : "border-white/20"}`}>
            <p className="font-medium">Scored against: {a.goal_snapshot}</p>
            <p className="mt-0.5 opacity-80">Within: {a.constraint_snapshot}</p>
          </div>

          {low ? (
            <>
            <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-primary bg-chip p-4 text-sm text-ink">
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white dark:text-navy">
                ✓
              </span>
              <div>
                <p className="font-semibold">This analysis was not counted.</p>
                <p className="mt-0.5 text-muted">
                  A Low match is free.{quota.isPro ? "" : ` You still have ${quota.left} free ${quota.left === 1 ? "analysis" : "analyses"} this month.`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/analyze" className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white dark:text-navy">
                Skip
              </Link>
              <Link href="/analyze" className="rounded-full border border-line px-6 py-3 text-sm font-medium">
                Analyze another video
              </Link>
            </div>
            </>
          ) : (
            <>
              <Link
                href={`/analyze/${id}/adaptations`}
                className="mt-4 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-navy"
              >
                See the {applied} adaptation{applied === 1 ? "" : "s"}
              </Link>
            </>
          )}
        </aside>
      </div>
      </ExpandProvider>
    </section>
  );
}
