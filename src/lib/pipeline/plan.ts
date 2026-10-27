import { z } from "zod";
import { EFFORT_OPTIONS, snapEffort } from "../effort";
import { generate } from "../llm";
import type { Profile } from "../profile";

export type PlanStep = { day: number; text: string; effort: number };
export type Plan = { durationDays: number; steps: PlanStep[] };

export const MAX_STEPS = 5;
export const MIN_DAYS = 1;
export const MAX_DAYS = 60;

const effort = z.union(EFFORT_OPTIONS.map((o) => z.literal(o)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]);

const schema = z.object({
  duration_days: z.number().int().min(MIN_DAYS).max(MAX_DAYS),
  steps: z
    .array(z.object({ day: z.number().int().min(1), text: z.string().min(5).max(180), effort_hours: effort }))
    .min(1)
    .max(MAX_STEPS),
});

const SYSTEM = `You turn the adaptations a founder selected into a short, executable action plan.
Reply with one JSON object:
{"duration_days":7,"steps":[{"day":1,"text":"...","effort_hours":1}]}

Rules:
- 1 to 5 steps. Each step is one concrete action the founder does alone, one sentence, imperative, using their real context.
- "day" counts from the day the plan is validated (day 1 = that day). Steps are in order and never later than duration_days.
- effort_hours is one of 0.5, 1, 1.5, 2, 2.5, 3, 4.
- Total effort per week must stay within the founder's weekly limit. For a plan of N days, that is limit * N / 7 in total (at least one week's worth).
- If requested_duration_days is given, duration_days must equal it. Otherwise suggest a duration (7 is the default; use more only when the work needs it).
- Merge or drop selected adaptations rather than exceeding 5 steps or the limit. Never contradict the active goal.
- Write in English. Do not invent facts about the founder's business.`;

export async function buildPlanSteps(
  profile: Profile,
  adaptations: { text: string; effort: number; target: string }[],
  requestedDays: number | null,
): Promise<Plan> {
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
      requested_duration_days: requestedDays,
      selected_adaptations: adaptations.map((a) => ({ text: a.text, estimated_hours: a.effort })),
    },
    null,
    2,
  );
  const out = await generate("plan", { system: SYSTEM, user, schema });
  return finalizePlan(out, requestedDays);
}

export function finalizePlan(
  out: { duration_days: number; steps: { day: number; text: string; effort_hours: number }[] },
  requestedDays: number | null,
): Plan {
  const durationDays = requestedDays ?? out.duration_days;
  const steps = out.steps
    .map((s) => ({ day: Math.min(Math.max(1, s.day), durationDays), text: s.text.trim(), effort: snapEffort(s.effort_hours) }))
    .sort((a, b) => a.day - b.day)
    .slice(0, MAX_STEPS);
  return { durationDays, steps };
}
