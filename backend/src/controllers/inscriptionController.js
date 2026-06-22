// Contrôleur inscriptions — Les Coccinelles
const { Inscription, Enfant, User, InscriptionDocument } = require('../models');
const { notifierStatutInscription } = require('../services/notification.service');
const { succes, erreur, cree } = require('../utils/response');

// GET /api/inscriptions
const lister = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent' ? { user_id: req.user.id } : {};
    const inscriptions = await Inscription.findAll({
      where: filtre,
      include: [
        { model: Enfant, as: 'enfant', attributes: ['id', 'prenom', 'nom'] },
        { model: User,   as: 'parent', attributes: ['id', 'prenom', 'nom', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return succes(res, inscriptions);
  } catch (err) {
    return erreur(res, 'Erreur récupération inscriptions');
  }
};

// GET /api/inscriptions/stats (admin)
const stats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const statuts = ['en_attente', 'en_cours', 'incomplet', 'accepte', 'refuse', 'liste_attente'];
    const resultat = {};

    for (const statut of statuts) {
      resultat[statut] = await Inscription.count({ where: { statut } });
    }
    resultat.total = await Inscription.count();
    return succes(res, resultat);
  } catch (err) {
    return erreur(res, 'Erreur statistiques');
  }
};

// POST /api/inscriptions
const creer = async (req, res) => {
  try {
    // Vérifier que l'enfant appartient bien au parent connecté
    const enfant = await Enfant.findOne({ where: { id: req.body.enfant_id, user_id: req.user.id } });
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    const inscription = await Inscription.create({ ...req.body, user_id: req.user.id });
    return cree(res, inscription, 'Demande d\'inscription envoyée');
  } catch (err) {
    return erreur(res, 'Erreur lors de la création de la demande');
  }
};

// GET /api/inscriptions/:id
const getInscription = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };

    const inscription = await Inscription.findOne({
      where: filtre,
      include: [
        { model: Enfant, as: 'enfant' },
        { model: User,   as: 'parent', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }
      ]
    });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);
    return succes(res, inscription);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération');
  }
};

// PUT /api/inscriptions/:id (parent, si en_attente)
const modifier = async (req, res) => {
  try {
    const inscription = await Inscription.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);
    if (inscription.statut !== 'en_attente') return erreur(res, 'Impossible de modifier une inscription déjà traitée', 400);

    await inscription.update(req.body);
    return succes(res, inscription, 'Inscription mise à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors de la mise à jour');
  }
};

// PATCH /api/inscriptions/:id/statut (admin)
const changerStatut = async (req, res) => {
  try {
    const { statut, commentaire_admin } = req.body;
    const inscription = await Inscription.findByPk(req.params.id);
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    await inscription.update({
      statut,
      commentaire_admin: commentaire_admin || inscription.commentaire_admin,
      traite_par:        req.user.id,
      date_traitement:   new Date()
    });

    // Notifier le parent du changement de statut
    const enfant = await Enfant.findByPk(inscription.enfant_id);
    await notifierStatutInscription(inscription.user_id, statut, enfant.prenom);

    return succes(res, inscription, 'Statut mis à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors du changement de statut');
  }
};

// POST /api/inscriptions/:id/documents — Upload des pièces justificatives (parent ou admin)
const ajouterDocuments = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const inscription = await Inscription.findOne({ where: filtre });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    const fichiers = req.files || [];
    if (fichiers.length === 0) return erreur(res, 'Aucun fichier reçu', 400);

    // labels[] en body correspond à chaque fichier dans le même ordre
    const labels = req.body.labels
      ? (Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels])
      : [];

    const docs = await Promise.all(
      fichiers.map((f, i) => InscriptionDocument.create({
        inscription_id: inscription.id,
        label:          labels[i] || f.originalname,
        fichier_path:   `/uploads/justificatifs/${f.filename}`,
        fichier_nom:    f.originalname
      }))
    );

    return cree(res, docs, 'Documents ajoutés');
  } catch (err) {
    return erreur(res, 'Erreur lors de l\'ajout des documents');
  }
};

// GET /api/inscriptions/:id/documents — Liste des documents du dossier
const listerDocuments = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const inscription = await Inscription.findOne({ where: filtre });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    const docs = await InscriptionDocument.findAll({
      where: { inscription_id: inscription.id },
      order: [['created_at', 'ASC']]
    });
    return succes(res, docs);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des documents');
  }
};

module.exports = { lister, stats, creer, getInscription, modifier, changerStatut, ajouterDocuments, listerDocuments };
