import { describe, expect, it } from "vitest";
import { formatTime, parseVideoId, watchUrl } from "./youtube";

describe("parseVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=42", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts the id from %s", (url, id) => expect(parseVideoId(url)).toBe(id));

  it.each(["", "not a url", "https://vimeo.com/123", "https://www.youtube.com/watch?v=short", "https://evil.com/watch?v=dQw4w9WgXcQ"])(
    "rejects %s",
    (url) => expect(parseVideoId(url)).toBeNull(),
  );
});

describe("time helpers", () => {
  it("builds a timestamp link in whole seconds", () => {
    expect(watchUrl("dQw4w9WgXcQ", 400.9)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=400");
    expect(watchUrl("dQw4w9WgXcQ", null)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
  it("formats mm:ss and h:mm:ss", () => {
    expect(formatTime(400)).toBe("06:40");
    expect(formatTime(3723)).toBe("1:02:03");
  });
});
