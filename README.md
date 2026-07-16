# Les Coccinelles — Plateforme web crèche

Projet de soutenance CDA (Concepteur Développeur d'Applications) — AFEC La Rochelle  
Développé par **Sabah Salih**

---

## Présentation

Application web fullstack pour la crèche **Les Coccinelles** de Puilboreau (17).  
Elle regroupe un site public, un espace parents sécurisé et un back-office administratif.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, React Router 6, Axios, react-hook-form, react-quill |
| Backend | Node.js, Express 4, Sequelize 6 |
| Base de données | MySQL 8 |
| Sécurité | JWT (access + refresh), bcryptjs, Helmet, express-rate-limit |
| Upload / images | Multer + Sharp (WebP, 2 tailles) |
| Email | Nodemailer |

---

## Structure du projet

```
lescoccinelles/
├── frontend-web/          # Application React
│   └── src/
│       ├── pages/
│       │   ├── public/    # Site vitrine (accueil, équipe, menus…)
│       │   ├── auth/      # Connexion, inscription, mot de passe oublié
│       │   ├── parent/    # Espace parents
│       │   └── admin/     # Back-office
│       ├── layouts/       # PublicLayout, AdminLayout, ParentLayout
│       ├── context/       # AuthContext (session JWT)
│       ├── services/      # Appels API (Axios)
│       └── styles/        # Variables CSS, reset, styles globaux
│
├── backend/               # API REST Express
│   └── src/
│       ├── routes/        # 15 fichiers de routes
│       ├── controllers/   # Logique métier
│       ├── models/        # Modèles Sequelize (16 tables)
│       ├── middlewares/   # Auth JWT, validation, rôles
│       ├── services/      # Mail, notifications
│       └── config/        # BDD, JWT, mail
│
└── database/
    └── schema.sql         # Schéma MySQL complet + données initiales
```

---

## Fonctionnalités

### Site public
- Accueil, présentation, équipe, projet pédagogique
- Horaires, tarifs, menus de la semaine
- Actualités, formulaire de contact
- Dossier d'inscription en ligne

### Espace parents (authentifié)
- Tableau de bord personnalisé
- Gestion des enfants et du profil
- Déclaration d'absences
- Consultation du suivi quotidien (repas, sieste, humeur)
- Documents (upload et téléchargement)
- Messagerie interne avec l'équipe
- Galerie photos privée
- Consentements RGPD

### Back-office admin
- Gestion des familles, enfants, inscriptions
- Validation des absences
- Rédaction des suivis quotidiens
- Menus de la semaine (éditeur riche)
- Actualités et CMS (pages du site)
- Galerie photos avec étiquetage des enfants
- Statistiques

---

## Installation

### Prérequis
- Node.js 18+
- MySQL 8

### 1. Base de données

Dans MySQL (phpMyAdmin, Workbench ou terminal) :

```sql
CREATE USER IF NOT EXISTS 'coccinelles_user'@'localhost' IDENTIFIED BY 'coccinelles_pass';
CREATE DATABASE IF NOT EXISTS coccinelles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON coccinelles_db.* TO 'coccinelles_user'@'localhost';
FLUSH PRIVILEGES;
```

Importer le schéma :

```bash
mysql -u coccinelles_user -pcoccinelles_pass coccinelles_db < database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Créer le fichier `.env` (copier `.env.example` si présent) et adapter :

```env
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=coccinelles_db
DB_USER=coccinelles_user
DB_PASSWORD=coccinelles_pass

JWT_SECRET=<clé_64_caractères_minimum>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<clé_64_caractères_minimum>
JWT_REFRESH_EXPIRES_IN=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre@email.com
MAIL_PASS=mot_de_passe_application
MAIL_FROM=noreply@lescoccinelles.fr
```

Démarrer :

```bash
npm run dev        # développement (nodemon)
npm start          # production
```

Le serveur démarre sur `http://localhost:3002`

### 3. Frontend

```bash
cd frontend-web
npm install
npm start
```

L'application démarre sur `http://localhost:3000`  
Le proxy vers le backend est configuré dans `package.json` (`"proxy": "http://localhost:3002"`).

---

## Routes API principales

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription parent |
| GET | `/api/equipe` | Liste de l'équipe (public) |
| GET | `/api/menus` | Menu de la semaine (public) |
| GET | `/api/actualites` | Actualités publiées (public) |
| GET | `/api/cms/pages/:slug` | Page CMS par slug (public) |
| GET | `/api/enfants` | Enfants du parent connecté |
| GET | `/api/absences` | Absences |
| GET | `/api/suivi` | Suivis quotidiens |
| GET | `/api/documents` | Documents |
| GET | `/api/messages` | Messages internes |
| GET | `/api/galerie` | Albums photos |
| GET | `/api/notifications` | Notifications |
| GET | `/api/inscriptions` | Dossiers d'inscription |

---

## Base de données — 16 tables

`users` · `enfants` · `inscriptions` · `absences` · `suivi_quotidien` · `documents` · `messages` · `actualites` · `menus` · `notifications` · `galerie_albums` · `galerie_photos` · `photo_enfants` · `consentements_photo` · `cms_pages` · `equipe_membres`

---

## Sécurité

- Mots de passe hashés avec **bcryptjs** (10 rounds)
- Authentification par **JWT** avec access token (15 min) + refresh token (7 jours)
- Headers HTTP sécurisés par **Helmet**
- Limitation de requêtes par **express-rate-limit**
- Validation des entrées par **express-validator**
- Fichiers uploadés isolés dans `/uploads` (hors du code source)
- Conformité **RGPD** : consentements photo tracés avec IP et horodatage
