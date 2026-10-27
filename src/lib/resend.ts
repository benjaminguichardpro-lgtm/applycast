export type Email = { to: string; subject: string; html: string; text: string };

export async function sendEmail({ to, subject, html, text }: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Applycast <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${body?.message ?? "unknown"}`);
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function checkinEmail(opts: { title: string | null; url: string; openCount: number }): Omit<Email, "to"> {
  const what = opts.title ? `“${opts.title}”` : "your plan";
  const open = opts.openCount === 1 ? "1 step is still open" : `${opts.openCount} steps are still open`;
  const subject = `Day 7: what happened with ${what}?`;
  const line = opts.openCount > 0 ? ` ${open}.` : "";
  const text = `It's been a week since you validated your plan from ${what}.${line}\n\nTell Applycast what happened (it takes a minute): ${opts.url}`;
  const html = `<p>It's been a week since you validated your plan from <strong>${escapeHtml(what)}</strong>.${escapeHtml(line)}</p>
<p><a href="${opts.url}" style="display:inline-block;padding:12px 20px;background:#1d3666;color:#fff;border-radius:999px;text-decoration:none">What happened?</a></p>
<p style="color:#5a6478;font-size:13px">One minute: the outcome, your metric before and after, and what to do with open steps.</p>`;
  return { subject, html, text };
}
