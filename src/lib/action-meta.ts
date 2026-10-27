export const DROP_REASONS = ["Not relevant", "No time", "Too risky", "Other"] as const;
export type DropReason = (typeof DROP_REASONS)[number];
