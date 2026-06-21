// Routes utilisateurs — /api/users
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const { uploadAvatar }   = require('../middlewares/upload.middleware');
const userController     = require('../controllers/userController');

// GET /api/users/me — Mon profil (connecté)
router.get('/me', verifierToken, userController.monProfil);

// PUT /api/users/me — Modifier mon profil
router.put('/me', verifierToken,
  [body('prenom').optional().trim().isLength({ min: 2 }).escape(),
   body('nom').optional().trim().isLength({ min: 2 }).escape(),
   body('telephone').optional().isMobilePhone()],
  validerDonnees, userController.modifierProfil
);

// PUT /api/users/me/password — Changer mon mot de passe
router.put('/me/password', verifierToken,
  [body('ancienPassword').notEmpty(),
   body('nouveauPassword').isLength({ min: 8 }).matches(/\d/).matches(/[A-Z]/)],
  validerDonnees, userController.changerMotDePasse
);

// PUT /api/users/me/avatar — Changer ma photo de profil
router.put('/me/avatar', verifierToken, uploadAvatar.single('avatar'), userController.changerAvatar);

// GET /api/users/admins — Liste des admins (tous utilisateurs connectés, pour la messagerie)
router.get('/admins', verifierToken, userController.listerAdmins);

// ── ROUTES ADMIN ─────────────────────────────────────────────────────
// GET /api/users — Liste de tous les utilisateurs (admin seulement)
router.get('/', verifierToken, verifierRole('admin', 'super_admin'), userController.listerUsers);

// GET /api/users/:id — Détail d'un utilisateur (admin)
router.get('/:id', verifierToken, verifierRole('admin', 'super_admin'), userController.getUser);

// PUT /api/users/:id/activer — Activer/désactiver un compte (admin)
router.put('/:id/activer', verifierToken, verifierRole('admin', 'super_admin'), userController.toggleActif);

// DELETE /api/users/:id — Supprimer un compte (super admin uniquement)
router.delete('/:id', verifierToken, verifierRole('super_admin'), userController.supprimerUser);

module.exports = router;
