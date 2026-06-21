// Configuration des tokens JWT du projet Les Coccinelles
const jwt = require('jsonwebtoken'); // Librairie JWT

// Générer un Access Token (courte durée — 15 minutes)
const genererAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },             // Données encodées dans le token
    process.env.JWT_SECRET,           // Clé secrète (obligatoirement dans .env)
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // Expiration 15 minutes
  );
};

// Générer un Refresh Token (longue durée — 7 jours)
const genererRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },                           // Seulement l'ID dans le refresh
    process.env.JWT_REFRESH_SECRET,           // Clé secrète différente de l'access
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } // 7 jours
  );
};

// Vérifier un access token et retourner les données décodées
const verifierAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET); // Lance une erreur si invalide
};

// Vérifier un refresh token et retourner les données décodées
const verifierRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  genererAccessToken,
  genererRefreshToken,
  verifierAccessToken,
  verifierRefreshToken
};
