import type { SupabaseClient } from "@supabase/supabase-js";

// A Low match (nothing to apply) and a failed analysis are not counted: see run.ts.
export const FREE_MONTHLY_ANALYSES = 3;
export const PRO_MONTHLY_ANALYSES = 50;

// Single server-side source for "analyses left this month" (banner, paywall, history all call this).
export async function getAnalysesLeft(supabase: SupabaseClient, userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const [{ data: user }, { data: usage }] = await Promise.all([
    supabase.from("users").select("plan, founding_member").eq("id", userId).single(),
    supabase.from("usage").select("analyses_count").eq("user_id", userId).eq("month", month).maybeSingle(),
  ]);
  const used = usage?.analyses_count ?? 0;
  const isPro = user?.plan === "pro";
  const limit = isPro ? PRO_MONTHLY_ANALYSES : FREE_MONTHLY_ANALYSES;
  return {
    isPro,
    isFounding: Boolean(user?.founding_member) && isPro,
    used,
    limit,
    left: Math.max(0, limit - used),
  };
}
