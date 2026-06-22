// Middleware de vérification du token JWT
const { verifierAccessToken } = require('../config/jwt');
const { User }                = require('../models');

// Vérifier que l'utilisateur est connecté et que son token est valide
const verifierToken = async (req, res, next) => {
  // Récupérer le token dans le header Authorization
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Format : "Bearer TOKEN"

  if (!token) {
    // Pas de token → non autorisé
    return res.status(401).json({
      success: false,
      message: 'Token manquant, connexion requise'
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = verifierAccessToken(token);

    // Récupérer l'utilisateur en base de données
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_reset'] } // Exclure les données sensibles
    });

    if (!user || !user.actif) {
      // Utilisateur introuvable ou désactivé
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou compte désactivé'
      });
    }

    req.user = user; // Attacher l'utilisateur à la requête pour les prochains middlewares
    next();          // Passer au middleware suivant
  } catch (err) {
    // Token invalide ou expiré
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Version optionnelle : lit le token s'il est présent, ne bloque pas sinon
const verifierTokenOptional = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) return next(); // Pas de token → on continue sans req.user

  try {
    const decoded = verifierAccessToken(token);
    const user    = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_reset'] }
    });
    if (user && user.actif) req.user = user;
  } catch { /* Token invalide → on ignore, req.user reste undefined */ }

  next();
};

module.exports = { verifierToken, verifierTokenOptional };
