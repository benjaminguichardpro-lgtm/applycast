"use client";

import { useEffect, useRef } from "react";
import { reveal } from "./reveal";

// The product tour under the hero headline, in a glass frame. It plays muted on a loop while it is on screen and
// pauses when it scrolls away; with reduced motion it stays still and shows the browser controls instead.
export function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React does not always write the muted attribute, and browsers only autoplay muted videos.
    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <div {...reveal(8)} className="hero-frame mx-auto mt-14 rounded-[28px] border border-white/70 bg-white/45 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:mt-16 sm:p-4 dark:border-line dark:bg-card/30">
      <div className="overflow-hidden rounded-2xl border border-line/60 bg-card">
        <video
          ref={ref}
          className="block aspect-[1920/998] w-full"
          poster="/demo/poster.jpg"
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Screen recording of Applycast: the verdict on a video, the adaptations, the action plan and the resulting actions."
        >
          <source src="/demo/demo.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
