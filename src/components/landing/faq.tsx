import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";
import { reveal } from "./reveal";

const items = [
  {
    q: "Where do transcripts come from?",
    a: "From the video’s captions on YouTube, fetched when you paste the link. Applycast reads the transcript, not the video file.",
  },
  {
    q: "What happens to my data?",
    a: "Your analyses, plans and check-ins are stored in your account and visible only to you. You can delete your account and all its data at any time.",
  },
  {
    q: "Can I cancel?",
    a: `Yes, anytime. You keep your plans, actions and check-ins, and fall back to the free plan (${FREE_MONTHLY_ANALYSES} analyses a month).`,
  },
  {
    q: "What kind of videos work?",
    a: "Podcasts, interviews and talks about building a business, with spoken content you could act on. Entertainment and music won’t give you much.",
  },
  {
    q: "What if a video has no captions?",
    a: "Applycast tells you there’s nothing it can read. You can paste the transcript yourself or try another video. A failed analysis doesn’t count against your monthly quota.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto mt-28 grid max-w-[1136px] scroll-mt-8 gap-10 px-4 lg:grid-cols-2 lg:gap-16">
      <div {...reveal()}>
        <span className="inline-flex items-center gap-2 rounded-xl border border-line/60 bg-card/60 px-3 py-1.5 text-sm text-muted dark:border-line">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-on-navy" aria-hidden="true">?</span>
          FAQ
        </span>
        <h2 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Frequently
          <br />
          asked questions
        </h2>
        <p className="mt-6 text-lg text-muted">Everything you need to know about Applycast.</p>
      </div>

      <div className="space-y-5">
        {items.map((i, n) => (
          <details key={i.q} {...reveal(n + 1, "right")} className="faq-item group rounded-[36px] border border-line/60 bg-card dark:border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
              {i.q}
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-lg leading-none text-on-navy transition-transform duration-300 group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="px-6 pb-6 pr-16 text-sm leading-relaxed text-muted">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
