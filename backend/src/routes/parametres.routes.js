// Routes des paramètres du site — /api/parametres
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const { uploadDocument, verifierContenuFichiers } = require('../middlewares/upload.middleware');
const parametresController = require('../controllers/parametresController');

// Le guide reçu est rangé dans le stockage privé (dossier stockage/guide)
const preparerUploadGuide = (req, res, next) => {
  req.uploadPrive   = true;
  req.uploadDossier = 'guide';
  next();
};

// Interrupteurs facultatifs, mais toujours des booléens s'ils sont envoyés
const reglesModification = [
  body('espace_parents_ouvert').optional().isBoolean({ strict: true }).withMessage('Valeur invalide'),
  body('creation_comptes_ouverte').optional().isBoolean({ strict: true }).withMessage('Valeur invalide')
];

router.get('/public', parametresController.getPublic);                                          // Public
router.get('/guide-inscription', parametresController.telechargerGuide);                        // Public
router.post('/guide-inscription', verifierToken, verifierRole('super_admin'), preparerUploadGuide,
  uploadDocument.single('fichier'), verifierContenuFichiers, parametresController.remplacerGuide); // Super admin
router.get('/',       verifierToken, verifierRole('super_admin'), parametresController.getTout); // Super admin
router.put('/',       verifierToken, verifierRole('super_admin'), reglesModification, validerDonnees,
  parametresController.modifier);                                                               // Super admin

module.exports = router;
