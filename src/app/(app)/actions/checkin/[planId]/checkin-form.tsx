"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DROP_REASONS } from "@/lib/action-meta";
import { carryOverAction, saveCheckin, setActionStatus, snoozeCheckin } from "../../actions";

type Status = "open" | "done" | "postponed" | "dropped";
type Step = { id: string; title: string; status: Status };

const OUTCOMES = [
  { value: "worked", label: "Worked", hint: "Moved the metric" },
  { value: "no_effect", label: "No effect", hint: "Done, nothing changed" },
  { value: "too_early", label: "Too early", hint: "Can’t tell yet" },
  { value: "failed", label: "Failed", hint: "Backfired or blocked" },
] as const;

const ERRORS: Record<string, string> = {
  invalid: "Check the form: outcome, metric before and a result line are required.",
  already_saved: "This check-in was already saved.",
  not_found: "This plan is no longer available.",
};

export function CheckinForm({
  planId,
  title,
  goalMetric,
  validatedAt,
  initialActions,
}: {
  planId: string;
  title: string | null;
  goalMetric: string | null;
  validatedAt: string | null;
  initialActions: Step[];
}) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<string>("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [line, setLine] = useState("");
  const [steps, setSteps] = useState(initialActions);
  const [dropping, setDropping] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = steps.filter((s) => s.status === "done").length;
  const ready = outcome !== "" && before.trim() !== "" && line.trim() !== "";
  const validated = validatedAt ? new Date(validatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : null;

  async function change(step: Step, status: Status, run: () => Promise<{ ok: boolean }>) {
    const prev = step.status;
    setSteps((all) => all.map((s) => (s.id === step.id ? { ...s, status } : s)));
    setDropping(null);
    const res = await run();
    if (!res.ok) setSteps((all) => all.map((s) => (s.id === step.id ? { ...s, status: prev } : s)));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const res = await saveCheckin(planId, { outcome, metricBefore: before, metricAfter: after || undefined, resultLine: line });
    if (res.ok) {
      router.push("/actions");
      router.refresh();
    } else {
      setBusy(false);
      setError(res.error);
    }
  }

  async function onSnooze() {
    if (busy) return;
    setBusy(true);
    await snoozeCheckin(planId);
    router.push("/actions");
    router.refresh();
  }

  const pill = "rounded-full px-4 py-2 text-xs font-semibold";

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">
            Day 7{title ? ` · “${title}”` : ""}
            {validated ? ` · plan validated ${validated}` : ""}
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">What happened?</h1>
        </div>
        <Link href="/actions" className="rounded-full border border-line px-4 py-2 text-sm">
          ← My actions
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={onSave} className="rounded-shell bg-card p-6">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">Outcome</legend>
            <div className="grid gap-2 sm:grid-cols-4">
              {OUTCOMES.map((o) => (
                <label
                  key={o.value}
                  className={`cursor-pointer rounded-2xl border p-3 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--primary)] ${
                    outcome === o.value ? "border-navy bg-navy text-on-navy" : "border-line"
                  }`}
                >
                  <input type="radio" name="outcome" value={o.value} checked={outcome === o.value} onChange={() => setOutcome(o.value)} className="sr-only" />
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="mt-0.5 block text-[11px] opacity-80">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-2 text-xs font-medium text-muted">{goalMetric ?? "Metric"} — your goal metric, before and after</legend>
            <div className="flex flex-wrap items-center gap-3">
              <input aria-label="Metric before" value={before} maxLength={60} onChange={(e) => setBefore(e.target.value)} placeholder="e.g. $49" className="w-40 rounded-full bg-field px-5 py-3 text-sm" />
              <span aria-hidden="true">→</span>
              <input aria-label="Metric after (optional)" value={after} maxLength={60} onChange={(e) => setAfter(e.target.value)} placeholder="e.g. $52" className="w-40 rounded-full bg-field px-5 py-3 text-sm" />
              <span className="text-xs text-muted">Leave “after” empty if it’s too early to tell.</span>
            </div>
          </fieldset>

          <div className="mt-6">
            <label htmlFor="line" className="mb-2 block text-xs font-medium text-muted">
              Result, in one line
            </label>
            <input id="line" value={line} maxLength={120} onChange={(e) => setLine(e.target.value)} placeholder="e.g. Pricing page live — 2 demo requests quoted the $65 tier" className="w-full rounded-full bg-field px-5 py-3 text-sm" />
            <p className="mt-1 text-right text-xs text-muted">{line.length}/120</p>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-warn">
              {ERRORS[error] ?? "Couldn’t save the check-in. Try again."}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={onSnooze} disabled={busy} className="text-sm text-muted underline">
              Ask me tomorrow
            </button>
            <button type="submit" disabled={!ready || busy} className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:text-navy">
              {busy ? "Saving…" : "Save check-in"}
            </button>
          </div>
        </form>

        <aside className="self-start rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">Plan steps</h2>
          <p className="mt-2 text-3xl font-light">
            {done} of {steps.length} done
          </p>
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.id} className="rounded-2xl bg-navy-soft p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className={s.status === "dropped" ? "line-through opacity-70" : ""}>{s.title}</span>
                  <span className="shrink-0 rounded-full border border-white/40 px-2.5 py-0.5 text-[11px] capitalize">{s.status}</span>
                </div>
                {s.status === "done" ? (
                  <button type="button" onClick={() => change(s, "open", () => setActionStatus(s.id, { status: "open" }))} className="mt-2 text-xs underline">
                    Change
                  </button>
                ) : s.status === "open" || s.status === "postponed" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => change(s, "postponed", () => carryOverAction(s.id))} className={`${pill} bg-white text-navy`}>
                      Carry over to next week
                    </button>
                    <button type="button" onClick={() => setDropping(dropping === s.id ? null : s.id)} aria-expanded={dropping === s.id} className={`${pill} border border-white/40`}>
                      Drop
                    </button>
                    <button type="button" onClick={() => change(s, "done", () => setActionStatus(s.id, { status: "done" }))} className={`${pill} border border-white/40`}>
                      Mark done
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => change(s, "open", () => setActionStatus(s.id, { status: "open" }))} className="mt-2 text-xs underline">
                    Change
                  </button>
                )}
                {dropping === s.id && (
                  <div role="group" aria-label="Why are you dropping it?" className="mt-2 flex flex-wrap gap-2">
                    {DROP_REASONS.map((reason) => (
                      <button key={reason} type="button" onClick={() => change(s, "dropped", () => setActionStatus(s.id, { status: "dropped", reason }))} className={`${pill} bg-white/90 text-navy`}>
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs opacity-80">Changes here update My actions and your done rate.</p>
        </aside>
      </div>
    </section>
  );
}
