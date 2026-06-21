// Contrôleur enfants — Les Coccinelles
const { Enfant, User } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// GET /api/enfants — Mes enfants ou tous (admin)
const lister = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { user_id: req.user.id, actif: true }  // Parent → ses enfants seulement
      : {};                                      // Admin → tous les enfants

    const enfants = await Enfant.findAll({
      where: filtre,
      include: [{ model: User, as: 'parent', attributes: ['id', 'prenom', 'nom', 'email'] }],
      order: [['prenom', 'ASC']]
    });
    return succes(res, enfants);
  } catch (err) {
    console.error('Erreur lister enfants :', err);
    return erreur(res, 'Erreur lors de la récupération des enfants');
  }
};

// POST /api/enfants — Créer un enfant
const creer = async (req, res) => {
  try {
    const enfant = await Enfant.create({ ...req.body, user_id: req.user.id });
    return cree(res, enfant, 'Enfant ajouté avec succès');
  } catch (err) {
    return erreur(res, 'Erreur lors de l\'ajout de l\'enfant');
  }
};

// GET /api/enfants/:id — Détail d'un enfant (vérifier que c'est l'enfant du parent)
const getEnfant = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id } // Parent → son enfant seulement
      : { id: req.params.id };                        // Admin → n'importe quel enfant

    const enfant = await Enfant.findOne({ where: filtre });
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    return succes(res, enfant);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération');
  }
};

// PUT /api/enfants/:id — Modifier un enfant
const modifier = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };

    const enfant = await Enfant.findOne({ where: filtre });
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    await enfant.update(req.body);
    return succes(res, enfant, 'Enfant mis à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors de la mise à jour');
  }
};

// DELETE /api/enfants/:id — Désactiver un enfant (soft delete)
const supprimer = async (req, res) => {
  try {
    const enfant = await Enfant.findByPk(req.params.id);
    if (!enfant) return erreur(res, 'Enfant non trouvé', 404);

    await enfant.update({ actif: false }); // Soft delete : désactiver plutôt que supprimer
    return succes(res, null, 'Enfant désactivé');
  } catch (err) {
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { lister, creer, getEnfant, modifier, supprimer };
