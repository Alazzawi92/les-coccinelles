# 🐞 00 — PROJET GÉNÉRAL
# Fichier : 00-PROJET-GENERAL.md
# Description : Vue d'ensemble du projet Les Coccinelles (état réel, novembre 2026)
# Projet : Plateforme web pour crèche — titre CDA, AFEC La Rochelle
# Développeuse : Sabah (nom complet à vérifier, voir README.md de ce dossier)

---

## 🎯 PRÉSENTATION DU PROJET

| | |
|---|---|
| **Nom** | Les Coccinelles |
| **Type** | Plateforme web complète + application mobile installable (PWA) |
| **Client** | Crèche associative Les Coccinelles, Puilboreau (17) |
| **Public accueilli** | Enfants de 0 à 3 ans — 28 places fixes + 4 places de garderie |
| **Horaires** | Du lundi au vendredi, 7 h 30 – 18 h 30 |
| **Communes accueillies** | Puilboreau, Saint-Xandre, Esnandes |
| **Formation** | CDA — Concepteur Développeur d'Applications, AFEC La Rochelle |
| **Période** | Juin 2026 → soutenance (développement seule) |
| **Statut** | Site en ligne (version réduite) ; ouverture des inscriptions en ligne en **mars 2027** |

### Problème de départ
La crèche utilisait **deux outils séparés** : un site vitrine d'un côté, un
portail parents de l'autre. Les informations étaient dispersées, la
communication avec les familles passait par plusieurs canaux, et le suivi des
enfants n'était pas centralisé.

### Objectif
Une **seule plateforme**, moderne, **sécurisée** et **conforme au RGPD**
(données de mineurs, données de santé), qui réunit :
- le site public de la crèche ;
- un espace parents (inscription, suivi quotidien, absences, messagerie, photos) ;
- un espace de gestion pour l'équipe et la direction ;
- une version mobile installable sur téléphone.

### Lancement en deux temps
La crèche ne peut pas ouvrir les inscriptions en cours d'année scolaire :
1. **Maintenant → mars 2027** : site vitrine en ligne ; espace parents et
   création de comptes **fermés** par deux interrupteurs du super admin.
2. **Mars 2027** : ouverture des comptes parents et des demandes d'inscription,
   sans redéploiement (Admin → Paramètres).

---

## 👥 RÔLES UTILISATEURS

| Rôle | Qui | Accès |
|---|---|---|
| Visiteur | Toute personne | Site public |
| `parent` | Parent d'un enfant (inscrit ou en cours d'inscription) | Espace parents ; suivi, galerie, absences seulement une fois l'enfant inscrit |
| `admin` | Membre de l'équipe éducative | Partie « Quotidien » : émargement, suivi, absences, calendrier, messagerie |
| `super_admin` | Direction de la crèche | Tout, dont familles, inscriptions, contenus du site, statistiques, rapports, paramètres |

---

## 🌐 LES 3 ESPACES — FONCTIONNALITÉS RÉALISÉES

### 1. Site public (sans connexion)
- Accueil, présentation de la crèche, équipe, projet pédagogique, horaires,
  tarifs (barème PSU), conditions d'inscription + guide PDF à télécharger.
- Actualités (liste + détail), menus de la semaine (cycle de 4 semaines).
- Formulaire de contact (anti-robot, limité à 5 messages par heure).
- Mentions légales et RGPD, bannière de consentement aux cookies.
- Site **bilingue français / anglais**, **thème clair / sombre**.

### 2. Espace parents (connexion + code reçu par email)
- Création de compte (email confirmé sous 24 h, validation par l'équipe) ou
  connexion avec **Google**.
- Tableau de bord, profil, gestion des enfants (santé, allergies, médecin).
- **Demande d'inscription en 6 étapes** avec pièces justificatives.
- **Suivi quotidien** de l'enfant : repas, siestes, biberons, selles, humeur,
  activités, température (vue calendrier).
- **Absences** : déclaration avec justificatif, vue liste et calendrier.
- **Documents** : envoi par glisser-déposer, téléchargement.
- **Messagerie** avec l'équipe (pièces jointes), **notifications** (cloche).
- **Galerie photos** privée ; photos **floutées** sans consentement.
- **Consentement photo** par enfant (RGPD).

### 3. Espace administration
- **Quotidien (admin et super admin)** : émargement arrivées / départs, saisie
  du suivi des enfants présents, validation des absences, calendrier mensuel des
  présences, messagerie avec les familles.
- **Gestion (super admin)** : tableau de bord et alertes, familles et comptes
  (activation), dossiers d'inscription (statuts, commentaire, notification au
  parent), enfants, actualités (éditeur de texte riche), menus, documents,
  galerie (envoi multiple, compression, identification des enfants), contenus
  des pages (CMS) et équipe, statistiques, **rapports de présence** (facturation)
  et d'activités, **paramètres** (interrupteurs, guide d'inscription).

### Version mobile (PWA)
Installable sur Android et iPhone depuis le navigateur, plein écran, fenêtre
« Installez l'application », bandeaux hors ligne et nouvelle version. Voir
`04-FRONTEND-MOBILE.md`.

---

## 🏗️ ARCHITECTURE GÉNÉRALE

Architecture **3 tiers** : le navigateur affiche, l'API applique les règles, la
base stocke. Le frontend et l'API sont indépendants et communiquent en JSON
sur HTTPS.

```
┌────────────────────────────┐        ┌─────────────────────────────────┐        ┌──────────────┐
│ PRÉSENTATION               │  HTTPS │ API REST (métier + sécurité)    │  SQL   │ DONNÉES      │
│ React 18 (SPA) + PWA       │ ─JSON─►│ Node.js 20 + Express 4          │ ──────►│ MySQL 8 /    │
│ Vercel                     │◄────── │ Sequelize 6 — Alwaysdata        │◄────── │ MariaDB      │
└────────────────────────────┘  JWT   └─────────────────────────────────┘        └──────────────┘
                                             │ SMTP (emails) · Google (connexion) · Cloudflare (anti-robot)
```

### Arborescence du dépôt
```
les-coccinelles/
├── backend/            # API Node.js + Express (voir 02-BACKEND-API.md)
├── frontend-web/       # Site React + PWA (voir 03-FRONTEND-WEB.md, 04-FRONTEND-MOBILE.md)
├── database/           # schema.sql, schema.alwaysdata.sql, migrations/, seeds/ (voir 01)
├── coccinelles-docs/   # Cette documentation
├── design/             # Maquette d'origine de la page d'accueil (HTML)
├── docker-compose.yml  # MySQL + API + frontend en développement (voir 06)
└── README.md
```

---

## 🛠️ STACK TECHNIQUE

| Domaine | Technologie | Version |
|---|---|---|
| Frontend | React + React Router | 18 / 6 |
| Formulaires, appels API | react-hook-form, Axios | — |
| Styles | CSS + variables CSS (thème clair / sombre), sans framework | — |
| Traductions | i18next (FR / EN) | 23 |
| Version mobile | PWA : manifest + service worker Workbox | Workbox 6 |
| Backend | Node.js + Express | 20 / 4 |
| ORM | Sequelize | 6 |
| Base de données | MySQL (local) / MariaDB (production) | 8 |
| Authentification | JWT + code par email (2FA) + Google | — |
| Sécurité | helmet, CORS, express-rate-limit, express-validator, Cloudflare Turnstile | — |
| Fichiers | Multer + Sharp (WebP, 3 tailles) | — |
| Emails | Nodemailer (SMTP) | — |
| PDF | jsPDF (menus, rapports) | — |
| Conteneurs | Docker + Docker Compose | — |
| Hébergement | Vercel (frontend) + Alwaysdata (API + base) | — |
| Versionnement | Git + GitHub | — |

---

## 🎨 DESIGN SYSTEM (résumé)

Orange `#FF7A45` et jaune `#FFB020` issus du logo, polices **Fredoka** (titres)
et **Nunito** (texte), espacements en multiples de 8 px, thème sombre.
Détail : `07-COMPOSANTS-UI.md`.

---

## 📊 CHIFFRES CLÉS (relevés le 12/11/2026)

| Mesure | Valeur |
|---|---|
| Tables en base | **20** |
| Routes API | **102** |
| Pages React | **44** (11 publiques, 10 parents, 17 admin, 6 authentification) |
| Composants réutilisables | 17 + 3 layouts |
| Code backend | ≈ 5 400 lignes JavaScript |
| Code frontend | ≈ 15 000 lignes JavaScript/JSX + ≈ 12 800 lignes CSS |
| Langues | 2 (français, anglais) |
| Migrations de base | 6 |
| Commits | 45+ (depuis le 21/06/2026) |

---

## ⚙️ VARIABLES D'ENVIRONNEMENT

### Backend (`backend/.env`, modèle : `backend/.env.example`)
| Variable | Rôle |
|---|---|
| `PORT`, `NODE_ENV`, `FRONTEND_URL` | Serveur, mode, adresse autorisée par CORS |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base de données |
| `JWT_SECRET`, `JWT_EXPIRES_IN` (15m), `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` (7d) | Jetons |
| `GOOGLE_CLIENT_ID` | Connexion Google (vide = désactivée) |
| `TURNSTILE_SECRET_KEY` | Anti-robot (vide = désactivé en dev, formulaires bloqués en production) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Envoi des emails |
| `UPLOAD_MAX_SIZE`, `UPLOAD_PATH` | Fichiers |
| `MOUNT_PREFIX`, `IP` | Hébergement Alwaysdata (chemin `/api-coccinelles`, IP d'écoute) |
| `FILES_SECRET` (facultatif) | Clé des liens signés (sinon `JWT_SECRET`) |

### Frontend (`frontend-web/.env`, ou variables Vercel)
| Variable | Rôle |
|---|---|
| `REACT_APP_API_URL` | Adresse de l'API |
| `REACT_APP_GOOGLE_CLIENT_ID` | Bouton Google (vide = masqué) |
| `REACT_APP_TURNSTILE_SITE_KEY` | Case anti-robot (vide = masquée) |

---

## 🚀 DÉMARRAGE RAPIDE

```bash
git clone https://github.com/Alazzawi92/les-coccinelles.git
cd les-coccinelles
cp backend/.env.example backend/.env    # Remplir les valeurs
docker-compose up -d                    # MySQL + API (3001) + frontend (3000)

# Tester la version mobile (PWA) : uniquement sur le build de production
cd frontend-web && npm run build && npx serve -s build
```
Détail et hébergement : `06-OUTILS-DEVOPS.md`.

---

## 📌 RÈGLES DE CODE

1. Commentaires **en français** ; en-tête `FICHIER / ROLE` en haut de chaque fichier.
2. Nommage : camelCase (JS), PascalCase (composants React), kebab-case (CSS),
   snake_case (SQL), commits `type(portée): description` en français.
3. CSS : un fichier par layout et par composant, uniquement des variables CSS,
   aucun style inline.
4. API : réponse `{ success, data, message }`, validation de toutes les entrées,
   `try / catch` sur chaque accès à la base.
5. Sécurité : un parent ne voit **que les données de ses enfants** ; jamais de
   mot de passe ni de jeton dans une réponse ; secrets uniquement dans `.env`.
