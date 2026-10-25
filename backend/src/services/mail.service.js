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

// Échappe le HTML d'un texte saisi (ex : commentaire de l'admin)
// avant de l'insérer dans le corps d'un email
const echapperHtml = (texte = '') => String(texte)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Envoyer un email au parent quand le statut de son inscription change.
// commentaire : message de l'admin (optionnel), affiché en encadré.
const envoyerStatutInscription = async ({ email, prenom, prenomEnfant, statut, commentaire, inscriptionId }) => {
  const lien = `${process.env.FRONTEND_URL}/parent/mes-enfants?demande=${inscriptionId}`;

  const enfant = echapperHtml(prenomEnfant);  // Prénom saisi par le parent : échappé
  const textes = {
    accepte:       `Bonne nouvelle : la demande d'inscription de ${enfant} a été <strong>acceptée</strong>.`,
    refuse:        `La demande d'inscription de ${enfant} a été <strong>refusée</strong>.`,
    incomplet:     `Le dossier d'inscription de ${enfant} est <strong>incomplet</strong>. Merci d'ajouter les documents manquants depuis votre espace parent.`,
    liste_attente: `${enfant} est inscrit(e) sur notre <strong>liste d'attente</strong>.`,
    en_cours:      `Le dossier d'inscription de ${enfant} est <strong>en cours de traitement</strong>.`
  };
  const texte  = textes[statut] || `Le statut de l'inscription de ${enfant} a été mis à jour.`;
  const bouton = statut === 'incomplet' ? 'Compléter mon dossier' : 'Voir ma demande';

  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: `Inscription de ${prenomEnfant} — Les Coccinelles`,
    html: `
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>${texte}</p>
      ${commentaire ? `
        <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:12px 16px;margin:16px 0;border-radius:6px;">
          <strong>Message de la crèche :</strong><br>${echapperHtml(commentaire).replace(/\n/g, '<br>')}
        </div>` : ''}
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        ${bouton}
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px;">Crèche Les Coccinelles — Puilboreau</p>
    `
  });
};

module.exports = {
  envoyerVerificationEmail,
  envoyerResetMotDePasse,
  envoyerStatutInscription
};
