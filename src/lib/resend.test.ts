import { describe, expect, it } from "vitest";
import { checkinEmail } from "./resend";

describe("checkinEmail", () => {
  it("links to the check-in and escapes the video title", () => {
    const e = checkinEmail({ title: 'A "<b>" title', url: "https://app.test/actions/checkin/abc", openCount: 2 });
    expect(e.html).toContain("https://app.test/actions/checkin/abc");
    expect(e.html).not.toContain("<b>");
    expect(e.text).toContain("2 steps are still open");
  });
  it("handles a plan with nothing left open", () => {
    expect(checkinEmail({ title: null, url: "https://x.test", openCount: 0 }).text).not.toContain("still open");
  });
});
