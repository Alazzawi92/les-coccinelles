// Contrôleur rapports — Les Coccinelles
// Agrège les émargements (temps de présence) et les suivis quotidiens
// (repas, sieste, activités) sur une période donnée, par enfant/groupe.
const { Op }                              = require('sequelize');
const { Enfant, Emargement, SuiviQuotidien } = require('../models');
const { succes, erreur }                  = require('../utils/response');

// Convertit "HH:MM:SS" en minutes depuis minuit
const versMinutes = (heure) => {
  if (!heure) return null;
  const [h, m] = heure.split(':').map(Number);
  return h * 60 + m;
};

// GET /api/rapports?debut=YYYY-MM-DD&fin=YYYY-MM-DD&groupe=&enfant_id=
const getRapport = async (req, res) => {
  try {
    const { debut, fin, groupe, enfant_id } = req.query;
    if (!debut || !fin) return erreur(res, 'Les paramètres debut et fin sont requis', 400);

    // Filtre des enfants concernés par le rapport
    const filtreEnfant = { actif: true };
    if (groupe)    filtreEnfant.groupe = groupe;
    if (enfant_id) filtreEnfant.id     = enfant_id;

    const enfants = await Enfant.findAll({
      where:      filtreEnfant,
      attributes: ['id', 'prenom', 'nom', 'groupe'],
      order:      [['prenom', 'ASC']]
    });
    const enfantIds = enfants.map(e => e.id);
    if (enfantIds.length === 0) return succes(res, []);

    // Émargements et suivis de la période, pour tous les enfants concernés
    const [emargements, suivis] = await Promise.all([
      Emargement.findAll({ where: { enfant_id: enfantIds, date_presence: { [Op.between]: [debut, fin] } } }),
      SuiviQuotidien.findAll({ where: { enfant_id: enfantIds, date_suivi: { [Op.between]: [debut, fin] } } })
    ]);

    // Regrouper émargements et suivis par enfant
    const emargementsParEnfant = {};
    emargements.forEach(e => {
      (emargementsParEnfant[e.enfant_id] ||= []).push(e);
    });
    const suivisParEnfant = {};
    suivis.forEach(s => {
      (suivisParEnfant[s.enfant_id] ||= []).push(s);
    });

    // Construire le rapport agrégé par enfant
    const rapport = enfants.map(enfant => {
      const joursPresence = (emargementsParEnfant[enfant.id] || []).map(e => {
        const debutMin = versMinutes(e.heure_arrivee);
        const finMin   = versMinutes(e.heure_depart);
        const dureeMin = (debutMin !== null && finMin !== null) ? Math.max(0, finMin - debutMin) : null;
        return {
          date:          e.date_presence,
          heure_arrivee: e.heure_arrivee,
          heure_depart:  e.heure_depart,
          duree_minutes: dureeMin
        };
      });
      const totalMinutes = joursPresence.reduce((total, j) => total + (j.duree_minutes || 0), 0);

      const joursSuivi = (suivisParEnfant[enfant.id] || []).map(s => ({
        date:         s.date_suivi,
        repas_matin:  s.repas_matin,
        repas_midi:   s.repas_midi,
        repas_gouter: s.repas_gouter,
        sieste_debut: s.sieste_debut,
        sieste_fin:   s.sieste_fin,
        siestes:      s.siestes,
        activites:    s.activites,
        humeur:       s.humeur
      }));

      // Nombre de repas "bien mangés" (tout) sur le total de repas renseignés (hors "absent")
      let repasTotal = 0, repasComplets = 0;
      joursSuivi.forEach(j => {
        [j.repas_matin, j.repas_midi, j.repas_gouter].forEach(r => {
          if (r && r !== 'absent') {
            repasTotal++;
            if (r === 'tout') repasComplets++;
          }
        });
      });

      const nbSiestes = joursSuivi.reduce((n, j) => n + (j.sieste_debut ? 1 : 0) + (Array.isArray(j.siestes) ? j.siestes.length : 0), 0);
      const nbJoursActivite = joursSuivi.filter(j => j.activites && j.activites.trim() !== '').length;

      return {
        enfant: { id: enfant.id, prenom: enfant.prenom, nom: enfant.nom, groupe: enfant.groupe },
        presence: {
          nb_jours:       joursPresence.length,
          total_minutes:  totalMinutes,
          total_heures:   Math.round((totalMinutes / 60) * 100) / 100,
          jours:          joursPresence
        },
        repas: { total_renseignes: repasTotal, complets: repasComplets },
        sieste: { nb_siestes: nbSiestes },
        activites: { nb_jours_renseignes: nbJoursActivite, jours: joursSuivi }
      };
    });

    return succes(res, rapport);
  } catch (err) { return erreur(res, 'Erreur lors du calcul du rapport'); }
};

module.exports = { getRapport };
