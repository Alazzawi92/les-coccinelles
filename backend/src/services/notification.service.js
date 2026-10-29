// Service de création de notifications en base de données
const { Notification } = require('../models');

// Créer une notification pour un utilisateur.
// titre / message : texte français (repli si pas de traduction).
// traduction : { code, params } → le site affiche notifications.<code>
// traduit dans la langue de l'utilisateur (FR / EN), avec les params.
const creerNotification = async (userId, titre, message, type = 'info', lien = null, traduction = null) => {
  try {
    await Notification.create({
      user_id: userId,
      titre,
      message,
      type,
      lien,
      code:    traduction?.code   || null,
      params:  traduction?.params || null
    });
  } catch (err) {
    // Ne pas bloquer l'action principale si la notif échoue
    console.error('Erreur création notification :', err.message);
  }
};

// Notifier un changement de statut d'inscription.
// Le lien ouvre "Mes enfants" directement sur la demande concernée.
// prenomEnfant : nom complet de l'enfant ("Lina Martin")
const notifierStatutInscription = async (userId, statut, prenomEnfant, inscriptionId) => {
  const messages = {
    accepte:       `La demande d'inscription de ${prenomEnfant} a été acceptée.`,
    refuse:        `La demande d'inscription de ${prenomEnfant} a été refusée.`,
    incomplet:     `Des documents manquent pour le dossier de ${prenomEnfant}.`,
    liste_attente: `${prenomEnfant} est en liste d'attente.`
  };

  const message = messages[statut] || `Statut de l'inscription de ${prenomEnfant} mis à jour.`;

  await creerNotification(userId, 'Mise à jour inscription', message, 'inscription', `/parent/mes-enfants?demande=${inscriptionId}`,
    { code: 'statutInscription', params: { statut, enfant: prenomEnfant } });
};

module.exports = { creerNotification, notifierStatutInscription };
