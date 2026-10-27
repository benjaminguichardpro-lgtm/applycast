import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, planForStatus } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe calls this on every subscription change; it is the only place a user becomes Pro or goes back to free.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.user_id ?? s.client_reference_id;
      if (userId && s.mode === "subscription") {
        await admin
          .from("users")
          .update({
            plan: "pro",
            stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id,
            stripe_subscription_id: typeof s.subscription === "string" ? s.subscription : s.subscription?.id,
            ...(s.metadata?.founding === "1" ? { founding_member: true } : {}),
          })
          .eq("id", userId);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const plan = event.type === "customer.subscription.deleted" ? "free" : planForStatus(sub.status);
      await admin
        .from("users")
        // Cancelling gives up the founding spot and its price.
        .update({ plan, stripe_subscription_id: plan === "pro" ? sub.id : null, ...(plan === "free" ? { founding_member: false } : {}) })
        .eq("stripe_customer_id", customer);
    }
  } catch (e) {
    console.error("stripe webhook failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 }); // Stripe retries
  }
  return NextResponse.json({ received: true });
}
