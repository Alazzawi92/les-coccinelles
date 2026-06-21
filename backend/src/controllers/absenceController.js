// Contrôleur absences — Les Coccinelles
const { Absence, Enfant } = require('../models');
const { creerNotification } = require('../services/notification.service');
const { succes, erreur, cree } = require('../utils/response');

const lister = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent' ? { user_id: req.user.id } : {};
    const absences = await Absence.findAll({
      where: filtre,
      include: [{ model: Enfant, as: 'enfant', attributes: ['id', 'prenom', 'nom'] }],
      order: [['date_debut', 'DESC']]
    });
    return succes(res, absences);
  } catch (err) { return erreur(res, 'Erreur récupération absences'); }
};

const creer = async (req, res) => {
  try {
    const enfant = await Enfant.findOne({ where: { id: req.body.enfant_id, user_id: req.user.id } });
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    const donneesAbsence = { ...req.body, user_id: req.user.id };
    if (req.file) donneesAbsence.justificatif = `/uploads/justificatifs/${req.file.filename}`;

    const absence = await Absence.create(donneesAbsence);
    return cree(res, absence, 'Absence déclarée');
  } catch (err) { return erreur(res, 'Erreur lors de la déclaration'); }
};

const getAbsence = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const absence = await Absence.findOne({ where: filtre, include: [{ model: Enfant, as: 'enfant' }] });
    if (!absence) return erreur(res, 'Absence non trouvée', 404);
    return succes(res, absence);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const modifier = async (req, res) => {
  try {
    const absence = await Absence.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!absence) return erreur(res, 'Absence non trouvée', 404);
    if (absence.statut !== 'en_attente') return erreur(res, 'Impossible de modifier une absence déjà traitée', 400);
    await absence.update(req.body);
    return succes(res, absence, 'Absence mise à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

const valider = async (req, res) => {
  try {
    const { statut } = req.body; // 'validee' ou 'refusee'
    const absence = await Absence.findByPk(req.params.id);
    if (!absence) return erreur(res, 'Absence non trouvée', 404);

    await absence.update({ statut, valide_par: req.user.id, date_validation: new Date() });

    // Notifier le parent
    const msg = statut === 'validee' ? 'Votre absence a été validée.' : 'Votre absence a été refusée.';
    await creerNotification(absence.user_id, 'Absence ' + statut, msg, 'absence', '/parent/absences');

    return succes(res, null, `Absence ${statut}`);
  } catch (err) { return erreur(res, 'Erreur lors de la validation'); }
};

const supprimer = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent' ? { id: req.params.id, user_id: req.user.id } : { id: req.params.id };
    const absence = await Absence.findOne({ where: filtre });
    if (!absence) return erreur(res, 'Absence non trouvée', 404);
    await absence.destroy();
    return succes(res, null, 'Absence supprimée');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, creer, getAbsence, modifier, valider, supprimer };
