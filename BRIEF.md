# BRIEF — Applycast MVP (web app)

## 0. Règles de travail
- Ce brief est la source de vérité. Les captures et `design-reference/Main.dc.html` donnent l'apparence, les textes et les états. Le code du prototype n'est pas à réutiliser : reconstruis en vrai code.
- Travaille par phases (section 9). À la fin de chaque phase : résume en langage simple ce que tu as fait, liste ce qui reste, attends mon feu vert.
- Ne code rien hors périmètre (section 8). En cas de doute, pose une question au lieu de deviner.

## 1. Produit
Un fondateur colle l'URL d'une vidéo business YouTube. L'app résume la vidéo, juge si elle s'applique à son business et à son objectif, propose des adaptations, génère un plan d'action court qu'il valide, puis suit l'exécution (Done / Postponed / Dropped) et demande le résultat à J+7.
Promesse : passer de « j'ai regardé » à « j'ai fait ». Le résumé n'est pas le produit, la décision contextualisée et le suivi le sont.
Cible : fondateur B2B SaaS/IA de 1 à 10 personnes, anglophone. Interface en anglais.

## 2. Stack (modifiable si tu justifies)
- Next.js (App Router) + TypeScript, Tailwind.
- Postgres (Supabase) + Drizzle ou Prisma.
- Auth : email magic link + Google (Supabase Auth).
- Paiement : Stripe Checkout + portail client, 1 plan Pro à 15 $/mois.
- Email : Resend. Tâches planifiées : cron (Vercel Cron ou équivalent).
- IA : couche d'abstraction `llm.generate(step, input)`. Fournisseur et modèle par variables d'environnement par étape. Sortie JSON validée par schéma (zod), 1 nouvel essai si invalide.
- Transcript : interface `getTranscript(videoId)`, implémentation par une API commerciale de transcripts (choix du fournisseur : me demander). Pas de scraping depuis le serveur. Pas de transcription audio au MVP.

## 3. Modèle de données
- `users` (id, email, created_at, plan: free|pro, stripe_customer_id)
- `profiles` (user_id, offer, stage enum[Idea, Pre-revenue, <$10k MRR, $10k–100k MRR, $100k+ MRR], role, active_goal, constraint_text, weekly_hours_limit numeric default 6)
- `analyses` (id, user_id, video_id, title, channel, published_at, duration, transcript_text, verdict enum[strong, partial, low], verdict_reason, created_at, deleted_at)
- `insights` (id, analysis_id, ts_seconds, text, kind enum[apply, against, na], tag, reason)
- `adaptations` (id, analysis_id, insight_id, target enum[business, profile], category nullable[Habit|Skill|Time], text, effort_hours)
- `plans` (id, analysis_id, duration_days, validated_at, checkin_due_at, status)
- `plan_steps` (id, plan_id, position, day, text, effort_hours)
- `actions` (id, plan_id, step_id, title, group enum[today, week, later], due_date, status enum[open, done, postponed, dropped], postponed_until, drop_reason, effort_hours)
- `checkins` (id, plan_id, outcome enum[worked, no_effect, too_early, failed], metric_before, metric_after, result_line, created_at)
- `usage` (user_id, month, analyses_count)
Suppression d'une analyse : supprime plan et actions liés. Les check-ins déjà saisis restent comptés dans le done rate (voir 5).

## 4. Pipeline IA (tâche asynchrone, état de chargement visible)
Étapes affichées à l'écran : Fetching transcript → Summarizing key points → Matching against your context → Scoring relevance.
- A. Extraction : transcript → 5 points max `{ts_seconds, text}` fidèles au transcript. Interdit d'inventer un passage ou un horodatage.
- B. Verdict : points × profil → pour chaque point : `apply | against | na`, métrique de l'objectif touchée et sens (ex. « ARPA ↑ »), raison en 1 phrase. Verdict global : strong / partial / low + raison 1–2 phrases + « X of 5 points apply ». Seuils (décision du fondateur, appliqués par le code) : strong si ≥ 60 % des points s'appliquent, partial si 40–59 %, low en dessous (sur 5 points : 3+ strong, 2 partial, 0–1 low). Un point `against` (va à l'opposé de l'objectif) n'est jamais compté dans « apply ». Si `low` : afficher « nothing to apply » + bouton Skip, aucune génération ensuite.
- C. Adaptations : pour chaque point `apply`, 1 adaptation « business » ET 1 « profile » (catégorie Habit/Skill/Time), avec `effort_hours` parmi {0.5, 1, 1.5, 2, 2.5, 3, 4}. Une adaptation doit tenir dans la contrainte déclarée.
- D. Plan (à la demande, bouton « Reveal the action plan ») : adaptations cochées → 5 étapes max, chacune avec jour et effort. Durée suggérée, ou durée libre saisie (régénère).
- Contrôle de cohérence avant d'enregistrer B et C : aucune adaptation ne doit contredire l'objectif actif. Sinon la retirer ou la marquer `against`.
- Si le transcript est indisponible : écran d'erreur avec 2 sorties (coller le transcript à la main, ou essayer une autre vidéo). Une analyse en échec ne consomme pas le quota gratuit.

## 5. Règles métier
- Gratuit : 3 analyses par mois (reset le 1er). La 4e déclenche le paywall. Une analyse en échec et une analyse « Low match » ne sont pas comptées ; l'écran Low match l'indique clairement (décision du fondateur). Plans, actions et check-ins ne sont jamais verrouillés. L'historique reste lisible sans abonnement.
- Pro : 15 $/mois, analyses illimitées. Annulation à tout moment. Offre de lancement (décision du fondateur) : les 50 premiers abonnés sont « Founding Member », prix −50 % tant que l'abonnement reste actif (coupon Stripe plafonné à 50 utilisations ; annuler fait perdre la place). Suppression de compte : annule l'abonnement et supprime toutes les données.
- Done rate = actions Done / actions validées (sur le mois). Pas de division par les analyses.
- Limite d'effort hebdo : `profiles.weekly_hours_limit` (6 par défaut). Jauge « X h of 6 h » sur Adaptations, Plan et My actions. Dépassement : jauge en alerte et message « Over your limit by X h ». Regenerate sur un plan modifié : avertissement « This will replace your edits ».
- Groupes d'actions : Today (jour ≤ 1), This week (≤ 7), Later.
- Postponed demande « Until when? » (date). Dropped propose une raison en un clic : Not relevant / No time / Too risky / Other.
- Check-in J+7 : email (Resend) puis écran « What happened? » avec Worked / No effect / Too early / Failed, champ métrique avant → après (après facultatif), résultat en 1 ligne (120 caractères max), étapes ouvertes : « Carry over to next week » ou « Drop ».
- Validation du plan : crée les actions, fixe `checkin_due_at = validé + 7 jours`.

## 6. Écrans (voir captures + `design-reference/Main.dc.html`)
Navigation : Analyze · My actions · History · Context. Bandeau haut : « Upgrade · N left », bascule clair/sombre, avatar.
1. Onboarding / Context : deux cartes éditables, « My business » (offer, stage) et « My profile » (role, active goal, main constraint), enregistrement manuel (bouton « Save changes », « Cancel », avertissement « Leave without saving? » si l'utilisateur quitte avec des modifications non enregistrées ; décision du fondateur, remplace l'enregistrement automatique de la maquette), panneau « How Applycast reads you » avec phrase de synthèse et bouton « Looks right — analyze a video » (actif seulement si les 5 champs sont remplis et enregistrés). Placeholders d'exemple dans chaque champ. « Active goal » demande un objectif chiffré (message d'aide si flou).
2. Analyze : champ URL + exemples, bouton Analyze, état de chargement avec les 4 étapes.
3. Result : carte vidéo, 5 points horodatés cliquables (lien YouTube `&t=`), panneau Verdict. Variante Low match.
4. Adaptations : paires point de la vidéo → adaptation, toggle « Apply to my business / my profile », case à cocher par adaptation (cochée par défaut), effort par adaptation, jauge, bouton « Build the action plan (N selected) ».
5. Plan : étapes éditables et supprimables (5 max), effort par étape, total vs limite, durée suggérée + champ libre + Regenerate, bloc « If you validate now » (dates exactes), bouton Validate plan.
6. My actions : groupes, statuts en un clic, done rate du mois, jauge d'effort de la semaine, bloc « Day-7 check-in due ».
7. Check-in (voir 5).
8. History : liste, badge de verdict (libellé + icône, jamais la couleur seule), Open, suppression avec confirmation, compteur « By verdict ». État vide.
9. Paywall : chiffres du mois, ce que débloque Pro, 15 $/mois, Subscribe, Not now.
États : vide, chargement, erreur transcript.
Accessibilité : vrais `<button>` et `<label>`, contraste AA, `aria-label` sur les icônes seules, jauges avec `role="meter"`.

## 7. Critères d'acceptation (je teste chacun)
1. Un nouvel utilisateur remplit Context, colle une URL réelle, obtient résumé + verdict en moins de 90 s.
2. Chaque horodatage ouvre la vidéo à la bonne seconde. Aucun point du résumé n'est absent du transcript.
3. Aucune adaptation affichée ne contredit l'objectif actif.
4. Décocher une adaptation met la jauge d'effort à jour et le compteur du bouton aussi.
5. Valider un plan crée les actions dans les bons groupes, avec date de check-in à J+7.
6. Les chiffres concordent partout (History, My actions, Paywall, bandeau) : un seul calcul côté serveur.
7. La 4e analyse comptée du mois mène au paywall. Les plans et actions restent accessibles.
8. Supprimer une analyse retire son plan et ses actions après confirmation.
9. Transcript indisponible : message clair, 2 sorties, quota intact.
10. Données isolées par utilisateur (test avec 2 comptes). Suppression de compte en un clic.

## 8. Hors périmètre
Extension Chrome, corbeille, bouton « i » par étape, 5 horizons de durée, score numérique, idées parkées, contre-avis entre vidéos, intégrations (Notion, Todoist), équipes, multi-plateformes, transcription audio, appli mobile.

## 9. Phases (feu vert entre chaque)
1. Socle : projet, auth, base, écrans Context + shell de navigation, mode clair/sombre. Critère : je crée un compte et j'enregistre mon profil.
2. Analyse : transcript, étapes A et B, écrans Analyze, Result, Low match, erreur, chargement. Critères 1, 2, 9.
3. Adaptations et plan : étapes C et D, écrans 4 et 5, jauge d'effort. Critères 3, 4, 5.
4. Suivi : My actions, check-in + email J+7, History, suppression. Critères 6, 8.
5. Argent et finition : quota, paywall, Stripe, états vides, accessibilité, isolation des données. Critères 7, 10.
6. Jeu d'évaluation : script qui lance 30 vidéos × 5 profils fictifs et exporte les sorties pour notation à l'aveugle (choix du fournisseur d'IA).
