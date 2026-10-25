// Contrôleur suivi quotidien — Les Coccinelles
const { SuiviQuotidien, Enfant } = require('../models');
const { succes, erreur, cree }   = require('../utils/response');

// ── Biberons : un élément par biberon { heure: 'HH:MM' | null, ml: 0..400 } ──
const BIBERON_ML_MAX  = 400;
const BIBERONS_MAX    = 20;   // Garde-fou : 20 éléments max par liste et par jour
const RE_HEURE        = /^([01]\d|2[0-3]):[0-5]\d$/;

// Valide et nettoie la liste envoyée par l'équipe.
// Retourne { liste } si tout est correct, sinon { message } (erreur 400).
const normaliserBiberons = (brut) => {
  if (brut === null) return { liste: [] };
  if (!Array.isArray(brut)) return { message: 'Format des biberons invalide' };
  if (brut.length > BIBERONS_MAX) return { message: `Maximum ${BIBERONS_MAX} biberons par jour` };
  const liste = [];
  for (const b of brut) {
    const heure = b?.heure ? String(b.heure).slice(0, 5) : null;  // "08:30:00" → "08:30"
    if (heure && !RE_HEURE.test(heure)) return { message: `Heure de biberon invalide : ${heure}` };
    const ml = Number(b?.ml);
    if (!Number.isInteger(ml) || ml < 0 || ml > BIBERON_ML_MAX) {
      return { message: `Quantité de biberon invalide : entre 0 et ${BIBERON_ML_MAX} ml` };
    }
    liste.push({ heure, ml });
  }
  // Tri chronologique (les biberons sans heure en fin de liste)
  liste.sort((a, b) => (a.heure || '99:99').localeCompare(b.heure || '99:99'));
  return { liste };
};

// Applique les biberons validés aux données à enregistrer :
// biberon_nb est recalculé, l'ancien champ biberon_ml n'est plus utilisé.
const appliquerBiberons = (donnees) => {
  if (donnees.biberons === undefined) return null;   // Champ non envoyé : rien à faire
  const { liste, message } = normaliserBiberons(donnees.biberons);
  if (message) return message;
  donnees.biberons   = liste;
  donnees.biberon_nb = liste.length;
  donnees.biberon_ml = null;
  return null;
};

// ── Selles : un élément par selle { heure: 'HH:MM' | null, type } ──
const TYPES_SELLES = ['normale', 'molle', 'liquide'];

const normaliserSelles = (brut) => {
  if (brut === null) return { liste: [] };
  if (!Array.isArray(brut)) return { message: 'Format des selles invalide' };
  if (brut.length > BIBERONS_MAX) return { message: `Maximum ${BIBERONS_MAX} selles par jour` };
  const liste = [];
  for (const e of brut) {
    const heure = e?.heure ? String(e.heure).slice(0, 5) : null;
    if (heure && !RE_HEURE.test(heure)) return { message: `Heure de selle invalide : ${heure}` };
    const type = e?.type || 'normale';
    if (!TYPES_SELLES.includes(type)) return { message: 'Type de selle invalide' };
    liste.push({ heure, type });
  }
  liste.sort((a, b) => (a.heure || '99:99').localeCompare(b.heure || '99:99'));
  return { liste };
};

// selles (oui/non) et selles_nb sont recalculés à partir de la liste
const appliquerSelles = (donnees) => {
  if (donnees.selles_details === undefined) return null;
  const { liste, message } = normaliserSelles(donnees.selles_details);
  if (message) return message;
  donnees.selles_details = liste;
  donnees.selles_nb      = liste.length;
  donnees.selles         = liste.length > 0;
  return null;
};

// ── Siestes : { debut: 'HH:MM', fin: 'HH:MM' | null } ──
// fin vide = sieste en cours (l'enfant dort encore) : enregistrée quand même
const appliquerSiestes = (donnees) => {
  if (donnees.siestes === undefined) return null;
  if (donnees.siestes === null) { donnees.siestes = []; return null; }
  if (!Array.isArray(donnees.siestes) || donnees.siestes.length > BIBERONS_MAX) return 'Format des siestes invalide';
  const liste = [];
  for (const sv of donnees.siestes) {
    const debut = sv?.debut ? String(sv.debut).slice(0, 5) : null;
    const fin   = sv?.fin   ? String(sv.fin).slice(0, 5)   : null;
    if (!debut) continue;                                      // Ligne vide : ignorée
    if (!RE_HEURE.test(debut) || (fin && !RE_HEURE.test(fin))) return 'Heure de sieste invalide';
    liste.push({ debut, fin });
  }
  donnees.siestes = liste;
  return null;
};

// Valide toutes les listes horodatées ; renvoie le 1er message d'erreur ou null
const appliquerListes = (donnees) =>
  appliquerBiberons(donnees) || appliquerSelles(donnees) || appliquerSiestes(donnees);

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
    const donnees = { ...req.body, redige_par: req.user.id };
    const erreurListes = appliquerListes(donnees);
    if (erreurListes) return erreur(res, erreurListes, 400);
    const suivi = await SuiviQuotidien.create(donnees);
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
    const donnees = { ...req.body };
    delete donnees.redige_par;  // L'auteur d'origine ne change pas
    const erreurListes = appliquerListes(donnees);
    if (erreurListes) return erreur(res, erreurListes, 400);
    await suivi.update(donnees);
    return succes(res, suivi, 'Suivi mis à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

module.exports = { lister, getSuiviDuJour, creer, modifier };
