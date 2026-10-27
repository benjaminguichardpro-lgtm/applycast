"use server";

import { z } from "zod";
import { STAGES } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    offer: z.string().max(300),
    stage: z.enum(STAGES),
    role: z.string().max(200),
    active_goal: z.string().max(300),
    constraint_text: z.string().max(300),
    weekly_hours_limit: z.number().min(1).max(80),
  })
  .partial();

export async function saveProfile(patch: unknown): Promise<{ ok: boolean }> {
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) {
    console.error("saveProfile invalid patch:", parsed.error.message);
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("user_id", user.id);
  if (error) console.error("saveProfile failed:", error.message);
  return { ok: !error };
}
