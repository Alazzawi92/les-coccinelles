// Routes menus — /api/menus
const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const menuController     = require('../controllers/menuController');

// Numéro de semaine entre 1 et 4, champs de menu facultatifs mais toujours du texte
const reglesSemaineCycle = [
  param('numero').isInt({ min: 1, max: 4 }).withMessage('Numéro de semaine invalide (1 à 4)'),
  body(menuController.CHAMPS_MENU).optional({ nullable: true }).isString().withMessage('Contenu de menu invalide')
];

router.get('/',             menuController.lister);            // Semaine courante (public)
// /cycle et /jour AVANT /:semaine pour ne pas être capturés comme paramètre
router.get('/cycle',        verifierToken, verifierRole('super_admin'), menuController.getCycle);
router.put('/cycle/:numero', verifierToken, verifierRole('super_admin'), reglesSemaineCycle, validerDonnees, menuController.sauvegarderSemaineCycle);
router.get('/jour/:date',   menuController.getMenuJour);       // Déjeuner + goûter d'un jour (public)
router.get('/:semaine',     menuController.getMenuSemaine);    // Menu d'une semaine (public)

module.exports = router;
