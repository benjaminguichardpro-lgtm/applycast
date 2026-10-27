import Stripe from "stripe";

export const PRO_PRICE_LABEL = "$15";

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

// The launch coupon (50% off, forever, max 50 redemptions) is created in Stripe; its id is in STRIPE_FOUNDING_COUPON_ID.
// Spots are counted by Stripe itself, never by us.
export async function foundingOfferAvailable(): Promise<boolean> {
  const id = process.env.STRIPE_FOUNDING_COUPON_ID;
  if (!id || !process.env.STRIPE_SECRET_KEY) return false;
  try {
    const c = await getStripe().coupons.retrieve(id);
    return c.valid && (c.max_redemptions == null || c.times_redeemed < c.max_redemptions);
  } catch {
    return false;
  }
}
