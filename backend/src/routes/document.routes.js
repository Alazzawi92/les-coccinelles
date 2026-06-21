// Routes documents — /api/documents
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { uploadDocument } = require('../middlewares/upload.middleware');
const documentController = require('../controllers/documentController');

// GET /api/documents — Mes documents (parent) ou tous (admin)
router.get('/',      verifierToken, documentController.lister);

// POST /api/documents — Uploader un document
router.post('/',     verifierToken, uploadDocument.single('fichier'), documentController.uploader);

// GET /api/documents/:id — Télécharger un document
router.get('/:id',   verifierToken, documentController.telecharger);

// DELETE /api/documents/:id — Supprimer un document
router.delete('/:id',verifierToken, documentController.supprimer);

module.exports = router;
