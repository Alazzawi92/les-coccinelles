// Contrôleur notifications — Les Coccinelles
const { Notification } = require('../models');
const { succes, erreur } = require('../utils/response');

const lister = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where:  { user_id: req.user.id },
      order:  [['created_at', 'DESC']],
      limit:  50 // 50 dernières notifications
    });
    return succes(res, notifications);
  } catch (err) { return erreur(res, 'Erreur récupération notifications'); }
};

const marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notif) return erreur(res, 'Notification non trouvée', 404);
    await notif.update({ lue: true });
    return succes(res, null, 'Notification lue');
  } catch (err) { return erreur(res, 'Erreur'); }
};

const toutMarquerLu = async (req, res) => {
  try {
    await Notification.update({ lue: true }, { where: { user_id: req.user.id, lue: false } });
    return succes(res, null, 'Toutes les notifications marquées comme lues');
  } catch (err) { return erreur(res, 'Erreur'); }
};

const supprimer = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notif) return erreur(res, 'Notification non trouvée', 404);
    await notif.destroy();
    return succes(res, null, 'Notification supprimée');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, marquerLue, toutMarquerLu, supprimer };
