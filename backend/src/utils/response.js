// Fonctions utilitaires pour les réponses API standardisées

// Réponse de succès
const succes = (res, data = null, message = 'Succès', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

// Réponse d'erreur
const erreur = (res, message = 'Erreur serveur', status = 500) => {
  return res.status(status).json({
    success: false,
    message
  });
};

// Réponse de création (201)
const cree = (res, data, message = 'Créé avec succès') => {
  return succes(res, data, message, 201);
};

module.exports = { succes, erreur, cree };
