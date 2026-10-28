"use client";

import { useState, useTransition } from "react";
import { sendContact } from "./actions";
import { CONTACT_TOPICS, MAX_MESSAGE } from "./topics";

const ERRORS: Record<string, string> = {
  invalid: "Write a few words before sending.",
  unavailable: "Contact isn’t set up yet. Please try again later.",
  send_failed: "Couldn’t send your message. Try again.",
  unauthenticated: "Your session expired. Sign in again.",
};

export function ContactForm({ email }: { email: string }) {
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await sendContact(topic, message);
      if (res.ok) {
        setSent(true);
        setMessage("");
      } else setError(res.error);
    });
  }

  if (sent) {
    return (
      <div role="status" className="rounded-shell bg-card p-6 sm:p-10">
        <h2 className="text-2xl font-medium">Message sent</h2>
        <p className="mt-2 text-sm text-muted">Thanks. We’ll reply to {email}.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-5 rounded-full border border-line px-5 py-2.5 text-sm font-medium">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-shell bg-card p-6 sm:p-10">
      <h2 className="text-2xl font-medium">Send us a message</h2>
      <p className="mt-1 text-xs text-muted">We’ll reply to {email}.</p>

      <label htmlFor="topic" className="mt-6 block text-sm font-medium">
        Topic
      </label>
      <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1.5 w-full rounded-full bg-field px-5 py-3.5 text-sm">
        {CONTACT_TOPICS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <label htmlFor="message" className="mt-5 block text-sm font-medium">
        Message
      </label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MAX_MESSAGE}
        rows={8}
        placeholder="What’s on your mind?"
        className="mt-1.5 w-full rounded-2xl bg-field p-4 text-sm placeholder:text-muted"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-warn">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || message.trim().length < 5}
        className="mt-5 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
