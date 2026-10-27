// Evaluation set: runs every video against every fictional profile and every enabled AI configuration,
// then exports a shuffled, config-free sheet for blind grading. See eval/README.md.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { adaptPoints, dropContradictions } from "../src/lib/pipeline/adapt";
import { extractPoints, type Point } from "../src/lib/pipeline/extract";
import { scorePoints } from "../src/lib/pipeline/verdict";
import type { Profile } from "../src/lib/profile";
import { getTranscript, TranscriptUnavailableError, type Transcript } from "../src/lib/transcript";
import { parseVideoId } from "../src/lib/youtube";
import { buildBlindSheet, SHEET_COLUMNS, toCsv, type EvalResult } from "./lib";

type VideoEntry = { url: string; tag?: string };
type ProfileEntry = Profile & { name: string };
type StepConfig = { provider: string; model: string };
type ConfigEntry = { name: string; enabled: boolean; steps: { extract: StepConfig; verdict: StepConfig } };

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};

const readJson = <T>(file: string): T => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
const sleepless = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    }),
  );
};

function hashSeed(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

async function main() {
  const videosAll = readJson<VideoEntry[]>("eval/videos.json");
  if (videosAll.length === 0) {
    console.error("eval/videos.json is empty. Add your videos (see eval/videos.example.json and eval/README.md).");
    process.exit(1);
  }
  const videos = videosAll
    .map((v) => ({ ...v, id: parseVideoId(v.url) }))
    .map((v) => {
      if (!v.id) throw new Error(`Not a YouTube URL in eval/videos.json: ${v.url}`);
      return v as VideoEntry & { id: string };
    })
    .slice(0, Number(option("videos")) || undefined);
  const profiles = readJson<ProfileEntry[]>("eval/profiles.json").slice(0, Number(option("profiles")) || undefined);
  const configs = readJson<ConfigEntry[]>("eval/configs.json").filter((c) => c.enabled);
  const withAdapt = !flag("no-adapt");
  const concurrency = Number(option("concurrency")) || 3;

  const cacheDir = path.join(ROOT, "eval/cache/transcripts");
  const cached = (id: string) => existsSync(path.join(cacheDir, `${id}.json`));
  const newTranscripts = videos.filter((v) => !cached(v.id)).length;
  const runs = videos.length * profiles.length * configs.length;

  console.log(`Videos: ${videos.length} · profiles: ${profiles.length} · configs: ${configs.map((c) => c.name).join(", ")}`);
  console.log(`Supadata transcripts to fetch: ${newTranscripts} (1 credit each, the rest is cached)`);
  console.log(`AI calls: ${videos.length * configs.length} extractions, ${runs} verdicts${withAdapt ? `, up to ${runs * 2} adaptation/check calls` : ""}`);
  if (flag("dry")) {
    console.log("\nDry run: nothing was called.");
    return;
  }

  const needs = new Set<string>(["SUPADATA_API_KEY"]);
  for (const c of configs) for (const s of [c.steps.extract, c.steps.verdict]) needs.add(`${s.provider.toUpperCase()}_API_KEY`);
  const missing = [...needs].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing in .env.local: ${missing.join(", ")}`);
    process.exit(1);
  }

  const runId = option("run") ?? new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(ROOT, "eval/out", runId);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  const resultsFile = path.join(outDir, "results.jsonl");
  const done = new Set<string>();
  if (existsSync(resultsFile)) {
    for (const line of readFileSync(resultsFile, "utf8").split("\n").filter(Boolean)) {
      const r = JSON.parse(line);
      if (!r.error) done.add(`${r.config}|${r.videoId}|${r.profileName}`);
    }
  }

  // 1. Transcripts (cached on disk so a rerun never pays Supadata twice).
  const transcripts = new Map<string, Transcript | "unavailable">();
  await sleepless(videos, 1, async (v) => {
    const file = path.join(cacheDir, `${v.id}.json`);
    if (existsSync(file)) {
      const c = JSON.parse(readFileSync(file, "utf8"));
      transcripts.set(v.id, c.unavailable ? "unavailable" : c);
      return;
    }
    try {
      const t = await getTranscript(v.id);
      writeFileSync(file, JSON.stringify(t));
      transcripts.set(v.id, t);
      console.log(`transcript ok      ${v.id}`);
    } catch (e) {
      if (e instanceof TranscriptUnavailableError) {
        writeFileSync(file, JSON.stringify({ unavailable: true }));
        transcripts.set(v.id, "unavailable");
        console.log(`no transcript      ${v.id}`);
      } else {
        console.log(`transcript FAILED  ${v.id}: ${e instanceof Error ? e.message : e}`);
      }
    }
  });

  // 2. Per config: extract once per video, then score every profile.
  for (const config of configs) {
    process.env.LLM_EXTRACT_PROVIDER = config.steps.extract.provider;
    process.env.LLM_EXTRACT_MODEL = config.steps.extract.model;
    process.env.LLM_VERDICT_PROVIDER = config.steps.verdict.provider;
    process.env.LLM_VERDICT_MODEL = config.steps.verdict.model;
    for (const step of ["ADAPT", "CHECK"]) {
      delete process.env[`LLM_${step}_PROVIDER`];
      delete process.env[`LLM_${step}_MODEL`];
    }

    await sleepless(videos, concurrency, async (v) => {
      const transcript = transcripts.get(v.id);
      if (!transcript || transcript === "unavailable") return;
      const pending = profiles.filter((p) => !done.has(`${config.name}|${v.id}|${p.name}`));
      if (pending.length === 0) return;

      let points: Point[];
      try {
        points = await extractPoints(transcript);
      } catch (e) {
        for (const p of pending) appendFileSync(resultsFile, JSON.stringify({ config: config.name, videoId: v.id, profileName: p.name, error: `extract: ${e instanceof Error ? e.message : e}` }) + "\n");
        console.log(`${config.name} ${v.id} extraction failed`);
        return;
      }

      for (const profile of pending) {
        const started = Date.now();
        try {
          const scored = await scorePoints(profile, points);
          let adaptations: EvalResult["adaptations"] = [];
          let dropped = 0;
          if (withAdapt && scored.verdict !== "low") {
            const apply = scored.points
              .filter((p) => p.kind === "apply")
              .map((p, i) => ({ index: i + 1, insightId: String(i + 1), text: p.text, tag: p.tag, reason: p.reason }));
            const drafted = await adaptPoints(profile, apply);
            const kept = await dropContradictions(profile, drafted);
            dropped = drafted.length - kept.length;
            adaptations = kept.map((a) => ({ target: a.target, category: a.category, text: a.text, effort: a.effort }));
          }
          const result: EvalResult = {
            config: config.name,
            videoId: v.id,
            videoTag: v.tag,
            profileName: profile.name,
            profileText: `${profile.role}. Offer: ${profile.offer}. Stage: ${profile.stage}. Goal: ${profile.active_goal}. Constraint: ${profile.constraint_text}.`,
            verdict: scored.verdict,
            verdictReason: scored.verdictReason,
            points: scored.points.map((p) => ({ ts: p.tsSeconds, text: p.text, kind: p.kind, tag: p.tag, reason: p.reason })),
            adaptations,
            droppedAdaptations: dropped,
            latencyMs: Date.now() - started,
          };
          appendFileSync(resultsFile, JSON.stringify(result) + "\n");
          console.log(`${config.name} ${v.id} × ${profile.name}: ${scored.verdict}`);
        } catch (e) {
          appendFileSync(resultsFile, JSON.stringify({ config: config.name, videoId: v.id, profileName: profile.name, error: e instanceof Error ? e.message : String(e) }) + "\n");
          console.log(`${config.name} ${v.id} × ${profile.name}: ERROR`);
        }
      }
    });
  }

  // 3. Exports.
  const lines = readFileSync(resultsFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const results = lines.filter((r) => !r.error) as EvalResult[];
  const errors = lines.filter((r) => r.error);
  const { rows, key } = buildBlindSheet(results, hashSeed(runId));
  writeFileSync(path.join(outDir, "blind.csv"), toCsv(rows, SHEET_COLUMNS));
  writeFileSync(path.join(outDir, "key.json"), JSON.stringify(key, null, 2));
  writeFileSync(path.join(outDir, "report.md"), report(results, errors, [...transcripts].filter(([, t]) => t === "unavailable").map(([id]) => id)));

  console.log(`\nDone. ${results.length} results, ${errors.length} errors.`);
  console.log(`Blind sheet:  eval/out/${runId}/blind.csv   (grade this, do not open key.json)`);
  console.log(`Key:          eval/out/${runId}/key.json`);
  console.log(`Auto report:  eval/out/${runId}/report.md  (shows the configs, so open it after grading)`);
}

function report(results: EvalResult[], errors: { config: string; videoId: string; profileName: string; error: string }[], noTranscript: string[]) {
  const out = ["# Automatic report", "", "Shows which config produced what: open it only after you finished grading the blind sheet.", ""];
  const names = [...new Set(results.map((r) => r.config).concat(errors.map((e) => e.config)))];
  for (const name of names) {
    const mine = results.filter((r) => r.config === name);
    const errs = errors.filter((e) => e.config === name);
    const lat = mine.map((r) => r.latencyMs).sort((a, b) => a - b);
    const points = mine.flatMap((r) => r.points);
    const verdicts = (profile?: string) => {
      const list = mine.filter((r) => !profile || r.profileName === profile);
      return ["strong", "partial", "low"].map((v) => `${list.filter((r) => r.verdict === v).length} ${v}`).join(" · ");
    };
    const adapted = mine.filter((r) => r.adaptations.length + r.droppedAdaptations > 0);
    const dropped = adapted.reduce((n, r) => n + r.droppedAdaptations, 0);
    const total = adapted.reduce((n, r) => n + r.adaptations.length + r.droppedAdaptations, 0);
    out.push(`## ${name}`, "");
    out.push(`- Runs: ${mine.length} ok, ${errs.length} errors`);
    out.push(`- Verdict latency (verdict + adaptations): median ${lat.length ? Math.round(lat[Math.floor(lat.length / 2)] / 1000) : "-"} s, max ${lat.length ? Math.round(lat[lat.length - 1] / 1000) : "-"} s`);
    out.push(`- Points per video: ${(points.length / Math.max(1, mine.length)).toFixed(1)}; with a timestamp: ${points.length ? Math.round((points.filter((p) => p.ts !== null).length / points.length) * 100) : 0}%`);
    out.push(`- Adaptations removed by the goal-coherence check: ${dropped} of ${total}`);
    out.push(`- Verdicts overall: ${verdicts()}`);
    for (const p of [...new Set(mine.map((r) => r.profileName))].sort()) out.push(`  - ${p}: ${verdicts(p)}`);
    out.push("");
  }
  if (noTranscript.length) out.push("## Videos without a usable transcript", "", ...noTranscript.map((id) => `- https://www.youtube.com/watch?v=${id}`), "");
  if (errors.length) out.push("## Errors", "", ...errors.map((e) => `- ${e.config} · ${e.videoId} · ${e.profileName}: ${e.error}`), "");
  return out.join("\n");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
