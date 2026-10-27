import { describe, expect, it } from "vitest";
import { aggregateScores, buildBlindSheet, parseCsv, seededShuffle, toCsv, type EvalResult } from "./lib";

const result = (config: string, videoId: string): EvalResult => ({
  config,
  videoId,
  profileName: "p3",
  profileText: "Offer X, goal Y",
  verdict: "partial",
  verdictReason: "Two points apply.",
  points: [{ ts: 403, text: "Raise prices", kind: "apply", tag: "MRR ↑", reason: "Raises price per account." }],
  adaptations: [{ target: "business", category: null, text: "Move to $65", effort: 1 }],
  droppedAdaptations: 0,
  latencyMs: 1000,
});

describe("csv", () => {
  it("round-trips commas, quotes and line breaks", () => {
    const rows = [{ a: 'He said "hi", twice', b: "line 1\nline 2" }];
    expect(parseCsv(toCsv(rows, ["a", "b"]))).toEqual(rows);
  });
});

describe("blind sheet", () => {
  const results = [result("openai", "AAAAAAAAAAA"), result("anthropic", "AAAAAAAAAAA"), result("openai", "BBBBBBBBBBB")];

  it("never shows the config in the graded sheet, only in the key", () => {
    const { rows, key } = buildBlindSheet(results, 7);
    expect(JSON.stringify(rows)).not.toMatch(/openai|anthropic/);
    expect(key.map((k) => k.config).sort()).toEqual(["anthropic", "openai", "openai"]);
    expect(new Set(key.map((k) => k.id)).size).toBe(3);
  });
  it("links each point to the video at its timestamp", () => {
    const { rows } = buildBlindSheet(results, 7);
    expect(rows[0].points).toContain("https://youtu.be/");
    expect(rows[0].points).toContain("?t=403");
  });
  it("shuffles the same way for the same seed", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], 42);
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 42)).toEqual(a);
    expect(a).not.toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("aggregateScores", () => {
  const key = [
    { id: "R-001", config: "openai", videoId: "a", profile: "p1" },
    { id: "R-002", config: "openai", videoId: "b", profile: "p1" },
    { id: "R-003", config: "anthropic", videoId: "a", profile: "p1" },
  ];
  it("averages grades per config and skips ungraded rows", () => {
    const graded = [
      { id: "R-001", relevance: "4", faithfulness: "5", goal_coherence: "5", usefulness: "3" },
      { id: "R-002", relevance: "2", faithfulness: "5", goal_coherence: "4", usefulness: "3" },
      { id: "R-003", relevance: "", faithfulness: "", goal_coherence: "", usefulness: "" },
    ];
    const scores = aggregateScores(graded, key);
    expect(scores).toHaveLength(1);
    expect(scores[0]).toMatchObject({ config: "openai", graded: 2 });
    expect(scores[0].means.relevance).toBe(3);
    expect(scores[0].means.faithfulness).toBe(5);
  });
});
