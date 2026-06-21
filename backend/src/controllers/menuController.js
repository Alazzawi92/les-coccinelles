// Contrôleur menus — Les Coccinelles
const { Menu } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// Calculer le lundi de la semaine en cours
const getLundiSemaine = () => {
  const maintenant = new Date();
  const jour       = maintenant.getDay(); // 0=dimanche, 1=lundi...
  const diff       = maintenant.getDate() - jour + (jour === 0 ? -6 : 1); // Ajuster vers lundi
  const lundi      = new Date(maintenant.setDate(diff));
  return lundi.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

const lister = async (req, res) => {
  try {
    // Retourner le menu de la semaine en cours par défaut
    const semaine = getLundiSemaine();
    const menu = await Menu.findOne({ where: { semaine_debut: semaine, publie: true } });
    return succes(res, menu || null);
  } catch (err) { return erreur(res, 'Erreur récupération menu'); }
};

const getMenuSemaine = async (req, res) => {
  try {
    const menu = await Menu.findOne({ where: { semaine_debut: req.params.semaine, publie: true } });
    if (!menu) return erreur(res, 'Menu non trouvé pour cette semaine', 404);
    return succes(res, menu);
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

module.exports = { lister, getMenuSemaine, creer, modifier, supprimer };
