"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Deleting an analysis removes its insights, adaptations, plan and actions (cascade).
// Saved check-ins stay, with their done/total snapshot, so the done rate does not move.
export async function deleteAnalysis(id: string): Promise<{ ok: boolean }> {
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase.from("analyses").delete({ count: "exact" }).eq("id", id);
  return { ok: !error && (count ?? 0) > 0 };
}
