// Contrôleur CMS — Les Coccinelles
const { CmsPage } = require('../models');
const { succes, erreur } = require('../utils/response');

const listerPages = async (req, res) => {
  try {
    const pages = await CmsPage.findAll({ order: [['slug', 'ASC']] });
    return succes(res, pages);
  } catch (err) { return erreur(res, 'Erreur récupération pages CMS'); }
};

const getPage = async (req, res) => {
  try {
    const page = await CmsPage.findOne({ where: { slug: req.params.slug, publie: true } });
    if (!page) return erreur(res, 'Page non trouvée', 404);
    return succes(res, page);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const modifierPage = async (req, res) => {
  try {
    const page = await CmsPage.findOne({ where: { slug: req.params.slug } });
    if (!page) return erreur(res, 'Page non trouvée', 404);
    await page.update({ ...req.body, modifie_par: req.user.id });
    return succes(res, page, 'Page mise à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

module.exports = { listerPages, getPage, modifierPage };
