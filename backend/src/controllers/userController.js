// Contrôleur utilisateurs — Les Coccinelles
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const path    = require('path');
const fs      = require('fs');
const { User } = require('../models');
const { succes, erreur, cree } = require('../utils/response');
const { envoyerCompteActive, envoyerInvitationEquipe } = require('../services/mail.service');

const DUREE_INVITATION_MS = 72 * 60 * 60 * 1000; // Lien d'invitation valable 72 heures

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

    // Compte créé via Google : aucun ancien mot de passe à vérifier
    if (!userAvecPassword.password) {
      return erreur(res, 'Votre compte utilise la connexion Google. Utilisez « Mot de passe oublié » pour définir un mot de passe.', 400);
    }

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

    const activation = !user.actif;

    // Un compte parent ne peut être activé qu'une fois l'email confirmé
    // (évite d'ouvrir un compte avec une adresse fausse ou mal saisie)
    if (activation && user.role === 'parent' && !user.email_verifie) {
      return erreur(res, 'Impossible d\'activer ce compte : le parent n\'a pas encore confirmé son adresse email', 400);
    }

    await user.update({ actif: activation });

    // Activation : le parent est prévenu par email qu'il peut se connecter.
    // Un échec d'envoi (SMTP indisponible) n'annule pas l'activation.
    if (activation) {
      try {
        await envoyerCompteActive(user.email, user.prenom);
      } catch (errMail) {
        console.error('Erreur email compte activé :', errMail.message);
      }
    }

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

// ── COMPTES DE L'ÉQUIPE (super admin uniquement) ─────────────────────

// GET /api/users/equipe — Liste des comptes admin et super admin
const listerEquipe = async (req, res) => {
  try {
    const membres = await User.findAll({
      where: { role: ['admin', 'super_admin'] },
      attributes: ['id', 'prenom', 'nom', 'email', 'role', 'actif', 'password', 'created_at'],
      order: [['created_at', 'DESC']],
      raw:   true // Objets simples (pas d'instances Sequelize)
    });

    // Le mot de passe sert seulement à savoir si l'invitation a été acceptée :
    // il est retiré de chaque ligne et n'est jamais renvoyé au navigateur
    const liste = membres.map(({ password, ...membre }) => ({
      ...membre,
      invitation_en_attente: !password // Pas encore de mot de passe choisi
    }));
    return succes(res, liste);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des comptes de l\'équipe');
  }
};

// POST /api/users/equipe — Créer un compte admin ou super admin.
// Aucun mot de passe n'est choisi ici : la personne reçoit un lien par
// email et choisit le sien. Le super admin ne le connaît donc jamais.
const creerCompteEquipe = async (req, res) => {
  try {
    const { email, prenom, nom, role } = req.body;

    // Une adresse = un seul compte
    const existant = await User.findOne({ where: { email } });
    if (existant) return erreur(res, 'Cette adresse email est déjà utilisée', 409);

    // Jeton du lien "choisir mon mot de passe" (même mécanisme que le mot de passe oublié)
    const token = crypto.randomBytes(32).toString('hex');

    const membre = await User.create({
      email,
      prenom,
      nom,
      role,                    // 'admin' ou 'super_admin' (vérifié par la route)
      password:      null,     // Choisi par la personne via le lien reçu
      actif:         true,     // Créé par le super admin : pas de validation à attendre
      email_verifie: false,    // Passe à vrai quand la personne utilise le lien
      token_reset:   token,
      token_expire:  new Date(Date.now() + DUREE_INVITATION_MS)
    });

    // Sans email, la personne ne pourrait jamais choisir son mot de passe :
    // en cas d'échec, on annule la création pour que le super admin réessaie
    try {
      await envoyerInvitationEquipe(email, prenom, role, token);
    } catch (errMail) {
      console.error('Erreur email invitation équipe :', errMail.message);
      await membre.destroy();
      return erreur(res, 'L\'email d\'invitation n\'a pas pu être envoyé. Le compte n\'a pas été créé, réessayez.', 502);
    }

    return cree(res, {
      id:     membre.id,
      email:  membre.email,
      prenom: membre.prenom,
      nom:    membre.nom,
      role:   membre.role
    }, `Compte créé. Une invitation a été envoyée à ${email}.`);
  } catch (err) {
    console.error('Erreur création compte équipe :', err);
    return erreur(res, 'Erreur lors de la création du compte');
  }
};

module.exports = { monProfil, modifierProfil, changerMotDePasse, changerAvatar, listerAdmins, listerUsers, getUser, toggleActif, supprimerUser, listerEquipe, creerCompteEquipe };
