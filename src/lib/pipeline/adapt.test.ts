import { describe, expect, it } from "vitest";
import { toRows } from "./adapt";

const points = [
  { index: 1, insightId: "i1", text: "Raise prices", tag: "MRR ↑", reason: null },
  { index: 2, insightId: "i2", text: "Price per contract", tag: "MRR ↑", reason: null },
];

const adaptations = [
  {
    insight_index: 1,
    business: { text: "Move new signups to $65 a month.", effort_hours: 1 },
    profile: { category: "Habit" as const, text: "Review new signups every Monday.", effort_hours: 0.5 },
  },
  {
    insight_index: 2,
    business: { text: "Price per contract reviewed, not per seat.", effort_hours: 4 },
    profile: { category: "Skill" as const, text: "Learn to run a price conversation.", effort_hours: 3 },
  },
];

describe("toRows", () => {
  it("creates one business and one profile adaptation per point", () => {
    const rows = toRows(adaptations, points, 8);
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.target === "business")).toHaveLength(2);
    expect(rows.find((r) => r.target === "profile" && r.insightId === "i1")?.category).toBe("Habit");
    expect(rows.find((r) => r.target === "business")?.category).toBeNull();
  });
  it("caps each adaptation's effort at the weekly limit", () => {
    const rows = toRows(adaptations, points, 2);
    expect(Math.max(...rows.map((r) => r.effort))).toBeLessThanOrEqual(2);
  });
});
