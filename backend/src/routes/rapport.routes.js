// Routes rapports — /api/rapports
const express = require('express');
const router  = express.Router();

const { verifierToken } = require('../middlewares/auth.middleware');
const { verifierRole }  = require('../middlewares/role.middleware');
const ctrl               = require('../controllers/rapportController');

// Réservé au super admin (page "Rapports" du groupe Gestion, hors Quotidien)
const adminSeulement = [verifierToken, verifierRole('super_admin')];

// GET /api/rapports?debut=&fin=&groupe=&enfant_id= — Rapport présence + activités
router.get('/', ...adminSeulement, ctrl.getRapport);

module.exports = router;
