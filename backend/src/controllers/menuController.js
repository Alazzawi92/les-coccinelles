// Contrôleur menus — Les Coccinelles
// Les menus forment un cycle de 4 semaines (Semaine 1 à 4) qui se répète toute l'année.
const { Op } = require('sequelize');
const { Menu } = require('../models');
const { succes, erreur } = require('../utils/response');

const NB_SEMAINES_CYCLE = 4;

// Lundi où le cycle commence en Semaine 1 (2 novembre 2026), en UTC pour éviter tout décalage de fuseau
const LUNDI_REFERENCE = Date.UTC(2026, 10, 2);
const MS_PAR_SEMAINE  = 7 * 24 * 60 * 60 * 1000;

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Les 10 champs saisissables : déjeuner et goûter du lundi au vendredi
const CHAMPS_MENU = JOURS.slice(1, 6).flatMap(jour => [`${jour}_midi`, `${jour}_gouter`]);

// Les 14 allergènes réglementaires, dans l'ordre d'affichage du menu imprimé.
// fruits_de_mer = mollusques (intitulé utilisé par la crèche)
const ALLERGENES = [
  'sulfites', 'lait', 'gluten', 'arachide', 'fruits_a_coque', 'fruits_de_mer', 'oeufs',
  'poisson', 'crustaces', 'soja', 'moutarde', 'sesame', 'lupin', 'celeri'
];

// Les 5 champs d'allergènes : un par jour (déjeuner + goûter confondus)
const CHAMPS_ALLERGENES = JOURS.slice(1, 6).map(jour => `${jour}_allergenes`);

// Base de données → API : "lait,gluten" devient ['lait', 'gluten'] (clés inconnues ignorées)
const versListe = (texte) => (texte ? texte.split(',').filter(cle => ALLERGENES.includes(cle)) : []);

// API → base de données : liste dans l'ordre officiel, sans doublon ; liste vide → NULL
const versTexte = (liste) => {
  const cles = ALLERGENES.filter(cle => Array.isArray(liste) && liste.includes(cle));
  return cles.length ? cles.join(',') : null;
};

// Menu renvoyé par l'API : champs texte + allergènes sous forme de listes
const formaterMenu = (menu) => {
  const donnees = menu.toJSON();
  CHAMPS_ALLERGENES.forEach(champ => { donnees[champ] = versListe(donnees[champ]); });
  return donnees;
};

// Date fictive qui identifie chaque semaine du cycle dans la colonne unique semaine_debut :
// Semaine 1 = 2000-01-01 (l'ancien menu par défaut), 2 = 2000-01-08, 3 = 2000-01-15, 4 = 2000-01-22
const dateDuCycle = (numero) => `2000-01-${String(1 + (numero - 1) * 7).padStart(2, '0')}`;

// Vérifie le format AAAA-MM-JJ et que la date existe
const dateValide = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(`${date}T00:00:00Z`));

// Date du jour en France, au format AAAA-MM-JJ (le serveur peut être en UTC)
const aujourdhui = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

// Numéro (1 à 4) de la semaine du cycle qui contient une date AAAA-MM-JJ
const numeroSemaineCycle = (date) => {
  const jour    = new Date(`${date}T00:00:00Z`);
  const numJour = jour.getUTCDay();
  // Ramène la date au lundi de sa semaine (dimanche = 6 jours en arrière)
  jour.setUTCDate(jour.getUTCDate() - (numJour === 0 ? 6 : numJour - 1));
  const semainesEcoulees = Math.round((jour.getTime() - LUNDI_REFERENCE) / MS_PAR_SEMAINE);
  // Double modulo : reste correct aussi pour les dates avant le lundi de référence
  return ((semainesEcoulees % NB_SEMAINES_CYCLE) + NB_SEMAINES_CYCLE) % NB_SEMAINES_CYCLE + 1;
};

// Menu saisi pour la semaine du cycle qui contient cette date (null si pas encore saisi)
const menuDeLaDate = (date) => Menu.findOne({
  where:      { semaine_debut: dateDuCycle(numeroSemaineCycle(date)) },
  attributes: [...CHAMPS_MENU, ...CHAMPS_ALLERGENES]
});

// GET /api/menus — Menu de la semaine en cours (public)
const lister = async (req, res) => {
  try {
    const menu = await menuDeLaDate(aujourdhui());
    return succes(res, menu ? formaterMenu(menu) : null);
  } catch (err) { return erreur(res, 'Erreur récupération menu'); }
};

// GET /api/menus/jour/:date — Déjeuner et goûter d'un jour précis (AAAA-MM-JJ).
// Sert au suivi quotidien (parent et admin) pour afficher "Au menu : ...".
// Samedi / dimanche : crèche fermée → midi et goûter à null.
const getMenuJour = async (req, res) => {
  try {
    const { date } = req.params;
    if (!dateValide(date)) return erreur(res, 'Date invalide (format AAAA-MM-JJ)', 400);

    const numJour = new Date(`${date}T00:00:00Z`).getUTCDay();
    const jour    = JOURS[numJour];
    if (numJour === 0 || numJour === 6) return succes(res, { date, jour, midi: null, gouter: null, allergenes: [] });

    const menu = await menuDeLaDate(date);
    return succes(res, {
      date,
      jour,
      midi:   menu?.[`${jour}_midi`]   || null,
      gouter: menu?.[`${jour}_gouter`] || null,
      allergenes: versListe(menu?.[`${jour}_allergenes`]) // Allergènes du jour
    });
  } catch (err) { return erreur(res, 'Erreur récupération du menu du jour'); }
};

// GET /api/menus/:semaine — Menu d'une semaine affichée sur le site (public)
const getMenuSemaine = async (req, res) => {
  try {
    const { semaine } = req.params;
    if (!dateValide(semaine)) return erreur(res, 'Date invalide (format AAAA-MM-JJ)', 400);
    const menu = await menuDeLaDate(semaine);
    if (!menu) return erreur(res, 'Aucun menu disponible', 404);
    return succes(res, formaterMenu(menu));
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

// GET /api/menus/cycle — Les 4 semaines à saisir (super admin)
const getCycle = async (req, res) => {
  try {
    const numeros = Array.from({ length: NB_SEMAINES_CYCLE }, (_, i) => i + 1);
    const menus   = await Menu.findAll({ where: { semaine_debut: { [Op.in]: numeros.map(dateDuCycle) } } });

    // Toujours 4 entrées, même pour une semaine pas encore saisie
    const semaines = numeros.map(numero => {
      const menu = menus.find(m => m.semaine_debut === dateDuCycle(numero));
      return {
        numero,
        ...Object.fromEntries(CHAMPS_MENU.map(champ => [champ, menu?.[champ] ?? ''])),
        ...Object.fromEntries(CHAMPS_ALLERGENES.map(champ => [champ, versListe(menu?.[champ])])) // Cases cochées
      };
    });
    return succes(res, { numero_courant: numeroSemaineCycle(aujourdhui()), semaines });
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

// PUT /api/menus/cycle/:numero — Crée ou met à jour une semaine du cycle (super admin)
const sauvegarderSemaineCycle = async (req, res) => {
  try {
    const semaineDebut = dateDuCycle(Number(req.params.numero));
    // Ne garde que les champs de menu envoyés : le reste du corps de la requête est ignoré
    const contenu = Object.fromEntries(
      CHAMPS_MENU.filter(champ => req.body[champ] !== undefined).map(champ => [champ, req.body[champ]])
    );
    // Allergènes : listes de clés (déjà validées par la route) → texte en base
    CHAMPS_ALLERGENES
      .filter(champ => req.body[champ] !== undefined)
      .forEach(champ => { contenu[champ] = versTexte(req.body[champ]); });

    let menu = await Menu.findOne({ where: { semaine_debut: semaineDebut } });
    if (menu) {
      await menu.update(contenu);
    } else {
      menu = await Menu.create({ ...contenu, semaine_debut: semaineDebut, publie: true, redige_par: req.user.id });
    }
    return succes(res, formaterMenu(menu), 'Menu enregistré');
  } catch (err) { return erreur(res, 'Erreur lors de la sauvegarde'); }
};

module.exports = { CHAMPS_MENU, CHAMPS_ALLERGENES, ALLERGENES, lister, getMenuJour, getMenuSemaine, getCycle, sauvegarderSemaineCycle };
