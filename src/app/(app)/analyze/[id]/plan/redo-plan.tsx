"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { redoPlan } from "../actions";

const ERRORS: Record<string, string> = {
  not_found: "This plan can’t be redone.",
  nothing_to_adapt: "With your current context, nothing in this video applies anymore. Your plan is unchanged.",
  failed: "Something went wrong. Your plan is unchanged. Try again.",
};

// For when the goal, the schedule or the constraints changed: archives the plan and starts a new one.
export function RedoPlan({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRedo() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await redoPlan(analysisId, refresh);
    if (res.ok) router.push(`/analyze/${analysisId}/adaptations`);
    else {
      setBusy(false);
      setError(res.error);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-full border border-white/40 px-5 py-3 text-sm font-medium">
        Redo this plan
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
      <p className="font-semibold">Redo this plan?</p>
      <p className="mt-1 opacity-90">Use this if your goal, your weekly hours or your constraints changed.</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 opacity-95">
        <li>
          <Link href="/context" className="font-semibold underline">
            Update your context
          </Link>{" "}
          first (goal, weekly hours, constraints).
        </li>
        <li>Come back here and redo the plan: you pick the adaptations again and build a new plan.</li>
      </ol>
      <label className="mt-3 flex items-start gap-2">
        <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} className="mt-0.5 h-4 w-4 accent-white" />
        <span>My goal or constraints changed: also rewrite the adaptations for my current context.</span>
      </label>
      <p className="mt-3 text-xs opacity-80">
        This plan is archived, not deleted. What you already did stays in your stats; the actions still open leave My actions.
      </p>
      {error && (
        <p role="alert" className="mt-3 font-semibold">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onRedo} disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy disabled:opacity-60">
          {busy ? (refresh ? "Rewriting…" : "Archiving…") : "Redo the plan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}
