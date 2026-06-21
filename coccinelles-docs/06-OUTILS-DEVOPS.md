# 🐳 06 — OUTILS & DEVOPS
# Fichier : 06-OUTILS-DEVOPS.md
# Description : Docker, Git, GitHub, workflow de développement

---

## 🐳 DOCKER

### docker-compose.yml
```yaml
# Orchestration des services du projet Les Coccinelles
# Lance : Backend + BDD + PHPMyAdmin en une commande

version: '3.8'

services:

  # ── BASE DE DONNÉES MySQL ──────────────────────────────────────
  database:
    image: mysql:8.0                        # Image MySQL officielle
    container_name: coccinelles_db
    restart: unless-stopped                 # Redémarrer si crash
    environment:
      MYSQL_ROOT_PASSWORD: root_password    # Mot de passe root
      MYSQL_DATABASE: coccinelles_db        # Créer la BDD au démarrage
      MYSQL_USER: coccinelles_user          # Utilisateur dédié
      MYSQL_PASSWORD: coccinelles_pass      # Son mot de passe
    ports:
      - "3306:3306"                         # Port BDD accessible localement
    volumes:
      - mysql_data:/var/lib/mysql           # Persistance des données
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql # Init BDD

  # ── INTERFACE WEB POUR LA BDD ─────────────────────────────────
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: coccinelles_phpmyadmin
    restart: unless-stopped
    ports:
      - "8080:80"                           # Accès : http://localhost:8080
    environment:
      PMA_HOST: database                    # Se connecte au service "database"
      PMA_USER: root
      PMA_PASSWORD: root_password
    depends_on:
      - database                            # Démarrer après la BDD

  # ── BACKEND NODE.JS ───────────────────────────────────────────
  backend:
    build:
      context: ./backend                    # Dossier du Dockerfile
      dockerfile: Dockerfile
    container_name: coccinelles_backend
    restart: unless-stopped
    ports:
      - "3001:3001"                         # API accessible : http://localhost:3001
    environment:
      DB_HOST:     database                 # Nom du service Docker BDD
      DB_PORT:     3306
      DB_NAME:     coccinelles_db
      DB_USER:     coccinelles_user
      DB_PASSWORD: coccinelles_pass
      JWT_SECRET:  change_this_in_production
      PORT:        3001
    volumes:
      - ./backend/uploads:/app/uploads      # Persistance des fichiers uploadés
    depends_on:
      - database                            # Démarrer après la BDD

# ── VOLUMES PERSISTANTS ──────────────────────────────────────────
volumes:
  mysql_data:                               # Données MySQL ne se perdent pas
```

### Dockerfile backend
```dockerfile
# Image de base Node.js LTS
FROM node:20-alpine

# Dossier de travail dans le container
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier tout le code source
COPY . .

# Exposer le port de l'API
EXPOSE 3001

# Commande de démarrage
CMD ["node", "server.js"]
```

### Commandes Docker utiles
```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs en temps réel
docker-compose logs -f backend

# Redémarrer un service spécifique
docker-compose restart backend

# Accéder au terminal du container backend
docker-compose exec backend sh

# Supprimer tout (containers + volumes = RESET COMPLET)
docker-compose down -v
```

---

## 🌿 GIT & GITHUB

### Structure des branches

```
main                    # Production (stable, deployé)
├── develop             # Intégration (version en cours)
│   ├── feature/auth    # Nouvelle fonctionnalité auth
│   ├── feature/galerie # Nouvelle fonctionnalité galerie
│   ├── fix/login-bug   # Correction d'un bug
│   └── docs/readme     # Mise à jour documentation
```

### Règles des branches

| Branche | Description | Merge vers |
|---------|-------------|-----------|
| `main` | Production — NE PAS toucher directement | — |
| `develop` | Branche principale de dev | `main` quand stable |
| `feature/nom` | Nouvelle fonctionnalité | `develop` |
| `fix/nom` | Correction de bug | `develop` |
| `docs/nom` | Documentation | `develop` |

### Convention des commits (en français)

```
type: description courte et claire

Types disponibles :
feat     : Nouvelle fonctionnalité
fix      : Correction de bug
docs     : Documentation
style    : Formatage (pas de changement logique)
refactor : Refactorisation du code
test     : Ajout ou modification de tests
chore    : Tâches de maintenance
```

#### Exemples de commits
```bash
git commit -m "feat: ajouter authentification JWT"
git commit -m "fix: corriger erreur upload photo"
git commit -m "docs: mettre à jour le README"
git commit -m "style: reformater les composants Button"
git commit -m "feat: créer page tableau de bord parent"
git commit -m "fix: gérer l'expiration du token refresh"
```

### Workflow Git quotidien
```bash
# 1. Toujours partir de develop à jour
git checkout develop
git pull origin develop

# 2. Créer une branche pour la fonctionnalité
git checkout -b feature/nom-fonctionnalite

# 3. Coder + commits réguliers
git add .
git commit -m "feat: description de ce qui a été fait"

# 4. Pousser la branche sur GitHub
git push origin feature/nom-fonctionnalite

# 5. Créer une Pull Request sur GitHub vers develop
# 6. Vérifier le code, puis merger

# 7. Supprimer la branche après merge
git branch -d feature/nom-fonctionnalite
```

### .gitignore
```
# Dépendances Node.js (trop lourdes)
node_modules/

# Variables d'environnement (données sensibles)
.env
.env.local
.env.production

# Fichiers uploadés (données utilisateurs)
backend/uploads/*
!backend/uploads/.gitkeep

# Cache et builds
.DS_Store
dist/
build/
.expo/

# Logs
*.log
npm-debug.log*
```

---

## 📋 TRELLO — ORGANISATION DU PROJET

### Structure des listes

```
📋 BACKLOG           → Toutes les tâches à faire (non priorisées)
🔜 À FAIRE           → Tâches priorisées pour les prochains jours
🔄 EN COURS          → Tâches en cours de développement (max 3)
✅ TERMINÉ           → Tâches finies (archiver régulièrement)
🐛 BUGS              → Bugs identifiés à corriger
💡 IDÉES             → Idées futures à évaluer
```

### Étiquettes de couleur

| Couleur | Signification |
|---------|--------------|
| 🔴 Rouge | Urgent / Bloquant |
| 🟠 Orange | Backend |
| 🔵 Bleu | Frontend Web |
| 🟣 Violet | Mobile |
| 🟢 Vert | Terminé / OK |
| ⚪ Gris | Documentation |

---

## 📌 CHECKLIST SETUP PROJET (à faire une fois)

```bash
# 1. Cloner le repo
git clone https://github.com/ton-user/les-coccinelles.git
cd les-coccinelles

# 2. Créer les fichiers .env
cp backend/.env.example backend/.env
# Remplir les variables dans backend/.env

# 3. Lancer Docker
docker-compose up -d

# 4. Vérifier que tout fonctionne
# BDD : http://localhost:8080 (PHPMyAdmin)
# API : http://localhost:3001/api/health
# Frontend : http://localhost:3000

# 5. Installer les dépendances frontend
cd frontend-web && npm install
cd ../frontend-mobile && npm install
```
