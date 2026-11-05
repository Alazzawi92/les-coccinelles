// Middlewares : espace parents et création de comptes — Les Coccinelles
// Bloquent les routes concernées quand le super admin a fermé
// l'interrupteur correspondant (voir services/parametres.service.js).
const {
  espaceParentsOuvert, creationComptesOuverte,
  MESSAGE_ESPACE_FERME, MESSAGE_CREATION_FERMEE
} = require('../services/parametres.service');
const { erreur } = require('../utils/response');

// Espace parents fermé : refus (connexion Google, réservée aux parents)
const verifierEspaceParentsOuvert = async (req, res, next) => {
  if (!(await espaceParentsOuvert())) return erreur(res, MESSAGE_ESPACE_FERME, 403);
  next();
};

// Création de comptes fermée : refus d'un nouveau compte ou d'une nouvelle
// demande d'inscription. L'équipe (admin / super_admin) n'est pas concernée.
const verifierCreationComptesOuverte = async (req, res, next) => {
  const equipe = req.user && req.user.role !== 'parent';
  if (!equipe && !(await creationComptesOuverte())) return erreur(res, MESSAGE_CREATION_FERMEE, 403);
  next();
};

module.exports = { verifierEspaceParentsOuvert, verifierCreationComptesOuverte };
