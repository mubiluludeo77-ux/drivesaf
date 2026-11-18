# DriveSAF

Service de chauffeur de remplacement à **Ottawa–Gatineau** : un chauffeur vient à vous et vous ramène **dans votre propre voiture** quand vous ne pouvez pas conduire.

Même base technique que le portfolio : **Next.js 16, React 19, TypeScript**, CSS dans `src/app/globals.css`.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Organisation

```
src/
  app/            layout.tsx, page.tsx, globals.css
  components/
    client/       écran client (formulaire de commande, suivi)
    driver/       écran chauffeur (permis, demandes, code, jauge)
    common/       carte, fiche chauffeur, barre de progression
    header/       en-tête et bouton de thème
    home/         page d'accueil (onglets client / chauffeur)
  data/config.ts  tarifs, taxes, permis, secteurs, carburant
  lib/supabase/   client Supabase et appels aux fonctions SQL (courses)
  providers/      RideProvider (état de la course), ThemeProvider
  types/ride.ts   types TypeScript
  utils/pricing.ts calcul de distance, prix, taxes, carburant
supabase/
  migrations/     schéma, règles métier (fonctions SQL), sécurité RLS
  seed.sql        les 15 secteurs Ottawa–Gatineau
scripts/
  db-test.mjs     tests de la base (PostgreSQL + PostGIS dans Node)
docs/
  BASE-DE-DONNEES.md  choix de la base et schéma SQL
  BACKLOG.md          backlog lisible
  jira-backlog.csv    backlog à importer dans Jira
```

## Règles du service (dans `src/data/config.ts`)

- Tarif : 25 $ + 2,10 $/km, +20 % de 22 h à 6 h, TVH 13 % (départ Ottawa) ou TPS + TVQ 14,975 % (départ Gatineau).
- Chauffeur : permis **G2** (Ontario) ou **classe 5 probatoire** (Québec) minimum, 80 % du prix avant taxes.
- Client : au moins **1/4 de réservoir** (ou 25 % de batterie) pour commander.

Ces règles sont aussi appliquées **côté serveur** par les fonctions SQL : le navigateur ne peut pas écrire directement dans la table des courses ni choisir son prix.

## Base de données (Sprint 1)

PostgreSQL + PostGIS sur Supabase. Détails : `docs/BASE-DE-DONNEES.md`.

Tester les migrations sans rien installer (PostgreSQL tourne dans Node) :

```bash
npm run db:test
```

Brancher un vrai projet Supabase :

1. Créer un projet sur supabase.com, région **Canada (Central)**.
2. SQL Editor : exécuter dans l'ordre les fichiers de `supabase/migrations/`, puis `supabase/seed.sql`.
3. Copier `.env.example` vers `.env.local` et remplir l'URL et la clé « publishable ».

L'interface utilise encore les données simulées : la brancher sur Supabase est l'étape suivante (comptes, puis courses).
