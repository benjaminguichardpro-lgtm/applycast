export const STEPS = [
  { key: "fetching", label: "Fetching transcript", percent: 12 },
  { key: "summarizing", label: "Summarizing key points", percent: 38 },
  { key: "matching", label: "Matching against your context", percent: 63 },
  { key: "scoring", label: "Scoring relevance", percent: 88 },
] as const;

export function stepState(stepKey: string, current: string | null, done: boolean): "done" | "running" | "queued" {
  if (done) return "done";
  const order = STEPS.map((s) => s.key as string);
  const at = current ? order.indexOf(current) : 0;
  const i = order.indexOf(stepKey);
  return i < at ? "done" : i === at ? "running" : "queued";
}

export function percentFor(current: string | null, done: boolean) {
  if (done) return 100;
  return STEPS.find((s) => s.key === current)?.percent ?? 5;
}
