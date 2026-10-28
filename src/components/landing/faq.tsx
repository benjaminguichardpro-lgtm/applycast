import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";

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
    <section id="faq" className="mx-auto mt-28 max-w-[800px] scroll-mt-8 px-4">
      <h2 className="text-center text-lg font-medium">FAQ</h2>
      <div className="mt-8 border-t border-line">
        {items.map((i) => (
          <details key={i.q} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {i.q}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-base group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="pb-5 pr-12 text-sm leading-relaxed text-muted">{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
