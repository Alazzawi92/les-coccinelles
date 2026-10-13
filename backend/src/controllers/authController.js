// Contrôleur d'authentification — Les Coccinelles
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { User } = require('../models');
const { genererAccessToken, genererRefreshToken, verifierRefreshToken } = require('../config/jwt');
const { envoyerVerificationEmail, envoyerResetMotDePasse } = require('../services/mail.service');
const { succes, erreur, cree } = require('../utils/response');
const { OAuth2Client } = require('google-auth-library');

// Client Google utilisé uniquement pour vérifier la signature des jetons
// reçus du bouton "Se connecter avec Google" (aucun appel à l'API Google).
const clientGoogle = new OAuth2Client();

// ── RÉPONSE DE CONNEXION COMMUNE ────────────────────────────────────
// Génère les tokens JWT et renvoie le profil, pour la connexion
// classique (email + mot de passe) comme pour la connexion Google.
const repondreConnexion = async (res, user) => {
  // Générer les deux tokens JWT
  const accessToken  = genererAccessToken(user.id, user.role);
  const refreshToken = genererRefreshToken(user.id);

  // Sauvegarder le refresh token en base (pour pouvoir le révoquer)
  await user.update({ refresh_token: refreshToken });

  // Retourner les tokens et les infos utilisateur (sans données sensibles)
  return succes(res, {
    accessToken,
    refreshToken,
    user: {
      id:            user.id,
      email:         user.email,
      prenom:        user.prenom,
      nom:           user.nom,
      role:          user.role,
      avatar:        user.avatar,
      email_verifie: user.email_verifie
    }
  }, 'Connexion réussie');
};

// ── INSCRIPTION ─────────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, prenom, nom, telephone } = req.body;

    // Vérifier si l'email existe déjà en base
    const existant = await User.findOne({ where: { email } });
    if (existant) {
      return erreur(res, 'Cette adresse email est déjà utilisée', 409);
    }

    // Hasher le mot de passe avec bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Générer un token de vérification email
    const tokenVerification = crypto.randomBytes(32).toString('hex');

    // Créer l'utilisateur en base de données (actif: false = en attente de validation admin)
    const user = await User.create({
      email,
      password:     passwordHash,
      prenom,
      nom,
      telephone:    telephone || null,
      actif:        false, // Bloqué jusqu'à validation par l'administrateur
      token_reset:  tokenVerification,
      token_expire: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Envoyer l'email de vérification (ne pas bloquer si échec)
    try {
      await envoyerVerificationEmail(email, prenom, tokenVerification);
    } catch (mailErr) {
      console.warn('Email de vérification non envoyé :', mailErr.message);
    }

    // Retourner le succès sans le mot de passe
    return cree(res, {
      id:     user.id,
      email:  user.email,
      prenom: user.prenom,
      nom:    user.nom,
      role:   user.role
    }, 'Compte créé. Un administrateur doit valider votre accès avant que vous puissiez vous connecter.');

  } catch (err) {
    console.error('Erreur register :', err);
    return erreur(res, 'Erreur lors de la création du compte');
  }
};

// ── CONNEXION ───────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Rechercher l'utilisateur avec le mot de passe (inclus exceptionnellement ici)
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return erreur(res, 'Email ou mot de passe incorrect', 401);
    }

    // Vérifier que le compte est actif (en attente de validation ou désactivé)
    if (!user.actif) {
      return erreur(res, 'Votre compte est en attente de validation par l\'administrateur', 403);
    }

    // Compte créé via Google : pas de mot de passe local à comparer
    if (!user.password) {
      return erreur(res, 'Ce compte utilise la connexion Google. Cliquez sur « Se connecter avec Google » ou définissez un mot de passe via « Oublié ? ».', 401);
    }

    // Vérifier le mot de passe avec bcrypt
    const motDePasseValide = await bcrypt.compare(password, user.password);
    if (!motDePasseValide) {
      return erreur(res, 'Email ou mot de passe incorrect', 401);
    }

    return repondreConnexion(res, user);

  } catch (err) {
    console.error('Erreur login :', err);
    return erreur(res, 'Erreur lors de la connexion');
  }

};


// ── CONNEXION / INSCRIPTION AVEC GOOGLE ─────────────────────────────
// POST /api/auth/google
// Le frontend envoie le jeton d'identité (ID token) fourni par Google.
// On vérifie nous-mêmes sa signature et son destinataire : on ne fait
// jamais confiance aux infos envoyées directement par le navigateur.
const googleLogin = async (req, res) => {
  try {
    // Fonctionnalité désactivée si aucun Client ID n'est configuré
    if (!process.env.GOOGLE_CLIENT_ID) {
      return erreur(res, "La connexion Google n'est pas activée", 503);
    }

    // Vérifier la signature du jeton et qu'il a bien été émis pour NOTRE application
    let infos;
    try {
      const ticket = await clientGoogle.verifyIdToken({
        idToken:  req.body.credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      infos = ticket.getPayload();
    } catch {
      return erreur(res, 'Jeton Google invalide ou expiré', 401);
    }

    // Refuser une adresse non vérifiée par Google : sinon quelqu'un pourrait
    // se faire passer pour le propriétaire d'un compte existant
    if (!infos.email || !infos.email_verified) {
      return erreur(res, "Votre adresse Google n'est pas vérifiée", 401);
    }

    const email = infos.email.toLowerCase();

    // Chercher le compte : d'abord par identifiant Google, sinon par email
    let user = await User.findOne({ where: { google_id: infos.sub } })
            || await User.findOne({ where: { email } });

    // Les comptes administrateurs se connectent uniquement par mot de passe
    if (user && user.role !== 'parent') {
      return erreur(res, 'Les comptes administrateurs doivent se connecter avec leur mot de passe', 403);
    }

    if (!user) {
      // Aucun compte : créer un compte parent sans mot de passe,
      // bloqué jusqu'à validation par l'administrateur (comme /register)
      user = await User.create({
        email,
        password:      null,
        google_id:     infos.sub,
        prenom:        infos.given_name  || email.split('@')[0],
        nom:           infos.family_name || '-',
        actif:         false,
        email_verifie: true // Adresse déjà vérifiée par Google
      });

      return cree(res, null, 'Compte créé avec Google. Un administrateur doit valider votre accès avant que vous puissiez vous connecter.');
    }

    // Compte existant pas encore relié à Google : on le relie
    if (!user.google_id) {
      await user.update({ google_id: infos.sub, email_verifie: true });
    }

    // Même règle que la connexion classique : compte validé obligatoire
    if (!user.actif) {
      return erreur(res, 'Votre compte est en attente de validation par l\'administrateur', 403);
    }

    return repondreConnexion(res, user);

  } catch (err) {
    console.error('Erreur connexion Google :', err);
    return erreur(res, 'Erreur lors de la connexion avec Google');
  }
};

// ── DÉCONNEXION ─────────────────────────────────────────────────────
// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    // Supprimer le refresh token en base pour le révoquer
    if (req.user) {
      await req.user.update({ refresh_token: null });
    }
    return succes(res, null, 'Déconnexion réussie');
  } catch (err) {
    console.error('Erreur logout :', err);
    return erreur(res, 'Erreur lors de la déconnexion');
  }
};

// ── RENOUVELLEMENT DU TOKEN ─────────────────────────────────────────
// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: tokenRecu } = req.body;

    if (!tokenRecu) {
      return erreur(res, 'Refresh token manquant', 401);
    }

    // Vérifier la validité du refresh token
    const decoded = verifierRefreshToken(tokenRecu);

    // Chercher l'utilisateur et vérifier que le token correspond
    const user = await User.findOne({
      where: { id: decoded.id, refresh_token: tokenRecu }
    });

    if (!user || !user.actif) {
      return erreur(res, 'Token invalide ou compte désactivé', 403);
    }

    // Générer un nouvel access token
    const nouvelAccessToken = genererAccessToken(user.id, user.role);

    return succes(res, { accessToken: nouvelAccessToken }, 'Token renouvelé');

  } catch (err) {
    return erreur(res, 'Refresh token invalide ou expiré', 403);
  }
};

// ── MOT DE PASSE OUBLIÉ ─────────────────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Toujours répondre "OK" même si email inexistant (sécurité anti-énumération)
    const user = await User.findOne({ where: { email } });

    if (user) {
      // Générer un token de reset
      const token  = crypto.randomBytes(32).toString('hex');
      const expire = new Date(Date.now() + 60 * 60 * 1000); // Expire dans 1 heure

      await user.update({ token_reset: token, token_expire: expire });

      // Envoyer l'email de reset
      try {
        await envoyerResetMotDePasse(email, user.prenom, token);
      } catch (mailErr) {
        console.warn('Email reset non envoyé :', mailErr.message);
      }
    }

    // Toujours retourner la même réponse (ne pas révéler si l'email existe)
    return succes(res, null, 'Si cet email existe, un lien de réinitialisation a été envoyé.');

  } catch (err) {
    console.error('Erreur forgot-password :', err);
    return erreur(res, 'Erreur lors de la demande de réinitialisation');
  }
};

// ── RÉINITIALISATION DU MOT DE PASSE ────────────────────────────────
// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Chercher l'utilisateur avec ce token non expiré
    const user = await User.findOne({ where: { token_reset: token } });

    if (!user || !user.token_expire || user.token_expire < new Date()) {
      return erreur(res, 'Token invalide ou expiré', 400);
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe et supprimer le token
    await user.update({
      password:     passwordHash,
      token_reset:  null,
      token_expire: null,
      refresh_token: null // Déconnecter toutes les sessions actives
    });

    return succes(res, null, 'Mot de passe réinitialisé avec succès');

  } catch (err) {
    console.error('Erreur reset-password :', err);
    return erreur(res, 'Erreur lors de la réinitialisation');
  }
};

// ── VÉRIFICATION EMAIL ───────────────────────────────────────────────
// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Chercher l'utilisateur avec ce token non expiré
    const user = await User.findOne({ where: { token_reset: token } });

    if (!user || !user.token_expire || user.token_expire < new Date()) {
      return erreur(res, 'Lien de vérification invalide ou expiré', 400);
    }

    // Marquer l'email comme vérifié et supprimer le token
    await user.update({
      email_verifie: true,
      token_reset:   null,
      token_expire:  null
    });

    return succes(res, null, 'Email vérifié avec succès');

  } catch (err) {
    console.error('Erreur verify-email :', err);
    return erreur(res, 'Erreur lors de la vérification');
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail
};
