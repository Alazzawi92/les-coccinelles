// Middleware de validation des données avec express-validator
const { validationResult } = require('express-validator');

// Vérifier les résultats de validation et retourner les erreurs si présentes
const validerDonnees = (req, res, next) => {
  const erreurs = validationResult(req); // Récupérer les erreurs de validation

  if (!erreurs.isEmpty()) {
    // Retourner les erreurs au format standard
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      erreurs: erreurs.array() // Liste des erreurs de validation
    });
  }

  next(); // Données valides, continuer
};

module.exports = { validerDonnees };
