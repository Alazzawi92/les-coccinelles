// Routes partenaires — /api/partenaires
// Partenaires de la page Présentation (gérés par le super admin)
const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { validerDonnees } = require('../middlewares/validate.middleware');
const { uploadLogo, verifierContenuFichiers } = require('../middlewares/upload.middleware');
const partenaireController = require('../controllers/partenaireController');

// Logo rangé dans uploads/partenaires (dossier public : affiché sur le site)
const dossierPartenaires = (req, res, next) => { req.uploadDossier = 'partenaires'; next(); };
const superAdmin = [verifierToken, verifierRole('super_admin')];

// Lien saisi sans « https:// » (ex : www.caf.fr) : complété automatiquement
const completerLien = (lien) => (lien && !/^https?:\/\//i.test(lien) ? `https://${lien}` : lien);

const regles = (creation) => [
  creation
    ? body('nom').trim().notEmpty().withMessage('Le nom est obligatoire')
    : body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('nom').optional().isLength({ max: 150 }).withMessage('Nom trop long (150 caractères max)'),
  body('categorie').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Catégorie trop longue (100 caractères max)'),
  // Lien facultatif : uniquement http(s), jamais javascript: ou autre
  body('lien').optional({ values: 'falsy' }).trim().customSanitizer(completerLien)
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Lien invalide (ex : https://www.caf.fr)')
    .isLength({ max: 500 }).withMessage('Lien trop long'),
  body('ordre').optional({ values: 'falsy' }).isInt({ min: 0, max: 999 }).withMessage("Ordre d'affichage invalide"),
  body('supprimer_logo').optional().isIn(['true', 'false']).withMessage('Valeur invalide')
];
const regleId = param('id').isInt({ min: 1 }).withMessage('Identifiant invalide');

router.get('/', partenaireController.lister); // Public

router.post('/',      ...superAdmin, dossierPartenaires, uploadLogo.single('logo'), verifierContenuFichiers,
  regles(true), validerDonnees, partenaireController.creer);
router.put('/:id',    ...superAdmin, dossierPartenaires, uploadLogo.single('logo'), verifierContenuFichiers,
  regleId, regles(false), validerDonnees, partenaireController.modifier);
router.delete('/:id', ...superAdmin, regleId, validerDonnees, partenaireController.supprimer);

module.exports = router;
