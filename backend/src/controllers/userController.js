// Contrôleur utilisateurs — Les Coccinelles
const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');
const { User } = require('../models');
const { succes, erreur } = require('../utils/response');

// GET /api/users/me — Retourner le profil de l'utilisateur connecté
const monProfil = async (req, res) => {
  try {
    return succes(res, req.user); // req.user est déjà sans password (voir middleware)
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération du profil');
  }
};

// PUT /api/users/me — Modifier le profil
const modifierProfil = async (req, res) => {
  try {
    const { prenom, nom, telephone, adresse } = req.body;
    await req.user.update({ prenom, nom, telephone, adresse });
    return succes(res, req.user, 'Profil mis à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors de la mise à jour du profil');
  }
};

// PUT /api/users/me/password — Changer le mot de passe
const changerMotDePasse = async (req, res) => {
  try {
    const { ancienPassword, nouveauPassword } = req.body;

    // Récupérer le user avec le mot de passe (excluded par défaut)
    const userAvecPassword = await User.findByPk(req.user.id);
    const valide = await bcrypt.compare(ancienPassword, userAvecPassword.password);

    if (!valide) {
      return erreur(res, 'Ancien mot de passe incorrect', 400);
    }

    const hash = await bcrypt.hash(nouveauPassword, 12);
    await userAvecPassword.update({ password: hash, refresh_token: null }); // Déconnecter les autres sessions

    return succes(res, null, 'Mot de passe modifié avec succès');
  } catch (err) {
    return erreur(res, 'Erreur lors du changement de mot de passe');
  }
};

// PUT /api/users/me/avatar — Changer la photo de profil
const changerAvatar = async (req, res) => {
  try {
    if (!req.file) return erreur(res, 'Aucun fichier reçu', 400);

    // Supprimer l'ancien avatar s'il existe
    if (req.user.avatar) {
      const ancienChemin = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.avatar));
      if (fs.existsSync(ancienChemin)) fs.unlinkSync(ancienChemin);
    }

    const cheminAvatar = `/uploads/avatars/${req.file.filename}`; // Chemin public
    await req.user.update({ avatar: cheminAvatar });

    return succes(res, { avatar: cheminAvatar }, 'Photo de profil mise à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors du changement d\'avatar');
  }
};

// GET /api/users/admins — Liste des admins (accessible aux parents pour la messagerie)
const listerAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: ['admin', 'super_admin'], actif: true },
      attributes: ['id', 'prenom', 'nom', 'role'],
      order: [['prenom', 'ASC']]
    });
    return succes(res, admins);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des admins');
  }
};

// GET /api/users — Liste tous les utilisateurs (admin)
const listerUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refresh_token', 'token_reset'] },
      order: [['created_at', 'DESC']]
    });
    return succes(res, users);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des utilisateurs');
  }
};

// GET /api/users/:id — Détail d'un utilisateur (admin)
const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_reset'] }
    });
    if (!user) return erreur(res, 'Utilisateur non trouvé', 404);
    return succes(res, user);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération');
  }
};

// PUT /api/users/:id/activer — Activer ou désactiver un compte
const toggleActif = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return erreur(res, 'Utilisateur non trouvé', 404);

    await user.update({ actif: !user.actif });
    return succes(res, null, `Compte ${user.actif ? 'activé' : 'désactivé'}`);
  } catch (err) {
    return erreur(res, 'Erreur lors de la modification');
  }
};

// DELETE /api/users/:id — Supprimer un compte
// super_admin : peut supprimer tout le monde (sauf lui-même)
// admin       : peut supprimer uniquement les parents
const supprimerUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return erreur(res, 'Utilisateur non trouvé', 404);

    if (user.id === req.user.id)
      return erreur(res, 'Impossible de supprimer votre propre compte', 400);

    // Un admin simple ne peut pas supprimer un autre admin ou super_admin
    if (req.user.role === 'admin' && user.role !== 'parent')
      return erreur(res, 'Vous n\'êtes pas autorisé à supprimer ce compte', 403);

    await user.destroy();
    return succes(res, null, 'Compte supprimé');
  } catch (err) {
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { monProfil, modifierProfil, changerMotDePasse, changerAvatar, listerAdmins, listerUsers, getUser, toggleActif, supprimerUser };
