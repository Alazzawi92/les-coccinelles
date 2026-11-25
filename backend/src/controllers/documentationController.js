// Contrôleur documentation — Les Coccinelles
// Documents PDF téléchargeables par tous sur la page Présentation
// (règlement de fonctionnement, projet d'établissement...).
// Gestion réservée au super admin (back office → Documentation).
const { DocumentPublic } = require('../models');
const { succes, erreur, cree } = require('../utils/response');
const { supprimerFichierPublic } = require('../utils/fichiersPublics');

const DOSSIER = 'documentation'; // uploads/documentation (dossier public)
const ORDRE   = [['ordre', 'ASC'], ['id', 'ASC']];

// GET /api/documentation — Liste des documents (public)
const lister = async (req, res) => {
  try {
    const documents = await DocumentPublic.findAll({
      attributes: ['id', 'titre', 'description', 'fichier', 'taille', 'ordre'],
      order:      ORDRE
    });
    return succes(res, documents);
  } catch (err) {
    console.error('Erreur documentation lister :', err);
    return erreur(res, 'Erreur récupération de la documentation');
  }
};

// POST /api/documentation — Ajout d'un document (super admin, PDF obligatoire)
const creer = async (req, res) => {
  try {
    if (!req.file) return erreur(res, 'Le fichier PDF est obligatoire', 400);
    const { titre, description, ordre } = req.body;
    const document = await DocumentPublic.create({
      titre,
      description:  description || null,
      fichier:      `/uploads/${DOSSIER}/${req.file.filename}`,
      nom_original: req.file.originalname,
      taille:       req.file.size,
      ordre:        ordre !== undefined && ordre !== '' ? Number(ordre) : 0
    });
    return cree(res, document, 'Document ajouté');
  } catch (err) {
    if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename); // Rien ne reste sur le disque
    console.error('Erreur documentation creer :', err);
    return erreur(res, "Erreur lors de l'ajout du document");
  }
};

// PUT /api/documentation/:id — Modification (super admin, nouveau PDF facultatif)
const modifier = async (req, res) => {
  try {
    const document = await DocumentPublic.findByPk(req.params.id);
    if (!document) {
      if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename);
      return erreur(res, 'Document non trouvé', 404);
    }
    const { titre, description, ordre } = req.body;
    const donnees = {};
    if (titre !== undefined)       donnees.titre = titre;
    if (description !== undefined) donnees.description = description || null;
    if (ordre !== undefined && ordre !== '') donnees.ordre = Number(ordre);

    // Nouveau fichier : il remplace l'ancien, qui est supprimé du disque
    const ancienFichier = document.fichier;
    if (req.file) {
      donnees.fichier      = `/uploads/${DOSSIER}/${req.file.filename}`;
      donnees.nom_original = req.file.originalname;
      donnees.taille       = req.file.size;
    }
    await document.update(donnees);
    if (req.file) supprimerFichierPublic(DOSSIER, ancienFichier);
    return succes(res, document, 'Document mis à jour');
  } catch (err) {
    if (req.file) supprimerFichierPublic(DOSSIER, req.file.filename);
    console.error('Erreur documentation modifier :', err);
    return erreur(res, 'Erreur lors de la modification');
  }
};

// DELETE /api/documentation/:id — Suppression (super admin), fichier compris
const supprimer = async (req, res) => {
  try {
    const document = await DocumentPublic.findByPk(req.params.id);
    if (!document) return erreur(res, 'Document non trouvé', 404);
    await document.destroy();
    supprimerFichierPublic(DOSSIER, document.fichier);
    return succes(res, null, 'Document supprimé');
  } catch (err) {
    console.error('Erreur documentation supprimer :', err);
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { lister, creer, modifier, supprimer };
