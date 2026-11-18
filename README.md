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
  providers/      RideProvider (état de la course), ThemeProvider
  types/ride.ts   types TypeScript
  utils/pricing.ts calcul de distance, prix, taxes, carburant
docs/
  BASE-DE-DONNEES.md  choix de la base et schéma SQL
  BACKLOG.md          backlog lisible
  jira-backlog.csv    backlog à importer dans Jira
```

## Règles du service (dans `src/data/config.ts`)

- Tarif : 25 $ + 2,10 $/km, +20 % de 22 h à 6 h, TVH 13 % (départ Ottawa) ou TPS + TVQ 14,975 % (départ Gatineau).
- Chauffeur : permis **G2** (Ontario) ou **classe 5 probatoire** (Québec) minimum, 80 % du prix avant taxes.
- Client : au moins **1/4 de réservoir** (ou 25 % de batterie) pour commander.

Pour l'instant, tout est simulé dans le navigateur (aucune base de données). Voir `docs/BASE-DE-DONNEES.md` et le backlog.
