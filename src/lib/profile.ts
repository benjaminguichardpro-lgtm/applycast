export const STAGES = ["Idea", "Pre-revenue", "<$10k MRR", "$10k–100k MRR", "$100k+ MRR"] as const;
export type Stage = (typeof STAGES)[number];

export type Profile = {
  offer: string;
  stage: Stage | null;
  role: string;
  active_goal: string;
  constraint_text: string;
  // Weekly effort cap in hours; edited separately from the 5 counted fields.
  weekly_hours_limit: number;
};

export const DEFAULT_WEEKLY_HOURS = 6;

export const PROFILE_FIELD_COUNT = 5;

export const PROFILE_FIELDS = ["offer", "stage", "role", "active_goal", "constraint_text"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

// Everything the Context form can change (the counted fields plus the weekly limit).
export const EDITABLE_FIELDS = [...PROFILE_FIELDS, "weekly_hours_limit"] as const;

export function countFilled(p: Profile) {
  return PROFILE_FIELDS.filter((k) => Boolean(p[k]?.toString().trim())).length;
}

// A measurable goal contains a number (a target or a deadline day/amount).
export function isMeasurable(goal: string) {
  return /\d/.test(goal);
}
