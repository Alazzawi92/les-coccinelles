// Routes fermetures — /api/fermetures
// Calendrier des fermetures de la page Présentation (géré par le super admin)
const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const fermetureController = require('../controllers/fermetureController');

const superAdmin = [verifierToken, verifierRole('super_admin')];
const RE_DATE    = /^\d{4}-\d{2}-\d{2}$/; // AAAA-MM-JJ

// Dates au format AAAA-MM-JJ ; date de fin facultative (1 jour) mais jamais avant le début
const regles = [
  body('date_debut').matches(RE_DATE).isISO8601({ strict: true }).withMessage('Date de début invalide (AAAA-MM-JJ)'),
  body('date_fin').optional({ values: 'falsy' })
    .matches(RE_DATE).isISO8601({ strict: true }).withMessage('Date de fin invalide (AAAA-MM-JJ)')
    .custom((fin, { req }) => fin >= req.body.date_debut).withMessage('La date de fin doit être après la date de début'),
  body('motif').trim().notEmpty().withMessage('Le motif est obligatoire')
    .isLength({ max: 150 }).withMessage('Motif trop long (150 caractères max)')
];
const regleId = param('id').isInt({ min: 1 }).withMessage('Identifiant invalide');

router.get('/',       fermetureController.listerAVenir);                  // Public : en cours et à venir
router.get('/tous',   ...superAdmin, fermetureController.listerTous);      // Back office : toutes
router.post('/',      ...superAdmin, regles, validerDonnees, fermetureController.creer);
router.put('/:id',    ...superAdmin, regleId, regles, validerDonnees, fermetureController.modifier);
router.delete('/:id', ...superAdmin, regleId, validerDonnees, fermetureController.supprimer);

module.exports = router;
