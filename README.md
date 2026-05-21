# Tournée Ménages

Application web PWA mobile-first pour organiser les ménages Airbnb pour deux personnes avec une seule voiture.

## Fonctionnalités

- **Planning intelligent** : moteur d'optimisation qui génère un planning respectant les contraintes (6h de travail max, 1h de trajet max, 1h de pause min, voiture partagée)
- **Priorités automatiques** : critical / very_urgent / urgent / plannable / flexible selon les fenêtres de ménage
- **Durées ajustées** : coefficients de saleté (propre ×0,75 / normal ×1,0 / sale ×1,35)
- **Mode terrain** : interface épurée pour suivre les étapes en temps réel avec timer
- **Alertes automatiques** : ménages manquants, fenêtres trop courtes, chevauchements
- **Statistiques** : taux de complétion, logements les plus nettoyés, activité sur 7/30 jours
- **PWA** : installable sur iOS et Android, fonctionne en mode déconnecté

## Stack technique

- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS
- **Navigation** : React Router v6
- **État** : Zustand
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **PWA** : vite-plugin-pwa + Workbox

## Installation

### 1. Prérequis

```bash
node -v  # >= 18.0.0
npm -v   # >= 9.0.0
```

### 2. Cloner et installer

```bash
git clone <repo>
cd tournee-menages
npm install
```

### 3. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un nouveau projet
2. Dans **SQL Editor**, exécuter le contenu de `supabase/migrations/001_init.sql`
3. Dans **Settings > API**, copier l'URL et la clé anon

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos valeurs Supabase
```

### 5. Créer un compte utilisateur

Dans Supabase > **Authentication > Users**, créer un utilisateur avec email et mot de passe.

### 6. Lancer en développement

```bash
npm run dev
```

L'application est accessible sur http://localhost:5173

### 7. Build de production

```bash
npm run build
npm run preview
```

## Déploiement

### Vercel

```bash
npx vercel
# Ajouter les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

### Netlify

```bash
npm run build
# Déployer le dossier dist/
# Ajouter les variables d'environnement dans les settings
```

## Structure du projet

```
src/
├── components/
│   ├── layout/
│   │   └── BottomNav.tsx       # Navigation inférieure 5 onglets
│   └── ui/
│       └── index.tsx           # Composants UI réutilisables
├── lib/
│   ├── supabase.ts             # Client Supabase
│   └── optimizer.ts            # Moteur d'optimisation
├── pages/
│   ├── LoginPage.tsx           # Authentification
│   ├── TodayPage.tsx           # Tableau de bord du jour
│   ├── PropertiesPage.tsx      # Liste des logements
│   ├── PropertyFormPage.tsx    # Formulaire logement
│   ├── ReservationsPage.tsx    # Liste des réservations
│   ├── ReservationFormPage.tsx # Formulaire réservation
│   ├── OptimizePage.tsx        # Génération du planning
│   ├── PlanningPage.tsx        # Vue timeline du planning
│   ├── FieldModePage.tsx       # Mode terrain avec timer
│   ├── AlertsPage.tsx          # Alertes et notifications
│   ├── SettingsPage.tsx        # Paramètres
│   └── StatsPage.tsx           # Statistiques
├── store/
│   ├── authStore.ts            # Store authentification
│   └── appStore.ts             # Store données (properties, jobs, etc.)
└── types/
    └── index.ts                # Types TypeScript
```

## Moteur d'optimisation

L'algorithme calcule :

1. **Priorité** selon l'heure de check-in :
   - `critical` : check-in dans < 8h ou déjà passé
   - `very_urgent` : check-in dans 8–24h
   - `urgent` : check-in dans 24–48h
   - `plannable` : check-in dans 2–5 jours
   - `flexible` : check-in dans 5+ jours

2. **Durée ajustée** selon la saleté :
   - `clean` : ×0,75
   - `normal` : ×1,00
   - `dirty` : ×1,35

3. **Fenêtre de ménage** : entre le checkout (par défaut 11h00) et le prochain checkin (par défaut 15h00)

4. **Contraintes** :
   - Maximum 6h de travail par personne
   - Maximum 1h de trajet par personne
   - Minimum 1h de pause par personne
   - Une seule voiture partagée entre les deux travailleurs

## Données initiales

La migration SQL crée automatiquement :
- Jean-Claude (couleur : bleu #4F7EFF)
- Madame (couleur : violet #A855F7)
- Les paramètres par défaut (horaires 8h–18h, etc.)

## Icônes PWA

Pour l'icône PWA, placer dans `public/` :
- `pwa-192x192.png` (192×192 px)
- `pwa-512x512.png` (512×512 px)
- `favicon.svg` ou `favicon.ico`

Vous pouvez générer ces icônes depuis n'importe quel générateur d'icônes PWA en ligne.

## Licence

Usage privé — non destiné à la distribution.
