// Contrôleur documents — Les Coccinelles
const path = require('path');
const fs   = require('fs');
const { Document } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

const lister = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { user_id: req.user.id, visible_parent: true }
      : {};
    const documents = await Document.findAll({ where: filtre, order: [['created_at', 'DESC']] });
    return succes(res, documents);
  } catch (err) { return erreur(res, 'Erreur récupération documents'); }
};

const uploader = async (req, res) => {
  try {
    if (!req.file) return erreur(res, 'Aucun fichier reçu', 400);

    const document = await Document.create({
      user_id:        req.user.id,
      enfant_id:      req.body.enfant_id || null,
      inscription_id: req.body.inscription_id || null,
      nom_fichier:    req.file.originalname,
      chemin_fichier: `/uploads/documents/${req.file.filename}`,
      type_mime:      req.file.mimetype,
      taille:         req.file.size,
      categorie:      req.body.categorie || 'autre',
      description:    req.body.description || null
    });
    return cree(res, document, 'Document uploadé');
  } catch (err) { return erreur(res, 'Erreur lors de l\'upload'); }
};

const telecharger = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const document = await Document.findOne({ where: filtre });
    if (!document) return erreur(res, 'Document non trouvé', 404);

    const cheminFichier = path.join(__dirname, '../../', document.chemin_fichier);
    if (!fs.existsSync(cheminFichier)) return erreur(res, 'Fichier introuvable sur le serveur', 404);

    res.download(cheminFichier, document.nom_fichier); // Déclencher le téléchargement
  } catch (err) { return erreur(res, 'Erreur lors du téléchargement'); }
};

const supprimer = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent' ? { id: req.params.id, user_id: req.user.id } : { id: req.params.id };
    const document = await Document.findOne({ where: filtre });
    if (!document) return erreur(res, 'Document non trouvé', 404);

    // Supprimer le fichier physique
    const cheminFichier = path.join(__dirname, '../../', document.chemin_fichier);
    if (fs.existsSync(cheminFichier)) fs.unlinkSync(cheminFichier);

    await document.destroy();
    return succes(res, null, 'Document supprimé');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, uploader, telecharger, supprimer };
