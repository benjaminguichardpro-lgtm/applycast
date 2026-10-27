import { describe, expect, it } from "vitest";
import { finalize, verdictFor } from "./verdict";

const points = [
  { tsSeconds: 134, text: "Price on outcomes" },
  { tsSeconds: 665, text: "Annual plan at two months free" },
  { tsSeconds: 932, text: "Replace the free plan" },
];

const base = {
  goal_metric: "ARPA",
  verdict_reason: "Point 1 raises ARPA while point 2 lowers it.",
};

describe("finalize", () => {
  it("never counts an against point as apply, and builds tags", () => {
    const out = finalize(
      {
        ...base,
        verdict: "partial",
        points: [
          { index: 1, kind: "apply", metric: "ARPA", direction: "up", reason: "Raises price per account." },
          { index: 2, kind: "against", metric: "monthly ARPA", direction: "down", reason: "Discounts lower it." },
          { index: 3, kind: "na", metric: null, direction: null, reason: "You have no free plan." },
        ],
      },
      points,
    );
    expect(out.points.map((p) => p.kind)).toEqual(["apply", "against", "na"]);
    expect(out.points[0].tag).toBe("ARPA ↑");
    expect(out.points[1].tag).toBe("monthly ARPA ↓");
    expect(out.points[2].tag).toBeNull();
    expect(out.verdict).toBe("low"); // 1 of 3 applies: below the 40% threshold
  });

  it("forces low when nothing applies, even if the model says strong", () => {
    const out = finalize(
      {
        ...base,
        verdict: "strong",
        points: points.map((_, i) => ({ index: i + 1, kind: "against" as const, metric: "ARPA", direction: "down" as const, reason: "Lowers ARPA." })),
      },
      points,
    );
    expect(out.verdict).toBe("low");
  });

  it("overrides the model's verdict with the share of points that apply", () => {
    const out = finalize(
      {
        ...base,
        verdict: "strong",
        points: [
          { index: 1, kind: "apply", metric: "ARPA", direction: "up", reason: "Raises ARPA." },
          { index: 2, kind: "na", metric: null, direction: null, reason: "Not relevant." },
          { index: 3, kind: "na", metric: null, direction: null, reason: "Not relevant." },
        ],
      },
      points,
    );
    expect(out.verdict).toBe("low");
  });
});

describe("verdictFor", () => {
  it.each([
    [0, 5, "low"],
    [1, 5, "low"],
    [2, 5, "partial"],
    [3, 5, "strong"],
    [5, 5, "strong"],
    [1, 3, "low"],
    [2, 4, "partial"],
    [2, 3, "strong"],
    [0, 0, "low"],
  ] as const)("%i of %i points gives %s", (applied, total, expected) => expect(verdictFor(applied, total)).toBe(expected));
});
