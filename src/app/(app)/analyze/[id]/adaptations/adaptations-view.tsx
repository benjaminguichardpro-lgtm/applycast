"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnalysisStepper } from "@/components/analysis-stepper";
import { EffortGauge } from "@/components/effort-gauge";
import { formatHours, totalHours } from "@/lib/effort";
import { formatTime } from "@/lib/youtube";
import { buildPlan, generateAdaptations, setAdaptationSelected } from "../actions";

type Item = {
  id: string;
  target: "business" | "profile";
  category: "Habit" | "Skill" | "Time" | null;
  text: string;
  effort: number;
  selected: boolean;
  from: { ts: number | null; text: string };
};
type LeftOut = { ts: number | null; text: string; kind: "against" | "na"; tag: string | null; reason: string | null };

const BUILD_ERRORS: Record<string, string> = {
  none_selected: "Select at least one adaptation.",
  already_validated: "You already validated a plan for this video.",
  not_found: "This analysis is no longer available.",
  failed: "Couldn’t build the plan. Try again.",
};

export function GenerateAdaptations({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run() {
    setError(null);
    const res = await generateAdaptations(analysisId);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <AnalysisStepper analysisId={analysisId} current="adaptations" />
      <h1 className="mt-2 text-4xl font-medium tracking-tight">From their playbook to yours</h1>
      <div className="mt-6 max-w-xl rounded-shell bg-card p-6" role="status" aria-live="polite">
        {!error ? (
          <div className="flex items-center gap-3 text-sm">
            <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Rewriting each point for your business and for you…
          </div>
        ) : (
          <div>
            <p role="alert" className="text-sm text-warn">
              {error === "nothing_to_adapt"
                ? "None of the points could be adapted to your goal. Skip this video."
                : error === "not_found"
                  ? "This analysis is no longer available."
                  : "Couldn’t write the adaptations. Try again."}
            </p>
            <div className="mt-3 flex gap-2">
              {error === "failed" && (
                <button type="button" onClick={run} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                  Try again
                </button>
              )}
              <Link href={`/analyze/${analysisId}`} className="rounded-full border border-line px-5 py-2.5 text-sm font-medium">
                Back to result
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function AdaptationsView({
  analysisId,
  planReady,
  items: initial,
  leftOut,
  goalMetric,
  limit,
  context,
}: {
  analysisId: string;
  planReady: boolean;
  items: Item[];
  leftOut: LeftOut[];
  goalMetric: string | null;
  limit: number;
  context: { offer: string; stage: string | null; role: string };
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [target, setTarget] = useState<"business" | "profile">("business");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = items.filter((i) => i.target === target);
  const selected = shown.filter((i) => i.selected);
  const hours = totalHours(selected);

  async function toggle(id: string, value: boolean) {
    setItems((all) => all.map((i) => (i.id === id ? { ...i, selected: value } : i)));
    const { ok } = await setAdaptationSelected(id, value);
    if (!ok) setItems((all) => all.map((i) => (i.id === id ? { ...i, selected: !value } : i)));
  }

  async function onBuild() {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setError(null);
    const res = await buildPlan(analysisId, target);
    // A validated plan can't be rebuilt: take the user to it instead of leaving them on an error.
    if (res.ok || res.error === "already_validated") router.push(`/analyze/${analysisId}/plan`);
    else {
      setBusy(false);
      setError(res.error);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-5 py-2.5 text-sm font-semibold ${active ? "bg-navy text-on-navy" : "text-ink"}`;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AnalysisStepper analysisId={analysisId} current="adaptations" planReady={planReady} />
          <h1 className="mt-2 text-4xl font-medium tracking-tight">From their playbook to yours</h1>
          {planReady && (
            <p role="status" className="mt-4 rounded-2xl border-2 border-primary bg-chip p-4 text-sm">
              You already validated a plan for this video.{" "}
              <a href={`/analyze/${analysisId}/plan`} className="font-semibold text-primary underline">
                Open your action plan →
              </a>
            </p>
          )}
        </div>
        <Link href={`/analyze/${analysisId}`} className="rounded-full border border-line px-4 py-2 text-sm">
          ← Result
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-shell bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-medium">
              {shown.length} adaptation{shown.length === 1 ? "" : "s"} · {selected.length} selected
            </h2>
            <div role="group" aria-label="Apply adaptations to" className="flex rounded-full bg-field p-1">
              <button type="button" aria-pressed={target === "business"} onClick={() => setTarget("business")} className={tabClass(target === "business")}>
                Apply to my business
              </button>
              <button type="button" aria-pressed={target === "profile"} onClick={() => setTarget("profile")} className={tabClass(target === "profile")}>
                Apply to my profile
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            {target === "business"
              ? "Changes to your offer, pricing and go-to-market. Uncheck what you won’t do."
              : "Habits, skills to build and time to free up — things you change in how you work."}
          </p>

          <ul className="mt-4 space-y-3">
            {shown.map((i) => (
              <li key={i.id} className="flex items-stretch gap-3">
                <div className="flex items-center">
                  <input
                    id={`sel-${i.id}`}
                    type="checkbox"
                    checked={i.selected}
                    onChange={(e) => toggle(i.id, e.target.checked)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <label htmlFor={`sel-${i.id}`} className="sr-only">
                    Include: {i.text}
                  </label>
                </div>
                <div className="grid flex-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1.4fr]">
                  <div className="rounded-2xl bg-field p-3 text-sm">
                    <p className="text-[11px] text-muted">In the video{i.from.ts !== null ? ` · ${formatTime(i.from.ts)}` : ""}</p>
                    <p className="mt-1">{i.from.text}</p>
                  </div>
                  <span aria-hidden="true" className="hidden self-center text-muted sm:block">→</span>
                  <div className={`rounded-2xl border p-3 text-sm ${i.selected ? "border-muted/60" : "border-line opacity-60"}`}>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                      <span>
                        {i.category && <span className="mr-2 rounded-full bg-chip px-2 py-0.5 font-semibold text-primary">{i.category}</span>}
                        {i.target === "business" ? "For your business" : "For you, as founder"}
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-ink">~{formatHours(i.effort)}</span>
                    </div>
                    <p className="mt-1.5 font-medium">{i.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">How these were adapted</h2>
          <p className="mt-3 text-sm opacity-85">
            {target === "business"
              ? `Rewritten for your business: ${context.offer}${context.stage ? `, at ${context.stage}` : ""}.${goalMetric ? ` Only points that raise ${goalMetric} made it.` : ""}`
              : `Rewritten for you: ${context.role}. Each one is something you do yourself, inside your weekly limit.`}
          </p>
          <div className="mt-5">
            <EffortGauge hours={hours} limit={limit} />
          </div>
          {leftOut.length > 0 && (
            <div className="mt-5 rounded-2xl bg-navy-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Left out · {leftOut.length} point{leftOut.length === 1 ? "" : "s"}</p>
              <ul className="mt-2 space-y-2 text-xs">
                {leftOut.map((l, n) => (
                  <li key={n}>
                    {l.ts !== null && <span className="mr-1.5 tabular-nums opacity-70">{formatTime(l.ts)}</span>}
                    {l.text} —{" "}
                    {l.kind === "against"
                      ? `works against your goal${l.tag ? ` (${l.tag})` : ""}`
                      : `not relevant${l.reason ? `, ${l.reason.replace(/^\W+/, "").replace(/^[A-Z]/, (c) => c.toLowerCase())}` : ""}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm font-semibold text-[#ff8a80]">
              {BUILD_ERRORS[error] ?? "Something went wrong."}
            </p>
          )}
          <button
            type="button"
            onClick={onBuild}
            disabled={busy || selected.length === 0}
            className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy disabled:opacity-60"
          >
            {busy ? "Building your plan…" : `Build the action plan (${selected.length} selected)`}
          </button>
        </aside>
      </div>
    </section>
  );
}
