import { formatTime } from "../youtube";
import type { Segment } from "./types";

// "6:40 text", "[06:40] text", "1:02:03 - text" at the start of a line.
const TIMESTAMP_LINE = /^\s*\[?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]?\s*[-–—:]?\s*(.*)$/;

export function parsePastedTranscript(raw: string): Segment[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const timed: Segment[] = [];
  let pendingStart: number | null = null;

  for (const line of lines) {
    const m = TIMESTAMP_LINE.exec(line);
    if (m) {
      const start = Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      if (m[4]) {
        timed.push({ start, text: m[4] });
        pendingStart = null;
      } else {
        pendingStart = start; // timestamp alone on its own line; text follows
      }
    } else if (pendingStart !== null) {
      timed.push({ start: pendingStart, text: line });
      pendingStart = null;
    } else if (timed.length > 0) {
      timed[timed.length - 1].text += ` ${line}`;
    }
  }
  // Treat as timed only when most lines carried a timestamp; otherwise keep plain text without invented times.
  if (timed.length >= 2) return timed;
  return [{ start: null, text: lines.join(" ") }];
}

function normalize(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export type TranscriptIndex = {
  text: string;
  segments: Segment[];
  starts: number[];
};

export function buildIndex(segments: Segment[]): TranscriptIndex {
  let text = "";
  const starts: number[] = [];
  for (const seg of segments) {
    const n = normalize(seg.text);
    if (!n) {
      starts.push(text.length);
      continue;
    }
    if (text) text += " ";
    starts.push(text.length);
    text += n;
  }
  return { text, segments, starts };
}

export type QuoteMatch = { start: number | null };

// Finds a verbatim quote in the transcript. Returns the start time of the segment where it begins, or null if absent.
export function locateQuote(index: TranscriptIndex, quote: string): QuoteMatch | null {
  const first = quote.split(/\.{3}|…/)[0];
  const words = normalize(first).split(" ").filter(Boolean);
  if (words.length < 4) return null;

  // Exact match first, then progressively shorter prefixes (down to 6 words) to tolerate a drifting tail.
  for (let len = words.length; len >= Math.min(6, words.length); len--) {
    const needle = words.slice(0, len).join(" ");
    const at = index.text.indexOf(needle);
    if (at !== -1) return { start: segmentStartAt(index, at) };
  }
  return null;
}

function segmentStartAt(index: TranscriptIndex, charPos: number): number | null {
  let lo = 0;
  let hi = index.starts.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (index.starts[mid] <= charPos) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return index.segments[found].start;
}

// Merges raw segments into ~20 s blocks for the prompt; "[mm:ss] text" lines, or plain text when untimed.
export function formatForPrompt(segments: Segment[], maxChars = 200_000): string {
  const lines: string[] = [];
  let blockStart: number | null = null;
  let buf = "";
  const flush = () => {
    if (!buf) return;
    lines.push(blockStart === null ? buf : `[${formatTime(blockStart)}] ${buf}`);
    buf = "";
  };
  for (const seg of segments) {
    if (blockStart !== null && seg.start !== null && seg.start - blockStart >= 20) flush();
    if (!buf) blockStart = seg.start;
    buf += (buf ? " " : "") + seg.text;
  }
  flush();
  const out = lines.join("\n");
  return out.length > maxChars ? out.slice(0, maxChars) : out;
}
