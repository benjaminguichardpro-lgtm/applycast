"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteAccount } from "@/app/auth/account-actions";
import { signOut } from "@/app/auth/actions";
import { openPortal } from "@/app/(app)/upgrade/actions";

export function UserMenu({ email, isPro, isFounding }: { email: string; isPro: boolean; isFounding: boolean }) {
  const initials = email.slice(0, 2).toUpperCase();
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (confirming && !d.open) d.showModal();
    if (!confirming && d.open) d.close();
  }, [confirming]);

  function onDelete() {
    setError(false);
    start(async () => {
      const res = await deleteAccount(); // redirects on success
      if (res && !res.ok) setError(true);
    });
  }

  const item = "w-full rounded-xl px-2 py-2 text-left text-sm font-medium hover:bg-field";

  return (
    <>
      <details className="relative">
        <summary
          aria-label={`Account menu for ${email}`}
          className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-navy text-xs font-semibold text-on-navy [&::-webkit-details-marker]:hidden"
        >
          {initials}
        </summary>
        <div className="absolute right-0 z-10 mt-2 w-60 rounded-2xl border border-line bg-card p-3 shadow-lg">
          <p className="truncate px-2 text-sm text-muted">{email}</p>
          {isPro && (
            <p className="px-2 pb-2 pt-1 text-xs font-semibold text-primary">{isFounding ? "★ Pro · Founding Member" : "Pro"}</p>
          )}
          {!isPro && (
            <Link href="/upgrade" className={`${item} block`}>
              Upgrade to Pro
            </Link>
          )}
          {isPro && (
            <form action={openPortal}>
              <button type="submit" className={item}>
                Manage subscription
              </button>
            </form>
          )}
          <form action={signOut}>
            <button type="submit" className={item}>
              Sign out
            </button>
          </form>
          <button type="button" onClick={() => setConfirming(true)} className={`${item} text-warn`}>
            Delete account
          </button>
        </div>
      </details>

      <dialog
        ref={dialog}
        onClose={() => setConfirming(false)}
        aria-labelledby="delete-account-title"
        className="m-auto w-[min(92vw,28rem)] rounded-shell bg-card p-6 text-ink backdrop:bg-black/40"
      >
        <h2 id="delete-account-title" className="text-lg font-medium">
          Delete your account?
        </h2>
        <p className="mt-2 text-sm text-muted">
          This permanently deletes your profile, analyses, plans, actions and check-ins{isPro ? ", and cancels your subscription" : ""}. It can’t be undone.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-warn">
            Couldn’t delete your account. Try again.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-line px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button type="button" onClick={onDelete} disabled={pending} className="rounded-full bg-warn px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:text-navy">
            {pending ? "Deleting…" : "Delete everything"}
          </button>
        </div>
      </dialog>
    </>
  );
}
