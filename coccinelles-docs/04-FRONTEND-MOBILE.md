# 📱 04 — FRONTEND MOBILE (Progressive Web App)
# Fichier : 04-FRONTEND-MOBILE.md
# Description : Version mobile de la plateforme sous forme de PWA
# (application installable construite à partir du site React)

---

## 🎯 OBJECTIF

Donner aux parents une **application sur leur téléphone** (icône sur l'écran
d'accueil, ouverture plein écran) pour :
- consulter le suivi quotidien de leur enfant ;
- déclarer une absence rapidement ;
- envoyer et recevoir des messages ;
- voir la galerie photos ;
- recevoir des notifications (étape 3, prévue après mars 2027).

---

## 🔀 CHOIX TECHNIQUE : PWA AU LIEU DE REACT NATIVE / EXPO

Le cahier des charges prévoyait au départ une application **React Native +
Expo** séparée (dossier `frontend-mobile/`). Elle a été remplacée par une
**Progressive Web App (PWA)** construite directement à partir de
`frontend-web/`. Le dossier `frontend-mobile/` n'existe donc pas.

| Critère | Application Expo | PWA (retenue) |
|---|---|---|
| Code à maintenir | 2 applications (web + mobile) | **1 seule** (le site React) |
| Fonctionnalités parents | à recoder écran par écran | **toutes déjà présentes** |
| Installation | App Store / Google Play | **depuis le navigateur**, sans store |
| Coût | compte Apple 99 $/an + Google 25 $ | **gratuit** |
| Mises à jour | validation des stores, téléchargement | **immédiates** à chaque déploiement Vercel |
| Notifications push | Expo Notifications | Web Push (Android, iPhone ≥ iOS 16.4 si installée) |
| Accès matériel (Bluetooth, NFC…) | oui | limité — **inutile pour une crèche** |

**Conclusion :** pour une crèche de 28 places, la PWA couvre tous les besoins
avec une seule base de code, sans frais et sans délai de publication.

---

## 📁 FICHIERS DE LA PWA

```
frontend-web/
├── public/
│   ├── manifest.json                  # Nom, couleurs, icônes, mode plein écran
│   ├── index.html                     # Lien vers le manifest + balises iPhone
│   └── icons/
│       ├── icon-192.png               # Icône Android
│       ├── icon-512.png               # Icône Android haute définition / écran de démarrage
│       ├── icon-maskable-512.png      # Icône avec marge (formes rondes Android)
│       └── apple-touch-icon.png       # Icône iPhone / iPad (180 px)
├── src/
│   ├── service-worker.js              # Cache de l'interface (Workbox) — règle RGPD
│   ├── serviceWorkerRegistration.js   # Enregistrement + détection des mises à jour
│   ├── utils/installationPwa.js       # Logique « installer l'application »
│   ├── hooks/useInstallationPossible.js  # Hook : l'installation est-elle possible ?
│   ├── config/version.js              # Numéro de version affiché en pied de page
│   └── components/ui/
│       ├── BandeauHorsLigne/          # « Vous êtes hors ligne »
│       ├── BandeauMiseAJour/          # « Nouvelle version disponible »
│       └── ModaleInstallation/        # Fenêtre « Installez l'application »
└── vercel.json                        # En-têtes : pas de cache sur le service worker, CSP
```

---

## ⚙️ MANIFESTE (public/manifest.json)

Décrit l'application installée :

| Clé | Valeur | Rôle |
|---|---|---|
| `name` / `short_name` | Les Coccinelles — Crèche à Puilboreau / Coccinelles | Nom complet / nom sous l'icône |
| `display` | `standalone` | Ouverture plein écran, sans barre d'adresse |
| `start_url` / `scope` | `/` | Page d'ouverture et pages couvertes |
| `theme_color` | `#FF7A45` | Couleur de la barre du téléphone (orange Coccinelles) |
| `background_color` | `#FFFDF7` | Fond de l'écran de démarrage |
| `icons` | 192, 512, maskable 512 | Icônes générées depuis le logo, sur fond crème |

---

## 🛡️ SERVICE WORKER ET RÈGLE RGPD

Le service worker (`src/service-worker.js`) est compilé automatiquement par
`react-scripts build` (Workbox *InjectManifest*). Il n'est **actif qu'en
production** : en développement (`npm start`), rien n'est mis en cache.

### Ce qui est mis en cache
| Contenu | Stratégie | Pourquoi |
|---|---|---|
| JS, CSS, `index.html` du build | **Pré-cache** (versionné par empreinte) | L'interface s'ouvre instantanément, même hors ligne |
| Navigation (`/parent/suivi`, …) | `index.html` depuis le cache | React Router affiche ensuite la bonne page |
| Fichiers de `/public` (logo, icônes, `theme-init.js`) | *Stale-while-revalidate*, 60 fichiers / 30 jours max | Rapide, mis à jour en arrière-plan |

### Ce qui n'est JAMAIS mis en cache (règle non négociable)
- **Toutes les réponses de l'API** (suivi, messages, absences, profils…) ;
- **Les photos d'enfants, documents et justificatifs** (`/uploads`).

Trois protections :
1. l'API est sur un autre domaine (Alwaysdata) : les routes du service worker
   sont limitées au domaine du site ;
2. les chemins `/api` et `/uploads` sont en plus exclus explicitement ;
3. aucune route ne vise les requêtes `fetch` / XHR de l'application.

**Conséquence :** un téléphone perdu ou partagé ne contient **aucune donnée
personnelle** dans le cache. Hors ligne, l'interface s'ouvre mais les données
ne s'affichent pas : le bandeau « Vous êtes hors ligne » l'explique.

---

## 🔄 MISES À JOUR DE L'APPLICATION

Problème classique des PWA : un service worker mal réglé garde les
utilisateurs sur une ancienne version. Solution mise en place :

1. `vercel.json` sert `/service-worker.js` avec `Cache-Control: no-cache` :
   le navigateur vérifie toujours s'il a changé ;
2. `serviceWorkerRegistration.js` recherche une nouvelle version **toutes les
   heures** et **à chaque retour sur l'application** ;
3. quand une nouvelle version est prête, le **bandeau « Nouvelle version
   disponible »** s'affiche :
   - **Mettre à jour** → message `SKIP_WAITING` au service worker, puis
     rechargement unique de la page ;
   - **Plus tard** → la nouvelle version s'appliquera à la prochaine ouverture.
4. Le numéro de version (`src/config/version.js`) est affiché en pied de page
   pour vérifier quelle version tourne sur un téléphone.
   ➜ **À augmenter à chaque mise en ligne**, avec `version` dans `package.json`.

---

## 📲 PROPOSER L'INSTALLATION (ModaleInstallation)

Une fenêtre « 📱 Installez l'application Les Coccinelles » s'ouvre **à
l'arrivée sur le site** :

| Appareil | Contenu de la fenêtre |
|---|---|
| Android / Chrome / Edge | Bouton **Installer** → fenêtre d'installation officielle du navigateur (événement `beforeinstallprompt`, capté dès le chargement dans `installationPwa.js`) |
| iPhone / iPad | Apple n'autorise pas de bouton : la fenêtre montre les 2 étapes **Partager → Sur l'écran d'accueil** |
| Firefox ordinateur | Rien (pas d'installation possible) |

Règles pour ne pas gêner le visiteur :
- elle s'ouvre **après le choix des cookies** (RGPD d'abord) ;
- **jamais** si l'application est déjà installée (`display-mode: standalone`) ;
- **jamais** dans l'espace admin ni sur les pages de connexion / création de compte ;
- **« Plus tard »** (ou Échap, ou clic sur le fond) : pas de nouvelle proposition
  pendant **7 jours** (date gardée dans `localStorage`, aucune donnée personnelle) ;
- un bouton **« 📱 Installer l'application »** dans le pied de page la rouvre à
  tout moment (visible seulement si l'installation est possible).

---

## 🔒 SÉCURITÉ (vercel.json)

- `Content-Security-Policy` : ajout de `worker-src 'self'` et `manifest-src 'self'`
  (service worker et manifeste uniquement depuis le site lui-même) ;
- `/service-worker.js` : `Cache-Control: no-cache, no-store, must-revalidate` ;
- `/manifest.json` : `Content-Type: application/manifest+json`.

Les jetons de connexion restent gérés comme sur le site (voir
`05-SECURITE-RGPD.md`) : la PWA ne change rien à l'authentification ni à la
double authentification par email.

---

## 🧪 TESTER LA PWA

### Sur ordinateur
```bash
cd frontend-web
npm run build          # Le service worker n'existe qu'en production
npx serve -s build     # Sert le build sur http://localhost:3000
```
Puis Chrome → F12 → onglet **Application** :
- **Manifest** : aucune erreur, icônes visibles ;
- **Service workers** : `service-worker.js` actif ;
- **Cache storage** : vérifier qu'aucune réponse d'API n'y figure (RGPD).

### Sur téléphone (site Vercel en HTTPS)
| Test | Résultat attendu |
|---|---|
| Ouvrir le site (navigation privée) | Bannière cookies, puis fenêtre « Installez l'application » |
| Android : **Installer** | Icône « Coccinelles » sur l'écran d'accueil, ouverture plein écran |
| iPhone : Partager → Sur l'écran d'accueil | Idem |
| Mode avion dans l'application | Bandeau « Vous êtes hors ligne », interface toujours visible |
| Nouveau déploiement puis retour dans l'app | Bandeau « Nouvelle version disponible » → version à jour en pied de page |

---

## 🗺️ ÉTAPES ET SUITE

| Étape | Contenu | État |
|---|---|---|
| 1 | Manifest, icônes, service worker, bandeau hors ligne | ✅ v1.0 |
| 2 | Bandeau « Nouvelle version », version en pied de page | ✅ v1.1 |
| — | Fenêtre « Installez l'application » | ✅ v1.3 |
| 3 | **Notifications Web Push** (nouveau message, absence reçue, nouvelles photos) | ⏳ après mars 2027 |

### Étape 3 prévue — notifications Web Push
- clés **VAPID** dans le `.env` du backend + librairie `web-push` (Node) ;
- table `abonnements_push` (migration) : un abonnement par appareil et par parent ;
- accord demandé **dans le profil parent**, jamais à l'ouverture de l'app ;
- envoi branché sur les notifications existantes (table `notifications`) ;
- contenu **sans donnée sensible** dans la notification (ex. « Nouveau message
  de la crèche »), le détail s'affiche après ouverture de l'app connectée ;
- limite iPhone : fonctionne uniquement si la PWA est **installée** (iOS ≥ 16.4).

---

## 📌 RÈGLES PWA IMPORTANTES

1. **Ne jamais mettre en cache une réponse d'API ou un fichier `/uploads`** (RGPD).
2. **Augmenter `VERSION_APPLICATION`** à chaque mise en ligne.
3. **Ne pas tester le service worker avec `npm start`** : utiliser `npm run build`.
4. Toute nouvelle route privée côté site doit rester sous `/api` ou `/uploads`
   pour bénéficier des exclusions du service worker.
5. Les textes des bandeaux et de la fenêtre sont dans `common.json`
   (`common.horsLigne`, `common.miseAJour`, `common.installation`) en FR et EN.
