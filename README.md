# AlloBoisset

Application web de covoiturage villageois et d'entraide locale pour Boisset.

## Objectif

AlloBoisset permet aux habitants de proposer ou demander des trajets de proximité, d'entrer en contact rapidement par téléphone, et d'utiliser un petit mur de messages pour l'entraide locale.

L'application est pensée pour un usage mobile, simple et direct, avec une expérience proche d'une PWA installable.

## Fonctionnalités principales

- Connexion par prénom, téléphone et code PIN.
- Création automatique d'un profil lors de la première connexion.
- Publication d'une offre de trajet : "Je vous emmène".
- Publication d'une demande de trajet : "Emmenez-moi".
- Liste des trajets actifs, filtrés côté application.
- Modification ou suppression des trajets par leur auteur ou par un administrateur.
- Contact direct par téléphone.
- Mur de messages villageois.
- Suppression de messages par les administrateurs.
- Conditions générales d'utilisation intégrées.
- Mode d'emploi intégré.
- Partage natif via l'API Web Share.
- Notifications Web Push via Service Worker.
- Manifest PWA pour installation mobile.

## Stack technique

- React 18
- Vite
- Tailwind CSS
- Supabase
- lucide-react
- Service Worker Web Push

## Structure du projet

```txt
alloboisset/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ public/
│  ├─ manifest.json
│  ├─ sw.js
│  ├─ favicon.png
│  ├─ apple-touch-icon.png
│  ├─ logo-192.png
│  ├─ logo-512.png
│  ├─ og-image.jpg
│  ├─ blason.png
│  └─ alloboisset_fond.jpg
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ index.css
   ├─ lib/
   │  └─ supabaseClient.js
   └─ hooks/
      └─ usePushNotifications.js
```

## Installation locale

```bash
npm install
npm run dev
```

L'application démarre ensuite avec Vite, généralement sur :

```txt
http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev      # lance le serveur de développement
npm run build    # génère la version de production
npm run preview  # prévisualise le build de production
npm run lint     # lance ESLint
```

## Supabase

L'application utilise Supabase pour stocker les données applicatives.

Tables utilisées par le code :

- `profiles` : profils utilisateurs, téléphone, nom, PIN.
- `rides` : offres et demandes de trajets.
- `village_messages` : messages du mur villageois.
- `push_subscriptions` : abonnements aux notifications Web Push.

## Notifications Web Push

Les notifications reposent sur :

- `src/hooks/usePushNotifications.js` pour l'abonnement navigateur.
- `public/sw.js` pour la réception des notifications push.
- la table Supabase `push_subscriptions` pour stocker les abonnements.

Le Service Worker est enregistré à l'adresse :

```txt
/sw.js
```

## PWA

Le fichier `public/manifest.json` configure l'application en mode `standalone`, avec les icônes et couleurs de thème nécessaires à l'installation mobile.

## Déploiement

L'application est prévue pour être déployée comme site statique Vite. Le fichier `index.html` référence l'URL publique :

```txt
https://alloboisset.vercel.app/
```

## Notes de maintenance

Améliorations recommandées :

- ajouter un fichier `.gitignore` ;
- déplacer les clés Supabase dans des variables d'environnement Vite ;
- découper `src/App.jsx` en composants, vues et hooks dédiés ;
- remplacer la distinction offre/demande basée sur les emojis par un champ explicite en base, par exemple `type = offer | request` ;
- vérifier les règles Row Level Security Supabase pour protéger les écritures et suppressions.
