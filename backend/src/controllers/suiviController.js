// Contrôleur suivi quotidien — Les Coccinelles
const { SuiviQuotidien, Enfant } = require('../models');
const { succes, erreur, cree }   = require('../utils/response');

// Vérifier que le parent a accès à cet enfant
const verifierAccesEnfant = async (enfantId, userId, role) => {
  if (role !== 'parent') return true; // Admin peut tout voir
  const enfant = await Enfant.findOne({ where: { id: enfantId, user_id: userId } });
  return !!enfant;
};

// GET /api/suivi/:enfant_id — Liste des suivis (7 derniers jours par défaut)
const lister = async (req, res) => {
  try {
    const acces = await verifierAccesEnfant(req.params.enfant_id, req.user.id, req.user.role);
    if (!acces) return erreur(res, 'Accès non autorisé', 403);

    const suivis = await SuiviQuotidien.findAll({
      where: { enfant_id: req.params.enfant_id },
      order: [['date_suivi', 'DESC']],
      limit: 30 // 30 derniers jours
    });
    return succes(res, suivis);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

// GET /api/suivi/:enfant_id/:date — Suivi d'un jour précis
const getSuiviDuJour = async (req, res) => {
  try {
    const acces = await verifierAccesEnfant(req.params.enfant_id, req.user.id, req.user.role);
    if (!acces) return erreur(res, 'Accès non autorisé', 403);

    const suivi = await SuiviQuotidien.findOne({
      where: { enfant_id: req.params.enfant_id, date_suivi: req.params.date }
    });
    if (!suivi) return erreur(res, 'Pas de suivi pour cette date', 404);
    return succes(res, suivi);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

// POST /api/suivi — Créer un suivi (admin)
const creer = async (req, res) => {
  try {
    const suivi = await SuiviQuotidien.create({ ...req.body, redige_par: req.user.id });
    return cree(res, suivi, 'Suivi créé');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return erreur(res, 'Un suivi existe déjà pour cet enfant ce jour', 409);
    return erreur(res, 'Erreur lors de la création');
  }
};

// PUT /api/suivi/:id — Modifier un suivi (admin)
const modifier = async (req, res) => {
  try {
    const suivi = await SuiviQuotidien.findByPk(req.params.id);
    if (!suivi) return erreur(res, 'Suivi non trouvé', 404);
    await suivi.update(req.body);
    return succes(res, suivi, 'Suivi mis à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

module.exports = { lister, getSuiviDuJour, creer, modifier };
