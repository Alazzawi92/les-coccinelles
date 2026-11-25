// Contrôleur partenaires — Les Coccinelles
// Partenaires de la crèche (nom, catégorie, logo, lien), affichés sur la page Présentation.
// Gestion réservée au super admin (back office → Partenaires).
const { Partenaire } = require('../models');
const { succes, erreur, cree } = require('../utils/response');
const { supprimerFichierPublic } = require('../utils/fichiersPublics');

const DOSSIER = 'partenaires'; // uploads/partenaires (dossier public)

// GET /api/partenaires — Liste des partenaires (public)
const lister = async (req, res) => {
  try {
    const partenaires = await Partenaire.findAll({
      attributes: ['id', 'nom', 'categorie', 'logo', 'lien', 'ordre'],
      order:      [['ordre', 'ASC'], ['nom', 'ASC']]
    });
    return succes(res, partenaires);
  } catch (err) {
    console.error('Erreur partenaires lister :', err);
    return erreur(res, 'Erreur récupération des partenaires');
  }
};

// POST /api/partenaires — Ajout (super admin, logo facultatif)
const creer = async (req, res) => {
  try {
    const { nom, categorie, lien, ordre } = req.body;
    const partenaire = await Partenaire.create({
      nom,
      categorie: categorie || null,
      lien:  lien || null,
      logo:  req.file ? `/uploads/${DOSSIER}/${req.file.filename}` : null,
      ordre: ordre !== undefined && ordre !== '' ? Number(ordre) : 0
    });
    return cree(res, partenaire, 'Partenaire ajouté');
  } catch (err) {
    if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename); // Rien ne reste sur le disque
    console.error('Erreur partenaires creer :', err);
    return erreur(res, "Erreur lors de l'ajout du partenaire");
  }
};

// PUT /api/partenaires/:id — Modification (super admin)
// Nouveau logo facultatif ; supprimer_logo = 'true' retire le logo actuel
const modifier = async (req, res) => {
  try {
    const partenaire = await Partenaire.findByPk(req.params.id);
    if (!partenaire) {
      if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename);
      return erreur(res, 'Partenaire non trouvé', 404);
    }
    const { nom, categorie, lien, ordre, supprimer_logo } = req.body;
    const donnees = {};
    if (nom !== undefined)  donnees.nom = nom;
    if (categorie !== undefined) donnees.categorie = categorie || null;
    if (lien !== undefined) donnees.lien = lien || null;
    if (ordre !== undefined && ordre !== '') donnees.ordre = Number(ordre);

    const ancienLogo = partenaire.logo;
    if (req.file)                        donnees.logo = `/uploads/${DOSSIER}/${req.file.filename}`;
    else if (supprimer_logo === 'true')  donnees.logo = null;

    await partenaire.update(donnees);
    // L'ancien logo n'est supprimé du disque qu'une fois la base à jour
    if (ancienLogo && donnees.logo !== undefined) supprimerFichierPublic(DOSSIER, ancienLogo);
    return succes(res, partenaire, 'Partenaire mis à jour');
  } catch (err) {
    if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename);
    console.error('Erreur partenaires modifier :', err);
    return erreur(res, 'Erreur lors de la modification');
  }
};

// DELETE /api/partenaires/:id — Suppression (super admin), logo compris
const supprimer = async (req, res) => {
  try {
    const partenaire = await Partenaire.findByPk(req.params.id);
    if (!partenaire) return erreur(res, 'Partenaire non trouvé', 404);
    await partenaire.destroy();
    supprimerFichierPublic(DOSSIER, partenaire.logo);
    return succes(res, null, 'Partenaire supprimé');
  } catch (err) {
    console.error('Erreur partenaires supprimer :', err);
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { lister, creer, modifier, supprimer };
