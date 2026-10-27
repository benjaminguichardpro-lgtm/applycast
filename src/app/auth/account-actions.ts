"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/billing";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Deletes the account and everything under it (profile, analyses, plans, actions, check-ins) and ends the subscription.
export async function deleteAccount(): Promise<{ ok: false } | never> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const { data } = await admin.from("users").select("stripe_subscription_id").eq("id", user.id).single();
  if (data?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      await getStripe().subscriptions.cancel(data.stripe_subscription_id as string);
    } catch (e) {
      // Already cancelled or not found: nothing left to bill, so deleting the account can go on.
      console.error("subscription cancel failed:", e instanceof Error ? e.message : e);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id); // cascades to every table
  if (error) {
    console.error("deleteUser failed:", error.message);
    return { ok: false };
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
