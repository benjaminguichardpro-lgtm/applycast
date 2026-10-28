import { reveal } from "./reveal";

const chip = "rounded-full px-3 py-1 text-[11px] font-semibold";

function Step({ n, title, children, visual }: { n: number; title: string; children: React.ReactNode; visual: React.ReactNode }) {
  return (
    <li {...reveal(n - 1)} className="lift flex flex-col rounded-3xl border border-line/60 bg-card p-5 shadow-sm dark:border-line">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-on-navy">{n}</span>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{children}</p>
      <div className="mt-auto pt-5">{visual}</div>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mt-24 max-w-[1136px] scroll-mt-8 px-4">
      <h2 {...reveal()} className="text-center text-lg font-medium">How it works</h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Step
          n={1}
          title="Paste a video"
          visual={
            <div className="flex items-center gap-3 rounded-2xl bg-field p-3">
              <span className="grid h-9 w-14 place-items-center rounded-lg bg-chip text-primary" aria-hidden="true">▶</span>
              <span className="text-[11px] text-muted">Founder interview · 54 min</span>
            </div>
          }
        >
          Any YouTube podcast, interview or talk about building a business.
        </Step>
        <Step
          n={2}
          title="See what applies"
          visual={
            <div className="space-y-2">
              <span className={`${chip} inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}>✓ High match</span>
              <div className="rounded-2xl bg-chip p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Worth your attention</p>
                <p className="mt-1 flex justify-between text-xs font-semibold">
                  <span>Price per location</span>
                  <span className="text-primary">21:40</span>
                </p>
              </div>
            </div>
          }
        >
          A verdict for your business and goal, with timestamps. A Low match is free.
        </Step>
        <Step
          n={3}
          title="Validate a plan"
          visual={
            <div>
              <div className="h-2 rounded-full bg-field" role="img" aria-label="4 h 15 of 6 h planned">
                <div className="fill h-2 rounded-full bg-primary" style={{ "--w": "72%" } as React.CSSProperties} />
              </div>
              <p className="mt-2 text-[11px] text-muted">4 steps · 4 h 15 of 6 h</p>
            </div>
          }
        >
          5 steps or fewer, sized to your weekly hours. You approve it before it starts.
        </Step>
        <Step
          n={4}
          title="Check in at day 7"
          visual={
            <div className="flex flex-wrap gap-2">
              <span style={{ "--i": 0 } as React.CSSProperties} className={`pop ${chip} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}>Done</span>
              <span style={{ "--i": 1 } as React.CSSProperties} className={`pop ${chip} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`}>Postponed</span>
              <span style={{ "--i": 2 } as React.CSSProperties} className={`pop ${chip} bg-field text-muted`}>Dropped</span>
            </div>
          }
        >
          Log the outcome. Carry over what’s left.
        </Step>
      </ol>
    </section>
  );
}
