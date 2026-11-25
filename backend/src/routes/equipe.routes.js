// Routes équipe — /api/equipe
const express = require('express');
const router  = express.Router();

const { verifierToken } = require('../middlewares/auth.middleware');
const { verifierRole }  = require('../middlewares/role.middleware');
const { uploadPhoto }   = require('../middlewares/upload.middleware');
const equipeController  = require('../controllers/equipeController');

// Middleware pour diriger l'upload vers uploads/equipe/
const avecDossier = (req, res, next) => { req.uploadDossier = 'equipe'; next(); };

// Public : liste des membres actifs (prénom, nom, fonction — sans photo)
router.get('/',      equipeController.listerMembres);

// Connecté (parents + équipe) : liste des membres actifs avec leurs photos
router.get('/avec-photos', verifierToken, equipeController.listerMembresAvecPhotos);

// Admin : liste complète (actifs + inactifs)
router.get('/tous',  verifierToken, verifierRole('super_admin'), equipeController.listerTous);

// Admin : CRUD
router.post('/',     verifierToken, verifierRole('super_admin'), avecDossier, uploadPhoto.single('photo'), equipeController.ajouterMembre);
router.put('/:id',   verifierToken, verifierRole('super_admin'), avecDossier, uploadPhoto.single('photo'), equipeController.modifierMembre);
router.delete('/:id',verifierToken, verifierRole('super_admin'), equipeController.supprimerMembre);

module.exports = router;
