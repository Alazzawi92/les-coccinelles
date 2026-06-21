# 🔧 02 — BACKEND API
# Fichier : 02-BACKEND-API.md
# Description : Architecture complète du backend Node.js + Express
# Routes API, middlewares, configuration

---

## 📁 STRUCTURE DU BACKEND

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js        # Connexion Sequelize
│   │   ├── jwt.js             # Configuration JWT
│   │   └── mail.js            # Configuration Nodemailer
│   ├── models/
│   │   ├── index.js           # Associations entre modèles
│   │   ├── User.js
│   │   ├── Enfant.js
│   │   ├── Inscription.js
│   │   ├── Absence.js
│   │   ├── SuiviQuotidien.js
│   │   ├── Document.js
│   │   ├── Message.js
│   │   ├── Actualite.js
│   │   ├── Menu.js
│   │   ├── Notification.js
│   │   ├── GalerieAlbum.js
│   │   ├── GaleriePhoto.js
│   │   ├── Consentement.js
│   │   └── CmsPage.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── enfantController.js
│   │   ├── inscriptionController.js
│   │   ├── absenceController.js
│   │   ├── suiviController.js
│   │   ├── documentController.js
│   │   ├── messageController.js
│   │   ├── actualiteController.js
│   │   ├── menuController.js
│   │   ├── notificationController.js
│   │   ├── galerieController.js
│   │   └── cmsController.js
│   ├── routes/
│   │   ├── index.js           # Fichier principal qui regroupe toutes les routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── enfant.routes.js
│   │   ├── inscription.routes.js
│   │   ├── absence.routes.js
│   │   ├── suivi.routes.js
│   │   ├── document.routes.js
│   │   ├── message.routes.js
│   │   ├── actualite.routes.js
│   │   ├── menu.routes.js
│   │   ├── notification.routes.js
│   │   ├── galerie.routes.js
│   │   └── cms.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js  # Vérification JWT
│   │   ├── role.middleware.js  # Vérification des rôles
│   │   ├── upload.middleware.js # Gestion des uploads
│   │   └── validate.middleware.js # Validation des données
│   ├── services/
│   │   ├── mail.service.js    # Envoi d'emails
│   │   ├── upload.service.js  # Traitement fichiers
│   │   └── notification.service.js # Création notifications
│   └── utils/
│       ├── response.js        # Format réponses API standard
│       └── helpers.js         # Fonctions utilitaires
├── uploads/                   # Fichiers uploadés
│   ├── avatars/
│   ├── documents/
│   ├── photos/
│   └── justificatifs/
├── .env
├── package.json
└── server.js                  # Point d'entrée
```

---

## 🚀 SERVER.JS (point d'entrée)

```javascript
// Point d'entrée du serveur Express
const express = require('express');   // Framework web
const cors    = require('cors');      // Permettre les requêtes cross-origin
const helmet  = require('helmet');    // Sécurité HTTP headers
const morgan  = require('morgan');    // Logs des requêtes
const path    = require('path');      // Gestion des chemins fichiers
require('dotenv').config();           // Charger les variables d'environnement

const sequelize = require('./src/config/database'); // Connexion BDD
const routes    = require('./src/routes');           // Toutes les routes

const app = express(); // Créer l'application Express

// ── MIDDLEWARES GLOBAUX ─────────────────────────────────────────────
app.use(helmet());                    // Sécurité : protège les headers HTTP
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000', // Autoriser le frontend
  credentials: true                  // Autoriser les cookies et headers d'auth
}));
app.use(express.json());              // Parser le corps des requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parser les formulaires
app.use(morgan('dev'));               // Afficher les logs de requêtes

// ── DOSSIER STATIQUE POUR LES FICHIERS UPLOADÉS ─────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── ROUTES API ───────────────────────────────────────────────────────
app.use('/api', routes); // Toutes les routes préfixées par /api

// ── DÉMARRAGE DU SERVEUR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

sequelize.sync({ alter: false }) // Synchroniser les modèles avec la BDD
  .then(() => {
    console.log('✅ Base de données connectée');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur BDD :', err);
  });
```

---

## 🔑 TOUTES LES ROUTES API

### Auth — /api/auth
```
POST   /api/auth/register          Créer un compte parent
POST   /api/auth/login             Connexion
POST   /api/auth/logout            Déconnexion
POST   /api/auth/refresh-token     Renouveler le token JWT
POST   /api/auth/forgot-password   Demander reset mot de passe
POST   /api/auth/reset-password    Réinitialiser le mot de passe
GET    /api/auth/verify-email/:token  Vérifier l'email
```

### Users — /api/users
```
GET    /api/users/me               Mon profil (connecté)
PUT    /api/users/me               Modifier mon profil
PUT    /api/users/me/password      Changer mon mot de passe
PUT    /api/users/me/avatar        Changer ma photo de profil
GET    /api/users                  Liste tous les users (admin)
GET    /api/users/:id              Détail d'un user (admin)
PUT    /api/users/:id/activer      Activer/désactiver un compte (admin)
DELETE /api/users/:id              Supprimer un compte (super admin)
```

### Enfants — /api/enfants
```
GET    /api/enfants                Mes enfants (parent) / Tous (admin)
POST   /api/enfants                Ajouter un enfant
GET    /api/enfants/:id            Détail d'un enfant
PUT    /api/enfants/:id            Modifier un enfant
DELETE /api/enfants/:id            Supprimer un enfant (admin)
```

### Inscriptions — /api/inscriptions
```
GET    /api/inscriptions           Mes inscriptions (parent) / Toutes (admin)
POST   /api/inscriptions           Créer une demande d'inscription
GET    /api/inscriptions/:id       Détail d'une inscription
PUT    /api/inscriptions/:id       Modifier une inscription (parent)
PATCH  /api/inscriptions/:id/statut  Changer le statut (admin)
GET    /api/inscriptions/stats     Statistiques (admin)
```

### Absences — /api/absences
```
GET    /api/absences               Mes absences (parent) / Toutes (admin)
POST   /api/absences               Déclarer une absence
GET    /api/absences/:id           Détail d'une absence
PUT    /api/absences/:id           Modifier une absence (si en_attente)
PATCH  /api/absences/:id/valider   Valider/refuser une absence (admin)
DELETE /api/absences/:id           Supprimer une absence
```

### Suivi quotidien — /api/suivi
```
GET    /api/suivi/:enfant_id              Suivi d'un enfant (par date)
GET    /api/suivi/:enfant_id/:date        Suivi d'un jour précis
POST   /api/suivi                         Créer un suivi (admin)
PUT    /api/suivi/:id                     Modifier un suivi (admin)
```

### Documents — /api/documents
```
GET    /api/documents              Mes documents (parent) / Tous (admin)
POST   /api/documents              Uploader un document
GET    /api/documents/:id          Télécharger un document
DELETE /api/documents/:id          Supprimer un document
```

### Messages — /api/messages
```
GET    /api/messages               Ma messagerie (conversations)
POST   /api/messages               Envoyer un message
GET    /api/messages/:id           Lire une conversation
PATCH  /api/messages/:id/lu        Marquer comme lu
DELETE /api/messages/:id           Supprimer un message
```

### Actualités — /api/actualites
```
GET    /api/actualites             Liste (public)
GET    /api/actualites/:id         Détail (public)
POST   /api/actualites             Créer (admin)
PUT    /api/actualites/:id         Modifier (admin)
PATCH  /api/actualites/:id/publier Publier/dépublier (admin)
DELETE /api/actualites/:id         Supprimer (admin)
```

### Menus — /api/menus
```
GET    /api/menus                  Menus de la semaine (public)
GET    /api/menus/:semaine         Menu d'une semaine précise (public)
POST   /api/menus                  Créer un menu (admin)
PUT    /api/menus/:id              Modifier un menu (admin)
DELETE /api/menus/:id              Supprimer un menu (admin)
```

### Notifications — /api/notifications
```
GET    /api/notifications          Mes notifications
PATCH  /api/notifications/:id/lue  Marquer comme lue
PATCH  /api/notifications/tout-lire Tout marquer comme lu
DELETE /api/notifications/:id      Supprimer une notification
```

### Galerie — /api/galerie
```
GET    /api/galerie/albums               Liste des albums
POST   /api/galerie/albums               Créer un album (admin)
GET    /api/galerie/albums/:id           Photos d'un album
PUT    /api/galerie/albums/:id           Modifier un album (admin)
DELETE /api/galerie/albums/:id           Supprimer un album (admin)
POST   /api/galerie/albums/:id/photos    Ajouter photos (admin)
DELETE /api/galerie/photos/:id           Supprimer une photo (admin)
GET    /api/galerie/consentement         Mon consentement RGPD
POST   /api/galerie/consentement         Donner/retirer consentement
```

### CMS — /api/cms
```
GET    /api/cms/pages              Toutes les pages CMS (admin)
GET    /api/cms/pages/:slug        Contenu d'une page (public)
PUT    /api/cms/pages/:slug        Modifier le contenu (admin)
```

---

## 🔒 MIDDLEWARES

### auth.middleware.js
```javascript
// Middleware de vérification du token JWT
const jwt = require('jsonwebtoken'); // Librairie JWT
const { User } = require('../models'); // Modèle User

// Vérifier que l'utilisateur est connecté
const verifierToken = async (req, res, next) => {
  // Récupérer le token dans le header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format : "Bearer TOKEN"

  if (!token) {
    // Pas de token → non autorisé
    return res.status(401).json({ message: 'Token manquant, connexion requise' });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur en base de données
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.actif) {
      // Utilisateur introuvable ou désactivé
      return res.status(401).json({ message: 'Utilisateur non trouvé ou désactivé' });
    }

    req.user = user; // Attacher l'utilisateur à la requête
    next();          // Passer au middleware suivant
  } catch (err) {
    // Token invalide ou expiré
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = { verifierToken };
```

### role.middleware.js
```javascript
// Middleware de vérification des rôles
// Utilisation : router.get('/admin', verifierToken, verifierRole('admin'), controller)

// Vérifier que l'utilisateur a le bon rôle
const verifierRole = (...rolesAutorises) => {
  return (req, res, next) => {
    // Vérifier que le rôle de l'utilisateur est dans la liste autorisée
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : permissions insuffisantes' });
    }
    next(); // Rôle OK, continuer
  };
};

module.exports = { verifierRole };
```

### upload.middleware.js
```javascript
// Middleware de gestion des uploads de fichiers
const multer  = require('multer');  // Gestion upload
const path    = require('path');    // Gestion chemins
const crypto  = require('crypto'); // Génération noms uniques

// Types de fichiers autorisés
const TYPES_AUTORISES = {
  documents: ['application/pdf', 'image/jpeg', 'image/png'],
  photos:    ['image/jpeg', 'image/png', 'image/webp'],
  avatars:   ['image/jpeg', 'image/png']
};

// Configuration stockage sur disque
const stockage = multer.diskStorage({
  // Dossier de destination selon le type
  destination: (req, file, cb) => {
    const dossier = req.uploadDossier || 'documents'; // Défini dans la route
    cb(null, `./uploads/${dossier}/`);
  },
  // Nom de fichier unique pour éviter les conflits
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);        // .pdf, .jpg...
    const nomUnique = crypto.randomBytes(16).toString('hex'); // Nom aléatoire
    cb(null, `${nomUnique}${extension}`);
  }
});

// Filtre de validation des types MIME
const filtreTypes = (typesAutorises) => (req, file, cb) => {
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true); // Fichier accepté
  } else {
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false);
  }
};

// Uploader pour les documents (PDF + images, max 5MB)
const uploadDocument = multer({
  storage:  stockage,
  limits:   { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter: filtreTypes(TYPES_AUTORISES.documents)
});

// Uploader pour les photos (images uniquement, max 10MB)
const uploadPhoto = multer({
  storage:  stockage,
  limits:   { fileSize: 10 * 1024 * 1024 }, // 10 MB maximum
  fileFilter: filtreTypes(TYPES_AUTORISES.photos)
});

module.exports = { uploadDocument, uploadPhoto };
```

---

## 📦 DÉPENDANCES NPM

```json
{
  "dependencies": {
    "bcryptjs":       "^2.4.3",   // Hashage des mots de passe
    "cors":           "^2.8.5",   // Gestion CORS
    "dotenv":         "^16.0.0",  // Variables d'environnement
    "express":        "^4.18.0",  // Framework web
    "express-validator": "^7.0.0", // Validation des données
    "express-rate-limit": "^6.0.0", // Protection bruteforce
    "helmet":         "^7.0.0",   // Sécurité HTTP headers
    "jsonwebtoken":   "^9.0.0",   // Tokens JWT
    "morgan":         "^1.10.0",  // Logs des requêtes
    "multer":         "^1.4.5",   // Upload de fichiers
    "mysql2":         "^3.0.0",   // Driver MySQL
    "nodemailer":     "^6.9.0",   // Envoi d'emails
    "sequelize":      "^6.32.0",  // ORM base de données
    "sharp":          "^0.32.0"   // Compression des images
  },
  "devDependencies": {
    "nodemon": "^3.0.0"           // Redémarrage auto en développement
  },
  "scripts": {
    "start":  "node server.js",       // Production
    "dev":    "nodemon server.js",    // Développement
    "seed":   "node database/seeds/index.js" // Insérer données de test
  }
}
```

---

## 📌 RÈGLES BACKEND IMPORTANTES

1. **Toujours** valider les données entrantes avec express-validator
2. **Toujours** hasher les mots de passe avec bcrypt (10 rounds minimum)
3. **Jamais** exposer des infos sensibles dans les réponses API
4. **Toujours** gérer les erreurs avec try/catch
5. **Rate limiting** sur les routes d'authentification
6. **Logs** de toutes les actions sensibles (connexion, suppression...)
7. **RGPD** : prévoir la suppression des données sur demande
