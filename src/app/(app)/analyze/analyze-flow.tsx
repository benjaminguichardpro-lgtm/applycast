"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { percentFor, STEPS, stepState } from "@/lib/analysis-steps";
import { getAnalysisStatus, startAnalysis, submitPastedTranscript } from "./actions";

type View =
  | { kind: "form" }
  | { kind: "running"; id: string }
  | { kind: "failed"; id: string; code: string; title: string | null }
  | { kind: "paste"; id: string; title: string | null };

const FORM_ERRORS: Record<string, string> = {
  invalid_url: "That doesn’t look like a YouTube link. Paste a youtube.com/watch or youtu.be URL.",
  unauthenticated: "Your session expired. Sign in again.",
  db_error: "Couldn’t start the analysis. Try again in a moment.",
};

const PASTE_ERRORS: Record<string, string> = {
  too_short: "That’s too short to analyze. Paste the full transcript.",
  too_long: "That transcript is too long. Paste a shorter one.",
  not_found: "This analysis can’t take a transcript anymore. Try another URL.",
  profile_incomplete: "Complete your context first.",
};

export function AnalyzeFlow({ profileReady, resumeId }: { profileReady: boolean; resumeId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<View>(resumeId ? { kind: "running", id: resumeId } : { kind: "form" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>("fetching");
  const [pasted, setPasted] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);

  const runningId = view.kind === "running" ? view.id : null;

  useEffect(() => {
    if (!runningId) return;
    let stopped = false;
    const tick = async () => {
      const s = await getAnalysisStatus(runningId);
      if (stopped) return;
      if (!s) {
        setView({ kind: "failed", id: runningId, code: "pipeline_error", title: null });
        return;
      }
      if (s.status === "done") {
        // refresh() also re-renders the layout, so the "N left" banner reflects the analysis just counted.
        if (pathname !== `/analyze/${runningId}`) router.push(`/analyze/${runningId}`);
        router.refresh();
        return;
      }
      if (s.status === "failed") {
        setView({ kind: "failed", id: runningId, code: s.errorCode ?? "pipeline_error", title: s.title });
        return;
      }
      setStep(s.step);
      timer = setTimeout(tick, 1500);
    };
    let timer = setTimeout(tick, 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [runningId, pathname, router]);

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !url.trim()) return;
    setBusy(true);
    setError(null);
    const res = await startAnalysis(url);
    setBusy(false);
    if (res.ok) {
      setStep("fetching");
      setView({ kind: "running", id: res.id });
    } else {
      setError(res.error);
    }
  }

  async function onSubmitPaste(e: React.FormEvent) {
    e.preventDefault();
    if (view.kind !== "paste" || busy) return;
    setBusy(true);
    setError(null);
    const res = await submitPastedTranscript(view.id, pasted);
    setBusy(false);
    if (res.ok) {
      setStep("fetching");
      setView({ kind: "running", id: view.id });
    } else {
      setError(res.error);
    }
  }

  function tryAnother() {
    setView({ kind: "form" });
    setUrl("");
    setError(null);
    setPasted("");
    if (pathname !== "/analyze") router.push("/analyze");
    else setTimeout(() => urlRef.current?.focus(), 0);
  }

  return (
    <div className="rounded-shell bg-card p-6 sm:p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-medium">New analysis</h2>
        <span className="text-xs text-muted">YouTube links only</span>
      </div>

      {view.kind === "form" && (
        <form onSubmit={onAnalyze} className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={urlRef}
              aria-label="YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={!profileReady}
              placeholder="Paste a YouTube URL — https://youtube.com/watch?v=…"
              className="min-w-0 flex-1 rounded-full bg-field px-5 py-3.5 text-sm placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={!profileReady || busy || !url.trim()}
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white disabled:opacity-50 dark:text-navy"
            >
              {busy ? "Starting…" : "Analyze"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-warn">
              {error === "profile_incomplete" ? "Complete your context first." : (FORM_ERRORS[error] ?? "Something went wrong.")}
            </p>
          )}
          {!profileReady && (
            <p className="mt-3 text-sm text-muted">
              Applycast scores every video against your context.{" "}
              <Link href="/context" className="font-semibold text-primary underline">
                Complete and save your context
              </Link>{" "}
              to analyze a video.
            </p>
          )}
        </form>
      )}

      {view.kind === "running" && <Progress step={step} />}

      {view.kind === "failed" && (
        <div className="mt-5 rounded-3xl border border-dashed border-muted/60 p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-xs">!</span>
            {view.code === "no_transcript" ? "Transcript unavailable" : "Analysis failed"}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {view.code === "no_transcript" &&
              `${view.title ? `“${view.title}”` : "This video"} has no captions we can read, so there is nothing to analyze. Paste the transcript yourself, or try another video. `}
            {view.code === "extraction_failed" &&
              "We couldn’t pull points we could check against the transcript. Paste a cleaner transcript, or try another video. "}
            {view.code === "pipeline_error" && "Something went wrong on our side. Try another video, or paste the transcript. "}
            This didn’t use a free analysis.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView({ kind: "paste", id: view.id, title: view.title })}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white dark:text-navy"
            >
              Paste transcript
            </button>
            <button type="button" onClick={tryAnother} className="rounded-full border border-line px-5 py-2.5 text-sm font-medium">
              Try another URL
            </button>
          </div>
        </div>
      )}

      {view.kind === "paste" && (
        <form onSubmit={onSubmitPaste} className="mt-5">
          <label htmlFor="transcript" className="mb-1.5 block text-sm font-medium">
            Transcript{view.title ? ` for “${view.title}”` : ""}
          </label>
          <p id="transcript-help" className="mb-2 text-xs text-muted">
            Put a timestamp at the start of each line (06:40 text) so points can link to the video. Without timestamps, points
            have no time links.
          </p>
          <textarea
            id="transcript"
            aria-describedby="transcript-help"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={10}
            className="w-full rounded-2xl bg-field p-4 text-sm"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-warn">
              {PASTE_ERRORS[error] ?? "Something went wrong."}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={busy || !pasted.trim()}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:text-navy"
            >
              {busy ? "Starting…" : "Analyze this transcript"}
            </button>
            <button type="button" onClick={tryAnother} className="rounded-full border border-line px-5 py-2.5 text-sm font-medium">
              Try another URL
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Progress({ step }: { step: string | null }) {
  const percent = percentFor(step, false);
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-5">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-chip" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - percent / 100)}
              className="stroke-primary transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-2xl font-medium leading-none">{percent}%</p>
              <p className="mt-1 text-[11px] text-muted">Analyzing</p>
            </div>
          </div>
        </div>
        <ul role="status" aria-live="polite" className="w-full space-y-3 text-sm">
          {STEPS.map((s) => {
            const st = stepState(s.key, step, false);
            return (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-3 ${st === "queued" ? "text-muted" : "font-medium"}`}>
                  <StepIcon state={st} />
                  {s.label}
                </span>
                <span className="text-xs text-muted">{st === "done" ? "Done" : st === "running" ? "Running" : "Queued"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-5 text-xs text-muted">Usually under a minute. It uses 1 of your free analyses once the verdict is ready, unless it’s a Low match.</p>
    </div>
  );
}

function StepIcon({ state }: { state: "done" | "running" | "queued" }) {
  if (state === "done")
    return (
      <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-navy text-xs text-on-navy">
        ✓
      </span>
    );
  if (state === "running")
    return <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
  return <span aria-hidden="true" className="h-6 w-6 rounded-full border-2 border-dashed border-muted/60" />;
}
