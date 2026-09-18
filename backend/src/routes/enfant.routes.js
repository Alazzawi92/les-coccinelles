// Routes enfants — /api/enfants
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const enfantController   = require('../controllers/enfantController');

// Tous les champs sont obligatoires (aligné sur le formulaire parent)
const reglesEnfant = [
  body('prenom').trim().isLength({ min: 2 }).withMessage('Prénom requis').escape(),
  body('nom').trim().isLength({ min: 2 }).withMessage('Nom requis').escape(),
  body('date_naissance').isDate().withMessage('Date de naissance invalide'),
  body('sexe').isIn(['M', 'F']).withMessage('Sexe invalide'),
  body('allergies').trim().notEmpty().withMessage('Allergies requises (indiquer « Aucune » si besoin)').escape(),
  body('medicaments').trim().notEmpty().withMessage('Traitements requis (indiquer « Aucun » si besoin)').escape(),
  body('medecin_nom').trim().notEmpty().withMessage('Nom du médecin requis').escape(),
  body('medecin_tel').trim().notEmpty().withMessage('Téléphone du médecin requis').escape()
];

// GET /api/enfants — Mes enfants (parent) ou tous (admin)
router.get('/',    verifierToken, enfantController.lister);

// POST /api/enfants — Ajouter un enfant
router.post('/',   verifierToken, reglesEnfant, validerDonnees, enfantController.creer);

// GET /api/enfants/:id — Détail d'un enfant
router.get('/:id', verifierToken, enfantController.getEnfant);

// PUT /api/enfants/:id — Modifier un enfant
router.put('/:id', verifierToken, reglesEnfant, validerDonnees, enfantController.modifier);

// PATCH /api/enfants/:id/jours-presence — Jours de garde habituels (super admin — page Enfants, groupe Familles)
router.patch('/:id/jours-presence', verifierToken, verifierRole('super_admin'), enfantController.modifierJoursPresence);

// DELETE /api/enfants/:id — Supprimer un enfant (super admin — page Enfants, groupe Familles)
router.delete('/:id', verifierToken, verifierRole('super_admin'), enfantController.supprimer);

module.exports = router;
