// Routes des paramètres du site — /api/parametres
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const parametresController = require('../controllers/parametresController');

// Interrupteurs facultatifs, mais toujours des booléens s'ils sont envoyés
const reglesModification = [
  body('espace_parents_ouvert').optional().isBoolean({ strict: true }).withMessage('Valeur invalide'),
  body('creation_comptes_ouverte').optional().isBoolean({ strict: true }).withMessage('Valeur invalide')
];

router.get('/public', parametresController.getPublic);                                          // Public
router.get('/',       verifierToken, verifierRole('super_admin'), parametresController.getTout); // Super admin
router.put('/',       verifierToken, verifierRole('super_admin'), reglesModification, validerDonnees,
  parametresController.modifier);                                                               // Super admin

module.exports = router;
