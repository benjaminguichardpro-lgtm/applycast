"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AnalysisStepper } from "@/components/analysis-stepper";
import { EffortGauge } from "@/components/effort-gauge";
import { EFFORT_OPTIONS, formatHours, overBy, perWeekHours, round1, totalHours } from "@/lib/effort";
import { MAX_DAYS, MIN_DAYS } from "@/lib/pipeline/plan";
import { regeneratePlan, validatePlan } from "../actions";

type Step = { id: string; day: number; text: string; effort: number };

const ERRORS: Record<string, string> = {
  invalid_days: `Enter a whole number of days between ${MIN_DAYS} and ${MAX_DAYS}.`,
  none_selected: "No adaptation is selected anymore. Go back and select some.",
  not_found: "This plan can’t be changed anymore.",
  invalid: "Check your steps: each needs some text.",
  failed: "Something went wrong. Try again.",
};

// Stable per page load; null on the server so dates (which depend on the viewer's clock) never mismatch.
let clientNow: Date | null = null;
const getClientNow = () => (clientNow ??= new Date());
const subscribeNever = () => () => {};

const dayLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

export function PlanView({
  analysisId,
  planId,
  validated,
  validatedAt,
  checkinDueAt,
  durationDays,
  steps: initial,
  limit,
}: {
  analysisId: string;
  planId: string;
  validated: boolean;
  validatedAt: string | null;
  checkinDueAt: string | null;
  durationDays: number;
  steps: Step[];
  limit: number;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState(initial);
  const [daysInput, setDaysInput] = useState("");
  const [busy, setBusy] = useState<null | "regenerate" | "validate">(null);
  const [error, setError] = useState<string | null>(null);
  const today = useSyncExternalStore(subscribeNever, getClientNow, () => null);

  const edited = !validated && (steps.length !== initial.length || steps.some((s, i) => s.text !== initial[i]?.text || s.effort !== initial[i]?.effort));
  const total = totalHours(steps.map((s) => ({ effort: s.effort })));
  const perWeek = perWeekHours(total, durationDays);
  const over = overBy(perWeek, limit);

  async function onRegenerate() {
    if (busy) return;
    const raw = daysInput.trim();
    const days = raw === "" ? null : Number(raw);
    setBusy("regenerate");
    setError(null);
    const res = await regeneratePlan(planId, days);
    if (res.ok) {
      setDaysInput("");
      router.refresh();
    } else setError(res.error);
    setBusy(null);
  }

  async function onValidate() {
    if (busy || steps.length === 0 || steps.some((s) => s.text.trim().length < 3)) return;
    setBusy("validate");
    setError(null);
    const res = await validatePlan(planId, { durationDays, steps: steps.map((s) => ({ day: s.day, text: s.text, effort: s.effort })) });
    if (res.ok) router.refresh();
    else {
      setError(res.error);
      setBusy(null);
    }
  }

  const start = validatedAt ? new Date(validatedAt) : today;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AnalysisStepper analysisId={analysisId} current="plan" />
          <h1 className="mt-2 text-4xl font-medium tracking-tight">Your action plan</h1>
        </div>
        <Link href={`/analyze/${analysisId}/adaptations`} className="rounded-full border border-line px-4 py-2 text-sm">
          ← Adaptations
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-shell bg-card p-6">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <h2 className="text-xl font-medium">Steps</h2>
            <span className="text-xs text-muted">
              {steps.length} of 5 max{validated ? "" : " · click to rewrite"}
            </span>
          </div>

          <ol className="divide-y divide-line">
            {steps.map((s, i) => (
              <li key={s.id} className="flex items-start gap-3 py-4">
                <span aria-hidden="true" className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm text-on-navy">
                  {i + 1}
                </span>
                <span className="mt-2.5 shrink-0 rounded-full bg-chip px-3 py-1 text-xs font-medium text-primary">Day {s.day}</span>
                {validated ? (
                  <p className="mt-2 min-w-0 flex-1 text-sm">{s.text}</p>
                ) : (
                  <textarea
                    aria-label={`Step ${i + 1}`}
                    value={s.text}
                    rows={Math.max(2, Math.ceil(s.text.length / 55))}
                    maxLength={300}
                    onChange={(e) => setSteps((all) => all.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
                    className="min-w-0 flex-1 resize-none rounded-2xl bg-field px-4 py-2.5 text-sm"
                  />
                )}
                {validated ? (
                  <span className="mt-2.5 shrink-0 rounded-full border border-line px-3 py-1 text-xs">~{formatHours(s.effort)}</span>
                ) : (
                  <>
                    <select
                      aria-label={`Effort for step ${i + 1}`}
                      value={s.effort}
                      onChange={(e) => setSteps((all) => all.map((x) => (x.id === s.id ? { ...x, effort: Number(e.target.value) } : x)))}
                      className="mt-1.5 shrink-0 rounded-full border border-line bg-card px-3 py-2 text-xs"
                    >
                      {EFFORT_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          ~{formatHours(o)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`Delete step ${i + 1}`}
                      onClick={() => setSteps((all) => all.filter((x) => x.id !== s.id))}
                      className="mt-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ol>

          {steps.length === 0 && <p className="py-4 text-sm text-muted">No steps left. Regenerate the plan to get new ones.</p>}

          <div
            className={`mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm ${over > 0 ? "border-warn bg-warn/10 text-warn" : "border-line bg-field"}`}
          >
            <span className="font-semibold">
              Total {round1(total)} h · {round1(perWeek)} h per week
            </span>
            <span>
              {over > 0
                ? `Over your ${round1(limit)} h/week limit by ${formatHours(over)}`
                : `✓ Fits your limit: ${round1(limit)} h per week`}
            </span>
          </div>
          <div className="mt-3 max-w-sm text-ink">
            <div className="rounded-2xl bg-navy p-4 text-on-navy">
              <EffortGauge hours={total} limit={limit} perWeek={perWeek} />
            </div>
          </div>
        </div>

        <aside className="rounded-shell bg-navy p-6 text-on-navy">
          {validated ? (
            <>
              <h2 className="text-lg font-medium">Plan validated</h2>
              <p className="mt-3 text-4xl font-light">
                {steps.length} action{steps.length === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-sm opacity-85">
                Created in My actions. {start && checkinDueAt ? `Day-7 check-in on ${dayLabel(new Date(checkinDueAt))}.` : ""}
              </p>
              <Link href="/actions" className="mt-6 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-navy">
                Go to My actions
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium">Duration</h2>
              <p className="mt-3 text-xs opacity-80">Suggested</p>
              <p className="text-6xl font-light leading-none">
                {durationDays}
                <span className="ml-2 text-base">days</span>
              </p>
              <label htmlFor="days" className="mt-5 block text-xs opacity-80">
                Your own duration, in days
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="days"
                  type="number"
                  inputMode="numeric"
                  min={MIN_DAYS}
                  max={MAX_DAYS}
                  value={daysInput}
                  onChange={(e) => setDaysInput(e.target.value)}
                  placeholder="e.g. 14"
                  className="min-w-0 flex-1 rounded-full bg-navy-soft px-5 py-3 text-sm placeholder:text-white/70"
                />
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={busy !== null}
                  className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {busy === "regenerate" ? "Regenerating…" : "↻ Regenerate"}
                </button>
              </div>
              {edited && (
                <p className="mt-2 text-xs text-[#ff8a80]">
                  <span aria-hidden="true">ⓘ </span>This will replace your edits.
                </p>
              )}
              {start && (
                <div className="mt-5 rounded-2xl bg-navy-soft p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">If you validate now</p>
                  <p className="mt-1 text-sm">
                    {steps.length} action{steps.length === 1 ? "" : "s"} in My actions · ends {dayLabel(addDays(start, durationDays))} · day-7 check-in on{" "}
                    {dayLabel(addDays(start, 7))}
                  </p>
                </div>
              )}
              {error && (
                <p role="alert" className="mt-4 text-sm font-semibold text-[#ff8a80]">
                  {ERRORS[error] ?? "Something went wrong."}
                </p>
              )}
              <button
                type="button"
                onClick={onValidate}
                disabled={busy !== null || steps.length === 0 || steps.some((s) => s.text.trim().length < 3)}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy disabled:opacity-60"
              >
                {busy === "validate" ? "Validating…" : "Validate plan"}
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
