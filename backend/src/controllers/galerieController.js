// Contrôleur galerie photos — Les Coccinelles (Phase 5)
// Fonctionnalités : compression Sharp 3 niveaux, tagging enfants,
// vérification consentement RGPD, notifications parents, téléchargement
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const { Op } = require('sequelize');

const {
  GalerieAlbum, GaleriePhoto, Consentement,
  Enfant, User, sequelize
} = require('../models');
const { creerNotification } = require('../services/notification.service');
const { succes, erreur, cree } = require('../utils/response');

// ── ALBUMS ──────────────────────────────────────────────────────────

const listerAlbums = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { visible_parents: true }
      : {};
    const albums = await GalerieAlbum.findAll({
      where: filtre,
      order: [['created_at', 'DESC']]
    });
    return succes(res, albums);
  } catch (err) {
    console.error('Erreur listerAlbums :', err);
    return erreur(res, 'Erreur récupération albums');
  }
};

const creerAlbum = async (req, res) => {
  try {
    const album = await GalerieAlbum.create({ ...req.body, cree_par: req.user.id });
    return cree(res, album, 'Album créé');
  } catch (err) { return erreur(res, 'Erreur lors de la création'); }
};

// Récupère un album avec ses photos + vérification consentement RGPD pour les parents
const getAlbum = async (req, res) => {
  try {
    const album = await GalerieAlbum.findByPk(req.params.id, {
      include: [{
        model: GaleriePhoto,
        as:    'photos',
        include: [{
          model:   Enfant,
          as:      'enfants',
          through: { attributes: [] }, // Ne pas inclure les colonnes pivot
          include: [{ model: Consentement, as: 'consentement', attributes: ['consenti'] }]
        }]
      }]
    });

    if (!album) return erreur(res, 'Album non trouvé', 404);

    // Pour les parents : masquer les photos sans consentement ou flouter
    if (req.user.role === 'parent') {
      // Récupérer les enfants du parent connecté avec leur consentement
      const enfantsParent = await Enfant.findAll({
        where:   { user_id: req.user.id },
        include: [{ model: Consentement, as: 'consentement' }]
      });

      const idsEnfantsConsentis = new Set(
        enfantsParent
          .filter(e => e.consentement?.consenti)
          .map(e => e.id)
      );

      // Marquer chaque photo : floue = au moins 1 enfant sans consentement
      const photosTraitees = album.photos.map(photo => {
        const enfantsSurPhoto = photo.enfants || [];
        const necessiteConsentement = enfantsSurPhoto.length > 0;
        const tousConsentis = enfantsSurPhoto.every(e =>
          idsEnfantsConsentis.has(e.id) || e.consentement?.consenti
        );

        const floue = necessiteConsentement && !tousConsentis;

        return {
          ...photo.toJSON(),
          floue,
          // Remplacer les chemins si floue
          chemin_web:       floue ? '/images/photo-floue.jpg'  : photo.chemin_web,
          chemin_miniature: floue ? '/images/photo-floue-thumb.jpg' : photo.chemin_miniature,
          // Ne jamais exposer l'original aux parents
          chemin_original: undefined
        };
      });

      return succes(res, { ...album.toJSON(), photos: photosTraitees });
    }

    return succes(res, album);
  } catch (err) {
    console.error('Erreur getAlbum :', err);
    return erreur(res, 'Erreur lors de la récupération');
  }
};

const modifierAlbum = async (req, res) => {
  try {
    const album = await GalerieAlbum.findByPk(req.params.id);
    if (!album) return erreur(res, 'Album non trouvé', 404);
    await album.update(req.body);
    return succes(res, album, 'Album mis à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

const supprimerAlbum = async (req, res) => {
  try {
    const album = await GalerieAlbum.findByPk(req.params.id, {
      include: [{ model: GaleriePhoto, as: 'photos' }]
    });
    if (!album) return erreur(res, 'Album non trouvé', 404);

    // Supprimer les fichiers physiques de toutes les photos
    for (const photo of album.photos) {
      supprimerFichiersPhoto(photo);
    }

    await album.destroy(); // Cascade sur galerie_photos et photo_enfants
    return succes(res, null, 'Album supprimé');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

// ── UPLOAD PHOTOS avec Sharp (3 tailles) ──────────────────────────

const ajouterPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return erreur(res, 'Aucune photo reçue', 400);

    const album = await GalerieAlbum.findByPk(req.params.id);
    if (!album) return erreur(res, 'Album non trouvé', 404);

    const photosCreees   = [];
    const enfantsTaggues = req.body.enfant_ids
      ? JSON.parse(req.body.enfant_ids)
      : [];

    for (const fichier of req.files) {
      const nomBase = crypto.randomBytes(16).toString('hex');

      const cheminOriginal  = `uploads/photos/${nomBase}_original.jpg`;
      const cheminWeb       = `uploads/photos/${nomBase}_web.jpg`;
      const cheminMiniature = `uploads/photos/${nomBase}_thumb.jpg`;

      try {
        // Version web : redimensionner à max 1200px, qualité 85%
        await sharp(fichier.path)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toFile(cheminWeb);

        // Miniature : 300×300 centrée (pour la grille), qualité 80%
        await sharp(fichier.path)
          .resize(300, 300, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 80 })
          .toFile(cheminMiniature);

        // Conserver l'original (renommer vers chemin permanent)
        fs.renameSync(fichier.path, cheminOriginal);
      } catch (sharpErr) {
        console.error('Erreur Sharp :', sharpErr.message);
        // Fallback : utiliser le fichier brut
        fs.copyFileSync(fichier.path, cheminWeb);
        fs.copyFileSync(fichier.path, cheminMiniature);
        if (fs.existsSync(fichier.path)) fs.renameSync(fichier.path, cheminOriginal);
      }

      const photo = await GaleriePhoto.create({
        album_id:         req.params.id,
        chemin_original:  `/${cheminOriginal}`,
        chemin_web:       `/${cheminWeb}`,
        chemin_miniature: `/${cheminMiniature}`,
        legende:          req.body.legende || null,
        cree_par:         req.user.id
      });

      // Taguer les enfants sur la photo (table pivot photo_enfants)
      if (enfantsTaggues.length > 0) {
        const enfants = await Enfant.findAll({
          where: { id: { [Op.in]: enfantsTaggues } }
        });
        await photo.setEnfants(enfants);
      }

      photosCreees.push(photo);
    }

    // Notifier les parents des enfants inscrits que de nouvelles photos sont disponibles
    await notifierParentsNouvellesPhotos(album, photosCreees.length);

    return cree(res, photosCreees, `${photosCreees.length} photo(s) ajoutée(s)`);
  } catch (err) {
    console.error('Erreur upload photos :', err);
    return erreur(res, 'Erreur lors de l\'upload des photos');
  }
};

// ── TAGGING ENFANTS sur une photo existante ─────────────────────────

const taguerEnfants = async (req, res) => {
  try {
    const photo = await GaleriePhoto.findByPk(req.params.id);
    if (!photo) return erreur(res, 'Photo non trouvée', 404);

    const { enfant_ids } = req.body;
    if (!Array.isArray(enfant_ids)) return erreur(res, 'enfant_ids doit être un tableau', 400);

    const enfants = await Enfant.findAll({
      where: { id: { [Op.in]: enfant_ids } }
    });

    await photo.setEnfants(enfants); // Remplace toutes les associations
    return succes(res, null, `${enfants.length} enfant(s) tagué(s) sur la photo`);
  } catch (err) { return erreur(res, 'Erreur lors du tagging'); }
};

// ── SUPPRESSION PHOTO ───────────────────────────────────────────────

const supprimerPhoto = async (req, res) => {
  try {
    const photo = await GaleriePhoto.findByPk(req.params.id);
    if (!photo) return erreur(res, 'Photo non trouvée', 404);

    supprimerFichiersPhoto(photo);
    await photo.destroy();
    return succes(res, null, 'Photo supprimée');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

// ── TÉLÉCHARGEMENT PHOTO par un parent ─────────────────────────────

const telechargerPhoto = async (req, res) => {
  try {
    const photo = await GaleriePhoto.findByPk(req.params.id, {
      include: [{
        model: Enfant, as: 'enfants',
        through: { attributes: [] },
        include: [{ model: Consentement, as: 'consentement' }]
      }]
    });

    if (!photo) return erreur(res, 'Photo non trouvée', 404);

    // Vérifier le consentement pour chaque enfant tagué
    for (const enfant of (photo.enfants || [])) {
      // Si parent connecté, vérifier que c'est son enfant et qu'il a consenti
      if (req.user.role === 'parent' && enfant.user_id !== req.user.id) {
        return erreur(res, 'Accès non autorisé à cette photo', 403);
      }
      if (!enfant.consentement?.consenti) {
        return erreur(res, 'Téléchargement non autorisé : consentement RGPD requis', 403);
      }
    }

    // Servir la version web (pas l'original haute résolution)
    const cheminFichier = path.join(__dirname, '../../', photo.chemin_web);
    if (!fs.existsSync(cheminFichier)) return erreur(res, 'Fichier introuvable', 404);

    res.download(cheminFichier, `photo_coccinelles_${photo.id}.jpg`);
  } catch (err) { return erreur(res, 'Erreur lors du téléchargement'); }
};

// ── CONSENTEMENT RGPD ───────────────────────────────────────────────

const getConsentement = async (req, res) => {
  try {
    const enfants = await Enfant.findAll({
      where:   { user_id: req.user.id, actif: true },
      include: [{ model: Consentement, as: 'consentement' }]
    });
    return succes(res, enfants);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const donnerConsentement = async (req, res) => {
  try {
    const { enfant_id, consenti } = req.body;

    const enfant = await Enfant.findOne({ where: { id: enfant_id, user_id: req.user.id } });
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    const [consentement] = await Consentement.upsert({
      enfant_id,
      user_id:           req.user.id,
      consenti:          !!consenti,
      date_consentement: new Date(),
      ip_adresse:        req.ip
    });

    return succes(res, consentement, `Consentement ${consenti ? 'accordé' : 'retiré'}`);
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour du consentement'); }
};

// ── FONCTIONS UTILITAIRES ────────────────────────────────────────────

// Supprimer les fichiers physiques d'une photo (3 versions)
const supprimerFichiersPhoto = (photo) => {
  [photo.chemin_original, photo.chemin_web, photo.chemin_miniature].forEach(chemin => {
    if (!chemin) return;
    const cheminFichier = path.join(__dirname, '../../', chemin);
    if (fs.existsSync(cheminFichier)) {
      try { fs.unlinkSync(cheminFichier); } catch {}
    }
  });
};

// Notifier tous les parents inscrits qu'il y a de nouvelles photos
const notifierParentsNouvellesPhotos = async (album, nbPhotos) => {
  try {
    // Récupérer tous les parents (enfants actifs)
    const parents = await User.findAll({
      where: { role: 'parent', actif: true }
    });

    const messageNotif = `${nbPhotos} nouvelle(s) photo(s) ajoutée(s) dans l'album "${album.titre}"`;

    // Créer une notification pour chaque parent
    await Promise.all(parents.map(parent =>
      creerNotification(
        parent.id,
        '📷 Nouvelles photos disponibles',
        messageNotif,
        'document',
        '/parent/galerie'
      )
    ));
  } catch (err) {
    console.warn('Erreur notification photos :', err.message);
  }
};

module.exports = {
  listerAlbums,
  creerAlbum,
  getAlbum,
  modifierAlbum,
  supprimerAlbum,
  ajouterPhotos,
  taguerEnfants,
  supprimerPhoto,
  telechargerPhoto,
  getConsentement,
  donnerConsentement
};
