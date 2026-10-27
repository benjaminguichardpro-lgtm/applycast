import { describe, expect, it } from "vitest";
import { nextResetLabel, ordinal, planForStatus } from "./billing";

describe("planForStatus", () => {
  it.each([
    ["active", "pro"],
    ["trialing", "pro"],
    ["past_due", "pro"],
    ["canceled", "free"],
    ["unpaid", "free"],
    ["incomplete_expired", "free"],
  ] as const)("%s gives %s", (status, plan) => expect(planForStatus(status)).toBe(plan));
});

describe("ordinal", () => {
  it.each([[1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [11, "11th"], [12, "12th"], [21, "21st"]] as const)("%i is %s", (n, label) =>
    expect(ordinal(n)).toBe(label),
  );
});

describe("nextResetLabel", () => {
  it("is the first of next month", () => {
    expect(nextResetLabel(new Date("2026-10-27T10:00:00Z"))).toBe("Nov 1");
    expect(nextResetLabel(new Date("2026-12-31T10:00:00Z"))).toBe("Jan 1");
  });
});
