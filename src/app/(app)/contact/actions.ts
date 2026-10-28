"use server";

import { getCurrentUser } from "@/lib/auth";
import { contactEmail, sendEmail } from "@/lib/resend";
import { CONTACT_TOPICS, MAX_MESSAGE } from "./topics";

export type ContactResult = { ok: true } | { ok: false; error: "unauthenticated" | "invalid" | "unavailable" | "send_failed" };

export async function sendContact(topic: string, message: string): Promise<ContactResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const text = message.trim();
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic) || text.length < 5 || text.length > MAX_MESSAGE) {
    return { ok: false, error: "invalid" };
  }
  const to = process.env.CONTACT_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return { ok: false, error: "unavailable" };
  try {
    await sendEmail({ to, ...contactEmail({ from: user.email, topic, message: text }) });
    return { ok: true };
  } catch (e) {
    console.error("contact email failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "send_failed" };
  }
}
