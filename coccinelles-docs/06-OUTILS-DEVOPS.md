# 🛠️ 06 — OUTILS, DEVOPS & DÉPLOIEMENT
# Fichier : 06-OUTILS-DEVOPS.md
# Description : Environnements, Docker, Git, hébergement (Vercel + Alwaysdata),
# procédure de mise en production

---

## 🌍 LES ENVIRONNEMENTS

| Environnement | Frontend | API | Base de données |
|---|---|---|---|
| **Développement (Docker)** | conteneur React — http://localhost:3000 | conteneur Node — http://localhost:3001/api | conteneur MySQL 8 — port 3306 |
| **Développement (sans Docker)** | `npm start` dans `frontend-web` | `npm run dev` dans `backend` | MySQL local |
| **Production** | **Vercel** — https://les-coccinelles.vercel.app | **Alwaysdata** — https://alazzawi.alwaysdata.net/api-coccinelles/api | **MariaDB Alwaysdata** |

```
Navigateur / PWA ──HTTPS──► Vercel (React compilé + service worker)
        │
        └──HTTPS──► Alwaysdata : Node.js + Express (/api-coccinelles) ──► MariaDB
                                     │
                                     ├──► SMTP (emails : confirmation, code 2FA…)
                                     ├──► Google (vérification connexion Google)
                                     └──► Cloudflare (vérification Turnstile)
```

---

## 🐳 DOCKER (développement)

`docker-compose.yml` lance 3 conteneurs sur un réseau privé `coccinelles-network` :

| Service | Image | Rôle |
|---|---|---|
| `mysql` | mysql:8.0 | Base `coccinelles_db`, initialisée par `database/schema.sql` ; **healthcheck** avant le démarrage du backend ; données persistées dans un volume |
| `backend` | node:20-alpine (`backend/Dockerfile`) | API sur le port 3001 ; code monté en volume (rechargement) ; `uploads/` persisté |
| `frontend` | node:20-alpine (`frontend-web/Dockerfile`) | Serveur de développement React sur le port 3000 (polling activé pour Windows) |

Les clés Google et Turnstile sont lues depuis le `.env` à la racine (clés de
test Turnstile par défaut).

### Commandes utiles
```bash
docker-compose up -d                      # Lancer les 3 conteneurs
docker-compose ps                         # État des conteneurs
docker logs -f coccinelles-backend        # Logs de l'API
docker restart coccinelles-backend        # Relancer l'API après une modification backend
docker exec -it coccinelles-mysql mysql -u coccinelles_user -p coccinelles_db   # Console SQL
docker-compose down                       # Arrêter (les données restent dans le volume)
```

---

## 🚀 HÉBERGEMENT ET MISE EN PRODUCTION

### Frontend — Vercel
- Projet relié au dépôt GitHub : **chaque push sur `main` déclenche un
  déploiement automatique** (`npm run build`).
- Variables : `REACT_APP_API_URL` (API Alwaysdata), `REACT_APP_GOOGLE_CLIENT_ID`,
  `REACT_APP_TURNSTILE_SITE_KEY`.
- `vercel.json` : réécriture de toutes les adresses vers `index.html` (routage
  React), en-têtes de sécurité (CSP, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`), pas de cache sur `service-worker.js`.
- HTTPS fourni automatiquement.

### API et base de données — Alwaysdata
- Site de type **Node.js** ; l'API est servie sous le chemin `/api-coccinelles`
  (variable `MOUNT_PREFIX`, retirée par `server.js`) et écoute sur l'IP imposée
  par l'hébergeur (variable `IP`).
- Base **MariaDB** administrée par phpMyAdmin ; schéma initial :
  `database/schema.alwaysdata.sql`.
- Variables d'environnement : celles de `backend/.env.example` (+ `MOUNT_PREFIX`,
  `IP`, `NODE_ENV=production`, secrets JWT, SMTP, Google, Turnstile).
- Le déploiement du backend est **manuel** (voir procédure).

### Procédure de mise en production d'une évolution
```
1. Développer et tester en local (Docker)
2. Commit + push sur main            → Vercel redéploie le frontend automatiquement
3. Si la base change : exécuter la nouvelle migration (database/migrations/00X_*.sql)
   dans phpMyAdmin d'Alwaysdata AVANT de mettre à jour l'API
4. Mettre à jour le code backend sur Alwaysdata (SFTP ou git pull), sans toucher .env
5. Redémarrer le site Node.js dans l'interface Alwaysdata
6. Vérifier : /api-coccinelles/health, connexion complète (code 2FA reçu),
   numéro de version en pied de page du site
```
> Ordre important : un frontend qui attend une nouvelle route ne fonctionne
> qu'une fois l'API et la base à jour (ex. double authentification → migration 006).

### Versions de l'application
Le numéro de version (`frontend-web/src/config/version.js` + `package.json`)
est affiché en pied de page ; il est augmenté à chaque mise en ligne
importante (1.1.0 → 1.2.0 → 1.3.0…). Les utilisateurs de la PWA reçoivent un
bandeau « Nouvelle version disponible ».

---

## 🌿 GIT & GITHUB

- Dépôt : `github.com/Alazzawi92/les-coccinelles` (monorepo : backend,
  frontend-web, database, docs).
- **Une branche `main`** : projet mené seule ; chaque commit poussé sur `main`
  est déployé par Vercel. Avant chaque push : compilation de production
  (`npm run build`) et vérification locale.
- Historique : **45+ commits** depuis juin 2026.

### Convention des commits (en français)
```
type(portée): description courte

feat      nouvelle fonctionnalité        feat(pwa): fenêtre « Installez l'application »
fix       correction                     fix(securite): compteur d'erreurs du code 2FA conservé
docs      documentation                  docs(roadmap): état réel du projet
style     présentation, sans logique
refactor  réorganisation du code
chore     maintenance
```
Le message détaille ensuite le **pourquoi** de la modification.

### .gitignore (principaux)
```
.env, .env.local              # Secrets
node_modules/                 # Dépendances
frontend-web/build/           # Compilation (générée par Vercel)
backend/uploads/<dossier>/*   # Fichiers envoyés par les utilisateurs (seuls les .gitkeep sont versionnés)
backend/stockage/             # Pièces justificatives privées
*.log
```

---

## 📋 ORGANISATION DU PROJET

> **À compléter par Sabah** : outil de suivi réellement utilisé (Trello,
> GitHub Projects, liste de tâches…), organisation des tâches, rythme de travail.

Repères disponibles dans le dépôt :
- planning en 7 phases et état d'avancement : `08-ROADMAP-PHASES.md` ;
- historique daté des commits (`git log`).

---

## 📌 INSTALLER LE PROJET SUR UN NOUVEAU POSTE

```bash
# 1. Cloner
git clone https://github.com/Alazzawi92/les-coccinelles.git
cd les-coccinelles

# 2. Variables d'environnement
cp backend/.env.example backend/.env       # Puis remplir les valeurs
# (optionnel) .env à la racine : GOOGLE_CLIENT_ID, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY

# 3. Lancer
docker-compose up -d

# 4. Données de test (optionnel) — depuis le poste, base MySQL du conteneur joignable sur le port 3306
cd backend && npm install && npm run seed

# 5. Vérifier
#  API      : http://localhost:3001/health
#  Frontend : http://localhost:3000
```
