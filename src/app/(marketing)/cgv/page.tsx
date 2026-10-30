import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { ANNUAL_FREE_MONTHS, PRO_ANNUAL_PRICE_LABEL, PRO_PRICE_LABEL } from "@/lib/billing";
import { hasMediator, LEGAL } from "@/lib/legal";
import { FREE_MONTHLY_ANALYSES, PRO_MONTHLY_ANALYSES } from "@/lib/quota";

export const metadata: Metadata = { title: "CGV et conditions d’utilisation · Applycast" };

export default function Cgv() {
  return (
    <LegalPage title="Conditions générales de vente et d’utilisation" updated={`Dernière mise à jour : ${LEGAL.updatedFr}`} alt={{ href: "/terms", label: "English" }}>
      <LegalSection title="1. Le service">
        <p>
          {LEGAL.product} est un service en ligne édité par <Fill value={LEGAL.publisherName} />, entreprise individuelle (voir les <Link href="/mentions-legales">mentions légales</Link>). Vous collez le
          lien d’une vidéo business ; le service analyse sa transcription avec une IA, vous indique quels points s’appliquent à votre activité et à votre objectif, et vous aide à les transformer en un plan de
          quelques étapes, avec des bilans. En créant un compte ou en vous abonnant, vous acceptez ces conditions.
        </p>
        {hasMediator ? (
          <p>
            {LEGAL.product} est conçu pour les professionnels. Les consommateurs peuvent aussi l’utiliser : les règles qui les protègent sont à l’article 6.
          </p>
        ) : (
          <p>{LEGAL.product} est réservé aux professionnels : voir l’article 6.</p>
        )}
      </LegalSection>

      <LegalSection title="2. Compte">
        <p>
          Vous vous connectez avec votre adresse e-mail, qui doit être valide et vous appartenir, et un mot de passe. Vous êtes responsable de ce qui se passe sous votre compte et de la sécurité de votre
          mot de passe et de votre messagerie. Un compte correspond à une personne.
        </p>
      </LegalSection>

      <LegalSection title="3. Formules et prix">
        <ul>
          <li>
            <strong>Gratuite :</strong> {FREE_MONTHLY_ANALYSES} analyses par mois. Une analyse qui se termine par une correspondance faible (« Low match »), ou qui échoue, n’est pas comptée. Les plans, actions et
            bilans déjà créés restent accessibles.
          </li>
          <li>
            <strong>Pro :</strong> {PRO_PRICE_LABEL} par mois, avec {PRO_MONTHLY_ANALYSES} analyses par mois.
          </li>
          <li>
            <strong>Pro annuel :</strong> {PRO_ANNUAL_PRICE_LABEL} par an ({ANNUAL_FREE_MONTHS} mois offerts par rapport au mensuel), avec les mêmes avantages que Pro mensuel, dont {PRO_MONTHLY_ANALYSES} analyses par
            mois.
          </li>
        </ul>
        <p>
          Les prix sont en dollars américains. Les taxes éventuelles sont indiquées au moment du paiement. Les quotas sont remis à zéro au début de chaque mois civil ; les analyses non utilisées ne sont pas reportées.
        </p>
      </LegalSection>

      <LegalSection title="4. Abonnement et paiement">
        <p>
          Pro est un abonnement, mensuel ou annuel. Vous êtes débité à la souscription, puis chaque mois (ou chaque année) à la même date, jusqu’à la résiliation. Le paiement est traité par Stripe. En cas d’échec, Stripe réessaie pendant quelques
          jours ; si l’échec persiste, votre formule repasse en gratuit. Nous vous prévenons avant toute modification de prix, et vous pouvez résilier avant qu’elle s’applique.
        </p>
      </LegalSection>

      <LegalSection id="remboursements" title="5. Résiliation et remboursements">
        <ul>
          <li>
            <strong>Résiliation à tout moment,</strong> dans l’application, sur la page Upgrade avec « Cancel or manage subscription ». Elle prend effet <strong>à la fin de la période déjà payée</strong> : vous gardez Pro
            jusque-là et vous n’êtes plus débité ensuite.
          </li>
          <li>
            <strong>Aucun remboursement</strong> d’une période déjà commencée, ni remboursement partiel en cas de résiliation ou de suppression du compte.
          </li>
          <li>
            <strong>Exception :</strong> si un dysfonctionnement grave de notre fait vous empêche d’utiliser le service et que nous ne pouvons pas le corriger dans un délai raisonnable, nous remboursons le mois concerné.
            Écrivez à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
          </li>
        </ul>
        {hasMediator && <p>Cet article ne réduit pas les droits que la loi accorde aux consommateurs (article 6).</p>}
      </LegalSection>

      {hasMediator ? (
        <LegalSection title="6. Consommateurs">
          <p>Si vous utilisez {LEGAL.product} en tant que consommateur (hors de votre activité professionnelle), la loi vous donne les droits suivants, que ces conditions ne limitent pas.</p>
          <ul>
            <li>
              <strong>Droit de rétractation :</strong> vous pouvez vous rétracter dans les 14 jours suivant la souscription, sans donner de motif, en nous envoyant une déclaration claire à{" "}
              <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Si vous avez demandé que le service commence immédiatement (cette confirmation vous est demandée lors de la souscription), vous payez ce qui a été fourni
              jusqu’à votre demande, proportionnellement au prix de la période. Le reste est remboursé sous 14 jours.
            </li>
            <li>
              <strong>Résiliation en ligne :</strong> vous pouvez mettre fin à votre abonnement à tout moment depuis l’application, comme à l’article 5.
            </li>
            <li>
              <strong>Garanties légales :</strong> les règles légales sur la conformité des services numériques restent applicables.
            </li>
            <li>
              <strong>Médiation :</strong> après nous avoir contactés, vous pouvez saisir le médiateur de la consommation : <Fill value={LEGAL.mediator} />.
            </li>
          </ul>
        </LegalSection>
      ) : (
        <LegalSection title="6. Usage professionnel uniquement">
          <p>
            {LEGAL.product} est réservé aux professionnels agissant pour les besoins de leur activité. En créant un compte ou en vous abonnant, vous confirmez l’utiliser à des fins professionnelles et non en tant que
            consommateur. Nous pouvons fermer un compte utilisé autrement. Les règles propres aux consommateurs, comme le droit de rétractation, ne s’appliquent donc pas.
          </p>
        </LegalSection>
      )}

      <LegalSection title="7. Utilisation acceptable">
        <p>
          Utilisez le service de façon licite et uniquement avec des contenus que vous avez le droit de traiter. N’essayez pas de casser, surcharger ou contourner le service ou ses limites, ne revendez pas l’accès et
          ne l’utilisez pas pour nuire à autrui. Nous pouvons suspendre un compte qui le ferait.
        </p>
      </LegalSection>

      <LegalSection title="8. Résultats de l’IA">
        <p>
          Les verdicts, adaptations et plans sont générés par une IA et peuvent être faux ou incomplets. Ce sont des suggestions pour vous aider à décider, pas des conseils professionnels, juridiques, financiers ou
          fiscaux. Vous restez responsable de ce que vous décidez de faire.
        </p>
      </LegalSection>

      <LegalSection title="9. Vos contenus et nos droits">
        <p>
          Vous conservez vos droits sur ce que vous fournissez. Vous nous autorisez à le traiter uniquement pour faire fonctionner le service pour vous, comme décrit dans la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>. {LEGAL.product}, sa marque, ses interfaces et son code appartiennent à l’éditeur.
        </p>
      </LegalSection>

      <LegalSection title="10. Disponibilité et évolutions">
        <p>
          Nous faisons le nécessaire pour que le service reste disponible, sans promettre un accès ininterrompu : maintenance, incidents et pannes de tiers peuvent survenir. Nous pouvons améliorer, modifier ou
          retirer des fonctionnalités.
        </p>
      </LegalSection>

      <LegalSection title="11. Responsabilité">
        <p>
          Pour les clients professionnels, et dans la mesure permise par la loi, notre responsabilité totale est limitée aux sommes que vous avez payées au cours des 12 mois précédant l’événement, et nous ne répondons pas
          des dommages indirects comme la perte de profit ou de clientèle. Rien dans ces conditions n’exclut une responsabilité que la loi ne permet pas d’exclure, {hasMediator ? " et les consommateurs conservent tous leurs droits légaux" : ""}.
        </p>
      </LegalSection>

      <LegalSection title="12. Fin du contrat">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis le menu du compte ; cela met fin à votre abonnement et efface vos données. Nous pouvons mettre fin au contrat ou suspendre un compte en cas de manquement
          grave ou répété à ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="13. Modification des conditions">
        <p>
          Nous pouvons mettre à jour ces conditions. La date en haut indique la dernière version. Si un changement touche ce que vous payez ou vos droits, nous vous prévenons à l’avance et vous pouvez résilier avant qu’il
          s’applique.
        </p>
      </LegalSection>

      <LegalSection title="14. Droit applicable et litiges">
        <p>
          Ces conditions sont régies par le droit français. Les clients professionnels soumettent leurs litiges aux tribunaux français compétents.{hasMediator ? " Les consommateurs peuvent saisir les tribunaux de leur lieu de résidence et conservent les protections impératives de leur pays." : ""} Contact : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
