import type { CSSProperties } from "react";

// Spread on an element to fade it in when it scrolls into view (see ScrollEffects). `i` staggers siblings;
// "drop" is the hero entrance (falls into place from slightly above).
export const reveal = (i = 0, variant: "" | "drop" = "") => ({
  "data-reveal": variant,
  style: { "--d": i } as CSSProperties,
});
