// Pure helpers for the evaluation set: blind sheet, CSV, scoring. No network, no database.

export type EvalPoint = { ts: number | null; text: string; kind: string; tag: string | null; reason: string };
export type EvalAdaptation = { target: string; category: string | null; text: string; effort: number };

export type EvalResult = {
  config: string;
  videoId: string;
  videoTag?: string;
  profileName: string;
  profileText: string;
  verdict: string;
  verdictReason: string;
  points: EvalPoint[];
  adaptations: EvalAdaptation[];
  droppedAdaptations: number;
  latencyMs: number;
};

export const GRADE_COLUMNS = ["relevance", "faithfulness", "goal_coherence", "usefulness"] as const;
export type KeyRow = { id: string; config: string; videoId: string; profile: string };

// ---- CSV -------------------------------------------------------------------

export function toCsv(rows: Record<string, string>[], columns: string[]) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [columns.map(cell).join(","), ...rows.map((r) => columns.map((c) => cell(r[c] ?? "")).join(","))].join("\n") + "\n";
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((c) => c !== "")) rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

// ---- Blind sheet -----------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function describePoints(videoId: string, points: EvalPoint[]) {
  return points
    .map((p, i) => {
      const at = p.ts === null ? "no time" : `${clock(p.ts)} https://youtu.be/${videoId}?t=${Math.floor(p.ts)}`;
      const tag = p.tag ? ` ${p.tag}` : "";
      return `${i + 1}. [${at}] ${p.kind.toUpperCase()}${tag}: ${p.text}\n   why: ${p.reason}`;
    })
    .join("\n");
}

function describeAdaptations(items: EvalAdaptation[]) {
  if (items.length === 0) return "(none)";
  return items.map((a) => `- ${a.target}${a.category ? `/${a.category}` : ""} (~${a.effort} h): ${a.text}`).join("\n");
}

export const SHEET_COLUMNS = [
  "id",
  "video_url",
  "profile",
  "verdict",
  "verdict_reason",
  "points",
  "adaptations",
  ...GRADE_COLUMNS,
  "comment",
];

// One shuffled row per result; the config name never appears in the sheet, only in the separate key.
export function buildBlindSheet(results: EvalResult[], seed: number) {
  const shuffled = seededShuffle(results, seed);
  const rows: Record<string, string>[] = [];
  const key: KeyRow[] = [];
  shuffled.forEach((r, i) => {
    const id = `R-${String(i + 1).padStart(3, "0")}`;
    rows.push({
      id,
      video_url: `https://www.youtube.com/watch?v=${r.videoId}`,
      profile: r.profileText,
      verdict: r.verdict,
      verdict_reason: r.verdictReason,
      points: describePoints(r.videoId, r.points),
      adaptations: describeAdaptations(r.adaptations),
    });
    key.push({ id, config: r.config, videoId: r.videoId, profile: r.profileName });
  });
  return { rows, key };
}

// ---- Scoring ---------------------------------------------------------------

export type ConfigScore = { config: string; graded: number; means: Record<string, number | null> };

export function aggregateScores(graded: Record<string, string>[], key: KeyRow[]): ConfigScore[] {
  const byId = new Map(key.map((k) => [k.id, k]));
  const acc = new Map<string, { n: number; sums: Record<string, { sum: number; n: number }> }>();
  for (const row of graded) {
    const k = byId.get(row.id);
    if (!k) continue;
    const values = GRADE_COLUMNS.map((c) => [c, Number(row[c])] as const).filter(([, v]) => Number.isFinite(v) && v >= 1 && v <= 5);
    if (values.length === 0) continue; // ungraded row
    const entry = acc.get(k.config) ?? { n: 0, sums: {} };
    entry.n++;
    for (const [c, v] of values) {
      const s = (entry.sums[c] ??= { sum: 0, n: 0 });
      s.sum += v;
      s.n++;
    }
    acc.set(k.config, entry);
  }
  return [...acc.entries()].map(([config, e]) => ({
    config,
    graded: e.n,
    means: Object.fromEntries(GRADE_COLUMNS.map((c) => [c, e.sums[c] ? Math.round((e.sums[c].sum / e.sums[c].n) * 100) / 100 : null])),
  }));
}
