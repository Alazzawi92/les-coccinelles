// Contrôleur fermetures — Les Coccinelles
// Calendrier des fermetures de la crèche, affiché sur la page Présentation.
// Gestion réservée au super admin (back office → Fermetures).
const { Op } = require('sequelize');
const { Fermeture } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// Date du jour en France au format AAAA-MM-JJ (le serveur peut être en UTC)
const aujourdhui = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

// GET /api/fermetures — Fermetures en cours et à venir (public)
const listerAVenir = async (req, res) => {
  try {
    const fermetures = await Fermeture.findAll({
      where:      { date_fin: { [Op.gte]: aujourdhui() } }, // Fermetures passées masquées
      attributes: ['id', 'date_debut', 'date_fin', 'motif'],
      order:      [['date_debut', 'ASC']]
    });
    return succes(res, fermetures);
  } catch (err) {
    console.error('Erreur fermetures listerAVenir :', err);
    return erreur(res, 'Erreur récupération des fermetures');
  }
};

// GET /api/fermetures/tous — Toutes les fermetures, passées comprises (super admin)
const listerTous = async (req, res) => {
  try {
    const fermetures = await Fermeture.findAll({ order: [['date_debut', 'DESC']] });
    return succes(res, fermetures);
  } catch (err) {
    console.error('Erreur fermetures listerTous :', err);
    return erreur(res, 'Erreur récupération des fermetures');
  }
};

// POST /api/fermetures — Ajout (super admin). date_fin vide → fermeture d'un jour
const creer = async (req, res) => {
  try {
    const { date_debut, date_fin, motif } = req.body;
    const fermeture = await Fermeture.create({ date_debut, date_fin: date_fin || date_debut, motif });
    return cree(res, fermeture, 'Fermeture ajoutée');
  } catch (err) {
    console.error('Erreur fermetures creer :', err);
    return erreur(res, "Erreur lors de l'ajout de la fermeture");
  }
};

// PUT /api/fermetures/:id — Modification (super admin)
const modifier = async (req, res) => {
  try {
    const fermeture = await Fermeture.findByPk(req.params.id);
    if (!fermeture) return erreur(res, 'Fermeture non trouvée', 404);
    const { date_debut, date_fin, motif } = req.body;
    await fermeture.update({ date_debut, date_fin: date_fin || date_debut, motif });
    return succes(res, fermeture, 'Fermeture mise à jour');
  } catch (err) {
    console.error('Erreur fermetures modifier :', err);
    return erreur(res, 'Erreur lors de la modification');
  }
};

// DELETE /api/fermetures/:id — Suppression (super admin)
const supprimer = async (req, res) => {
  try {
    const fermeture = await Fermeture.findByPk(req.params.id);
    if (!fermeture) return erreur(res, 'Fermeture non trouvée', 404);
    await fermeture.destroy();
    return succes(res, null, 'Fermeture supprimée');
  } catch (err) {
    console.error('Erreur fermetures supprimer :', err);
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { listerAVenir, listerTous, creer, modifier, supprimer };
