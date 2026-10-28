"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/billing";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
}

async function customerIdFor(userId: string, email: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("stripe_customer_id").eq("id", userId).single();
  if (data?.stripe_customer_id) return data.stripe_customer_id as string;
  const customer = await getStripe().customers.create({ email, metadata: { user_id: userId } });
  await admin.from("users").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

export async function startCheckout() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const price = process.env.STRIPE_PRICE_ID;
  if (!price) throw new Error("STRIPE_PRICE_ID is not set");

  const admin = createAdminClient();
  const { data: row } = await admin.from("users").select("plan").eq("id", user.id).single();
  if (row?.plan === "pro") redirect("/upgrade");

  const customer = await customerIdFor(user.id, user.email);
  const base = {
    mode: "subscription" as const,
    locale: "en" as const,
    customer,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${siteUrl()}/upgrade?welcome=1`,
    cancel_url: `${siteUrl()}/upgrade`,
  };

  const coupon = process.env.STRIPE_FOUNDING_COUPON_ID;
  const stripe = getStripe();
  let url: string | null = null;
  if (coupon) {
    // Stripe enforces the 50-redemption cap: if the coupon is used up, fall back to the public price.
    try {
      const s = await stripe.checkout.sessions.create({
        ...base,
        discounts: [{ coupon }],
        metadata: { user_id: user.id, founding: "1" },
        subscription_data: { metadata: { user_id: user.id, founding: "1" } },
      });
      url = s.url;
    } catch (e) {
      console.error("founding checkout failed, using the public price:", e instanceof Error ? e.message : e);
    }
  }
  if (!url) {
    const s = await stripe.checkout.sessions.create({
      ...base,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    });
    url = s.url;
  }
  if (!url) throw new Error("Stripe returned no checkout URL");
  redirect(url);
}

export async function openPortal() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("stripe_customer_id").eq("id", user.id).single();
  if (!data?.stripe_customer_id) redirect("/upgrade");
  const session = await getStripe().billingPortal.sessions.create({
    customer: data.stripe_customer_id as string,
    locale: "en" as const,
    return_url: `${siteUrl()}/upgrade`,
  });
  redirect(session.url);
}
