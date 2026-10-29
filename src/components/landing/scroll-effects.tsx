"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Reveals [data-reveal] elements once as they enter the viewport, and flags a scrolled page for the sticky header.
// The layout stays mounted when moving between landing pages, so this re-runs on every route change to pick up the
// new page's elements (otherwise they stay hidden).
export function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fx = "";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          setTimeout(() => el.classList.add("done"), 1700);
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const onScroll = () => {
      if (window.scrollY > 12) root.dataset.scrolled = "";
      else delete root.dataset.scrolled;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.scrolled;
      delete root.dataset.fx;
    };
  }, [pathname]);

  return null;
}
