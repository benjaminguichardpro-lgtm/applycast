const BADGE = {
  strong: { label: "Strong match", icon: "✓", cls: "bg-navy text-on-navy" },
  partial: { label: "Partial match", icon: "◐", cls: "bg-chip text-primary" },
  low: { label: "Low match", icon: "⊖", cls: "border border-ink/40 text-ink" },
} as const;

// Label + icon + fill: readable without color.
export function VerdictBadge({ verdict }: { verdict: keyof typeof BADGE }) {
  const b = BADGE[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${b.cls}`}>
      <span aria-hidden="true">{b.icon}</span>
      {b.label}
    </span>
  );
}
