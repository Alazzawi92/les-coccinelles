// Contrôleur absences — Les Coccinelles
const { Op }               = require('sequelize');
const { Absence, Enfant }  = require('../models');
const { creerNotification } = require('../services/notification.service');
const { succes, erreur, cree } = require('../utils/response');

// Jours de la semaine en français, indexés comme Date.getDay() (0 = dimanche)
const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Un enfant est "prévu" un jour donné si ce jour fait partie de son
// contrat (jours_presence). Si jours_presence est vide/non renseigné,
// on considère qu'il vient tous les jours ouvrés (lundi à vendredi).
const estPrevuCeJour = (enfant, dateStr) => {
  const jour = JOURS_SEMAINE[new Date(dateStr + 'T12:00:00').getDay()];
  if (!enfant.jours_presence || enfant.jours_presence.length === 0) {
    return jour !== 'dimanche' && jour !== 'samedi';
  }
  return enfant.jours_presence.includes(jour);
};

const lister = async (req, res) => {
  try {
    const { User } = require('../models');
    const filtre = req.user.role === 'parent' ? { user_id: req.user.id } : {};
    const absences = await Absence.findAll({
      where: filtre,
      include: [
        { model: Enfant, as: 'enfant', attributes: ['id', 'prenom', 'nom'] },
        // Inclure le parent pour afficher son nom dans la liste admin
        { model: User, as: 'parent', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }
      ],
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

// GET /api/absences/presences/:date — Présences, absences et "pas prévu"
// pour un jour donné (admin). "Pas prévu" = enfant dont ce n'est pas un
// jour de garde habituel (contrat), à ne pas confondre avec une absence
// déclarée (maladie, vacances...).
const getPresences = async (req, res) => {
  try {
    const { User } = require('../models');
    const { date } = req.params; // Format YYYY-MM-DD

    // Tous les enfants actifs inscrits à la crèche
    const tousEnfants = await Enfant.findAll({
      where:      { actif: true },
      attributes: ['id', 'prenom', 'nom', 'sexe', 'groupe', 'jours_presence'],
      order:      [['prenom', 'ASC']]
    });

    // Absences couvrant cette date (date_debut ≤ date ≤ date_fin), sauf les refusées
    const absencesDuJour = await Absence.findAll({
      where: {
        date_debut: { [Op.lte]: date },
        date_fin:   { [Op.gte]: date },
        statut:     { [Op.ne]: 'refusee' }
      },
      include: [{ model: User, as: 'parent', attributes: ['prenom', 'nom'] }],
      attributes: ['id', 'enfant_id', 'motif', 'date_debut', 'date_fin', 'statut']
    });

    // Construire un index enfant_id → absence pour lookup O(1)
    const absenceParEnfant = {};
    absencesDuJour.forEach(a => { absenceParEnfant[a.enfant_id] = a; });

    // Séparer présents, absents et non-prévus (pas leur jour de garde)
    const presents  = [];
    const absents   = [];
    const nonPrevus = [];
    tousEnfants.forEach(e => {
      const abs = absenceParEnfant[e.id];
      if (!estPrevuCeJour(e, date)) {
        nonPrevus.push(e.toJSON());
      } else if (abs) {
        absents.push({ ...e.toJSON(), absence: abs });
      } else {
        presents.push(e.toJSON());
      }
    });

    return succes(res, { date, presents, absents, nonPrevus });
  } catch (err) { return erreur(res, 'Erreur récupération présences'); }
};

// GET /api/absences/presences-mois?annee=&mois= — Nombre d'enfants
// attendus/absents pour chaque jour du mois (admin). Sert à afficher
// un chiffre directement sur chaque case du calendrier, sans avoir à
// cliquer jour par jour.
const getPresencesMois = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee, 10);
    const mois  = parseInt(req.query.mois, 10); // 0-indexé (0 = janvier)
    if (Number.isNaN(annee) || Number.isNaN(mois)) return erreur(res, 'Paramètres annee/mois invalides', 400);

    const premierJour = `${annee}-${String(mois + 1).padStart(2, '0')}-01`;
    const nbJours      = new Date(annee, mois + 1, 0).getDate();
    const dernierJour  = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(nbJours).padStart(2, '0')}`;

    // Tous les enfants actifs, une seule fois pour tout le mois
    const tousEnfants = await Enfant.findAll({
      where:      { actif: true },
      attributes: ['id', 'jours_presence']
    });

    // Toutes les absences qui chevauchent le mois, en une seule requête
    const absencesDuMois = await Absence.findAll({
      where: {
        date_debut: { [Op.lte]: dernierJour },
        date_fin:   { [Op.gte]: premierJour },
        statut:     { [Op.ne]: 'refusee' }
      },
      attributes: ['enfant_id', 'date_debut', 'date_fin']
    });

    // Pour chaque jour du mois, compter présents / absents / non-prévus
    const parJour = {};
    for (let j = 1; j <= nbJours; j++) {
      const dateStr = `${annee}-${String(mois + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      let presents = 0, absents = 0, nonPrevus = 0;
      tousEnfants.forEach(e => {
        if (!estPrevuCeJour(e, dateStr)) { nonPrevus++; return; }
        const absent = absencesDuMois.some(a =>
          a.enfant_id === e.id && a.date_debut <= dateStr && a.date_fin >= dateStr
        );
        if (absent) absents++; else presents++;
      });
      parJour[dateStr] = { presents, absents, nonPrevus };
    }

    return succes(res, parJour);
  } catch (err) { return erreur(res, 'Erreur récupération présences du mois'); }
};

module.exports = { lister, creer, getAbsence, modifier, valider, supprimer, getPresences, getPresencesMois };
