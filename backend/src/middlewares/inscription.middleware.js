// Middleware "famille inscrite" — Les Coccinelles
// Réserve certaines fonctionnalités (galerie, suivi, absences, consentement)
// aux parents dont au moins un enfant a une inscription ACCEPTÉE.
// Les admins / super admins ne sont jamais bloqués.
const { Inscription } = require('../models');

// true si le parent a au moins une inscription au statut "accepte"
const familleInscrite = async (userId) =>
  (await Inscription.count({ where: { user_id: userId, statut: 'accepte' } })) > 0;

// À placer APRÈS verifierToken (a besoin de req.user)
const verifierInscriptionAcceptee = async (req, res, next) => {
  if (req.user.role !== 'parent') return next();
  try {
    if (await familleInscrite(req.user.id)) return next();
    return res.status(403).json({
      success: false,
      code:    'INSCRIPTION_REQUISE', // Repéré par le frontend pour afficher l'écran "accès réservé"
      message: 'Accès réservé aux familles dont l\'inscription est acceptée'
    });
  } catch (err) {
    console.error('Erreur verifierInscriptionAcceptee :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { verifierInscriptionAcceptee, familleInscrite };
