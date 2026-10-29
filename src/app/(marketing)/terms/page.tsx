import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { FOUNDING_DISCOUNT_PERCENT, FOUNDING_PRICE_LABEL, PRO_PRICE_LABEL } from "@/lib/billing";
import { hasMediator, LEGAL } from "@/lib/legal";
import { FREE_MONTHLY_ANALYSES, PRO_MONTHLY_ANALYSES } from "@/lib/quota";

export const metadata: Metadata = { title: "Terms of use and sale · Applycast" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use and sale" updated={`Last updated: ${LEGAL.updatedEn}`} alt={{ href: "/cgv", label: "Français" }}>
      <LegalSection title="1. The service">
        <p>
          {LEGAL.product} is an online service published by <Fill value={LEGAL.publisherName} />, sole proprietorship (see the <Link href="/legal-notice">legal notice</Link>). You paste the
          link of a business video; the service analyzes its transcript with AI, tells you which points apply to your business and goal, and helps you turn them into a plan of a few steps,
          with check-ins. By creating an account or subscribing you accept these terms.
        </p>
        {hasMediator ? (
          <p>
            {LEGAL.product} is designed for professionals. Consumers may also use it: the specific rules that protect them are in section 6.
          </p>
        ) : (
          <p>{LEGAL.product} is offered to professionals only: see section 6.</p>
        )}
      </LegalSection>

      <LegalSection title="2. Account">
        <p>
          You sign in with a link sent to your email address, which must be yours and valid. You are responsible for what happens under your account and for keeping your mailbox secure.
          One account is for one person.
        </p>
      </LegalSection>

      <LegalSection title="3. Plans and prices">
        <ul>
          <li>
            <strong>Free:</strong> {FREE_MONTHLY_ANALYSES} analyses per month. An analysis that ends as a Low match, or that fails, is not counted. Plans, actions and check-ins you already created stay
            available.
          </li>
          <li>
            <strong>Pro:</strong> {PRO_PRICE_LABEL} per month, with {PRO_MONTHLY_ANALYSES} analyses per month.
          </li>
          <li>
            <strong>Founding offer:</strong> the first 50 subscribers pay {FOUNDING_DISCOUNT_PERCENT}% less ({FOUNDING_PRICE_LABEL} per month) for as long as their subscription stays active. If you
            cancel, the offer ends and cannot be taken again.
          </li>
        </ul>
        <p>
          Prices are in US dollars. Taxes, if any, are shown at checkout. Quotas reset at the start of each calendar month; unused analyses do not carry over.
        </p>
      </LegalSection>

      <LegalSection title="4. Subscription and payment">
        <p>
          Pro is a monthly subscription. You are charged when you subscribe, then every month on the same date, until you cancel. Payment is processed by Stripe. If a payment fails, Stripe
          retries it for a few days; if it keeps failing, your plan returns to Free. We will tell you before any price change takes effect, and you can cancel before it does.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="5. Cancellation and refunds">
        <ul>
          <li>
            <strong>Cancel anytime,</strong> in the app on the Upgrade page with “Cancel or manage subscription”. Cancellation takes effect <strong>at the end of the period you already paid</strong>: you keep
            Pro until then, and you are not charged again.
          </li>
          <li>
            <strong>No refund</strong> for a period already started, and no partial refund when you cancel or delete your account.
          </li>
          <li>
            <strong>Exception:</strong> if a serious malfunction caused by us prevents you from using the service and we cannot fix it within a reasonable time, we refund the affected month. Write to{" "}
            <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
          </li>
        </ul>
        {hasMediator && <p>This section does not reduce the rights that the law gives to consumers (section 6).</p>}
      </LegalSection>

      {hasMediator ? (
        <LegalSection title="6. Consumers">
          <p>If you use {LEGAL.product} as a consumer (not for your professional activity), the law gives you the following rights, which these terms do not limit.</p>
          <ul>
            <li>
              <strong>Right of withdrawal:</strong> you can withdraw within 14 days of subscribing, without giving a reason, by sending us a clear statement at{" "}
              <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. If you asked for the service to start immediately (you are asked to confirm this when you subscribe), you pay for what was provided until you told us
              you withdraw, in proportion to the price of the period. The rest is refunded within 14 days.
            </li>
            <li>
              <strong>Cancellation online:</strong> you can end your subscription at any time from the app, as in section 5.
            </li>
            <li>
              <strong>Legal guarantees:</strong> the legal rules on the conformity of digital services remain applicable.
            </li>
            <li>
              <strong>Mediation:</strong> after contacting us, you may refer a dispute to the consumer mediator: <Fill value={LEGAL.mediator} />.
            </li>
          </ul>
        </LegalSection>
      ) : (
        <LegalSection title="6. Professional use only">
          <p>
            {LEGAL.product} is offered to professionals acting for the needs of their business. By creating an account or subscribing, you confirm that you use it for professional purposes and not as a consumer.
            We may close an account that is used otherwise. Consumer rules, such as the right of withdrawal, therefore do not apply.
          </p>
        </LegalSection>
      )}

      <LegalSection title="7. Acceptable use">
        <p>
          Use the service lawfully and only with content you are allowed to process. Do not try to break, overload or bypass the service or its limits, do not resell access, and do not use it to harm others.
          We may suspend an account that does.
        </p>
      </LegalSection>

      <LegalSection title="8. AI results">
        <p>
          The verdicts, adaptations and plans are generated by AI and can be wrong or incomplete. They are suggestions to help you decide, not professional, legal, financial or tax advice. You remain
          responsible for what you decide to do.
        </p>
      </LegalSection>

      <LegalSection title="9. Your content and our rights">
        <p>
          You keep your rights over what you provide. You allow us to process it only to run the service for you, as described in the <Link href="/privacy">privacy policy</Link>. {LEGAL.product}, its brand,
          interfaces and code belong to the publisher.
        </p>
      </LegalSection>

      <LegalSection title="10. Availability and changes">
        <p>
          We work to keep the service available but do not promise uninterrupted access: maintenance, incidents and third-party outages can happen. We may improve, change or remove features.
        </p>
      </LegalSection>

      <LegalSection title="11. Liability">
        <p>
          For professional customers, and to the extent the law allows, our total liability is limited to the amounts you paid in the 12 months before the event, and we are not liable for indirect losses
          such as lost profit or lost business. Nothing in these terms excludes a liability that the law does not allow to be excluded{hasMediator ? ", and consumers keep all their legal rights" : ""}.
        </p>
      </LegalSection>

      <LegalSection title="12. Ending the contract">
        <p>
          You can delete your account at any time from the account menu; it ends your subscription and erases your data. We may end the contract or suspend an account in case of serious or repeated breach of
          these terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to these terms">
        <p>
          We may update these terms. The date at the top shows the latest version. If a change affects what you pay or your rights, we tell you in advance, and you can cancel before it applies.
        </p>
      </LegalSection>

      <LegalSection title="14. Law and disputes">
        <p>
          These terms are governed by French law. Professional customers submit disputes to the competent French courts.{hasMediator ? " Consumers may bring a dispute before the courts of their place of residence and keep the mandatory protections of their country." : ""} Contact: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
