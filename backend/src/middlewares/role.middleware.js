// Middleware de vérification des rôles utilisateur
// Usage : router.get('/admin', verifierToken, verifierRole('admin', 'super_admin'), controller)

// Vérifier que l'utilisateur connecté a le rôle requis
const verifierRole = (...rolesAutorises) => {
  return (req, res, next) => {
    // verifierToken doit être appelé avant ce middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier que le rôle de l'utilisateur est dans la liste autorisée
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : permissions insuffisantes'
      });
    }

    next(); // Rôle autorisé, continuer
  };
};

module.exports = { verifierRole };
