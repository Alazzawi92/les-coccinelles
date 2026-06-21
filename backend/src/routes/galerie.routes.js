// Routes galerie — /api/galerie
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadPhoto }    = require('../middlewares/upload.middleware');
const galerieController  = require('../controllers/galerieController');

// Albums
router.get('/albums',                  verifierToken, galerieController.listerAlbums);
router.post('/albums',                 verifierToken, verifierRole('admin', 'super_admin'), galerieController.creerAlbum);
router.get('/albums/:id',              verifierToken, galerieController.getAlbum);
router.put('/albums/:id',              verifierToken, verifierRole('admin', 'super_admin'), galerieController.modifierAlbum);
router.delete('/albums/:id',           verifierToken, verifierRole('admin', 'super_admin'), galerieController.supprimerAlbum);

// Photos dans un album (upload multiple avec compression Sharp)
router.post('/albums/:id/photos',      verifierToken, verifierRole('admin', 'super_admin'), uploadPhoto.array('photos', 20), galerieController.ajouterPhotos);
router.delete('/photos/:id',           verifierToken, verifierRole('admin', 'super_admin'), galerieController.supprimerPhoto);

// Tagging des enfants sur une photo (admin)
router.put('/photos/:id/enfants',      verifierToken, verifierRole('admin', 'super_admin'), galerieController.taguerEnfants);

// Téléchargement d'une photo par un parent (avec vérif consentement)
router.get('/photos/:id/download',     verifierToken, galerieController.telechargerPhoto);

// Consentement RGPD
router.get('/consentement',            verifierToken, galerieController.getConsentement);
router.post('/consentement',           verifierToken, galerieController.donnerConsentement);

module.exports = router;
