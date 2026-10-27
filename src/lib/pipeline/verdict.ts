import { z } from "zod";
import { generate } from "../llm";
import type { Profile } from "../profile";
import type { Point } from "./extract";

export type Kind = "apply" | "against" | "na";
export type Verdict = "strong" | "partial" | "low";

export type ScoredPoint = Point & { kind: Kind; tag: string | null; reason: string; isKey: boolean; keyReason: string | null };
export type Scored = { goalMetric: string; verdict: Verdict; verdictReason: string; points: ScoredPoint[] };

function schemaFor(n: number) {
  return z
    .object({
      goal_metric: z.string().min(1).max(60),
      points: z.array(
        z.object({
          index: z.number().int(),
          kind: z.enum(["apply", "against", "na"]),
          metric: z.string().max(60).nullable(),
          direction: z.enum(["up", "down"]).nullable(),
          reason: z.string().min(3).max(200),
          key: z.boolean(),
          key_reason: z.string().max(220).nullable(),
        }),
      ),
      verdict: z.enum(["strong", "partial", "low"]),
      verdict_reason: z.string().min(10).max(500),
    })
    .superRefine((v, ctx) => {
      const seen = v.points.map((p) => p.index).sort((a, b) => a - b);
      const expected = Array.from({ length: n }, (_, i) => i + 1);
      if (seen.join() !== expected.join()) {
        ctx.addIssue({ code: "custom", message: `points must cover each index 1..${n} exactly once` });
      }
    });
}

const SYSTEM = `You judge whether the points of a business video apply to one specific founder.
Reply with one JSON object:
{"goal_metric":"...","points":[{"index":1,"kind":"apply|against|na","metric":"...|null","direction":"up|down|null","reason":"...","key":false,"key_reason":null}],"verdict":"strong|partial|low","verdict_reason":"..."}

Definitions, judged against the founder's ACTIVE GOAL and MAIN CONSTRAINT:
- "apply": the point gives something the founder can use within the constraint, and using it directly moves the goal metric in the right direction. That includes a concrete action, and also a decision rule or threshold that guides a choice the founder faces on the way to the goal (for example "only raise prices on existing customers if the expected gain is at least 10%"). Do not stretch: if the link to the goal needs several assumptions, or the point only describes how another company works, it is "na".
- "against": following the point would move the goal metric in the wrong direction, whatever the video says. Never use "apply" for such a point.
- "na": the point does not concern this founder's business, stage or constraint.

Fields:
- goal_metric: the short name of the metric in the active goal (e.g. "ARPA", "MRR", "signups").
- metric + direction: for "apply" and "against", the metric the point touches and which way it would move it ("up" or "down"). For "na", both null.
- reason: one short sentence (14 words max), specific to this founder.
- key: true only for an "apply" point that could change the outcome for this founder, not just help a little: the single idea that could make their active goal reachable or unblock them. Most videos have none; never more than 2. When key is true, key_reason is one sentence (25 words max) saying why this point could change things for them; otherwise key is false and key_reason is null. A key point is never "na" or "against".
- verdict: "strong" if at least 60% of the points apply, "partial" if at least one applies but fewer than 60%, "low" only if no point applies. A single applying point is enough for "partial".
- verdict_reason: 1 to 2 sentences that cite point numbers and explain the verdict for this founder.
Write in English. Cover every point index exactly once.`;

export async function scorePoints(profile: Profile, points: Point[]): Promise<Scored> {
  const user = JSON.stringify(
    {
      founder: {
        offer: profile.offer,
        stage: profile.stage,
        role: profile.role,
        active_goal: profile.active_goal,
        main_constraint: profile.constraint_text,
      },
      points: points.map((p, i) => ({ index: i + 1, text: p.text })),
    },
    null,
    2,
  );
  const out = await generate("verdict", { system: SYSTEM, user, schema: schemaFor(points.length) });
  return finalize(out, points);
}

type ModelOut = {
  goal_metric: string;
  points: { index: number; kind: Kind; metric: string | null; direction: "up" | "down" | null; reason: string; key?: boolean; key_reason?: string | null }[];
  verdict: Verdict;
  verdict_reason: string;
};

// Low only when nothing applies; strong from 60% of the points; partial in between (one useful point is enough).
export function verdictFor(applied: number, total: number): Verdict {
  if (applied === 0 || total === 0) return "low";
  return applied / total >= 0.6 ? "strong" : "partial";
}

export const MAX_KEY_POINTS = 2;

// Deterministic rules applied after the model: tags, and a verdict that cannot contradict the counts.
export function finalize(out: ModelOut, points: Point[]): Scored {
  const scored: ScoredPoint[] = points.map((p, i) => {
    const m = out.points.find((x) => x.index === i + 1)!;
    const tag = m.kind !== "na" && m.metric && m.direction ? `${m.metric} ${m.direction === "up" ? "↑" : "↓"}` : null;
    return { ...p, kind: m.kind, tag, reason: m.reason, isKey: m.kind === "apply" && Boolean(m.key) && Boolean(m.key_reason?.trim()), keyReason: m.key_reason?.trim() || null };
  });
  // A key point is rare by definition: keep the first MAX_KEY_POINTS the model flagged.
  let keys = 0;
  for (const p of scored) {
    if (!p.isKey) p.keyReason = null;
    else if (++keys > MAX_KEY_POINTS) {
      p.isKey = false;
      p.keyReason = null;
    }
  }
  const applied = scored.filter((p) => p.kind === "apply").length; // "against" is never counted
  const verdict = verdictFor(applied, scored.length);
  return { goalMetric: out.goal_metric, verdict, verdictReason: out.verdict_reason, points: scored };
}
