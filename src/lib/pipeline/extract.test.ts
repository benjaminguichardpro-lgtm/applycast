import { describe, expect, it } from "vitest";
import { buildIndex } from "../transcript/parse";
import { verifyPoints } from "./extract";

const index = buildIndex([
  { start: 10, text: "We moved our free users onto a fourteen day trial" },
  { start: 95, text: "and signups from paying logos doubled within a month" },
]);

describe("verifyPoints", () => {
  it("keeps points whose quote exists and takes the time from the transcript", () => {
    const out = verifyPoints(
      [{ text: "Replace the free plan with a trial.", quote: "moved our free users onto a fourteen day trial" }],
      index,
    );
    expect(out).toEqual([{ tsSeconds: 10, text: "Replace the free plan with a trial." }]);
  });
  it("drops invented passages", () => {
    const out = verifyPoints(
      [
        { text: "Real one.", quote: "signups from paying logos doubled within a month" },
        { text: "Made up.", quote: "we hired forty salespeople in the first quarter" },
      ],
      index,
    );
    expect(out.map((p) => p.text)).toEqual(["Real one."]);
  });
  it("sorts by time and keeps at most five", () => {
    const many = Array.from({ length: 7 }, () => ({ text: "x", quote: "moved our free users onto a fourteen day trial" }));
    expect(verifyPoints(many, index).length).toBeLessThanOrEqual(5);
  });
});
