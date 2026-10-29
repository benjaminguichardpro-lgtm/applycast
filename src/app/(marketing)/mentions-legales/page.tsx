import type { Metadata } from "next";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { hasMediator, LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales · Applycast" };

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated={`Dernière mise à jour : ${LEGAL.updatedFr}`} alt={{ href: "/legal-notice", label: "English" }}>
      <LegalSection title="Éditeur du site">
        <p>
          Le site <strong>{LEGAL.site}</strong> et le service {LEGAL.product} sont édités par :
        </p>
        <ul>
          <li>
            <Fill value={LEGAL.publisherName} />, {LEGAL.legalForm}
          </li>
          <li>
            SIREN : <Fill value={LEGAL.siren} />
          </li>
          <li>
            Adresse : <Fill value={LEGAL.address} />
          </li>
          <li>
            TVA : <Fill value={LEGAL.vat} />
          </li>
          <li>
            E-mail : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          <Fill value={LEGAL.publisherName} />, en sa qualité d’éditeur.
        </p>
      </LegalSection>

      <LegalSection title="Hébergeur">
        <p>
          Le site est hébergé par <strong>{LEGAL.host.name}</strong>, {LEGAL.host.address}. Téléphone : {LEGAL.host.phone}.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question, écrivez à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>

      {hasMediator && (
        <LegalSection title="Médiation de la consommation">
          <p>
            Si vous êtes un consommateur, vous pouvez recourir gratuitement au médiateur de la consommation suivant, après avoir tenté de résoudre
            le litige directement avec nous : <Fill value={LEGAL.mediator} />.
          </p>
        </LegalSection>
      )}

      <LegalSection title="Propriété intellectuelle">
        <p>
          La marque, le logo, les textes, les interfaces et le code de {LEGAL.product} sont protégés. Toute reproduction sans autorisation écrite est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement de vos données est décrit dans la <a href="/confidentialite">politique de confidentialité</a>. Les conditions
          d’utilisation et de vente figurent dans les <a href="/cgv">CGV / CGU</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
