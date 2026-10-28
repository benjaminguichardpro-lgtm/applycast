import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Privacy · Applycast" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <p>Applycast stores your email, your business context, your analyses, plans, actions and check-ins. Only you can read them.</p>
      <p>
        To run the service we send data to a few processors: Supabase (database and sign-in), OpenAI (analysis of video transcripts), Supadata
        (fetching YouTube transcripts), Stripe (payments, we never see your card) and Resend (emails).
      </p>
      <p>You can delete your account and all its data from the account menu in the app. Questions: use the Contact page in the app.</p>
    </LegalPage>
  );
}
