"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EDITABLE_FIELDS, PROFILE_FIELD_COUNT, STAGES, countFilled, isMeasurable, type Profile } from "@/lib/profile";
import { saveProfile } from "./actions";

type SaveState = "idle" | "saving" | "error";

const inputClass = "w-full rounded-2xl bg-field px-4 py-3 text-sm placeholder:text-muted/70";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

function changedFields(draft: Profile, saved: Profile) {
  const patch: Partial<Profile> = {};
  for (const k of EDITABLE_FIELDS) {
    if (draft[k] !== saved[k]) (patch as Record<string, unknown>)[k] = draft[k];
  }
  return patch;
}

export function ContextForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [p, setP] = useState<Profile>(initial);
  const [saved, setSaved] = useState<Profile>(initial);
  const [save, setSave] = useState<SaveState>("idle");
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const dirty = EDITABLE_FIELDS.some((k) => p[k] !== saved[k]);
  const limitInvalid = !(p.weekly_hours_limit >= 1 && p.weekly_hours_limit <= 80);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
    if (save === "error") setSave("idle");
  }

  async function onSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!dirty || save === "saving" || limitInvalid) return;
    const snapshot = p;
    setSave("saving");
    const { ok } = await saveProfile(changedFields(snapshot, saved));
    if (ok) {
      setSaved(snapshot);
      setSave("idle");
    } else {
      setSave("error");
    }
  }

  function onCancel() {
    setP(saved);
    setSave("idle");
  }

  // Browser-level warning for tab close / reload.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // In-app warning: intercept clicks on internal links (nav, logo) while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== window.location.origin) return;
      if (a.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(a.pathname + a.search);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (leaveTo && !d.open) d.showModal();
    if (!leaveTo && d.open) d.close();
  }, [leaveTo]);

  const filled = countFilled(p);
  const ready = !dirty && countFilled(saved) === PROFILE_FIELD_COUNT;
  const goalFuzzy = p.active_goal.trim().length > 0 && !isMeasurable(p.active_goal);

  return (
    <form onSubmit={onSave}>
      <p className="text-xs text-muted">Step 1 of 2 · about one minute</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium tracking-tight">Tell Applycast who it judges videos for</h1>
          <p className="mt-3 text-sm text-muted">Every video gets scored against these two cards. Click a field to edit it.</p>
        </div>
        <div className="flex items-center gap-2">
          <p role="status" className={`rounded-full border px-4 py-1.5 text-xs ${save === "error" ? "border-warn text-warn" : "border-line text-muted"}`}>
            {save === "saving" && "Saving…"}
            {save === "error" && "Couldn’t save — try again"}
            {save === "idle" && (dirty ? "Unsaved changes" : "✓ All changes saved")}
          </p>
          {dirty && (
            <button type="button" onClick={onCancel} className="rounded-full border border-line px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || save === "saving" || limitInvalid}
            className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-on-navy disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-shell bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">My business</h2>
            <span className="text-xs text-muted">2 fields</span>
          </div>
          <div className="mt-4">
            <label htmlFor="offer" className={labelClass}>Offer</label>
            <input
              id="offer"
              className={inputClass}
              value={p.offer}
              maxLength={300}
              onChange={(e) => update("offer", e.target.value)}
              placeholder="e.g. AI document review for mid-size law firms"
            />
          </div>
          <fieldset className="mt-4">
            <legend className={labelClass}>Stage</legend>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={p.stage === s}
                  onClick={() => update("stage", s)}
                  className={`rounded-full px-4 py-2 text-xs font-medium ${p.stage === s ? "bg-navy text-on-navy" : "bg-field text-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 rounded-2xl bg-chip p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">What your stage changes</p>
            <p className="mt-1 text-xs">Pick a stage. It decides which advice is realistic for you right now.</p>
          </div>
        </div>

        <div className="rounded-shell bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">My profile</h2>
            <span className="text-xs text-muted">3 fields</span>
          </div>
          <div className="mt-4">
            <label htmlFor="role" className={labelClass}>Role</label>
            <input
              id="role"
              className={inputClass}
              value={p.role}
              maxLength={200}
              onChange={(e) => update("role", e.target.value)}
              placeholder="e.g. Solo founder, runs sales and product"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="goal" className={labelClass}>Active goal</label>
            <input
              id="goal"
              className={inputClass}
              value={p.active_goal}
              maxLength={300}
              aria-describedby="goal-help"
              onChange={(e) => update("active_goal", e.target.value)}
              placeholder="e.g. Raise ARPA from $49 to $65 by March 31"
            />
            <p id="goal-help" className={`mt-1.5 text-xs ${goalFuzzy ? "font-medium text-warn" : "text-muted"}`}>
              Make it measurable: a number and a deadline. Every verdict is scored against it.
            </p>
          </div>
          <div className="mt-4">
            <label htmlFor="constraint" className={labelClass}>Main constraint</label>
            <input
              id="constraint"
              className={inputClass}
              value={p.constraint_text}
              maxLength={300}
              onChange={(e) => update("constraint_text", e.target.value)}
              placeholder="e.g. 6 hours a week outside customer work"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="weekly-limit" className={labelClass}>Weekly effort limit (hours)</label>
            <input
              id="weekly-limit"
              type="number"
              min={1}
              max={80}
              step={0.5}
              inputMode="decimal"
              className={inputClass}
              value={p.weekly_hours_limit}
              aria-describedby="limit-help"
              onChange={(e) => update("weekly_hours_limit", e.target.value === "" ? 0 : Number(e.target.value))}
            />
            <p id="limit-help" className="mt-1.5 text-xs text-muted">
              Hours per week you can give to actions (1 to 80). Gauges and plans are checked against it.
            </p>
          </div>
        </div>

        <aside className="flex flex-col rounded-shell bg-navy p-6 text-on-navy">
          <h2 className="text-lg font-medium">How Applycast reads you</h2>
          <p className="mt-4 text-xl leading-snug">
            You: <Slot value={p.role} hint="[your role]" />. You sell <Slot value={p.offer} hint="[your offer]" />, at{" "}
            <Slot value={p.stage ?? ""} hint="[your stage]" />. Goal: <Slot value={p.active_goal} hint="[a measurable goal]" />.
            Limit: <Slot value={p.constraint_text} hint="[your main constraint]" />.
          </p>
          <div className="mt-4 rounded-2xl bg-navy-soft p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Scoring rule</p>
            <p className="mt-1 text-xs">A video scores Strong only when it moves your active goal within your main constraint.</p>
          </div>
          <p className="mt-auto pt-6 text-xs">
            {filled} of {PROFILE_FIELD_COUNT} fields filled
          </p>
          {ready ? (
            <Link href="/analyze" className="mt-2 block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-navy">
              Looks right — analyze a video
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy opacity-60"
            >
              Looks right — analyze a video
            </button>
          )}
        </aside>
      </div>
      <dialog
        ref={dialogRef}
        onClose={() => setLeaveTo(null)}
        aria-labelledby="leave-title"
        className="m-auto w-[min(92vw,26rem)] rounded-shell bg-card p-6 text-ink backdrop:bg-black/40"
      >
        <h2 id="leave-title" className="text-lg font-medium">Leave without saving?</h2>
        <p className="mt-2 text-sm text-muted">Your changes to this page will be lost.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setLeaveTo(null)} className="rounded-full border border-line px-4 py-2 text-sm font-medium">
            Stay
          </button>
          <button
            type="button"
            onClick={() => {
              const to = leaveTo;
              setLeaveTo(null);
              if (to) router.push(to);
            }}
            className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-on-navy"
          >
            Leave
          </button>
        </div>
      </dialog>
    </form>
  );
}

function Slot({ value, hint }: { value: string; hint: string }) {
  return value.trim() ? <span>{value}</span> : <span className="opacity-60">{hint}</span>;
}
