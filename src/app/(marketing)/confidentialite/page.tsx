import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage, LegalSection } from "@/components/landing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité · Applycast" };

export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" updated={`Dernière mise à jour : ${LEGAL.updatedFr}`} alt={{ href: "/privacy", label: "English" }}>
      <p>
        Cette politique explique quelles données personnelles {LEGAL.product} collecte, pourquoi, qui les reçoit et quels sont vos droits. Elle s’applique au site {LEGAL.site} et à l’application.
      </p>

      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable est <Fill value={LEGAL.publisherName} />, entreprise individuelle, voir les <Link href="/mentions-legales">mentions légales</Link>. Contact :{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <ul>
          <li>
            <strong>Compte :</strong> votre adresse e-mail. Vous vous connectez avec un lien reçu par e-mail ; il n’y a pas de mot de passe.
          </li>
          <li>
            <strong>Votre contexte :</strong> ce que vous nous indiquez sur votre activité et vos objectifs (offre, stade, rôle, objectif, contraintes, heures par semaine).
          </li>
          <li>
            <strong>Vos analyses :</strong> les liens YouTube que vous soumettez, le titre et la chaîne de la vidéo, la transcription, les points extraits, ainsi que les adaptations, plans,
            actions et bilans que vous créez.
          </li>
          <li>
            <strong>Facturation :</strong> les paiements sont gérés par Stripe. Nous conservons un identifiant de votre client et de votre abonnement Stripe, votre formule et son statut. Nous ne voyons
            ni ne stockons jamais votre numéro de carte.
          </li>
          <li>
            <strong>Usage :</strong> le nombre d’analyses réalisées chaque mois, pour appliquer la limite de votre formule.
          </li>
          <li>
            <strong>Messages :</strong> ce que vous nous envoyez par e-mail ou via le formulaire de contact.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul>
          <li>Fournir le service demandé, y compris les e-mails de connexion et le rappel de bilan à 7 jours (exécution du contrat).</li>
          <li>Vous facturer et tenir la comptabilité (obligation légale).</li>
          <li>Sécuriser le service et prévenir les abus (intérêt légitime).</li>
          <li>Répondre à vos messages (contrat, ou intérêt légitime).</li>
        </ul>
        <p>Nous n’envoyons pas d’e-mails commerciaux et nous ne vendons pas vos données.</p>
      </LegalSection>

      <LegalSection title="Destinataires">
        <p>Nous faisons appel à ces prestataires, qui traitent des données pour notre compte :</p>
        <ul>
          <li>
            <strong>Supabase</strong> : base de données et authentification.
          </li>
          <li>
            <strong>Vercel</strong> : hébergement du site et de l’application.
          </li>
          <li>
            <strong>OpenAI</strong> : l’IA qui analyse les transcriptions et rédige adaptations et plans. Votre transcription et votre contexte lui sont transmis à cette fin.
          </li>
          <li>
            <strong>Supadata</strong> : récupération des transcriptions YouTube. Le lien de la vidéo lui est transmis.
          </li>
          <li>
            <strong>Stripe</strong> : paiements et gestion de l’abonnement.
          </li>
          <li>
            <strong>Resend</strong> : envoi des e-mails.
          </li>
        </ul>
        <p>
          Certains de ces prestataires sont situés hors de l’Union européenne, notamment aux États-Unis. Dans ce cas, les transferts reposent sur les garanties qu’ils proposent, comme les clauses contractuelles types de l’UE
          ou le cadre de protection des données UE–États-Unis. Selon les conditions de l’API d’OpenAI, les données envoyées par cette API ne servent pas par défaut à entraîner ses modèles.
        </p>
      </LegalSection>

      <LegalSection title="Durées de conservation">
        <ul>
          <li>
            Les données de votre compte sont conservées jusqu’à ce que vous le supprimiez. Dans l’application, ouvrez le menu du compte et choisissez « Delete account » : votre profil, vos analyses, plans, actions et
            bilans sont effacés et votre abonnement est résilié.
          </li>
          <li>Les factures et justificatifs de paiement sont conservés aussi longtemps que la loi comptable l’exige (en général 10 ans).</li>
          <li>Les messages que vous nous envoyez sont conservés le temps nécessaire au traitement de votre demande.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, une copie portable, et vous opposer à certains usages. Vous pouvez aussi donner des directives sur
          le sort de vos données après votre décès. Écrivez à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> ; nous répondons sous un mois. Si vous estimez que vos droits ne sont pas respectés, vous
          pouvez saisir la CNIL (cnil.fr).
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage local">
        <p>
          Nous n’utilisons que le strict nécessaire : un cookie de session qui vous maintient connecté, et votre préférence clair/sombre enregistrée dans votre navigateur. Ils ne nécessitent pas votre consentement.
          Nous n’utilisons aucun traceur publicitaire ou de mesure d’audience. Les pages de paiement hébergées par Stripe déposent leurs propres cookies, selon la politique de Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>La connexion est chiffrée (HTTPS) et les données de chaque compte sont isolées au niveau de la base de données : vous ne pouvez lire que les vôtres.</p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>Nous pouvons mettre à jour cette politique ; la date en haut indique la dernière version. En cas de changement important, nous vous prévenons dans l’application ou par e-mail.</p>
      </LegalSection>
    </LegalPage>
  );
}
