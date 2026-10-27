"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${base}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <p role="status" className="mt-6 rounded-2xl bg-card p-4 text-sm">
        Check <strong>{email}</strong> for your sign-in link. Open it in this browser.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label htmlFor="email" className="block text-xs font-medium text-muted">
        Work email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="w-full rounded-2xl bg-field px-4 py-3 text-sm placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-navy px-5 py-3 text-sm font-semibold text-on-navy disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Email me a magic link"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-warn">
          {message}
        </p>
      )}
    </form>
  );
}
