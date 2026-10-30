"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const MIN_PASSWORD = 8;
const FIELD = "w-full rounded-2xl bg-field px-4 py-3 text-sm placeholder:text-muted";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "confirm" | "error">("idle");
  const [message, setMessage] = useState("");

  const signup = mode === "signup";

  function switchMode() {
    setMode(signup ? "signin" : "signup");
    setPassword("");
    setConfirm("");
    setStatus("idle");
  }

  function fail(text: string) {
    setStatus("error");
    setMessage(text);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (signup) {
      if (password.length < MIN_PASSWORD) return fail(`Use at least ${MIN_PASSWORD} characters.`);
      if (password !== confirm) return fail("The two passwords don’t match.");
    }
    setStatus("sending");
    const supabase = createClient();
    if (!signup) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return fail("Wrong email or password.");
      router.push("/context");
      router.refresh();
      return;
    }
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${base}/auth/callback` } });
    if (error) return fail(error.message);
    if (data.session) {
      router.push("/context");
      router.refresh();
      return;
    }
    setStatus("confirm");
  }

  if (status === "confirm") {
    return (
      <p role="status" className="mt-6 rounded-2xl bg-card p-4 text-sm">
        Check <strong>{email}</strong> to confirm your account. Open the link in this browser, then sign in.
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
        className={FIELD}
      />
      <label htmlFor="password" className="block text-xs font-medium text-muted">
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={signup ? MIN_PASSWORD : undefined}
        autoComplete={signup ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={FIELD}
      />
      {signup && (
        <>
          <label htmlFor="confirm" className="block text-xs font-medium text-muted">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={FIELD}
          />
        </>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-navy px-5 py-3 text-sm font-semibold text-on-navy disabled:opacity-60"
      >
        {status === "sending" ? "One moment…" : signup ? "Create account" : "Sign in"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-warn">
          {message}
        </p>
      )}
      <button type="button" onClick={switchMode} className="w-full text-center text-sm text-muted underline">
        {signup ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}
