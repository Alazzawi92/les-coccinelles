# 🔐 05 — SÉCURITÉ & RGPD
# Fichier : 05-SECURITE-RGPD.md
# Description : Règles de sécurité, authentification JWT, conformité RGPD
# Obligatoire car données d'enfants et de familles

---

## 🎯 POURQUOI C'EST CRITIQUE

La plateforme gère des données sensibles :
- **Données d'enfants mineurs** (santé, allergies, photos)
- **Données de familles** (adresses, finances, documents)
- **Communications privées** (messages parents/crèche)

Le non-respect du RGPD est une infraction légale.
Une faille de sécurité peut exposer des données d'enfants.

---

## 🔑 AUTHENTIFICATION JWT

### Fonctionnement des tokens
```
1. Login → Backend génère 2 tokens :
   - Access Token  : valide 15 minutes (utilisé dans chaque requête)
   - Refresh Token : valide 7 jours (renouveler l'access token)

2. Chaque requête API envoie l'access token dans le header :
   Authorization: Bearer <access_token>

3. Quand l'access token expire (15 min) :
   - Frontend envoie le refresh token
   - Backend génère un nouvel access token
   - Sans reconnexion pour l'utilisateur

4. Déconnexion ou refresh token expiré :
   - Supprimer les deux tokens côté client
   - Rediriger vers la page de connexion
```

### Configuration JWT (config/jwt.js)
```javascript
// Configuration des tokens JWT du projet
const jwt = require('jsonwebtoken'); // Librairie JWT

// Générer un Access Token (courte durée)
const genererAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },              // Données encodées dans le token
    process.env.JWT_SECRET,            // Clé secrète (à garder secrète !)
    { expiresIn: '15m' }               // Expiration dans 15 minutes
  );
};

// Générer un Refresh Token (longue durée)
const genererRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },                    // Seulement l'ID dans le refresh
    process.env.JWT_REFRESH_SECRET,    // Clé secrète différente
    { expiresIn: '7d' }                // Expiration dans 7 jours
  );
};

// Vérifier un token et retourner les données
const verifierToken = (token, secret) => {
  return jwt.verify(token, secret);   // Lance une erreur si invalide
};

module.exports = { genererAccessToken, genererRefreshToken, verifierToken };
```

---

## 🔒 HASHAGE DES MOTS DE PASSE

```javascript
// Hashage avec bcrypt — JAMAIS stocker en clair
const bcrypt = require('bcryptjs');

// Lors de l'inscription ou changement de mot de passe
const hasherMotDePasse = async (motDePasse) => {
  const saltRounds = 12;                          // 12 = sécurisé (plus = plus lent)
  const hash = await bcrypt.hash(motDePasse, saltRounds); // Hacher
  return hash;                                    // Stocker ce hash en BDD
};

// Lors de la connexion
const verifierMotDePasse = async (motDePasse, hash) => {
  const valide = await bcrypt.compare(motDePasse, hash); // Comparer
  return valide;                                  // true si correct, false sinon
};
```

---

## 🚦 SYSTÈME DE RÔLES

| Rôle | Pages accessibles | Actions autorisées |
|------|------------------|-------------------|
| **Public** | Site public uniquement | Lecture, formulaire contact |
| **Parent** | Site public + espace parent | CRUD ses propres données |
| **Admin** | Tout sauf config système | Gérer familles, publier contenu |
| **Super Admin** | Tout | Config, créer comptes admin, RGPD |

### Hiérarchie des rôles
```
Super Admin > Admin > Parent > Public
```

### Règle d'or
```
Un parent ne peut accéder QU'AUX données de SES enfants.
Jamais aux données d'autres familles.
```

---

## 🛡️ PROTECTION DES ROUTES API

```javascript
// Exemple de protection d'une route par rôle
const router = require('express').Router();
const { verifierToken } = require('../middlewares/auth.middleware');
const { verifierRole }  = require('../middlewares/role.middleware');

// Route publique (pas de protection)
router.get('/actualites', controller.lister);

// Route pour parents connectés
router.get('/suivi/:id', verifierToken, controller.getSuivi);

// Route admin seulement
router.post('/menus', verifierToken, verifierRole('admin', 'super_admin'), controller.creer);

// Route super admin seulement
router.delete('/users/:id', verifierToken, verifierRole('super_admin'), controller.supprimer);
```

---

## 🔐 PROTECTION CONTRE LES ATTAQUES

### Rate Limiting (anti-bruteforce)
```javascript
// Limiter les tentatives de connexion
const rateLimit = require('express-rate-limit');

// Maximum 10 tentatives de connexion par 15 minutes
const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  max:      10,              // Maximum 10 requêtes
  message:  'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders:   false
});

// Appliquer sur la route de connexion
router.post('/auth/login', limiteConnexion, authController.login);
```

### Validation des données entrantes
```javascript
// Exemple de validation avec express-validator
const { body, validationResult } = require('express-validator');

// Règles de validation pour l'inscription
const reglesInscription = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),                          // Normaliser l'email

  body('password')
    .isLength({ min: 8 }).withMessage('8 caractères minimum')
    .matches(/\d/).withMessage('Au moins un chiffre')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule'),

  body('prenom')
    .trim()                                     // Supprimer espaces début/fin
    .isLength({ min: 2 }).withMessage('2 caractères minimum')
    .escape()                                   // Échapper les caractères HTML
];

// Middleware pour vérifier les erreurs de validation
const validerDonnees = (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    // Retourner les erreurs si validation échouée
    return res.status(400).json({ erreurs: erreurs.array() });
  }
  next(); // Données valides, continuer
};
```

### Upload sécurisé
```javascript
// Vérification stricte des fichiers uploadés
const verifierFichier = (req, res, next) => {
  const fichier = req.file;
  
  if (!fichier) {
    return res.status(400).json({ message: 'Aucun fichier envoyé' });
  }

  // Types autorisés (PDF + images)
  const typesAutorises = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  
  if (!typesAutorises.includes(fichier.mimetype)) {
    // Supprimer le fichier non autorisé
    fs.unlinkSync(fichier.path);
    return res.status(400).json({ message: 'Type de fichier non autorisé' });
  }

  // Taille maximum : 5 MB
  if (fichier.size > 5 * 1024 * 1024) {
    fs.unlinkSync(fichier.path);
    return res.status(400).json({ message: 'Fichier trop volumineux (max 5 MB)' });
  }

  next(); // Fichier valide
};
```

---

## 📋 RGPD — RÈGLEMENT GÉNÉRAL DE PROTECTION DES DONNÉES

### Données collectées et justification

| Donnée | Pourquoi | Durée conservation |
|--------|----------|-------------------|
| Email parent | Connexion + communication | Durée inscription + 1 an |
| Nom/prénom | Identification | Durée inscription + 1 an |
| Données enfant | Accueil à la crèche | Durée inscription + 1 an |
| Données santé | Sécurité de l'enfant | Durée inscription + 1 an |
| Photos enfants | Partage familial | Jusqu'à retrait consentement |
| Messages | Communication | 2 ans |

### Droits des utilisateurs (RGPD Article 12-23)

```
✅ Droit d'accès       → Consulter toutes ses données
✅ Droit de rectification → Modifier ses données
✅ Droit à l'effacement  → Supprimer son compte et données
✅ Droit d'opposition    → Refuser le traitement (photos)
✅ Droit à la portabilité → Export de ses données
```

### Consentement pour les photos
```javascript
// Le consentement pour les photos est OBLIGATOIRE et explicite
// Sans consentement = photo non visible même si uploadée

// Vérifier le consentement avant d'afficher une photo
const afficherPhoto = async (req, res) => {
  const { photoId } = req.params;
  const userId      = req.user.id;

  // Récupérer la photo
  const photo = await GaleriePhoto.findByPk(photoId, {
    include: [{ model: PhotoEnfant, include: [Enfant] }]
  });

  // Vérifier le consentement pour chaque enfant sur la photo
  for (const enfant of photo.enfants) {
    const consentement = await Consentement.findOne({
      where: { enfant_id: enfant.id }
    });

    if (!consentement?.consenti) {
      // Pas de consentement → flouter ou masquer la photo
      return res.json({ url: '/images/photo-floue.jpg', floue: true });
    }
  }

  return res.json({ url: photo.chemin_web, floue: false });
};
```

### Page mentions légales obligatoires
```
La plateforme doit afficher :
✅ Nom du responsable de traitement (directrice crèche)
✅ Finalité des données collectées
✅ Durée de conservation
✅ Droits des utilisateurs
✅ Contact DPO ou responsable RGPD
✅ Comment exercer ses droits
✅ Politique de cookies
```

---

## 🌐 SÉCURITÉ HTTPS EN PRODUCTION

```bash
# En production, TOUJOURS utiliser HTTPS
# Certificat SSL gratuit avec Let's Encrypt

# Installation Certbot (Ubuntu)
sudo apt install certbot python3-certbot-nginx

# Générer le certificat SSL
sudo certbot --nginx -d lescoccinelles.fr

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 📌 CHECKLIST SÉCURITÉ AVANT MISE EN PRODUCTION

```
□ Tous les mots de passe hashés avec bcrypt (min 10 rounds)
□ JWT_SECRET long et aléatoire (min 64 caractères)
□ Rate limiting sur auth/login et auth/register
□ HTTPS activé sur le domaine
□ Variables d'environnement dans .env (jamais dans le code)
□ .env dans .gitignore (jamais versionné)
□ Validation de toutes les données entrantes
□ Types de fichiers uploadés vérifiés
□ Accès aux photos conditionné au consentement RGPD
□ Page mentions légales complète
□ Possibilité de suppression de compte (RGPD)
□ Logs des actions sensibles (connexion, suppression)
□ Headers de sécurité avec Helmet.js
```
