// Routes absences — /api/absences
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadDocument } = require('../middlewares/upload.middleware');
const absenceController  = require('../controllers/absenceController');
const { verifierInscriptionAcceptee } = require('../middlewares/inscription.middleware'); // Famille avec inscription acceptée

// Justificatif d'absence : rangé dans uploads/justificatifs (chemin enregistré par le contrôleur)
const dossierJustificatifs = (req, res, next) => { req.uploadDossier = 'justificatifs'; next(); };

// GET /api/absences/presences/:date — Présences/absences pour un jour (admin) — AVANT /:id
router.get('/presences/:date',  verifierToken, verifierRole('admin', 'super_admin'), absenceController.getPresences);

// GET /api/absences/presences-mois?annee=&mois= — Résumé jour par jour pour tout un mois (admin) — AVANT /:id
router.get('/presences-mois',   verifierToken, verifierRole('admin', 'super_admin'), absenceController.getPresencesMois);

// GET /api/absences — Mes absences (parent) ou toutes (admin)
router.get('/',                 verifierToken, verifierInscriptionAcceptee, absenceController.lister);

// POST /api/absences — Déclarer une absence (avec justificatif optionnel)
router.post('/',                verifierToken, verifierInscriptionAcceptee, dossierJustificatifs, uploadDocument.single('justificatif'), absenceController.creer);

// GET /api/absences/:id — Détail d'une absence
router.get('/:id',              verifierToken, verifierInscriptionAcceptee, absenceController.getAbsence);

// PUT /api/absences/:id — Modifier une absence (si en_attente)
router.put('/:id',              verifierToken, verifierInscriptionAcceptee, absenceController.modifier);

// PATCH /api/absences/:id/valider — Valider ou refuser (admin)
router.patch('/:id/valider',    verifierToken, verifierRole('admin', 'super_admin'), absenceController.valider);

// DELETE /api/absences/:id — Supprimer une absence
router.delete('/:id',           verifierToken, verifierInscriptionAcceptee, absenceController.supprimer);

module.exports = router;
