// Service « Faire confiance à cet appareil » — Les Coccinelles
//
// Après un code de connexion valide, la personne peut cocher la case
// « Faire confiance à cet appareil ». Le navigateur reçoit alors une clé
// aléatoire ; aux connexions suivantes, il la renvoie avec le mot de passe
// et le code reçu par email n'est plus demandé, pendant :
//   - 30 jours pour un parent (accès limité à ses enfants)
//   - 24 heures pour l'équipe (admin, super admin : données de tous les enfants)
// Le mot de passe et la case anti-robot restent TOUJOURS demandés.
//
// Sécurité :
//   - seule l'empreinte HMAC de la clé est en base (comme le code 2FA) :
//     une copie de la base ne permet pas de se faire passer pour un appareil
//   - la durée est recalculée avec le rôle ACTUEL du compte : un parent
//     devenu membre de l'équipe passe de 30 jours à 24 heures
//   - toutes les confiances sont supprimées quand le mot de passe change
const crypto = require('crypto');
const { Op } = require('sequelize');
const { AppareilConfiance } = require('../models');

const HEURE_MS = 60 * 60 * 1000;
const MAX_APPAREILS = 10; // Au-delà, les plus anciens sont oubliés

// Durée de confiance selon le rôle (en heures)
const dureeHeures = (role) => (role === 'parent' ? 30 * 24 : 24);

// Clé dédiée à cet usage, dérivée de JWT_SECRET (comme le code 2FA)
const cleHmac = () => Buffer.from(
  crypto.hkdfSync('sha256', process.env.JWT_SECRET, 'les-coccinelles-2fa', 'appareil-confiance', 32)
);

// L'identifiant du compte entre dans l'empreinte : une clé ne vaut que pour son compte
const empreinte = (userId, cle) =>
  crypto.createHmac('sha256', cleHmac()).update(`${userId}:${cle}`).digest('hex');

// Forme attendue d'une clé : 64 caractères hexadécimaux (32 octets aléatoires)
const cleValide = (cle) => typeof cle === 'string' && /^[a-f0-9]{64}$/.test(cle);

// Vrai si ce navigateur est un appareil de confiance encore valable pour ce compte
const estAppareilDeConfiance = async (user, cle) => {
  if (!cleValide(cle)) return false;
  const appareil = await AppareilConfiance.findOne({
    where: { user_id: user.id, cle_empreinte: empreinte(user.id, cle), expire_le: { [Op.gt]: new Date() } }
  });
  if (!appareil) return false;
  // Durée recalculée avec le rôle actuel (ex : parent devenu admin → 24 h)
  const finSelonRole = new Date(appareil.created_at).getTime() + dureeHeures(user.role) * HEURE_MS;
  return finSelonRole > Date.now();
};

// Enregistre ce navigateur comme appareil de confiance et renvoie la clé
// à lui transmettre (elle n'est jamais conservée en clair côté serveur)
const ajouterAppareil = async (user) => {
  // Ménage : confiances expirées du compte supprimées
  await AppareilConfiance.destroy({ where: { user_id: user.id, expire_le: { [Op.lte]: new Date() } } });

  // Au plus MAX_APPAREILS par compte : les plus anciens sont oubliés
  const existants = await AppareilConfiance.findAll({
    where: { user_id: user.id }, order: [['created_at', 'DESC']], attributes: ['id']
  });
  const aOublier = existants.slice(MAX_APPAREILS - 1).map(a => a.id);
  if (aOublier.length) await AppareilConfiance.destroy({ where: { id: aOublier } });

  const cle = crypto.randomBytes(32).toString('hex');
  const expireLe = new Date(Date.now() + dureeHeures(user.role) * HEURE_MS);
  await AppareilConfiance.create({ user_id: user.id, cle_empreinte: empreinte(user.id, cle), expire_le: expireLe });
  return { cle, expire_le: expireLe };
};

// Supprime toutes les confiances d'un compte (mot de passe changé)
const oublierAppareils = (userId) => AppareilConfiance.destroy({ where: { user_id: userId } });

module.exports = { dureeHeures, estAppareilDeConfiance, ajouterAppareil, oublierAppareils };
