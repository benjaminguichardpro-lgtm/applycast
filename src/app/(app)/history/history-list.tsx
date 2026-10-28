"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VerdictBadge } from "@/components/verdict-badge";
import { thumbnailUrl } from "@/lib/youtube";
import { deleteAnalysis } from "./actions";

export type HistoryRow = {
  id: string;
  videoId: string;
  title: string;
  channel: string | null;
  verdict: "strong" | "partial" | "low";
  createdAt: string;
  progress: { done: number; total: number } | null;
};

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<HistoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (target && !d.open) d.showModal();
    if (!target && d.open) d.close();
  }, [target]);

  async function confirmDelete() {
    if (!target) return;
    setBusy(true);
    setError(false);
    const { ok } = await deleteAnalysis(target.id);
    setBusy(false);
    if (ok) {
      setTarget(null);
      router.refresh();
    } else setError(true);
  }

  const detail = (r: HistoryRow) =>
    [r.channel, `analyzed ${day(r.createdAt)}`, r.progress ? `${r.progress.done}/${r.progress.total} actions done` : r.verdict === "low" ? "Skipped" : "No plan yet"]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <ul className="divide-y divide-line rounded-shell bg-card p-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl(r.videoId)} alt="" className="h-11 w-16 shrink-0 rounded-xl bg-chip object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="truncate text-xs text-muted">{detail(r)}</p>
            </div>
            <VerdictBadge verdict={r.verdict} />
            <Link href={`/analyze/${r.id}`} className="rounded-full border border-line px-4 py-2 text-xs font-medium">
              Open
            </Link>
            <button
              type="button"
              aria-label={`Delete “${r.title}”`}
              onClick={() => {
                setError(false);
                setTarget(r);
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-line"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setTarget(null)}
        aria-labelledby="delete-title"
        className="m-auto w-[min(92vw,28rem)] rounded-shell bg-card p-6 text-ink backdrop:bg-black/40"
      >
        <h2 id="delete-title" className="text-lg font-medium">
          Delete this analysis?
        </h2>
        <p className="mt-2 text-sm text-muted">
          “{target?.title}” and its plan and actions will be deleted. Check-ins you already saved still count in your done rate.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-warn">
            Couldn’t delete it. Try again.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setTarget(null)} className="rounded-full border border-line px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={busy} className="rounded-full bg-warn px-4 py-2 text-sm font-semibold text-white dark:text-black disabled:opacity-60">
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
