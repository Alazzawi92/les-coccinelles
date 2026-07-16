// Routes émargements — /api/emargements
const express = require('express');
const router  = express.Router();

const { verifierToken } = require('../middlewares/auth.middleware');
const { verifierRole }  = require('../middlewares/role.middleware');
const ctrl              = require('../controllers/emargementController');

// Tous les endpoints sont réservés aux admins
const adminSeulement = [verifierToken, verifierRole('admin', 'super_admin')];

// GET /api/emargements/:date — Enfants + pointages pour un jour (ex: 2026-07-03)
router.get('/:date',    ...adminSeulement, ctrl.getDuJour);

// POST /api/emargements — Créer un pointage d'arrivée
router.post('/',        ...adminSeulement, ctrl.creerArrivee);

// PATCH /api/emargements/:id — Mettre à jour un pointage (départ ou correction)
router.patch('/:id',    ...adminSeulement, ctrl.modifier);

// DELETE /api/emargements/:id — Supprimer un pointage (erreur de saisie)
router.delete('/:id',   ...adminSeulement, ctrl.supprimer);

module.exports = router;
