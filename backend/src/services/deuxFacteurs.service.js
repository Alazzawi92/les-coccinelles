// Service de double authentification — Les Coccinelles
// À chaque connexion, un code à 6 chiffres est envoyé par email.
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const { DeuxFacteurs } = require('../models');
const { envoyerCodeConnexion } = require('./mail.service');

const DUREE_CODE_MS   = 10 * 60 * 1000;  // Un code reste valable 10 minutes
const DELAI_RENVOI_MS = 60 * 1000;       // Un seul envoi par minute

// Clé dédiée à un usage, dérivée de JWT_SECRET
const cleDerivee = (usage) => Buffer.from(
  crypto.hkdfSync('sha256', process.env.JWT_SECRET, 'les-coccinelles-2fa', usage, 32)
);

// ── Jeton de l'étape "code" ──────────────────────────────────
// Signé avec sa propre clé : il n'est jamais accepté comme jeton de session,
// et un jeton de session n'est jamais accepté ici.
// 20 minutes : laisse le temps de redemander un code valable 10 minutes.
const creerJetonEtape = (userId) =>
  jwt.sign({ id: userId }, cleDerivee('jeton-etape'), { expiresIn: '20m', algorithm: 'HS256' });

const lireJetonEtape = (jeton) =>
  jwt.verify(jeton, cleDerivee('jeton-etape'), { algorithms: ['HS256'] });

// ── Code de connexion ────────────────────────────────────────
// L'identifiant du compte entre dans l'empreinte : un code ne vaut que pour son compte
const empreinteCode = (userId, code) =>
  crypto.createHmac('sha256', cleDerivee('code-connexion')).update(`${userId}:${code}`).digest('hex');

// Compare deux empreintes en temps constant
const memeEmpreinte = (a, b) => crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Crée un nouveau code pour le compte (remplace le précédent) et le renvoie
const creerCode = async (userId) => {
  const code = String(crypto.randomInt(1000000)).padStart(6, '0');
  const maintenant = Date.now();
  await DeuxFacteurs.upsert({
    user_id:        userId,
    code_empreinte: empreinteCode(userId, code),
    expire_le:      new Date(maintenant + DUREE_CODE_MS),
    envoye_le:      new Date(maintenant),
    tentatives:     0,
    bloque_jusqu:   null
  });
  return code;
};

// Crée et envoie un code. Renvoie 'envoye', 'trop_tot', 'bloque' ou 'echec_envoi'.
const envoyerNouveauCode = async (user) => {
  const ligne = await DeuxFacteurs.findByPk(user.id);
  if (ligne?.bloque_jusqu && new Date(ligne.bloque_jusqu) > new Date()) return 'bloque';
  if (ligne?.code_empreinte && ligne.envoye_le && Date.now() - new Date(ligne.envoye_le) < DELAI_RENVOI_MS) return 'trop_tot';

  const code = await creerCode(user.id);
  try {
    await envoyerCodeConnexion(user.email, user.prenom, code);
    return 'envoye';
  } catch (err) {
    console.error('Erreur envoi du code de connexion :', err.message);
    await DeuxFacteurs.update({ envoye_le: null }, { where: { user_id: user.id } }); // Nouvel essai possible tout de suite
    return 'echec_envoi';
  }
};

// Affiche "s***@gmail.com" : la personne sait où chercher sans exposer l'adresse complète
const masquerEmail = (email) => {
  const [nom, domaine] = email.split('@');
  return `${nom[0]}***@${domaine}`;
};

// Après un mot de passe ou un compte Google valide : envoie le code, sans ouvrir de session
const etapeDeuxFacteurs = async (user) => {
  const statut = await envoyerNouveauCode(user);
  if (statut === 'bloque') return { bloque: true };
  return {
    jeton_2fa:    creerJetonEtape(user.id),
    email_masque: masquerEmail(user.email),
    email_envoye: statut !== 'echec_envoi' // Si false : la page propose de renvoyer le code
  };
};

module.exports = { lireJetonEtape, empreinteCode, memeEmpreinte, creerCode, envoyerNouveauCode, etapeDeuxFacteurs };
