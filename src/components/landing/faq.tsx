import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";
import { reveal } from "./reveal";

const items: { q: string; a: string[] }[] = [
  {
    q: "How is this different from asking ChatGPT to summarize a YouTube video?",
    a: [
      "ChatGPT can summarize what a video says. Applycast answers a more useful question: “Should I act on this video — and what specifically should I do, given my business right now?”",
      "You provide your offer, stage, role, active goal, main constraint, and weekly time available. Applycast evaluates up to five points against that context, tells you whether each one applies, works against your goal, or is irrelevant, and turns only the useful ones into a short, realistic action plan.",
      "You are not paying for a transcript or a summary. You are paying to avoid spending an hour watching, interpreting, and trying to apply content that may not fit your business.",
    ],
  },
  {
    q: "Will the advice actually be relevant to my business?",
    a: [
      "Yes, because the analysis is grounded in your context, not in generic startup advice.",
      "A passage about outbound sales, pricing, onboarding, hiring, or product positioning may be highly relevant to one founder and irrelevant, or even harmful, to another. Applycast judges each point against your current offer, stage, goal, constraint, and available time.",
      "You also stay in control: you can open the timestamped source, reject an adaptation, edit the plan, regenerate it, or discard the recommendation entirely.",
    ],
  },
  {
    q: "Can I trust that the points actually come from the video?",
    a: [
      "Yes. Every point is extracted from the video transcript and linked to a clickable timestamp that takes you directly to the relevant part of the video.",
      "You can verify the original passage before accepting an adaptation or adding an action to your plan. For high-impact points, you can also open a longer explanation to understand why Applycast flagged them.",
      "Applycast is designed to help you decide faster, not to ask you to trust an opaque AI output.",
    ],
  },
  {
    q: "Will this just create another overwhelming to-do list?",
    a: [
      "No. Applycast is built to reduce noise, not add work.",
      "Each analysis contains a maximum of five points. For each useful point, you receive one business adaptation and one personal adaptation, with an estimated effort in hours. You choose only what you want to keep, then Applycast creates a plan of no more than five steps, sized around the time you actually have available.",
      "You can modify the proposed durations, regenerate the plan, or start over before validating it.",
    ],
  },
  {
    q: "What happens if I cancel my subscription?",
    a: [
      "You can cancel at any time, and you do not lose access to what you have already created.",
      "Your existing plans, actions, and day-7 check-ins remain available, and your analysis history stays readable without an active subscription. Payments are processed securely through Stripe.",
      `The free plan includes ${FREE_MONTHLY_ANALYSES} analyses per month, and analyses with a low match verdict do not count against your quota.`,
    ],
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
            <div className="space-y-3 px-6 pb-6 pr-16 text-sm leading-relaxed text-muted">
              {i.a.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
