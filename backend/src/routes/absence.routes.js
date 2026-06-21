// Routes absences — /api/absences
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadDocument } = require('../middlewares/upload.middleware');
const absenceController  = require('../controllers/absenceController');

// GET /api/absences — Mes absences (parent) ou toutes (admin)
router.get('/',                 verifierToken, absenceController.lister);

// POST /api/absences — Déclarer une absence (avec justificatif optionnel)
router.post('/',                verifierToken, uploadDocument.single('justificatif'), absenceController.creer);

// GET /api/absences/:id — Détail d'une absence
router.get('/:id',              verifierToken, absenceController.getAbsence);

// PUT /api/absences/:id — Modifier une absence (si en_attente)
router.put('/:id',              verifierToken, absenceController.modifier);

// PATCH /api/absences/:id/valider — Valider ou refuser (admin)
router.patch('/:id/valider',    verifierToken, verifierRole('admin', 'super_admin'), absenceController.valider);

// DELETE /api/absences/:id — Supprimer une absence
router.delete('/:id',           verifierToken, absenceController.supprimer);

module.exports = router;
