// Routes d'authentification — /api/auth
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { body }  = require('express-validator');

const authController    = require('../controllers/authController');
const { verifierToken } = require('../middlewares/auth.middleware');
const { validerDonnees }= require('../middlewares/validate.middleware');

const router = express.Router();

// Limiteur anti-bruteforce : max 10 tentatives par 15 minutes
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  max:      10,              // Maximum 10 requêtes
  message:  { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false
});

// Règles de validation pour l'inscription
const reglesRegister = [
  body('email')
    .isEmail().withMessage('Adresse email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule'),
  body('prenom')
    .trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères').escape(),
  body('nom')
    .trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères').escape(),
  // Téléphone optionnel : chiffres, espaces, + . - ( ) — 20 caractères max
  // (taille de la colonne users.telephone)
  body('telephone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9 .\-()]{8,20}$/).withMessage('Numéro de téléphone invalide (ex : 06 12 34 56 78)')
];

// Règles de validation pour la connexion
const reglesLogin = [
  body('email').isEmail().withMessage('Adresse email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

// Règles de validation pour le reset mot de passe
const reglesResetPassword = [
  body('token').notEmpty().withMessage('Token requis'),
  body('password')
    .isLength({ min: 8 }).withMessage('8 caractères minimum')
    .matches(/\d/).withMessage('Au moins un chiffre')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
];

// ── ROUTES ───────────────────────────────────────────────────────────

// POST /api/auth/register — Créer un compte parent
router.post('/register', limiteAuth, reglesRegister, validerDonnees, authController.register);

// POST /api/auth/login — Connexion
router.post('/login', limiteAuth, reglesLogin, validerDonnees, authController.login);

// POST /api/auth/google — Connexion / inscription avec Google (parents uniquement)
router.post('/google',
  limiteAuth,
  body('credential').isString().notEmpty().withMessage('Jeton Google manquant'),
  validerDonnees,
  authController.googleLogin
);

// POST /api/auth/logout — Déconnexion (token requis)
router.post('/logout', verifierToken, authController.logout);

// POST /api/auth/refresh-token — Renouveler le token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/forgot-password — Demander reset mot de passe
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validerDonnees,
  authController.forgotPassword
);

// POST /api/auth/reset-password — Réinitialiser le mot de passe
router.post('/reset-password', reglesResetPassword, validerDonnees, authController.resetPassword);

// GET /api/auth/verify-email/:token — Vérifier l'email
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
