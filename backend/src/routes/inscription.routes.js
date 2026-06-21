// Routes inscriptions — /api/inscriptions
const express = require('express');
const router  = express.Router();

const { verifierToken }      = require('../middlewares/auth.middleware');
const { verifierRole }       = require('../middlewares/role.middleware');
const inscriptionController  = require('../controllers/inscriptionController');

// GET /api/inscriptions — Mes inscriptions (parent) ou toutes (admin)
router.get('/',                    verifierToken, inscriptionController.lister);

// GET /api/inscriptions/stats — Statistiques (admin)
router.get('/stats',               verifierToken, verifierRole('admin', 'super_admin'), inscriptionController.stats);

// POST /api/inscriptions — Créer une demande d'inscription
router.post('/',                   verifierToken, inscriptionController.creer);

// GET /api/inscriptions/:id — Détail d'une inscription
router.get('/:id',                 verifierToken, inscriptionController.getInscription);

// PUT /api/inscriptions/:id — Modifier une inscription (parent, si en_attente)
router.put('/:id',                 verifierToken, inscriptionController.modifier);

// PATCH /api/inscriptions/:id/statut — Changer le statut (admin)
router.patch('/:id/statut',        verifierToken, verifierRole('admin', 'super_admin'), inscriptionController.changerStatut);

module.exports = router;
