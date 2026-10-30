import { reveal } from "./reveal";

const before = [
  "A 90-minute interview, watched on 1.5x",
  "Notes you never open again",
  "Ten ideas, no idea which fits your business",
  "A plan that ignores your real weekly hours",
  "Nobody asks, three weeks later, what you did",
];

const after = [
  "A verdict in minutes: does this apply to you, yes or no",
  "Only the points that fit your business, with timestamps",
  "Each point turned into an action, with its effort",
  "5 steps or fewer, sized to your weekly limit",
  "A check-in at day 7 to log what you did",
];

function Item({ children, good }: { children: React.ReactNode; good?: boolean }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed">
      <span
        aria-hidden="true"
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${good ? "bg-primary text-on-navy" : "bg-field text-muted"}`}
      >
        {good ? "✓" : "✕"}
      </span>
      <span className={good ? "" : "text-muted"}>{children}</span>
    </li>
  );
}

export function BeforeAfter() {
  return (
    <section className="relative mx-auto mt-28 max-w-[1136px] px-4">
      <h2 {...reveal()} className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Watching is easy. Doing is the hard part.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div {...reveal(0, "left")} className="rounded-3xl border border-line/60 bg-card/60 p-6 dark:border-line sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Without Applycast</p>
          <h3 className="mt-2 text-2xl font-medium text-muted">Inspired, then stuck</h3>
          <ul className="mt-6 space-y-4">
            {before.map((t) => (
              <Item key={t}>{t}</Item>
            ))}
          </ul>
        </div>
        <div {...reveal(1, "right")} className="lift glow-border rounded-3xl border border-line/60 bg-card p-6 shadow-sm dark:border-line sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">With Applycast</p>
          <h3 className="mt-2 text-2xl font-medium">A verdict, a plan, a follow-up</h3>
          <ul className="mt-6 space-y-4">
            {after.map((t) => (
              <Item key={t} good>
                {t}
              </Item>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
