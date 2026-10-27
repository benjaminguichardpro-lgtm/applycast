import { describe, expect, it } from "vitest";
import { finalizePlan } from "./plan";

describe("finalizePlan", () => {
  const out = {
    duration_days: 7,
    steps: [
      { day: 5, text: "Ship the pricing page", effort_hours: 2 },
      { day: 1, text: "Pull usage data", effort_hours: 1 },
      { day: 12, text: "Late step", effort_hours: 0.5 },
    ],
  };
  it("orders steps by day and keeps them inside the duration", () => {
    const plan = finalizePlan(out, null);
    expect(plan.steps.map((s) => s.day)).toEqual([1, 5, 7]);
    expect(plan.durationDays).toBe(7);
  });
  it("uses the founder's own duration when given", () => {
    const plan = finalizePlan(out, 14);
    expect(plan.durationDays).toBe(14);
    expect(plan.steps.map((s) => s.day)).toEqual([1, 5, 12]);
  });
  it("never returns more than 5 steps", () => {
    const many = { duration_days: 7, steps: Array.from({ length: 5 }, (_, i) => ({ day: i + 1, text: `Step ${i}`, effort_hours: 1 })) };
    expect(finalizePlan(many, null).steps).toHaveLength(5);
  });
});
