"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/billing";
import { hasMediator } from "@/lib/legal";
import { MARKETING_URL } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
}

async function customerIdFor(userId: string, email: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("stripe_customer_id").eq("id", userId).single();
  // preferred_locales decides the language of Stripe's receipts and invoices (the app and Checkout are in English).
  if (data?.stripe_customer_id) {
    await getStripe().customers.update(data.stripe_customer_id as string, { preferred_locales: ["en"] });
    return data.stripe_customer_id as string;
  }
  const customer = await getStripe().customers.create({ email, preferred_locales: ["en"], metadata: { user_id: userId } });
  await admin.from("users").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

// The form's two buttons send interval=month or interval=year (10 months charged for 12).
export async function startCheckout(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const yearly = formData.get("interval") === "year";
  const priceVar = yearly ? "STRIPE_PRICE_ID_ANNUAL" : "STRIPE_PRICE_ID";
  const price = process.env[priceVar];
  if (!price) throw new Error(`${priceVar} is not set`);

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
    // Terms consent and the "start now" acknowledgement consumers need (right of withdrawal). Turn on with
    // STRIPE_COLLECT_TERMS=1 once the Terms URL is set in the Stripe Dashboard: Stripe refuses it otherwise.
    ...(process.env.STRIPE_COLLECT_TERMS === "1" && {
      consent_collection: { terms_of_service: "required" as const },
      custom_text: {
        terms_of_service_acceptance: {
          message: hasMediator
            ? `I accept the [Terms](${MARKETING_URL}/terms) and ask for the service to start immediately. If I am a consumer, I know I can withdraw within 14 days and then pay only for the service already used.`
            : `I accept the [Terms](${MARKETING_URL}/terms) and confirm that I use Applycast for professional purposes, not as a consumer.`,
        },
      },
    }),
  };

  const s = await getStripe().checkout.sessions.create({
    ...base,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  });
  const url = s.url;
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
