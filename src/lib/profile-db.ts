import type { SupabaseClient } from "@supabase/supabase-js";
import { countFilled, DEFAULT_WEEKLY_HOURS, PROFILE_FIELD_COUNT, type Profile } from "./profile";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("offer, stage, role, active_goal, constraint_text, weekly_hours_limit")
    .eq("user_id", userId)
    .single();
  return {
    offer: data?.offer ?? "",
    stage: data?.stage ?? null,
    role: data?.role ?? "",
    active_goal: data?.active_goal ?? "",
    constraint_text: data?.constraint_text ?? "",
    weekly_hours_limit: Number(data?.weekly_hours_limit ?? DEFAULT_WEEKLY_HOURS),
  };
}

export const isProfileComplete = (p: Profile) => countFilled(p) === PROFILE_FIELD_COUNT;
