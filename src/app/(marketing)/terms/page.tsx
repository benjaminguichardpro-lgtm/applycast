import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Terms · Applycast" };

export default function Terms() {
  return (
    <LegalPage title="Terms">
      <p>Applycast gives AI-generated suggestions about videos you choose. They are not professional, legal or financial advice, and you decide what to act on.</p>
      <p>The free plan has a monthly analysis limit. Pro is a monthly subscription you can cancel anytime from the app; you keep your data and fall back to the free plan.</p>
      <p>Don’t use the service to abuse it or other people. We may suspend accounts that do.</p>
    </LegalPage>
  );
}
