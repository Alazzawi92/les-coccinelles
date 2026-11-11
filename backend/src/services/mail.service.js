// Service d'envoi d'emails — Les Coccinelles
const transporteur = require('../config/mail');

const MAIL_FROM = process.env.MAIL_FROM || 'noreply@lescoccinelles.fr';

// Échappe le HTML d'un texte saisi (ex : commentaire de l'admin)
// avant de l'insérer dans le corps d'un email
const echapperHtml = (texte = '') => String(texte)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Envoyer un email de vérification de compte
const envoyerVerificationEmail = async (email, prenom, token) => {
  const lien = `${process.env.FRONTEND_URL}/verify-email/${token}`; // Lien de vérification

  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Confirmez votre adresse email — Les Coccinelles',
    html: `
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>Merci de créer votre compte sur la plateforme Les Coccinelles.</p>
      <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Confirmer mon email
      </a>
      <p>Ce lien expire dans 24 heures. <strong>Sans confirmation dans ce délai, votre compte
      sera supprimé automatiquement</strong> : il vous suffira alors d'en créer un nouveau.</p>
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
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous (valable 1 heure) :</p>
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Réinitialiser mon mot de passe
      </a>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `
  });
};

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

// Envoyer un email au parent quand son adresse est confirmée (lien cliqué
// ou inscription Google) : le compte attend maintenant la validation de l'admin
const envoyerCompteEnAttente = async (email, prenom) => {
  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Votre compte est en attente de validation — Les Coccinelles',
    html: `
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>Votre adresse email est <strong>confirmée</strong>, merci !</p>
      <p>L'équipe de la crèche va maintenant vérifier et valider votre compte.
      Vous recevrez un nouvel email dès que votre compte sera actif.</p>
      <p>Vous n'avez rien d'autre à faire pour le moment.</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Crèche Les Coccinelles — Puilboreau</p>
    `
  });
};

// Envoyer le code de connexion à 6 chiffres (double authentification)
const envoyerCodeConnexion = async (email, prenom, code) => {
  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Votre code de connexion — Les Coccinelles',
    html: `
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>Voici votre code de connexion, valable 10 minutes :</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p>
      <p>Ne le communiquez à personne : la crèche ne vous le demandera jamais.</p>
      <p><strong>Si vous n'essayez pas de vous connecter</strong>, quelqu'un connaît peut-être votre mot de passe : changez-le.</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Crèche Les Coccinelles — Puilboreau</p>
    `
  });
};

// Envoyer un email au parent quand l'administrateur active son compte
const envoyerCompteActive = async (email, prenom) => {
  const lien = `${process.env.FRONTEND_URL}/connexion`;

  await transporteur.sendMail({
    from:    `"Les Coccinelles" <${MAIL_FROM}>`,
    to:      email,
    subject: 'Votre compte est activé — Les Coccinelles',
    html: `
      <h2>Bonjour ${echapperHtml(prenom)},</h2>
      <p>Bonne nouvelle : la crèche a <strong>validé votre compte</strong>.</p>
      <p>Vous pouvez dès maintenant vous connecter à votre espace parent pour
      faire une demande d'inscription et suivre votre dossier.</p>
      <a href="${lien}" style="background:#FF9800;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Me connecter
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px;">Crèche Les Coccinelles — Puilboreau</p>
    `
  });
};

module.exports = {
  envoyerCodeConnexion,
  envoyerVerificationEmail,
  envoyerResetMotDePasse,
  envoyerStatutInscription,
  envoyerCompteEnAttente,
  envoyerCompteActive
};
