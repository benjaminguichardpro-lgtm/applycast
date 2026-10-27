"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { DROP_REASONS } from "@/lib/action-meta";
import { formatHours } from "@/lib/effort";
import { setActionStatus } from "./actions";

export type ActionRow = {
  id: string;
  title: string;
  group: "today" | "week" | "later";
  dueDate: string | null;
  status: "open" | "done" | "postponed" | "dropped";
  postponedUntil: string | null;
  dropReason: string | null;
  effort: number;
  from: string | null;
};

// The viewer's date; null on the server so it never mismatches.
let clientNow: Date | null = null;
const getClientNow = () => (clientNow ??= new Date());
const subscribeNever = () => () => {};

export function TodayLabel() {
  const now = useSyncExternalStore(subscribeNever, getClientNow, () => null);
  return <>{now ? now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Today"}</>;
}

const short = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

type Panel = null | "postpone" | "drop";

export function ActionsList({ rows: initial, groups }: { rows: ActionRow[]; groups: { key: ActionRow["group"]; label: string }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [panel, setPanel] = useState<{ id: string; kind: Exclude<Panel, null> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const today = useSyncExternalStore(subscribeNever, getClientNow, () => null);

  async function apply(row: ActionRow, patch: Partial<ActionRow>, input: Parameters<typeof setActionStatus>[1]) {
    const before = row;
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    setPanel(null);
    setError(null);
    const res = await setActionStatus(row.id, input);
    if (res.ok) router.refresh();
    else {
      setRows((all) => all.map((r) => (r.id === row.id ? before : r)));
      setError(res.error === "past_date" ? "Pick a date from today on." : "Couldn’t save that change. Try again.");
    }
  }

  const clear = (r: ActionRow) => apply(r, { status: "open", postponedUntil: null, dropReason: null }, { status: "open" });

  function onDone(r: ActionRow) {
    if (r.status === "done") return clear(r);
    return apply(r, { status: "done", postponedUntil: null, dropReason: null }, { status: "done" });
  }
  function onPostponed(r: ActionRow) {
    if (r.status === "postponed") return clear(r);
    setDate("");
    setPanel({ id: r.id, kind: "postpone" });
  }
  function onDropped(r: ActionRow) {
    if (r.status === "dropped") return clear(r);
    setPanel({ id: r.id, kind: "drop" });
  }

  const sub = (r: ActionRow) => {
    const from = r.from ? ` · from “${r.from}”` : "";
    const time = `~${formatHours(r.effort)}`;
    if (r.status === "done") return `Done · ${time}${from}`;
    if (r.status === "postponed") return `Postponed${r.postponedUntil ? ` until ${short(r.postponedUntil)}` : ""}${from}`;
    if (r.status === "dropped") return `Dropped${r.dropReason ? ` · ${r.dropReason}` : ""}${from}`;
    const due = r.dueDate ? new Date(r.dueDate) : null;
    const isToday = due && today && due.toDateString() === today.toDateString();
    return `${due ? (isToday ? "Today" : due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })) : "Open"} · ${time}${from}`;
  };

  const seg = (on: boolean, tone: "done" | "postponed" | "dropped") =>
    `px-4 py-2 text-xs font-semibold rounded-full ${
      on ? (tone === "done" ? "bg-navy text-on-navy" : tone === "postponed" ? "bg-chip text-primary" : "bg-muted text-white dark:text-navy") : "text-ink"
    }`;

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-2xl border border-warn px-4 py-2 text-sm text-warn">
          {error}
        </p>
      )}
      {groups.map((g) => {
        const list = rows.filter((r) => r.group === g.key);
        if (list.length === 0) return null;
        return (
          <section key={g.key} aria-labelledby={`g-${g.key}`} className="rounded-shell bg-card p-6">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 id={`g-${g.key}`} className="text-xl font-medium">
                {g.label}
              </h2>
              <span className="text-xs text-muted">
                {list.length} action{list.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="divide-y divide-line">
              {list.map((r) => (
                <li key={r.id} className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${r.status === "dropped" ? "line-through opacity-70" : ""}`}>{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{sub(r)}</p>
                    </div>
                    <div role="group" aria-label={`Status of: ${r.title}`} className="flex rounded-full border border-line p-1">
                      <button type="button" aria-pressed={r.status === "done"} onClick={() => onDone(r)} className={seg(r.status === "done", "done")}>
                        {r.status === "done" ? "✓ Done" : "Done"}
                      </button>
                      <button type="button" aria-pressed={r.status === "postponed"} onClick={() => onPostponed(r)} className={seg(r.status === "postponed", "postponed")}>
                        Postponed
                      </button>
                      <button type="button" aria-pressed={r.status === "dropped"} onClick={() => onDropped(r)} className={seg(r.status === "dropped", "dropped")}>
                        Dropped
                      </button>
                    </div>
                  </div>

                  {panel?.id === r.id && panel.kind === "postpone" && (
                    <form
                      className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl bg-field p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (date) apply(r, { status: "postponed", postponedUntil: `${date}T00:00:00Z`, dropReason: null }, { status: "postponed", until: date });
                      }}
                    >
                      <div>
                        <label htmlFor={`until-${r.id}`} className="block text-xs font-medium text-muted">
                          Until when?
                        </label>
                        <input
                          id={`until-${r.id}`}
                          type="date"
                          required
                          min={today ? today.toISOString().slice(0, 10) : undefined}
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="mt-1 rounded-xl bg-card px-3 py-2 text-sm"
                        />
                      </div>
                      <button type="submit" disabled={!date} className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-on-navy disabled:opacity-50">
                        Postpone
                      </button>
                      <button type="button" onClick={() => setPanel(null)} className="rounded-full border border-line px-4 py-2 text-xs font-medium">
                        Cancel
                      </button>
                    </form>
                  )}

                  {panel?.id === r.id && panel.kind === "drop" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-field p-3" role="group" aria-label="Why are you dropping it?">
                      <span className="text-xs font-medium text-muted">Why?</span>
                      {DROP_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => apply(r, { status: "dropped", dropReason: reason, postponedUntil: null }, { status: "dropped", reason })}
                          className="rounded-full bg-card px-4 py-2 text-xs font-medium"
                        >
                          {reason}
                        </button>
                      ))}
                      <button type="button" onClick={() => setPanel(null)} className="rounded-full border border-line px-4 py-2 text-xs font-medium">
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
