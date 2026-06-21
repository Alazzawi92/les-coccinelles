// Routes actualités — /api/actualites
const express = require('express');
const router  = express.Router();

const { verifierToken }   = require('../middlewares/auth.middleware');
const { verifierRole }    = require('../middlewares/role.middleware');
const { uploadDocument }  = require('../middlewares/upload.middleware');
const actualiteController = require('../controllers/actualiteController');

// Routes publiques (sans authentification)
router.get('/',             actualiteController.lister);      // Liste paginée
router.get('/:id',          actualiteController.getActualite);// Détail

// Routes admin
router.post('/',            verifierToken, verifierRole('admin', 'super_admin'), uploadDocument.single('image'), actualiteController.creer);
router.put('/:id',          verifierToken, verifierRole('admin', 'super_admin'), actualiteController.modifier);
router.patch('/:id/publier',verifierToken, verifierRole('admin', 'super_admin'), actualiteController.togglePublier);
router.delete('/:id',       verifierToken, verifierRole('admin', 'super_admin'), actualiteController.supprimer);

module.exports = router;
