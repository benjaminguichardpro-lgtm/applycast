import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy · Applycast" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated={`Last updated: ${LEGAL.updatedEn}`} alt={{ href: "/confidentialite", label: "Français" }}>
      <p>
        This policy explains what personal data {LEGAL.product} collects, why, who receives it and what your rights are. It applies to {LEGAL.site} and to the app.
      </p>

      <LegalSection title="Who is responsible">
        <p>
          The data controller is <Fill value={LEGAL.publisherName} />, sole proprietorship, see the <Link href="/legal-notice">legal notice</Link>. Contact:{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Data we collect">
        <ul>
          <li>
            <strong>Account:</strong> your email address. You sign in with a link sent by email; there is no password.
          </li>
          <li>
            <strong>Your context:</strong> what you tell us about your business and goals (offer, stage, role, goal, constraints, weekly hours).
          </li>
          <li>
            <strong>Your analyses:</strong> the YouTube links you submit, the video title and channel, the transcript, the points extracted, and the adaptations, plans,
            actions and check-ins you create.
          </li>
          <li>
            <strong>Billing:</strong> payments are handled by Stripe. We keep an identifier of your Stripe customer and subscription, your plan and its status. We never see or
            store your card number.
          </li>
          <li>
            <strong>Usage:</strong> the number of analyses you run each month, to apply your plan’s limit.
          </li>
          <li>
            <strong>Messages:</strong> what you send us by email or through the contact form.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we use it, and on what basis">
        <ul>
          <li>To provide the service you asked for, including sign-in emails and the day-7 check-in reminder (performance of the contract).</li>
          <li>To bill you and keep accounting records (legal obligation).</li>
          <li>To secure the service and prevent abuse (legitimate interest).</li>
          <li>To answer your messages (contract, or legitimate interest).</li>
        </ul>
        <p>We do not send marketing emails, and we do not sell your data.</p>
      </LegalSection>

      <LegalSection title="Who receives your data">
        <p>We use these service providers, who process data on our behalf:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: database and authentication.
          </li>
          <li>
            <strong>Vercel</strong>: hosting of the site and the app.
          </li>
          <li>
            <strong>OpenAI</strong>: the AI that analyzes transcripts and writes adaptations and plans. Your transcript and context are sent to it for that purpose.
          </li>
          <li>
            <strong>Supadata</strong>: retrieval of YouTube transcripts. The video link is sent to it.
          </li>
          <li>
            <strong>Stripe</strong>: payments and subscription management.
          </li>
          <li>
            <strong>Resend</strong>: sending of emails.
          </li>
        </ul>
        <p>
          Some of these providers are located outside the European Union, notably in the United States. Where that is the case, transfers rely on the safeguards the provider
          offers, such as the EU Standard Contractual Clauses or the EU–US Data Privacy Framework. According to OpenAI’s API terms, data sent through its API is not used to train its
          models by default.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul>
          <li>
            Your account data is kept until you delete your account. In the app, open the account menu and choose “Delete account”: your profile, analyses, plans, actions and
            check-ins are erased and your subscription is ended.
          </li>
          <li>Invoices and payment records are kept as long as accounting law requires (generally 10 years).</li>
          <li>Messages you send us are kept as long as needed to deal with your request.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask for access to your data, correction, deletion, restriction, a portable copy, and you can object to certain uses. You can also give instructions about your data after your death.
          Write to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>; we answer within one month. If you think your rights are not respected, you can complain to the French data
          protection authority, the CNIL (cnil.fr).
        </p>
      </LegalSection>

      <LegalSection title="Cookies and similar storage">
        <p>
          We only use what is strictly necessary: a session cookie that keeps you signed in, and your light/dark preference stored in your browser. These do not require your consent.
          We use no advertising or analytics trackers. The payment pages hosted by Stripe set their own cookies, under Stripe’s policy.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>The connection is encrypted (HTTPS) and each account’s data is isolated at the database level, so that you can only read your own.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>We may update this policy; the date at the top shows the latest version. For important changes we will tell you in the app or by email.</p>
      </LegalSection>
    </LegalPage>
  );
}
