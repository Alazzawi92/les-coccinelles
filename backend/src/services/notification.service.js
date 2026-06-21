// Service de création de notifications en base de données
const { Notification } = require('../models');

// Créer une notification pour un utilisateur
const creerNotification = async (userId, titre, message, type = 'info', lien = null) => {
  try {
    await Notification.create({
      user_id: userId,
      titre,
      message,
      type,
      lien
    });
  } catch (err) {
    // Ne pas bloquer l'action principale si la notif échoue
    console.error('Erreur création notification :', err.message);
  }
};

// Notifier un changement de statut d'inscription
const notifierStatutInscription = async (userId, statut, prenomEnfant) => {
  const messages = {
    accepte:       `La demande d'inscription de ${prenomEnfant} a été acceptée.`,
    refuse:        `La demande d'inscription de ${prenomEnfant} a été refusée.`,
    incomplet:     `Des documents manquent pour le dossier de ${prenomEnfant}.`,
    liste_attente: `${prenomEnfant} est en liste d'attente.`
  };

  const message = messages[statut] || `Statut de l'inscription de ${prenomEnfant} mis à jour.`;

  await creerNotification(userId, 'Mise à jour inscription', message, 'inscription', '/parent/mes-enfants');
};

module.exports = { creerNotification, notifierStatutInscription };
