# Backlog Jira — DriveSAF

Importer `jira-backlog.csv` dans Jira : **Paramètres → Système → Importation externe → CSV**.
Associer les colonnes : Issue Id → *Issue Id*, Parent Id → *Parent Id*, Story Points → *Story Points*, Sprint → *Sprint* (ou ignorer et utiliser l'étiquette).

## Epics

- **E1** — Fondations du projet
- **E2** — Comptes et authentification
- **E3** — Vérification des chauffeurs
- **E4** — Commande de course (client)
- **E5** — Mise en relation et suivi en temps réel
- **E6** — Application chauffeur
- **E7** — Paiement, taxes et versements
- **E8** — Sécurité
- **E9** — Conformité et légal
- **E10** — Lancement Ottawa–Gatineau

## Sprint 1 — 20 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 1 | Task | Fondations du projet | Mettre en place le projet Next.js comme le portfolio | Highest | 2 |
| 2 | Task | Fondations du projet | Créer le projet Supabase (région ca-central-1) | Highest | 2 |
| 3 | Task | Fondations du projet | Créer le schéma de base de données v1 | Highest | 5 |
| 4 | Task | Fondations du projet | Activer la sécurité par ligne (RLS) sur toutes les tables | Highest | 3 |
| 5 | Task | Fondations du projet | Déploiement sur Vercel + CI GitHub | High | 3 |
| 6 | Story | Comptes et authentification | En tant que client, je crée un compte avec mon téléphone | Highest | 5 |

## Sprint 2 — 26 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 7 | Story | Comptes et authentification | En tant que chauffeur, je crée un compte chauffeur | Highest | 3 |
| 9 | Story | Vérification des chauffeurs | En tant que chauffeur, je téléverse mon permis | Highest | 5 |
| 13 | Story | Commande de course (client) | En tant que client, j'enregistre ma voiture | High | 3 |
| 14 | Story | Commande de course (client) | En tant que client, je saisis départ et destination avec autocomplétion | Highest | 5 |
| 15 | Story | Commande de course (client) | En tant que client, je vois le prix avant de commander | Highest | 5 |
| 16 | Story | Commande de course (client) | En tant que client, je déclare mon niveau de carburant | High | 2 |
| 17 | Story | Commande de course (client) | En tant que client, je commande et j'annule une course | Highest | 3 |

## Sprint 3 — 16 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 10 | Story | Vérification des chauffeurs | En tant que chauffeur, je fournis mon dossier de conduite et mes antécédents | High | 3 |
| 11 | Story | Vérification des chauffeurs | En tant qu'admin, j'approuve ou je refuse un chauffeur | Highest | 5 |
| 23 | Story | Application chauffeur | En tant que chauffeur, je passe en ligne et hors ligne | Highest | 3 |
| 37 | Task | Conformité et légal | Trouver une assurance pour les chauffeurs de remplacement | Highest | 3 |
| 38 | Task | Conformité et légal | Confirmer les règles G2 / probatoire avec MTO et SAAQ | Highest | 2 |

## Sprint 4 — 34 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 19 | Story | Mise en relation et suivi en temps réel | En tant que système, je propose la course au chauffeur le plus proche | Highest | 8 |
| 20 | Story | Mise en relation et suivi en temps réel | En tant que client, je vois le chauffeur arriver sur une vraie carte | Highest | 8 |
| 21 | Story | Mise en relation et suivi en temps réel | En tant que client, je suis le trajet jusqu'à destination | High | 5 |
| 22 | Task | Mise en relation et suivi en temps réel | Notifications push (web) | High | 5 |
| 24 | Story | Application chauffeur | En tant que chauffeur, j'accepte ou je refuse une demande | Highest | 3 |
| 25 | Story | Application chauffeur | En tant que chauffeur, je démarre la course avec le code du client | Highest | 3 |
| 32 | Story | Sécurité | En tant que client, je vérifie l'identité du chauffeur | Highest | 2 |

## Sprint 5 — 22 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 26 | Story | Application chauffeur | En tant que chauffeur, je vois mes gains | Medium | 3 |
| 27 | Story | Paiement, taxes et versements | En tant que client, j'enregistre une carte de paiement | Highest | 5 |
| 28 | Story | Paiement, taxes et versements | En tant que client, je suis débité à la fin de la course | Highest | 5 |
| 29 | Story | Paiement, taxes et versements | En tant que chauffeur, je reçois mes gains chaque semaine | High | 8 |
| 30 | Task | Paiement, taxes et versements | Valider les règles de taxes avec un comptable | Highest | 1 |

## Sprint 6 — 25 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 8 | Story | Comptes et authentification | En tant qu'utilisateur, je gère mon profil | Medium | 3 |
| 12 | Task | Vérification des chauffeurs | Bloquer automatiquement un permis expiré | Medium | 3 |
| 33 | Story | Sécurité | En tant qu'utilisateur, j'appelle le 911 avec le bouton SOS | Highest | 3 |
| 34 | Story | Sécurité | En tant que client, je partage mon trajet avec un proche | High | 3 |
| 35 | Story | Sécurité | En tant qu'utilisateur, j'appelle l'autre sans voir son numéro | Medium | 5 |
| 36 | Story | Sécurité | En tant qu'utilisateur, je note l'autre et je signale un problème | High | 3 |
| 39 | Task | Conformité et légal | Rédiger les conditions d'utilisation et la politique de confidentialité | Highest | 3 |
| 40 | Task | Conformité et légal | Durée de conservation et suppression des données | High | 2 |

## Sprint 7 — 20 points

| # | Type | Epic | Tâche | Priorité | Pts |
|---|---|---|---|---|---|
| 18 | Story | Commande de course (client) | En tant que client, je réserve une course à l'avance | Low | 5 |
| 31 | Story | Paiement, taxes et versements | En tant que client, je laisse un pourboire | Low | 2 |
| 41 | Task | Lancement Ottawa–Gatineau | Recruter et vérifier 15 chauffeurs pour la bêta | High | 3 |
| 42 | Task | Lancement Ottawa–Gatineau | Bêta fermée avec 50 clients | High | 3 |
| 43 | Task | Lancement Ottawa–Gatineau | Comparer nos tarifs avec la concurrence locale | Medium | 2 |
| 44 | Task | Lancement Ottawa–Gatineau | Version anglaise de l'application | High | 5 |
