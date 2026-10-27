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
    expect(out.verdict).toBe("partial"); // one applying point is enough
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

  it("overrides the model's verdict with the points that apply", () => {
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
    expect(out.verdict).toBe("partial"); // the model said strong, but only one of three applies
  });
});

describe("verdictFor", () => {
  it.each([
    [0, 5, "low"],
    [1, 5, "partial"],
    [2, 5, "partial"],
    [3, 5, "strong"],
    [5, 5, "strong"],
    [1, 3, "partial"],
    [2, 3, "strong"],
    [2, 4, "partial"],
    [0, 0, "low"],
  ] as const)("%i of %i points gives %s", (applied, total, expected) => expect(verdictFor(applied, total)).toBe(expected));
});

describe("key points", () => {
  const mk = (kind: "apply" | "na" | "against", key: boolean, key_reason: string | null) => ({
    kind,
    metric: kind === "na" ? null : "MRR",
    direction: kind === "na" ? null : ("up" as const),
    reason: "Because it matters.",
    key,
    key_reason,
  });
  const three = [
    { tsSeconds: 10, text: "A" },
    { tsSeconds: 20, text: "B" },
    { tsSeconds: 30, text: "C" },
  ];
  it("keeps a key point on an applying point and its reason", () => {
    const out = finalize(
      { goal_metric: "MRR", verdict: "partial", verdict_reason: "One point applies and it matters.", points: [{ index: 1, ...mk("apply", true, "This could unlock your goal.") }, { index: 2, ...mk("na", false, null) }, { index: 3, ...mk("na", false, null) }] },
      three,
    );
    expect(out.verdict).toBe("partial");
    expect(out.points[0]).toMatchObject({ isKey: true, keyReason: "This could unlock your goal." });
  });
  it("ignores a key flag on a point that does not apply or has no reason", () => {
    const out = finalize(
      { goal_metric: "MRR", verdict: "low", verdict_reason: "Nothing applies to this founder.", points: [{ index: 1, ...mk("na", true, "x") }, { index: 2, ...mk("apply", true, null) }, { index: 3, ...mk("against", true, "y") }] },
      three,
    );
    expect(out.points.every((p) => !p.isKey)).toBe(true);
  });
  it("keeps at most two key points", () => {
    const out = finalize(
      { goal_metric: "MRR", verdict: "strong", verdict_reason: "All three apply to this founder.", points: [1, 2, 3].map((index) => ({ index, ...mk("apply", true, "Matters a lot.") })) },
      three,
    );
    expect(out.points.filter((p) => p.isKey)).toHaveLength(2);
    expect(out.points[2].keyReason).toBeNull();
  });
});
