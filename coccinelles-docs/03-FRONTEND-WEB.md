# 🌐 03 — FRONTEND WEB (React)
# Fichier : 03-FRONTEND-WEB.md
# Description : Architecture réelle du frontend React — structure,
# routage et gardes, API, styles, traductions, accessibilité

---

## 📁 STRUCTURE DU FRONTEND

```
frontend-web/
├── public/
│   ├── index.html              # Page HTML unique (+ lien manifest PWA, balises iPhone)
│   ├── manifest.json           # PWA : nom, couleurs, icônes (voir 04-FRONTEND-MOBILE.md)
│   ├── icons/                  # PWA : icônes 192 / 512 / maskable / iPhone
│   ├── images/                 # Logo, photo floutée de remplacement
│   ├── theme-init.js           # Thème clair / sombre appliqué avant React
│   └── fiche-preinscription.pdf
├── vercel.json                 # Hébergement : réécritures, CSP, en-têtes de sécurité
└── src/
    ├── components/
    │   ├── NotifCloche/        # Cloche de notifications (layouts parent et admin)
    │   └── ui/                 # Composants réutilisables (1 dossier = .jsx + .css)
    │       ├── AccesReserve/
    │       ├── ApercuEquipe/
    │       ├── BadgeInscription/
    │       ├── BandeauHorsLigne/
    │       ├── BandeauMiseAJour/
    │       ├── Chargement/
    │       ├── CoccinelleDefilement/
    │       ├── CoccinelleSvg/
    │       ├── CookieBanner/
    │       ├── GoogleButton/
    │       ├── ImageSecours/
    │       ├── LanguageSwitcher/
    │       ├── ModaleEmailConfirme/
    │       ├── ModaleInstallation/
    │       ├── ThemeToggle/
    │       └── Turnstile/
    ├── pages/
    │   ├── public/             # Accessibles sans connexion
    │   │   ├── Accueil/
    │   │   ├── Actualites/
    │   │   ├── Contact/
    │   │   ├── Equipe/
    │   │   ├── Horaires/
    │   │   ├── Inscriptions/
    │   │   ├── MentionsLegales/
    │   │   ├── Menus/
    │   │   ├── Presentation/
    │   │   ├── ProjetPedagogique/
    │   │   └── Tarifs/
    │   ├── parent/             # Espace parents (auth requis)
    │   │   ├── Absences/
    │   │   ├── Consentement/
    │   │   ├── Dashboard/
    │   │   ├── Documents/
    │   │   ├── GaleriePrivee/
    │   │   ├── Inscription/
    │   │   ├── MesEnfants/
    │   │   ├── Messages/
    │   │   ├── MonProfil/
    │   │   └── Suivi/
    │   ├── admin/              # Espace admin (auth + rôle admin / super_admin)
    │   │   ├── Absences/
    │   │   ├── Actualites/
    │   │   ├── CMS/
    │   │   ├── Calendrier/
    │   │   ├── Dashboard/
    │   │   ├── Documents/
    │   │   ├── Emargement/
    │   │   ├── Enfants/
    │   │   ├── Familles/
    │   │   ├── Galerie/
    │   │   ├── Inscriptions/
    │   │   ├── Menus/
    │   │   ├── Messagerie/
    │   │   ├── Parametres/
    │   │   ├── Rapports/
    │   │   ├── Statistiques/
    │   │   └── SuiviAdmin/
    │   └── auth/               # Connexion, compte, double authentification
    │       ├── DeuxFacteurs/
    │       ├── ForgotPassword/
    │       ├── Login/
    │       ├── Register/
    │       ├── ResetPassword/
    │       └── VerifyEmail/
    ├── layouts/                # Chaque layout a son propre CSS (navbar, footer, sidebar inclus)
    │   ├── PublicLayout/       # Site public (barre de navigation + pied de page)
    │   ├── ParentLayout/       # Espace parents (sidebar)
    │   └── AdminLayout/        # Espace admin (sidebar)
    ├── context/
    │   ├── AuthContext.jsx     # Utilisateur connecté, connexion / déconnexion
    │   └── ParametresContext.jsx  # Réglages du super admin (espace parents, comptes)
    ├── hooks/
    │   ├── useAccesFamille.js
    │   ├── useFenetreModale.js
    │   ├── useInstallationPossible.js  # PWA : installation possible ?
    │   ├── useMenuDuJour.js
    │   └── usePageCMS.js
    ├── services/
    │   ├── api.js              # Instance Axios (jeton JWT, rafraîchissement, langue)
    │   └── auth.service.js     # Appels API d'authentification (dont 2FA)
    ├── utils/                  # Fonctions utilitaires (dates, âge, validation,
    │                           #   PDF des menus, installation PWA…)
    ├── config/
    │   ├── limites.js          # Tailles maximales des fichiers envoyés
    │   └── version.js          # Numéro de version affiché en pied de page
    ├── i18n/                   # Traductions FR / EN (common, public, auth, parent, admin)
    ├── styles/
    │   ├── variables.css       # Variables CSS design system (thème clair / sombre)
    │   ├── reset.css           # Reset CSS
    │   ├── global.css          # Styles globaux (boutons, formulaires…)
    │   ├── pages-publiques.css # Styles communs des pages publiques
    │   ├── auth.css            # Styles des pages de connexion / compte
    │   ├── parent.css          # Styles communs de l'espace parents
    │   └── admin.css           # Styles communs de l'espace admin
    ├── router/
    │   ├── index.jsx           # React Router — toutes les routes
    │   ├── ProtectedRoute.jsx  # Garde : connecté + rôle autorisé
    │   ├── SuperAdminRoute.jsx # Garde : partie « Gestion » réservée au super admin
    │   └── ParametreRoute.jsx  # Garde : interrupteurs du super admin
    ├── service-worker.js       # PWA : cache de l'interface (jamais l'API)
    ├── serviceWorkerRegistration.js  # PWA : enregistrement + mises à jour
    ├── App.jsx                 # Composant racine (contextes, toasts, bandeaux)
    └── index.js                # Point d'entrée React
```

---

## 🔀 ROUTAGE (router/index.jsx)

React Router 6. Les routes sont regroupées par espace, chacune avec son layout
et ses gardes :

| Espace | Routes | Garde |
|---|---|---|
| Site public (`PublicLayout`) | `/`, `/presentation`, `/equipe`, `/projet-pedagogique`, `/horaires`, `/tarifs`, `/conditions-inscription`, `/actualites`, `/actualites/:id`, `/menus`, `/contact`, `/mentions-legales`, `/connexion` | Aucune |
| Authentification (plein écran) | `/connexion/verification` (code 2FA), `/creer-un-compte`, `/mot-de-passe-oublie`, `/reset-password`, `/verify-email/:token` | `/creer-un-compte` fermé si le super admin a fermé la création de comptes |
| Espace parents (`ParentLayout`) | `/parent/tableau-de-bord`, `mon-profil`, `mes-enfants`, `inscription`, `suivi`, `suivi/:id`, `absences`, `documents`, `messages`, `galerie`, `consentement` | `ParametreRoute` (espace ouvert) + `ProtectedRoute` (parent, admin, super_admin) ; suivi / absences / galerie / consentement en plus dans `AccesReserve` (enfant inscrit) |
| Admin « Quotidien » (`AdminLayout`) | `/admin/suivi`, `absences`, `calendrier`, `emargement`, `messagerie` | `ProtectedRoute` (admin, super_admin) |
| Admin « Gestion » | `/admin/tableau-de-bord`, `familles`, `inscriptions`, `enfants`, `actualites`, `menus`, `documents`, `galerie`, `cms`, `statistiques`, `rapports`, `parametres`, `comptes` | + `SuperAdminRoute` (super_admin seulement ; un admin est renvoyé vers l'émargement) |
| Route inconnue | `*` | Redirection vers l'accueil |

### Les gardes de routes
| Composant | Rôle |
|---|---|
| `ProtectedRoute roles={[…]}` | Pendant la vérification de session : indicateur de chargement. Pas connecté → `/connexion`. Rôle non autorisé → tableau de bord parent. |
| `SuperAdminRoute` | Réserve la partie « Gestion » au super admin ; un admin simple garde l'accès au quotidien. |
| `ParametreRoute reglage="…"` | Ferme une partie du site selon les interrupteurs du super admin (lancement en deux temps). |
| `AccesReserve` | Affiche un écran explicatif si la famille n'a pas encore d'enfant inscrit. |

> Ces gardes servent le **confort** de l'utilisateur. La **sécurité** est
> assurée par le backend : chaque route API vérifie elle-même le jeton et le rôle.

---

## ⚙️ COMMUNICATION AVEC L'API (services/api.js)

Une instance **Axios** unique pour tout le site :
- **URL de l'API** lue dans `REACT_APP_API_URL` (Alwaysdata en production) ;
- **intercepteur de requête** : ajoute `Authorization: Bearer <accessToken>`,
  la langue choisie (`Accept-Language: fr | en`) et laisse Axios gérer les
  envois de fichiers (FormData) ;
- **intercepteur de réponse** : jeton expiré → appel de
  `/auth/refresh-token` puis **nouvelle tentative automatique** de la requête ;
  rafraîchissement impossible → déconnexion propre ;
- `urlFichier()` : construit l'adresse complète d'un fichier du backend (les
  chemins privés arrivent déjà signés par l'API).

État de connexion : `context/AuthContext.jsx` (utilisateur, `connecter`,
`deconnecter`). Réglages du super admin : `context/ParametresContext.jsx`.

---

## 🎨 STYLES ET DESIGN SYSTEM

- **CSS classique + variables CSS** (pas de framework CSS, pas de Tailwind).
- **97 variables** dans `styles/variables.css` : couleurs, polices, espacements
  (système de 8 px), arrondis, ombres, z-index, transitions. **Aucune couleur
  en dur** dans les composants.
- **Thème clair / sombre** : les mêmes variables sont redéfinies quand `<html>`
  porte `data-theme="dark"`. `public/theme-init.js` applique le thème **avant**
  l'affichage (pas de flash blanc) : choix mémorisé, sinon réglage du système.
- **Un fichier CSS par layout** (`PublicLayout.css`, `ParentLayout.css`,
  `AdminLayout.css`) + un CSS par composant et par page.
- **Feuilles communes** : `global.css` (reset, boutons `.btn`, `.btn--primary`,
  `.btn--outline`, `.btn--ghost`, `.btn--sm`, `.btn--lg`, formulaires),
  `pages-publiques.css`, `auth.css`, `parent.css`, `admin.css`.
- **Responsive** (« desktop first », points de rupture 1440 / 1279 / 1023 /
  767 / 479 px) : menu hamburger sur le site public, sidebar qui devient une
  **barre de navigation en bas** sur mobile dans l'espace parents.

Couleurs principales (voir `07-COMPOSANTS-UI.md`) : orange `#FF7A45`
(`--primary`), jaune `#FFB020` (`--secondary`), polices **Fredoka** (titres) et
**Nunito** (texte).

---

## 🌍 TRADUCTIONS (i18n/)

- **i18next + react-i18next** : site entièrement disponible en **français et
  anglais** (sélecteur FR / EN).
- Un seul espace de noms ; fichiers rangés par partie du site :
  `locales/{fr,en}/{common,public,auth,parent,admin}.json`.
- Utilisation : `const { t } = useTranslation();` puis `t('common.xxx')`.
- La langue est envoyée à l'API (`Accept-Language`) : messages d'erreur et
  notifications reviennent dans la bonne langue.
- Dates et montants formatés selon la langue (`getLocale()`).

---

## ♿ ACCESSIBILITÉ

- Attribut `lang` de `<html>` mis à jour à chaque changement de langue.
- `role="status"` / `aria-live` sur les messages dynamiques (chargement,
  bandeaux hors ligne / mise à jour) ; `role="dialog"` + `aria-modal` sur les
  fenêtres, fermeture avec Échap, focus placé sur le bouton principal.
- Composants interactifs = vrais `<button>` (accessibles au clavier), y compris
  la coccinelle « retour en haut ».
- Animations désactivées si le visiteur a demandé `prefers-reduced-motion`.
- Images décoratives avec `alt=""`, images informatives avec texte alternatif.

---

## 📱 VERSION MOBILE

Le site est une **PWA** installable (manifest, service worker, bandeaux hors
ligne / mise à jour, fenêtre d'installation) : voir `04-FRONTEND-MOBILE.md`.

---

## 📦 DÉPENDANCES NPM (frontend-web/package.json)

| Paquet | Rôle |
|---|---|
| react 18 + react-dom | Bibliothèque d'interface |
| react-router-dom 6 | Routage côté navigateur |
| axios | Appels à l'API |
| react-hook-form | Formulaires et validation côté client |
| react-hot-toast | Notifications visuelles (toasts) |
| react-quill | Éditeur de texte riche (actualités, CMS, menus) |
| i18next, react-i18next, i18next-browser-languagedetector | Traductions FR / EN |
| date-fns | Manipulation des dates |
| jspdf | Génération des PDF (menus, rapports) |
| workbox-* | Service worker de la PWA |
| react-scripts 5 (dev) | Create React App : compilation, serveur de développement |

Scripts : `npm start` (développement), `npm run build` (production, génère
aussi le service worker).

---

## 📌 RÈGLES FRONTEND IMPORTANTES

1. Un dossier par composant ou page : `Nom/Nom.jsx` + `Nom/Nom.css` (PascalCase).
2. Toujours `var(--variable)` en CSS, jamais de couleur en dur ni de style inline.
3. Tous les textes visibles passent par `t('…')` (FR **et** EN).
4. Tous les appels API passent par `services/api.js`.
5. Les gardes de routes n'ont pas valeur de sécurité : le backend vérifie tout.
6. Commentaires en français ; en-tête `FICHIER / ROLE` en haut de chaque fichier.
