// Routes inscriptions — /api/inscriptions
const express = require('express');
const router  = express.Router();

const { verifierToken }      = require('../middlewares/auth.middleware');
const { verifierRole }       = require('../middlewares/role.middleware');
const { uploadDocument, verifierContenuFichiers } = require('../middlewares/upload.middleware');
const { validerCreationInscription } = require('../validators/inscription.validator');
const inscriptionController  = require('../controllers/inscriptionController');

// Pièces justificatives : stockage PRIVÉ (hors dossier public servi en statique)
const dossierJustificatifs = (req, res, next) => { req.uploadDossier = 'justificatifs'; req.uploadPrive = true; next(); };

// GET /api/inscriptions — Mes inscriptions (parent) ou toutes (admin)
router.get('/',                    verifierToken, inscriptionController.lister);

// GET /api/inscriptions/acces — La famille a-t-elle une inscription acceptée ?
// (sert au frontend à verrouiller galerie, suivi, absences...) — AVANT /:id
router.get('/acces',               verifierToken, inscriptionController.acces);

// GET /api/inscriptions/mes-documents — Pièces envoyées avec mes demandes — AVANT /:id
router.get('/mes-documents',       verifierToken, verifierRole('parent'), inscriptionController.mesDocuments);

// GET /api/inscriptions/stats — Statistiques (admin + super admin : l'admin
// voit déjà toute la liste, les compteurs du tableau de bord doivent suivre)
router.get('/stats',               verifierToken, verifierRole('admin', 'super_admin'), inscriptionController.stats);

// POST /api/inscriptions — Créer une demande d'inscription
// Ordre : fichiers reçus → contenu réel vérifié → champs validés → création
router.post('/',                   verifierToken, dossierJustificatifs, uploadDocument.array('fichiers', 20),
  verifierContenuFichiers, validerCreationInscription, inscriptionController.creer);

// GET /api/inscriptions/:id — Détail d'une inscription
router.get('/:id',                 verifierToken, inscriptionController.getInscription);

// PUT /api/inscriptions/:id — Modifier une inscription (parent, si en_attente)
router.put('/:id',                 verifierToken, inscriptionController.modifier);

// PATCH /api/inscriptions/:id/statut — Changer le statut (admin)
router.patch('/:id/statut',        verifierToken, verifierRole('super_admin'), inscriptionController.changerStatut);

// POST /api/inscriptions/:id/documents — Uploader des pièces justificatives
router.post('/:id/documents',      verifierToken, dossierJustificatifs, uploadDocument.array('fichiers', 20),
  verifierContenuFichiers, inscriptionController.ajouterDocuments);

// GET /api/inscriptions/:id/documents/:docId/fichier — Lire une pièce (parent propriétaire ou admin)
router.get('/:id/documents/:docId/fichier', verifierToken, inscriptionController.lireDocument);

// GET /api/inscriptions/:id/documents — Lister les documents d'un dossier
router.get('/:id/documents',       verifierToken, inscriptionController.listerDocuments);

module.exports = router;
