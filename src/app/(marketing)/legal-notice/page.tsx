import type { Metadata } from "next";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Legal notice · Applycast" };

export default function LegalNotice() {
  return (
    <LegalPage title="Legal notice" updated={`Last updated: ${LEGAL.updatedEn}`} alt={{ href: "/mentions-legales", label: "Français" }}>
      <LegalSection title="Publisher">
        <p>
          The website <strong>{LEGAL.site}</strong> and the {LEGAL.product} service are published by:
        </p>
        <ul>
          <li>
            <Fill value={LEGAL.publisherName} />, sole proprietorship (<em>{LEGAL.legalForm}</em>, France)
          </li>
          <li>
            SIREN: <Fill value={LEGAL.siren} />
          </li>
          <li>
            Address: <Fill value={LEGAL.address} />
          </li>
          <li>
            VAT: <Fill value={LEGAL.vat} />
          </li>
          <li>
            Email: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Publication director">
        <p>
          <Fill value={LEGAL.publisherName} />, as publisher.
        </p>
      </LegalSection>

      <LegalSection title="Hosting provider">
        <p>
          The site is hosted by <strong>{LEGAL.host.name}</strong>, {LEGAL.host.address}. Phone: {LEGAL.host.phone}.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For any question, write to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Consumer mediation">
        <p>
          If you are a consumer, you may use the following consumer mediator free of charge, once you have tried to settle the dispute with us
          directly: <Fill value={LEGAL.mediator} />.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>The brand, logo, texts, interfaces and code of {LEGAL.product} are protected. Reproduction without written permission is prohibited.</p>
      </LegalSection>

      <LegalSection title="Personal data and terms">
        <p>
          How your data is processed is described in the <a href="/privacy">privacy policy</a>. The terms of use and sale are in the{" "}
          <a href="/terms">terms</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
