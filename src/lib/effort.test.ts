import { describe, expect, it } from "vitest";
import { formatHours, groupForDay, overBy, perWeekHours, snapEffort, totalHours } from "./effort";

describe("effort helpers", () => {
  it("formats minutes below an hour", () => {
    expect(formatHours(0.5)).toBe("30 min");
    expect(formatHours(1.5)).toBe("1.5 h");
  });
  it("caps an effort at the allowed set and the weekly limit", () => {
    expect(snapEffort(4, 6)).toBe(4);
    expect(snapEffort(4, 2)).toBe(2);
    expect(snapEffort(3, 1.2)).toBe(1);
    expect(snapEffort(0.2, 6)).toBe(0.5);
  });
  it("groups steps by day: today (<=1), this week (<=7), later", () => {
    expect([1, 2, 7, 8, 30].map(groupForDay)).toEqual(["today", "week", "week", "later", "later"]);
  });
  it("sums selected effort and compares with the weekly limit", () => {
    const total = totalHours([{ effort: 2 }, { effort: 1 }, { effort: 2.5 }]);
    expect(total).toBe(5.5);
    expect(overBy(total, 6)).toBe(0);
    expect(overBy(7.5, 6)).toBe(1.5);
  });
  it("spreads a long plan over several weeks", () => {
    expect(perWeekHours(12, 14)).toBe(6);
    expect(perWeekHours(6, 3)).toBe(6);
  });
});
