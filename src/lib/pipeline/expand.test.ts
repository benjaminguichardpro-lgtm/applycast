import { describe, expect, it } from "vitest";
import { buildIndex } from "../transcript/parse";
import { passageAround, verifyDetail } from "./expand";

const transcript = ["[00:10] intro words here", "[06:40] we raised prices for new customers only", "[08:30] and kept old plans for six months", "[30:00] much later talk"].join("\n");

describe("passageAround", () => {
  it("keeps about three minutes around the point", () => {
    const seg = passageAround(transcript, 400);
    expect(seg.map((s) => s.start)).toEqual([400, 510]);
  });
  it("falls back to the whole text when there are no timestamps", () => {
    const seg = passageAround("plain text with no times at all", null);
    expect(seg).toHaveLength(1);
    expect(seg[0].start).toBeNull();
  });
});

describe("verifyDetail", () => {
  const index = buildIndex([{ start: 400, text: "we raised prices for new customers only" }]);
  it("keeps verified quotes with their time and drops invented ones", () => {
    const out = verifyDetail(
      { summary: "A long enough summary of what was said.", quotes: [{ quote: "we raised prices for new customers only" }, { quote: "we doubled revenue in a single week overnight" }] },
      index,
    );
    expect(out.quotes).toEqual([{ text: "we raised prices for new customers only", ts: 400 }]);
  });
});
