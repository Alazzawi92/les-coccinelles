// Contrôleur émargements (pointages journaliers) — Les Coccinelles
const { Emargement, Enfant } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// GET /api/emargements/:date — Tous les enfants + leur pointage pour un jour donné
const getDuJour = async (req, res) => {
  try {
    const { date } = req.params;

    // Charger tous les enfants actifs inscrits
    const enfants = await Enfant.findAll({
      where:      { actif: true },
      attributes: ['id', 'prenom', 'nom', 'sexe', 'groupe'],
      order:      [['prenom', 'ASC']]
    });

    // Charger les émargements du jour
    const emargements = await Emargement.findAll({
      where: { date_presence: date }
    });

    // Index rapide enfant_id → émargement pour éviter des boucles imbriquées
    const emargementsMap = {};
    emargements.forEach(e => { emargementsMap[e.enfant_id] = e; });

    // Combiner : chaque enfant avec son émargement (ou null si pas encore pointé)
    const resultat = enfants.map(e => ({
      enfant:      e.toJSON(),
      emargement:  emargementsMap[e.id] ? emargementsMap[e.id].toJSON() : null
    }));

    return succes(res, resultat);
  } catch (e) { return erreur(res, e.message || 'Erreur récupération émargements'); }
};

// POST /api/emargements — Créer un pointage d'arrivée
// Body attendu : { enfant_id, date_presence, heure_arrivee }
const creerArrivee = async (req, res) => {
  try {
    const { enfant_id, date_presence, heure_arrivee } = req.body;

    // Vérifier que l'enfant n'est pas déjà pointé ce jour
    const existant = await Emargement.findOne({
      where: { enfant_id, date_presence }
    });
    if (existant) return erreur(res, 'Un pointage existe déjà pour cet enfant ce jour', 409);

    const emargement = await Emargement.create({
      enfant_id,
      date_presence,
      heure_arrivee,
      signe_par: req.user.id
    });
    return cree(res, emargement, 'Arrivée enregistrée');
  } catch (err) { return erreur(res, 'Erreur création pointage'); }
};

// PATCH /api/emargements/:id — Mettre à jour l'heure de départ (ou corriger l'arrivée)
// Body attendu : { heure_depart?, heure_arrivee?, note? }
const modifier = async (req, res) => {
  try {
    const emargement = await Emargement.findByPk(req.params.id);
    if (!emargement) return erreur(res, 'Pointage non trouvé', 404);

    // Mettre à jour uniquement les champs fournis
    const champs = {};
    if (req.body.heure_arrivee !== undefined) champs.heure_arrivee = req.body.heure_arrivee;
    if (req.body.heure_depart  !== undefined) champs.heure_depart  = req.body.heure_depart;
    if (req.body.note          !== undefined) champs.note          = req.body.note;

    await emargement.update(champs);
    return succes(res, emargement, 'Pointage mis à jour');
  } catch (err) { return erreur(res, 'Erreur mise à jour pointage'); }
};

// DELETE /api/emargements/:id — Supprimer un pointage (correction d'erreur)
const supprimer = async (req, res) => {
  try {
    const emargement = await Emargement.findByPk(req.params.id);
    if (!emargement) return erreur(res, 'Pointage non trouvé', 404);
    await emargement.destroy();
    return succes(res, null, 'Pointage supprimé');
  } catch (err) { return erreur(res, 'Erreur suppression pointage'); }
};

module.exports = { getDuJour, creerArrivee, modifier, supprimer };
