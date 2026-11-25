// Routes documentation — /api/documentation
// Documents PDF publics de la page Présentation (gérés par le super admin)
const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const { uploadPdf, verifierContenuFichiers } = require('../middlewares/upload.middleware');
const documentationController = require('../controllers/documentationController');

// Fichier rangé dans uploads/documentation (dossier public : téléchargeable par tous)
const dossierDocumentation = (req, res, next) => { req.uploadDossier = 'documentation'; next(); };
const superAdmin = [verifierToken, verifierRole('super_admin')];

// Règles communes : titre (obligatoire à la création), description et ordre facultatifs
const regles = (creation) => [
  creation
    ? body('titre').trim().notEmpty().withMessage('Le titre est obligatoire')
    : body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
  body('titre').optional().isLength({ max: 150 }).withMessage('Titre trop long (150 caractères max)'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Description trop longue (255 caractères max)'),
  body('ordre').optional({ values: 'falsy' }).isInt({ min: 0, max: 999 }).withMessage("Ordre d'affichage invalide")
];
const regleId = param('id').isInt({ min: 1 }).withMessage('Identifiant invalide');

router.get('/', documentationController.lister); // Public

router.post('/',      ...superAdmin, dossierDocumentation, uploadPdf.single('fichier'), verifierContenuFichiers,
  regles(true), validerDonnees, documentationController.creer);
router.put('/:id',    ...superAdmin, dossierDocumentation, uploadPdf.single('fichier'), verifierContenuFichiers,
  regleId, regles(false), validerDonnees, documentationController.modifier);
router.delete('/:id', ...superAdmin, regleId, validerDonnees, documentationController.supprimer);

module.exports = router;
