export const EFFORT_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4] as const;
export type Effort = (typeof EFFORT_OPTIONS)[number];

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function formatHours(h: number) {
  return h < 1 ? `${Math.round(h * 60)} min` : `${round1(h)} h`;
}

// Largest allowed effort that is <= max (never below the smallest option).
export function snapEffort(h: number, max: number = 4): Effort {
  const cap = Math.min(h, max);
  let best: Effort = EFFORT_OPTIONS[0];
  for (const o of EFFORT_OPTIONS) if (o <= cap) best = o;
  return best;
}

export function isEffort(h: number): h is Effort {
  return (EFFORT_OPTIONS as readonly number[]).includes(h);
}

export type ActionGroup = "today" | "week" | "later";

// Day 1 is the validation day.
export function groupForDay(day: number): ActionGroup {
  return day <= 1 ? "today" : day <= 7 ? "week" : "later";
}

export function totalHours(items: { effort: number }[]) {
  return round1(items.reduce((sum, i) => sum + i.effort, 0));
}

// A plan longer than a week spreads its effort over several weeks.
export function perWeekHours(total: number, durationDays: number) {
  return round1(total / Math.max(1, durationDays / 7));
}

export function overBy(perWeek: number, limit: number) {
  return Math.max(0, round1(perWeek - limit));
}
