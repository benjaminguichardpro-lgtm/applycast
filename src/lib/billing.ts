import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRO_PRICE = 19;
export const ANNUAL_MONTHS_PAID = 10; // the yearly plan charges 10 months for 12: same benefits as monthly
export const ANNUAL_FREE_MONTHS = 12 - ANNUAL_MONTHS_PAID;
export const PRO_ANNUAL_PRICE = PRO_PRICE * ANNUAL_MONTHS_PAID;
export const PRO_PRICE_LABEL = `$${PRO_PRICE}`;
export const PRO_ANNUAL_PRICE_LABEL = `$${PRO_ANNUAL_PRICE}`;

let client: Stripe | null = null;
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return (client ??= new Stripe(key));
}

// Pro while the subscription is paying (or in its payment-retry grace period); free once it ends.
export function planForStatus(status: string): "pro" | "free" {
  return status === "active" || status === "trialing" || status === "past_due" ? "pro" : "free";
}

export function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

// "Nov 1": when the free quota resets.
export function nextResetLabel(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// "Dec 3": set once the subscription was cancelled in the portal but is still paid until then; null otherwise.
export async function proEndsOn(userId: string): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const { data } = await createAdminClient().from("users").select("stripe_subscription_id").eq("id", userId).single();
    const id = data?.stripe_subscription_id as string | null | undefined;
    if (!id) return null;
    const sub = await getStripe().subscriptions.retrieve(id);
    const end = sub.cancel_at ?? (sub.cancel_at_period_end ? sub.items.data[0]?.current_period_end : null);
    if (!end) return null;
    return new Date(end * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}
