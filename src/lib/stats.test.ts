import { describe, expect, it } from "vitest";
import { combineCounts, monthStart, pct, weekBounds } from "./stats";

describe("done rate", () => {
  it("is done actions over validated actions", () => {
    const { total, doneRate, counts } = combineCounts(["done", "done", "open", "postponed", "dropped"], []);
    expect(total).toBe(5);
    expect(counts.done).toBe(2);
    expect(doneRate).toBe(40);
  });
  it("keeps the check-in snapshot of a deleted plan", () => {
    const { total, doneRate, counts } = combineCounts(["done", "open"], [{ actions_total: 4, actions_done: 3 }]);
    expect(total).toBe(6);
    expect(counts.done).toBe(4);
    expect(counts.dropped).toBe(1);
    expect(doneRate).toBe(67);
  });
  it("is 0 with no validated actions", () => {
    expect(pct(0, 0)).toBe(0);
    expect(combineCounts([], []).doneRate).toBe(0);
  });
});

describe("date bounds", () => {
  it("starts the month on the 1st (UTC)", () => {
    expect(monthStart(new Date("2026-10-27T15:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
  it("starts the week on Monday", () => {
    const { start, end } = weekBounds(new Date("2026-10-27T15:00:00Z")); // a Tuesday
    expect(start.toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(weekBounds(new Date("2026-11-01T23:00:00Z")).start.toISOString()).toBe("2026-10-26T00:00:00.000Z"); // Sunday
  });
});
