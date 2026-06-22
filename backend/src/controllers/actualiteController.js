// Contrôleur actualités — Les Coccinelles
const { Actualite, User } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

const lister = async (req, res) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limite   = parseInt(req.query.limite) || 10;
    const filtrePubication = req.user ? {} : { publie: true }; // Admin voit tout

    const { count, rows } = await Actualite.findAndCountAll({
      where:   filtrePubication,
      include: [{ model: User, as: 'auteur', attributes: ['id', 'prenom', 'nom'] }],
      order:   [['date_publication', 'DESC']],
      limit:   limite,
      offset:  (page - 1) * limite
    });

    return succes(res, { total: count, page, pages: Math.ceil(count / limite), actualites: rows });
  } catch (err) { console.error('[ACTUALITES] lister:', err); return erreur(res, 'Erreur récupération actualités'); }
};

const getActualite = async (req, res) => {
  try {
    const actualite = await Actualite.findByPk(req.params.id, {
      include: [{ model: User, as: 'auteur', attributes: ['id', 'prenom', 'nom'] }]
    });
    if (!actualite || (!actualite.publie && !req.user)) return erreur(res, 'Actualité non trouvée', 404);
    return succes(res, actualite);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const creer = async (req, res) => {
  try {
    const donnees = { ...req.body, auteur_id: req.user.id };
    if (req.file) donnees.image = `/uploads/documents/${req.file.filename}`;
    if (donnees.publie) donnees.date_publication = new Date();

    const actualite = await Actualite.create(donnees);
    return cree(res, actualite, 'Actualité créée');
  } catch (err) { return erreur(res, 'Erreur lors de la création'); }
};

const modifier = async (req, res) => {
  try {
    const actualite = await Actualite.findByPk(req.params.id);
    if (!actualite) return erreur(res, 'Actualité non trouvée', 404);
    await actualite.update(req.body);
    return succes(res, actualite, 'Actualité mise à jour');
  } catch (err) { return erreur(res, 'Erreur lors de la mise à jour'); }
};

const togglePublier = async (req, res) => {
  try {
    const actualite = await Actualite.findByPk(req.params.id);
    if (!actualite) return erreur(res, 'Actualité non trouvée', 404);
    const publie = !actualite.publie;
    await actualite.update({ publie, date_publication: publie ? new Date() : null });
    return succes(res, null, publie ? 'Actualité publiée' : 'Actualité dépubliée');
  } catch (err) { return erreur(res, 'Erreur lors de la modification'); }
};

const supprimer = async (req, res) => {
  try {
    const actualite = await Actualite.findByPk(req.params.id);
    if (!actualite) return erreur(res, 'Actualité non trouvée', 404);
    await actualite.destroy();
    return succes(res, null, 'Actualité supprimée');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, getActualite, creer, modifier, togglePublier, supprimer };
