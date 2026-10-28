"use client";

import Link from "next/link";

// Shown when a page fails to load: always offers a way out.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="max-w-xl rounded-shell bg-card p-6">
      <h1 className="text-2xl font-medium tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">This page couldn’t load. Your data is safe. Try again, or go back to Analyze.</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/analyze" className="rounded-full border border-line px-5 py-2.5 text-sm font-medium">
          Go to Analyze
        </Link>
      </div>
    </section>
  );
}
