// Middleware de validation des données avec express-validator
const fs = require('fs');                                 // Suppression des fichiers refusés
const { validationResult } = require('express-validator');

// Vérifier les résultats de validation et retourner les erreurs si présentes
const validerDonnees = (req, res, next) => {
  const erreurs = validationResult(req); // Récupérer les erreurs de validation

  if (!erreurs.isEmpty()) {
    // Fichiers déjà enregistrés par multer : supprimés (rien ne reste sur le disque)
    const fichiers = req.files ? [].concat(...Object.values(req.files)) : (req.file ? [req.file] : []);
    fichiers.forEach(f => f?.path && fs.unlink(f.path, () => {}));
    // Retourner les erreurs au format standard (message = 1re erreur, lisible)
    return res.status(400).json({
      success: false,
      message: erreurs.array()[0]?.msg || 'Données invalides',
      erreurs: erreurs.array() // Liste des erreurs de validation
    });
  }

  next(); // Données valides, continuer
};

module.exports = { validerDonnees };
