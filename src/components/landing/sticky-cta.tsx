"use client";

import { useEffect, useState } from "react";
import { appLink } from "@/lib/site";
import { primaryButton } from "./buttons";
import { RollLabel } from "./roll-label";

// A call to action that follows the reader once the hero form has scrolled away, and steps aside when the closing
// call to action (#final-cta) is on screen, so the two never compete.
export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-url");
    const end = document.getElementById("final-cta");
    const watch = (el: HTMLElement | null, cb: (e: IntersectionObserverEntry) => void) => {
      if (!el) return null;
      const io = new IntersectionObserver(([e]) => cb(e));
      io.observe(el);
      return io;
    };
    const a = watch(hero, (e) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0));
    const b = watch(end, (e) => setAtEnd(e.isIntersecting));
    return () => {
      a?.disconnect();
      b?.disconnect();
    };
  }, []);

  const shown = pastHero && !atEnd;

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition duration-500 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
    >
      <div className="pointer-events-auto flex w-full max-w-[520px] items-center justify-between gap-3 rounded-full border border-line/60 bg-card/85 py-2 pl-5 pr-2 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-line">
        <p className="min-w-0 truncate text-sm font-medium">Turn your next video into done.</p>
        <a href={appLink("/login")} className={`${primaryButton} shrink-0 !py-2.5`}>
          <RollLabel>Try it free</RollLabel>
        </a>
      </div>
    </div>
  );
}
