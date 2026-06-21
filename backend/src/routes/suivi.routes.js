// Routes suivi quotidien — /api/suivi
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const suiviController    = require('../controllers/suiviController');

// GET /api/suivi/:enfant_id — Suivi d'un enfant (tous les jours)
router.get('/:enfant_id',            verifierToken, suiviController.lister);

// GET /api/suivi/:enfant_id/:date — Suivi d'un jour précis
router.get('/:enfant_id/:date',      verifierToken, suiviController.getSuiviDuJour);

// POST /api/suivi — Créer un suivi (admin seulement)
router.post('/',                     verifierToken, verifierRole('admin', 'super_admin'), suiviController.creer);

// PUT /api/suivi/:id — Modifier un suivi (admin seulement)
router.put('/:id',                   verifierToken, verifierRole('admin', 'super_admin'), suiviController.modifier);

module.exports = router;
