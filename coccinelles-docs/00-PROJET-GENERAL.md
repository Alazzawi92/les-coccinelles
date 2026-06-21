# 🐞 00 — PROJET GÉNÉRAL
# Fichier : 00-PROJET-GENERAL.md
# Description : Vue d'ensemble complète du projet Les Coccinelles
# Projet : Plateforme web pour crèche (CDA - AFEC La Rochelle)
# Développeur : Sabah Al-Azzawi

---

## 🎯 PRÉSENTATION DU PROJET

**Nom** : Les Coccinelles  
**Type** : Plateforme web complète pour une crèche  
**Client** : Crèche Les Coccinelles, Puilboreau (17)  
**Développeur** : Sabah Al-Azzawi  
**Formation** : CDA — Concepteur Développeur d'Applications  
**Statut** : En développement  

### Objectif principal
Remplacer deux outils séparés (site public + portail parents) par une seule
plateforme moderne, unifiée, sécurisée et conforme RGPD.

---

## 🏗️ ARCHITECTURE GÉNÉRALE

```
projet-coccinelles/
│
├── 📚 docs/                      # Tous les fichiers .md de documentation
│   ├── 00-PROJET-GENERAL.md      # Ce fichier
│   ├── 01-BASE-DE-DONNEES.md     # Schéma SQL + relations
│   ├── 02-BACKEND-API.md         # Routes Express + middlewares
│   ├── 03-FRONTEND-WEB.md        # Architecture React web
│   ├── 04-FRONTEND-MOBILE.md     # React Native Expo
│   ├── 05-SECURITE-RGPD.md       # Sécurité + RGPD
│   ├── 06-OUTILS-DEVOPS.md       # Docker, Git, Trello
│   ├── 07-COMPOSANTS-UI.md       # Design System + composants
│   └── 08-ROADMAP-PHASES.md      # Planning développement
│
├── 🗄️ database/
│   ├── schema.sql                # Création toutes les tables
│   ├── seeds/                    # Données de test
│   └── migrations/               # Migrations Sequelize
│
├── 🔧 backend/                   # Node.js + Express
│   ├── src/
│   │   ├── config/               # Config BDD, JWT, mail
│   │   ├── models/               # Modèles Sequelize (15 tables)
│   │   ├── controllers/          # Logique métier
│   │   ├── routes/               # Définition des routes API
│   │   ├── middlewares/          # Auth, upload, validation
│   │   ├── services/             # Services (email, upload...)
│   │   └── utils/                # Fonctions utilitaires
│   ├── uploads/                  # Fichiers uploadés
│   ├── .env                      # Variables d'environnement
│   └── server.js                 # Point d'entrée backend
│
├── 🌐 frontend-web/              # React 18
│   └── src/
│       ├── assets/               # Images, SVG, fonts
│       ├── components/           # Composants réutilisables
│       │   ├── common/           # Button, Input, Card, Modal...
│       │   ├── forms/            # Formulaires spécifiques
│       │   └── ui/               # Composants design system
│       ├── pages/
│       │   ├── public/           # Pages accessibles sans connexion
│       │   ├── parent/           # Pages espace parents (auth)
│       │   └── admin/            # Pages espace admin (auth)
│       ├── layouts/              # Layouts avec leur propre CSS
│       │   ├── PublicLayout/
│       │   │   ├── PublicLayout.jsx
│       │   │   └── PublicLayout.css
│       │   ├── ParentLayout/
│       │   │   ├── ParentLayout.jsx
│       │   │   └── ParentLayout.css
│       │   └── AdminLayout/
│       │       ├── AdminLayout.jsx
│       │       └── AdminLayout.css
│       ├── hooks/                # Hooks React personnalisés
│       ├── context/              # Context API (auth, theme)
│       ├── services/             # Appels API (axios)
│       ├── styles/               # CSS globaux + variables
│       │   ├── variables.css     # Variables CSS du design system
│       │   ├── global.css        # Styles globaux
│       │   └── reset.css         # Reset CSS
│       ├── utils/                # Fonctions utilitaires front
│       ├── router/               # React Router configuration
│       └── App.jsx               # Composant racine
│
├── 📱 frontend-mobile/           # React Native Expo
│   └── app/
│       ├── (tabs)/               # Navigation par onglets
│       ├── auth/                 # Écrans authentification
│       └── _layout.jsx           # Layout principal Expo Router
│
├── 🐳 docker-compose.yml         # Orchestration containers
├── 🤖 CLAUDE.md                  # Guide pour Claude Code
└── 📖 README.md                  # Documentation projet
```

---

## 👥 RÔLES UTILISATEURS

| Rôle | Accès | Description |
|------|-------|-------------|
| **Public** | Site public | Visiteur non connecté |
| **Parent** | Espace parents | Parent d'un enfant inscrit |
| **Admin** | Espace admin | Membre de l'équipe crèche |
| **Super Admin** | Tout + config | Directrice de la crèche |

---

## 🌐 LES 3 ESPACES DE LA PLATEFORME

### 1. Site Public
- Accessible sans connexion
- Présentation de la crèche
- Informations pratiques
- Formulaire de contact
- Actualités et menus

### 2. Espace Parents (authentifié)
- Inscription et connexion sécurisée
- Dossier d'inscription en ligne
- Suivi quotidien de l'enfant
- Envoi et consultation de documents
- Messagerie avec la crèche
- Galerie photos (avec consentement RGPD)
- Déclaration d'absences

### 3. Espace Administration (authentifié)
- Gestion des familles et dossiers
- Liste d'attente
- Publication actualités / menus / documents
- Suivi quotidien des enfants
- Gestion de la galerie photos
- Tableau de bord + statistiques
- Messagerie avec les parents

---

## 🛠️ STACK TECHNIQUE

| Domaine | Technologie | Version |
|---------|-------------|---------|
| Frontend Web | React | 18.x |
| Routing Web | React Router | 6.x |
| Styles | CSS Modules + variables CSS | — |
| Frontend Mobile | React Native + Expo | SDK 51+ |
| Backend | Node.js + Express | 20.x LTS |
| ORM | Sequelize | 6.x |
| Base de données | MySQL / MariaDB | 8.x |
| Auth | JWT (jsonwebtoken) | — |
| Upload | Multer | — |
| Email | Nodemailer | — |
| Conteneurs | Docker + Docker Compose | — |
| Versioning | Git + GitHub | — |

---

## 🎨 DESIGN SYSTEM

### Palette de couleurs
```css
--primary:    #FF9800;  /* Orange principal */
--secondary:  #66BB6A;  /* Vert nature */
--accent-1:   #4FC3F7;  /* Bleu ciel */
--accent-2:   #F06292;  /* Rose doux */
--accent-3:   #BA68C8;  /* Violet tendre */
--accent-4:   #FFEB3B;  /* Jaune soleil */
--bg-light:   #FFFDF7;  /* Fond blanc chaud */
--text-dark:  #2D3436;  /* Texte foncé */
```

### Typographie
```css
--font-heading: 'Fredoka', sans-serif;   /* Titres ludiques */
--font-body:    'Nunito', sans-serif;    /* Texte lisible */
```

### Espacements (système 8px)
```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  24px;
--space-xl:  32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Border-radius
```css
--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  16px;
--radius-xl:  20px;
--radius-pill: 50px;
```

---

## 📊 CHIFFRES CLÉS DU PROJET

| Métrique | Valeur |
|----------|--------|
| Pages totales | 64 pages |
| Tables BDD | 15 tables |
| Routes API | 60+ endpoints |
| Composants UI | 20+ composants |
| Durée estimée | 3-4 mois |

---

## ⚙️ VARIABLES D'ENVIRONNEMENT

### Backend (.env)
```env
# Serveur
PORT=3001
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=coccinelles_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=change_this_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=

# Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend Web (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NAME=Les Coccinelles
```

---

## 🚀 DÉMARRAGE RAPIDE

```bash
# 1. Cloner le projet
git clone https://github.com/ton-user/les-coccinelles.git
cd les-coccinelles

# 2. Lancer avec Docker
docker-compose up -d

# 3. Lancer le backend (sans Docker)
cd backend
npm install
npm run dev

# 4. Lancer le frontend web (sans Docker)
cd frontend-web
npm install
npm start

# 5. Lancer l'app mobile
cd frontend-mobile
npm install
npx expo start
```

---

## 📌 RÈGLES DE CODE IMPORTANTES

1. **Commentaires en français** sur chaque ligne importante
2. **CSS par layout** : chaque layout a son propre fichier CSS
3. **Pas de styles inline** : toujours utiliser les classes CSS
4. **Variables CSS** : toujours utiliser les variables du design system
5. **Noms de variables** : camelCase pour JS, kebab-case pour CSS
6. **Commits** : en français, format `type: description`
7. **Branches Git** : `feature/nom`, `fix/nom`, `docs/nom`
