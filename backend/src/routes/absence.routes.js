// Routes absences — /api/absences
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadDocument, verifierContenuFichiers } = require('../middlewares/upload.middleware');
const { body }           = require('express-validator');
const { validerDonnees } = require('../middlewares/validate.middleware');

// Règles d'une déclaration d'absence (mêmes contrôles que le formulaire parent)
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const reglesAbsence = [
  body('enfant_id').isInt({ min: 1 }).withMessage('Enfant requis'),
  body('date_debut').matches(RE_DATE).withMessage('Date de début invalide'),
  body('date_fin').matches(RE_DATE).withMessage('Date de fin invalide')
    .bail()
    .custom((fin, { req }) => fin >= req.body.date_debut).withMessage('La date de fin doit être après la date de début'),
  body('motif').isIn(['maladie', 'vacances', 'rendez_vous', 'autre']).withMessage('Motif invalide'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage('Précisions trop longues (1000 caractères max)')
];
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
router.post('/',                verifierToken, verifierInscriptionAcceptee, dossierJustificatifs, uploadDocument.single('justificatif'),
  verifierContenuFichiers, reglesAbsence, validerDonnees, absenceController.creer);

// GET /api/absences/:id — Détail d'une absence
router.get('/:id',              verifierToken, verifierInscriptionAcceptee, absenceController.getAbsence);

// PUT /api/absences/:id — Modifier une absence (si en_attente)
router.put('/:id',              verifierToken, verifierInscriptionAcceptee, absenceController.modifier);

// PATCH /api/absences/:id/valider — Valider ou refuser (admin)
router.patch('/:id/valider',    verifierToken, verifierRole('admin', 'super_admin'), absenceController.valider);

// DELETE /api/absences/:id — Supprimer une absence
router.delete('/:id',           verifierToken, verifierInscriptionAcceptee, absenceController.supprimer);

module.exports = router;
