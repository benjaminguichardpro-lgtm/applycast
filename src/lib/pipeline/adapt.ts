import { z } from "zod";
import { EFFORT_OPTIONS, snapEffort } from "../effort";
import { generate } from "../llm";
import type { Profile } from "../profile";

export type ApplyPoint = { index: number; insightId: string; text: string; tag: string | null; reason: string | null };

export type AdaptationRow = {
  insightId: string;
  target: "business" | "profile";
  category: "Habit" | "Skill" | "Time" | null;
  text: string;
  effort: number;
};

const effort = z.union(EFFORT_OPTIONS.map((o) => z.literal(o)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]);

function adaptSchema(indexes: number[]) {
  return z
    .object({
      adaptations: z.array(
        z.object({
          insight_index: z.number().int(),
          business: z.object({ text: z.string().min(10).max(220), effort_hours: effort }),
          profile: z.object({
            category: z.enum(["Habit", "Skill", "Time"]),
            text: z.string().min(10).max(220),
            effort_hours: effort,
          }),
        }),
      ),
    })
    .superRefine((v, ctx) => {
      const got = v.adaptations.map((a) => a.insight_index).sort((a, b) => a - b);
      if (got.join() !== [...indexes].sort((a, b) => a - b).join()) {
        ctx.addIssue({ code: "custom", message: `adaptations must cover insight_index ${indexes.join(", ")} exactly once` });
      }
    });
}

const ADAPT_SYSTEM = `You turn points from a business video into adaptations for one specific founder.
Reply with one JSON object:
{"adaptations":[{"insight_index":1,"business":{"text":"...","effort_hours":1},"profile":{"category":"Habit|Skill|Time","text":"...","effort_hours":1}}]}

For each point, write exactly two adaptations:
- "business": a change to the founder's own offer, pricing or go-to-market, using their real numbers and context. One sentence, imperative, concrete.
- "profile": something the founder does personally: a "Habit" to build, a "Skill" to learn, or "Time" to free up. One sentence, imperative, concrete.

Rules:
- Each adaptation must move the founder's ACTIVE GOAL in the right direction. Never write one that works against it.
- Each adaptation must fit the MAIN CONSTRAINT: effort_hours is the realistic time to do it once, and must not exceed the weekly limit.
- effort_hours must be one of 0.5, 1, 1.5, 2, 2.5, 3, 4.
- Write in English. Cover every insight_index exactly once. Do not invent facts about the founder's business.`;

export async function adaptPoints(profile: Profile, points: ApplyPoint[]): Promise<AdaptationRow[]> {
  const user = JSON.stringify(
    {
      founder: {
        offer: profile.offer,
        stage: profile.stage,
        role: profile.role,
        active_goal: profile.active_goal,
        main_constraint: profile.constraint_text,
        weekly_limit_hours: profile.weekly_hours_limit,
      },
      points: points.map((p) => ({ insight_index: p.index, text: p.text, moves: p.tag, why_it_applies: p.reason })),
    },
    null,
    2,
  );
  const out = await generate("adapt", {
    system: ADAPT_SYSTEM,
    user,
    schema: adaptSchema(points.map((p) => p.index)),
  });
  return toRows(out.adaptations, points, profile.weekly_hours_limit);
}

export function toRows(
  adaptations: { insight_index: number; business: { text: string; effort_hours: number }; profile: { category: "Habit" | "Skill" | "Time"; text: string; effort_hours: number } }[],
  points: ApplyPoint[],
  weeklyLimit: number,
): AdaptationRow[] {
  const rows: AdaptationRow[] = [];
  for (const p of points) {
    const a = adaptations.find((x) => x.insight_index === p.index);
    if (!a) continue;
    // An adaptation must fit the declared constraint: cap its effort at the weekly limit.
    rows.push({ insightId: p.insightId, target: "business", category: null, text: a.business.text.trim(), effort: snapEffort(a.business.effort_hours, weeklyLimit) });
    rows.push({ insightId: p.insightId, target: "profile", category: a.profile.category, text: a.profile.text.trim(), effort: snapEffort(a.profile.effort_hours, weeklyLimit) });
  }
  return rows;
}

// Coherence check before saving: drop any adaptation that works against the active goal.
const checkSchema = z.object({ contradicting: z.array(z.string()) });

const CHECK_SYSTEM = `You check adaptations for one founder against their ACTIVE GOAL.
Reply with one JSON object: {"contradicting":["id", ...]}
List the id of every adaptation that, if followed, would move the goal metric in the wrong direction or clearly conflict with the goal or its deadline. If none, return an empty list. Only use ids you were given.`;

export async function dropContradictions(profile: Profile, rows: AdaptationRow[]): Promise<AdaptationRow[]> {
  const items = rows.map((r, i) => ({ id: `a${i + 1}`, target: r.target, text: r.text }));
  const user = JSON.stringify({ active_goal: profile.active_goal, main_constraint: profile.constraint_text, adaptations: items }, null, 2);
  const out = await generate("check", { system: CHECK_SYSTEM, user, schema: checkSchema });
  const bad = new Set(out.contradicting);
  return rows.filter((_, i) => !bad.has(`a${i + 1}`));
}
