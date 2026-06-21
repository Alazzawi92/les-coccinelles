// Service d'envoi d'emails — Les Coccinelles
const transporteur = require('../config/mail');

const MAIL_FROM = process.env.MAIL_FROM || 'noreply@lescoccinelles.fr';

// Envoyer un email de vérification de compte
const envoyerVerificationEmail = async (email, prenom, token) => {
  const lien = `${process.env.FRONTEND_URL}/verify-email/${token}`; // Lien de vérification

  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Confirmez votre adresse email — Les Coccinelles',
    html: `
      <h2>Bonjour ${prenom},</h2>
      <p>Merci de créer votre compte sur la plateforme Les Coccinelles.</p>
      <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Confirmer mon email
      </a>
      <p>Ce lien expire dans 24 heures.</p>
    `
  });
};

// Envoyer un email de réinitialisation de mot de passe
const envoyerResetMotDePasse = async (email, prenom, token) => {
  const lien = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Réinitialisation de votre mot de passe — Les Coccinelles',
    html: `
      <h2>Bonjour ${prenom},</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous (valable 1 heure) :</p>
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Réinitialiser mon mot de passe
      </a>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `
  });
};

module.exports = {
  envoyerVerificationEmail,
  envoyerResetMotDePasse
};
