import type { Metadata } from "next";
import Image from "next/image";
import { Faq } from "@/components/landing/faq";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { reveal } from "@/components/landing/reveal";
import { primaryButton } from "@/components/landing/buttons";
import { FREE_MONTHLY_ANALYSES } from "@/lib/quota";
import { MARKETING_URL, appLink } from "@/lib/site";
import { RollLabel } from "@/components/landing/roll-label";

export const metadata: Metadata = {
  metadataBase: new URL(MARKETING_URL),
  title: "Applycast: from “I watched it” to “I did it”",
  description:
    "Paste a business video. Applycast tells you what applies to your startup and turns it into a plan of 5 steps or fewer that you actually finish.",
  openGraph: { title: "Applycast", description: "From “I watched it” to “I did it”.", type: "website" },
};

export default function Landing() {
  return (
    <>
      <section className="relative isolate mx-auto max-w-[1136px] px-4 pt-10 text-center sm:pt-16">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-beam hero-beam-a" aria-hidden="true" />
        <div className="hero-beam hero-beam-b" aria-hidden="true" />
        <h1 className="text-[clamp(2.75rem,12vw,6rem)] font-semibold leading-[1.05] tracking-tight">
          <span {...reveal(0, "drop")} className="block text-muted line-through decoration-[0.07em]">“I watched it.”</span>
          <span {...reveal(2, "drop")} className="block text-primary">“I did it.”</span>
        </h1>
        <p {...reveal(4, "drop")} className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted">
          Paste a business video. Applycast tells you what applies to your startup and turns it into a plan of 5 steps or fewer that you actually finish.
        </p>
        <form {...reveal(6, "drop")} action={appLink("/login")} className="mx-auto mt-8 max-w-[640px] text-left">
          <label htmlFor="hero-url" className="text-xs font-medium">YouTube link</label>
          <div className="glow-border mt-2 flex items-center gap-2 rounded-full border border-line/60 bg-card/60 p-1.5 shadow-sm dark:border-line">
            <input
              id="hero-url"
              name="url"
              type="url"
              placeholder="Paste a podcast, interview or talk"
              className="min-w-0 flex-1 rounded-full bg-field px-5 py-3 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button type="submit" className={`${primaryButton} shrink-0 !py-3`}><RollLabel>Try it free</RollLabel></button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Free plan: {FREE_MONTHLY_ANALYSES} analyses a month.{" "}
            <a href="#how-it-works" className="text-primary underline">See how it works</a>
          </p>
        </form>

        {/* The product, framed like the reference: a glass ring around the screenshot, full content width. */}
        <div {...reveal(8)} className="hero-frame mx-auto mt-14 rounded-[28px] border border-white/70 bg-white/45 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:mt-16 sm:p-4 dark:border-line dark:bg-card/30">
          <div className="relative aspect-[6/5] overflow-hidden rounded-2xl border border-line/60 bg-card sm:aspect-auto">
            <Image
              src="/screens/adaptations.png"
              alt="The Applycast adaptations screen: each point from the video on the left, turned into an action for your business on the right, with the effort it takes."
              width={2940}
              height={1542}
              sizes="(min-width: 1136px) 1072px, 100vw"
              className="absolute -left-[6%] -top-[22%] h-auto w-[240%] max-w-none sm:static sm:w-full sm:max-w-full"
            />
          </div>
        </div>
      </section>

      <HowItWorks />
      <Pricing />
      <Faq />

      <section className="mx-auto mt-28 max-w-[1136px] px-4">
        <div {...reveal()} className="rounded-[28px] border border-line/60 bg-card/60 p-3 dark:border-line">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-card p-8 sm:flex-row sm:items-center sm:px-10 sm:py-8">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Turn your next video into done.</h2>
            <a href={appLink("/login")} className={`${primaryButton} !py-3`}><RollLabel>Try it free</RollLabel></a>
          </div>
        </div>
      </section>
    </>
  );
}
