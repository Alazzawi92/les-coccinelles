// Routes messagerie — /api/messages
const express = require('express');
const router  = express.Router();

const { verifierToken }     = require('../middlewares/auth.middleware');
const messageController     = require('../controllers/messageController');
const { uploadPieceJointe } = require('../middlewares/upload.middleware');

router.get('/',           verifierToken, messageController.lister);
router.post('/',          verifierToken, uploadPieceJointe.single('fichier'), messageController.envoyer);
router.get('/:id',        verifierToken, messageController.getConversation); // Lire une conversation
router.patch('/:id/lu',   verifierToken, messageController.marquerLu);    // Marquer comme lu
router.delete('/:id',     verifierToken, messageController.supprimer);    // Supprimer

module.exports = router;
