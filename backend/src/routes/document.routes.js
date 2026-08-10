// Routes documents — /api/documents
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadDocument } = require('../middlewares/upload.middleware');
const documentController = require('../controllers/documentController');

// La page "Documents" (groupe Gestion) est réservée au super_admin, mais
// cette même route sert aussi les parents (leurs propres documents) —
// on autorise donc 'parent' et 'super_admin', pas l'admin simple.
const parentOuSuperAdmin = verifierRole('parent', 'super_admin');

// GET /api/documents — Mes documents (parent) ou tous (super admin)
router.get('/',      verifierToken, parentOuSuperAdmin, documentController.lister);

// POST /api/documents — Uploader un document
router.post('/',     verifierToken, parentOuSuperAdmin, uploadDocument.single('fichier'), documentController.uploader);

// GET /api/documents/:id — Télécharger un document
router.get('/:id',   verifierToken, parentOuSuperAdmin, documentController.telecharger);

// DELETE /api/documents/:id — Supprimer un document
router.delete('/:id',verifierToken, parentOuSuperAdmin, documentController.supprimer);

module.exports = router;
