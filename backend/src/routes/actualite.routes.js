// Routes actualités — /api/actualites
const express = require('express');
const router  = express.Router();

const { verifierToken, verifierTokenOptional } = require('../middlewares/auth.middleware');
const { verifierRole }    = require('../middlewares/role.middleware');
const { uploadDocument }  = require('../middlewares/upload.middleware');
const actualiteController = require('../controllers/actualiteController');

// Routes publiques — token optionnel pour que l'admin voit aussi les brouillons
router.get('/',    verifierTokenOptional, actualiteController.lister);       // Liste paginée
router.get('/:id', verifierTokenOptional, actualiteController.getActualite); // Détail

// Routes admin
router.post('/',            verifierToken, verifierRole('admin', 'super_admin'), uploadDocument.single('image'), actualiteController.creer);
router.put('/:id',          verifierToken, verifierRole('admin', 'super_admin'), actualiteController.modifier);
router.patch('/:id/publier',verifierToken, verifierRole('admin', 'super_admin'), actualiteController.togglePublier);
router.delete('/:id',       verifierToken, verifierRole('admin', 'super_admin'), actualiteController.supprimer);

module.exports = router;
