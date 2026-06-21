// Routes notifications — /api/notifications
const express = require('express');
const router  = express.Router();

const { verifierToken }       = require('../middlewares/auth.middleware');
const notificationController  = require('../controllers/notificationController');

router.get('/',                  verifierToken, notificationController.lister);        // Mes notifications
router.patch('/:id/lue',         verifierToken, notificationController.marquerLue);    // Marquer lue
router.patch('/tout-lire',       verifierToken, notificationController.toutMarquerLu); // Tout marquer lu
router.delete('/:id',            verifierToken, notificationController.supprimer);     // Supprimer

module.exports = router;
