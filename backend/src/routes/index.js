// Fichier principal des routes — regroupe toutes les routes de l'API
const express = require('express');
const router  = express.Router();

// Importer toutes les routes
const authRoutes         = require('./auth.routes');
const userRoutes         = require('./user.routes');
const enfantRoutes       = require('./enfant.routes');
const inscriptionRoutes  = require('./inscription.routes');
const absenceRoutes      = require('./absence.routes');
const suiviRoutes        = require('./suivi.routes');
const emargementRoutes   = require('./emargement.routes');
const documentRoutes     = require('./document.routes');
const messageRoutes      = require('./message.routes');
const actualiteRoutes    = require('./actualite.routes');
const menuRoutes         = require('./menu.routes');
const notificationRoutes = require('./notification.routes');
const galerieRoutes      = require('./galerie.routes');
const cmsRoutes          = require('./cms.routes');
const contactRoutes      = require('./contact.routes');
const equipeRoutes       = require('./equipe.routes');

// Enregistrer toutes les routes avec leur préfixe
router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/enfants',       enfantRoutes);
router.use('/inscriptions',  inscriptionRoutes);
router.use('/absences',      absenceRoutes);
router.use('/suivi',         suiviRoutes);
router.use('/emargements',   emargementRoutes);
router.use('/documents',     documentRoutes);
router.use('/messages',      messageRoutes);
router.use('/actualites',    actualiteRoutes);
router.use('/menus',         menuRoutes);
router.use('/notifications', notificationRoutes);
router.use('/galerie',       galerieRoutes);
router.use('/cms',           cmsRoutes);
router.use('/contact',       contactRoutes);
router.use('/equipe',        equipeRoutes);

module.exports = router;
