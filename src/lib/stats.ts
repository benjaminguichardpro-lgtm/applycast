import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnalysesLeft } from "./quota";

export type ActionStatus = "open" | "done" | "postponed" | "dropped";

export type MonthStats = {
  month: string;
  analyses: number;
  left: number | null; // free analyses left; null on Pro
  isPro: boolean;
  plansValidated: number;
  actionsValidated: number;
  counts: Record<ActionStatus, number>;
  doneRate: number;
  byVerdict: { strong: number; partial: number; low: number };
};

export function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// Monday 00:00 UTC of the current week, and the following Monday.
export function weekBounds(now = new Date()) {
  const day = (now.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
  return { start, end: new Date(start.getTime() + 7 * 86_400_000) };
}

export const pct = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));

// Plans deleted after a check-in leave only their snapshot: done actions stay done, the rest counts as dropped.
export function combineCounts(
  live: ActionStatus[],
  orphans: { actions_total: number; actions_done: number }[],
): { counts: Record<ActionStatus, number>; total: number; doneRate: number } {
  const counts: Record<ActionStatus, number> = { open: 0, done: 0, postponed: 0, dropped: 0 };
  for (const s of live) counts[s]++;
  for (const o of orphans) {
    counts.done += o.actions_done;
    counts.dropped += Math.max(0, o.actions_total - o.actions_done);
  }
  const total = counts.open + counts.done + counts.postponed + counts.dropped;
  return { counts, total, doneRate: pct(counts.done, total) };
}

// The only place these monthly figures are computed: the banner, History, My actions and the paywall all read from here.
export async function getMonthStats(supabase: SupabaseClient, userId: string): Promise<MonthStats> {
  const start = monthStart();
  const startIso = start.toISOString();

  const [quota, { data: monthPlans }, { data: allPlans }, { data: checkins }, { data: analyses }] = await Promise.all([
    getAnalysesLeft(supabase, userId),
    supabase.from("plans").select("id").eq("status", "validated").gte("validated_at", startIso),
    supabase.from("plans").select("id"),
    supabase.from("checkins").select("plan_id, actions_total, actions_done").gte("created_at", startIso),
    supabase.from("analyses").select("verdict").eq("status", "done").is("deleted_at", null).gte("created_at", startIso),
  ]);

  const planIds = (monthPlans ?? []).map((p) => p.id as string);
  const { data: actions } = planIds.length
    ? await supabase.from("actions").select("status").in("plan_id", planIds)
    : { data: [] as { status: ActionStatus }[] };

  const existing = new Set((allPlans ?? []).map((p) => p.id as string));
  const orphans = (checkins ?? []).filter((c) => !existing.has(c.plan_id as string)) as { actions_total: number; actions_done: number }[];
  const { counts, total, doneRate } = combineCounts((actions ?? []).map((a) => a.status as ActionStatus), orphans);

  const byVerdict = { strong: 0, partial: 0, low: 0 };
  for (const a of analyses ?? []) if (a.verdict in byVerdict) byVerdict[a.verdict as keyof typeof byVerdict]++;

  return {
    month: new Date().toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
    analyses: quota.used,
    left: quota.left,
    isPro: quota.isPro,
    plansValidated: planIds.length + orphans.length,
    actionsValidated: total,
    counts,
    doneRate,
    byVerdict,
  };
}
