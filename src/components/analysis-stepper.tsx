import Link from "next/link";

const STEPS = [
  { key: "result", label: "Analysis", path: "" },
  { key: "adaptations", label: "Adaptations", path: "/adaptations" },
  { key: "plan", label: "Action plan", path: "/plan" },
] as const;

// Where the user is in analysis → adaptations → plan. Earlier steps link back; later ones are not reachable yet.
export function AnalysisStepper({ analysisId, current }: { analysisId: string; current: (typeof STEPS)[number]["key"] }) {
  const at = STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Progress">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((s, i) => {
          const state = i < at ? "done" : i === at ? "current" : "todo";
          const badge = (
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                state === "current" ? "bg-navy text-on-navy" : state === "done" ? "bg-chip text-primary" : "border border-line text-muted"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
          );
          const cls = `flex items-center gap-2 rounded-full px-3 py-1.5 ${
            state === "current" ? "bg-card font-semibold shadow-sm" : state === "done" ? "hover:bg-card" : "text-muted"
          }`;
          return (
            <li key={s.key} className="flex items-center gap-2">
              {state === "done" ? (
                <Link href={`/analyze/${analysisId}${s.path}`} className={cls}>
                  {badge}
                  {s.label}
                </Link>
              ) : (
                <span className={cls} aria-current={state === "current" ? "step" : undefined}>
                  {badge}
                  {s.label}
                </span>
              )}
              {i < STEPS.length - 1 && <span aria-hidden="true" className="text-muted">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
