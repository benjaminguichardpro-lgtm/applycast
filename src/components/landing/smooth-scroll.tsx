"use client";

import Lenis from "lenis";
import { useEffect } from "react";

// Smooth, eased page scrolling for the landing (mouse wheel and trackpad; touch keeps its native feel).
// Off for visitors who asked for reduced motion. In-page anchors (#pricing) glide there too.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 1, anchors: { offset: -96 } });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
