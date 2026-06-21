// Contrôleur messagerie — Les Coccinelles
const { Message, User } = require('../models');
const { creerNotification } = require('../services/notification.service');
const { succes, erreur, cree } = require('../utils/response');
const { Op } = require('sequelize');

const lister = async (req, res) => {
  try {
    // Récupérer les messages envoyés et reçus
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { expediteur_id: req.user.id },
          { destinataire_id: req.user.id }
        ],
        parent_id: null // Seulement les messages racines (pas les réponses)
      },
      include: [
        { model: User, as: 'expediteur',   attributes: ['id', 'prenom', 'nom', 'avatar'] },
        { model: User, as: 'destinataire', attributes: ['id', 'prenom', 'nom', 'avatar'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return succes(res, messages);
  } catch (err) { return erreur(res, 'Erreur récupération messages'); }
};

const envoyer = async (req, res) => {
  try {
    const { destinataire_id, sujet, contenu, parent_id } = req.body;
    const message = await Message.create({
      expediteur_id:    req.user.id,
      destinataire_id,
      sujet,
      contenu,
      parent_id:        parent_id || null,
      piece_jointe:     req.file ? `/uploads/messages/${req.file.filename}` : null,
      piece_jointe_nom: req.file ? req.file.originalname : null
    });

    // Notifier le destinataire
    await creerNotification(destinataire_id, 'Nouveau message', `Message de ${req.user.prenom} ${req.user.nom}`, 'message', '/parent/messages');

    return cree(res, message, 'Message envoyé');
  } catch (err) { return erreur(res, 'Erreur lors de l\'envoi'); }
};

const getConversation = async (req, res) => {
  try {
    // Récupérer le message principal et ses réponses
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [{ expediteur_id: req.user.id }, { destinataire_id: req.user.id }]
      },
      include: [
        { model: Message, as: 'reponses', include: [{ model: User, as: 'expediteur', attributes: ['id', 'prenom', 'nom'] }] },
        { model: User, as: 'expediteur',   attributes: ['id', 'prenom', 'nom'] },
        { model: User, as: 'destinataire', attributes: ['id', 'prenom', 'nom'] }
      ]
    });
    if (!message) return erreur(res, 'Message non trouvé', 404);
    return succes(res, message);
  } catch (err) { return erreur(res, 'Erreur lors de la récupération'); }
};

const marquerLu = async (req, res) => {
  try {
    const message = await Message.findOne({ where: { id: req.params.id, destinataire_id: req.user.id } });
    if (!message) return erreur(res, 'Message non trouvé', 404);
    await message.update({ lu: true, date_lecture: new Date() });
    return succes(res, null, 'Message marqué comme lu');
  } catch (err) { return erreur(res, 'Erreur'); }
};

const supprimer = async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.id, expediteur_id: req.user.id }
    });
    if (!message) return erreur(res, 'Message non trouvé', 404);
    await message.destroy();
    return succes(res, null, 'Message supprimé');
  } catch (err) { return erreur(res, 'Erreur lors de la suppression'); }
};

module.exports = { lister, envoyer, getConversation, marquerLu, supprimer };
