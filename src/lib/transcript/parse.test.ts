import { describe, expect, it } from "vitest";
import { buildIndex, locateQuote, parsePastedTranscript } from "./parse";

const segments = [
  { start: 0, text: "Welcome back to the show." },
  { start: 400, text: "The first thing we did was raise prices" },
  { start: 408, text: "for new customers only, and we kept old plans." },
  { start: 500, text: "Then we published our pricing page." },
];

describe("locateQuote", () => {
  const index = buildIndex(segments);

  it("returns the start of the segment where the quote begins", () => {
    expect(locateQuote(index, "The first thing we did was raise prices for new customers only")?.start).toBe(400);
  });
  it("ignores case and punctuation", () => {
    expect(locateQuote(index, "then we PUBLISHED our pricing page")?.start).toBe(500);
  });
  it("rejects a quote that is not in the transcript", () => {
    expect(locateQuote(index, "we doubled our revenue in one single week")).toBeNull();
  });
  it("rejects quotes too short to be meaningful", () => {
    expect(locateQuote(index, "raise prices")).toBeNull();
  });
});

describe("parsePastedTranscript", () => {
  it("reads timestamps at the start of lines", () => {
    const out = parsePastedTranscript("00:05 hello there\n06:40 raise prices\n1:02:03 final words");
    expect(out.map((s) => s.start)).toEqual([5, 400, 3723]);
  });
  it("joins continuation lines to the previous segment", () => {
    const out = parsePastedTranscript("00:05 hello\nthere again\n00:20 next");
    expect(out[0].text).toBe("hello there again");
  });
  it("never invents timestamps for plain text", () => {
    const out = parsePastedTranscript("just a block of text\nwith two lines");
    expect(out).toHaveLength(1);
    expect(out[0].start).toBeNull();
  });
});
