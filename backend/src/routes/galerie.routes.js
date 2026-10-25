// Routes galerie — /api/galerie
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const { uploadPhoto }    = require('../middlewares/upload.middleware');
const galerieController  = require('../controllers/galerieController');
const { verifierInscriptionAcceptee } = require('../middlewares/inscription.middleware'); // Famille avec inscription acceptée

// Les parents n'accèdent à la galerie (et au consentement photo) qu'une fois
// l'inscription d'un de leurs enfants acceptée — les admins ne sont pas concernés

// Albums
router.get('/albums',                  verifierToken, verifierInscriptionAcceptee, galerieController.listerAlbums);
router.post('/albums',                 verifierToken, verifierRole('super_admin'), galerieController.creerAlbum);
router.get('/albums/:id',              verifierToken, verifierInscriptionAcceptee, galerieController.getAlbum);
router.put('/albums/:id',              verifierToken, verifierRole('super_admin'), galerieController.modifierAlbum);
router.delete('/albums/:id',           verifierToken, verifierRole('super_admin'), galerieController.supprimerAlbum);

// Photos dans un album (upload multiple avec compression Sharp)
router.post('/albums/:id/photos',      verifierToken, verifierRole('super_admin'), uploadPhoto.array('photos', 20), galerieController.ajouterPhotos);
router.delete('/photos/:id',           verifierToken, verifierRole('super_admin'), galerieController.supprimerPhoto);

// Tagging des enfants sur une photo (admin)
router.put('/photos/:id/enfants',      verifierToken, verifierRole('super_admin'), galerieController.taguerEnfants);

// Téléchargement d'une photo par un parent (avec vérif consentement)
router.get('/photos/:id/download',     verifierToken, verifierInscriptionAcceptee, galerieController.telechargerPhoto);

// Consentement RGPD
router.get('/consentement',            verifierToken, verifierInscriptionAcceptee, galerieController.getConsentement);
router.post('/consentement',           verifierToken, verifierInscriptionAcceptee, galerieController.donnerConsentement);

module.exports = router;
