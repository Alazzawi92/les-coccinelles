// Contrôleur menus — Les Coccinelles
const { Menu } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// Date sentinelle pour le menu par défaut (ne correspond à aucune vraie semaine)
const SEMAINE_DEFAUT = '2000-01-01';

// Calculer le lundi de la semaine en cours
const getLundiSemaine = () => {
  const maintenant = new Date();
  const jour       = maintenant.getDay();
  const diff       = maintenant.getDate() - jour + (jour === 0 ? -6 : 1);
  const lundi      = new Date(maintenant.setDate(diff));
  return lundi.toISOString().split('T')[0];
};

const lister = async (req, res) => {
  try {
    const semaine = getLundiSemaine();
    let menu = await Menu.findOne({ where: { semaine_debut: semaine, publie: true } });
    // Retombe sur le menu par défaut si aucun menu publié cette semaine
    if (!menu) menu = await Menu.findOne({ where: { semaine_debut: SEMAINE_DEFAUT } });
    return succes(res, menu || null);
  } catch (err) { return erreur(res, 'Erreur récupération menu'); }
};

// Récupérer le menu par défaut (admin)
const getMenuDefaut = async (req, res) => {
  try {
    const menu = await Menu.findOne({ where: { semaine_debut: SEMAINE_DEFAUT } });
    return succes(res, menu || null);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

// Créer ou mettre à jour le menu par défaut
const sauvegarderMenuDefaut = async (req, res) => {
  try {
    let menu = await Menu.findOne({ where: { semaine_debut: SEMAINE_DEFAUT } });
    if (menu) {
      await menu.update(req.body);
    } else {
      menu = await Menu.create({ ...req.body, semaine_debut: SEMAINE_DEFAUT, publie: true, redige_par: req.user.id });
    }
    return succes(res, menu, 'Menu par défaut sauvegardé');
  } catch (err) { return erreur(res, 'Erreur lors de la sauvegarde'); }
};

const getMenuSemaine = async (req, res) => {
  try {
    // Cherche d'abord un menu spécifique à la semaine demandée
    let menu = await Menu.findOne({ where: { semaine_debut: req.params.semaine } });
    const estDefaut = !menu;
    // Retombe sur le menu par défaut si aucun menu trouvé pour cette semaine
    if (!menu) menu = await Menu.findOne({ where: { semaine_debut: SEMAINE_DEFAUT } });
    if (!menu) return erreur(res, 'Aucun menu disponible', 404);
    // Indique au frontend si c'est le menu par défaut ou un menu personnalisé
    return succes(res, { ...menu.toJSON(), est_defaut: estDefaut });
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const creer = async (req, res) => {
  try {
    const menu = await Menu.create({ ...req.body, redige_par: req.user.id });
    return cree(res, menu, 'Menu créé');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return erreur(res, 'Un menu existe déjà pour cette semaine', 409);
    return erreur(res, 'Erreur lors de la création');
  }
};

const modifier = async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return erreur(res, 'Menu non trouvé', 404);
    await menu.update(req.body);
    return succes(res, menu, 'Menu mis à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

const supprimer = async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return erreur(res, 'Menu non trouvé', 404);
    await menu.destroy();
    return succes(res, null, 'Menu supprimé');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, getMenuDefaut, sauvegarderMenuDefaut, getMenuSemaine, creer, modifier, supprimer };
