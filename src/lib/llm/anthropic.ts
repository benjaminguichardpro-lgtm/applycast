import type { Provider } from "./types";

export const anthropic: Provider = async ({ model, system, user }) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 4096, system, messages: [{ role: "user", content: user }] }),
    signal: AbortSignal.timeout(80_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${body?.error?.message ?? "unknown"}`);
  const text = body?.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (typeof text !== "string") throw new Error("Anthropic returned no content");
  return text;
};
