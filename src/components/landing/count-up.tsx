"use client";

import { useEffect, useRef } from "react";

// Renders the final value (so it is right without JS), then counts up from 0 the first time it is on screen.
export function CountUp({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const format = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;
    el.textContent = format(0);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1200);
          el.textContent = format(value * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, decimals, prefix, suffix]);

  return <span ref={ref} className="tabular-nums">{`${prefix}${value.toFixed(decimals)}${suffix}`}</span>;
}
