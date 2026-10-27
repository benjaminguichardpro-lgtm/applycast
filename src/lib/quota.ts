import type { SupabaseClient } from "@supabase/supabase-js";

// A Low match (nothing to apply) and a failed analysis are not counted: see run.ts.
export const FREE_MONTHLY_ANALYSES = 3;

// Single server-side source for "analyses left this month" (banner, paywall, history all call this).
export async function getAnalysesLeft(supabase: SupabaseClient, userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const [{ data: user }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", userId).single(),
    supabase.from("usage").select("analyses_count").eq("user_id", userId).eq("month", month).maybeSingle(),
  ]);
  const used = usage?.analyses_count ?? 0;
  const isPro = user?.plan === "pro";
  return { isPro, used, left: isPro ? null : Math.max(0, FREE_MONTHLY_ANALYSES - used) };
}
