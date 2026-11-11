// Contrôleur de la double authentification par email — Les Coccinelles
const sequelize = require('../config/database');
const { User, DeuxFacteurs } = require('../models');
const { creerSession } = require('./authController');
const { succes, erreur } = require('../utils/response');
const { espaceParentsOuvert, MESSAGE_ESPACE_FERME } = require('../services/parametres.service');
const { lireJetonEtape, empreinteCode, memeEmpreinte, envoyerNouveauCode } = require('../services/deuxFacteurs.service');

const MAX_TENTATIVES   = 5;               // Codes faux avant annulation du code
const DUREE_BLOCAGE_MS = 15 * 60 * 1000;  // 15 minutes sans nouveau code ensuite

const MESSAGE_BLOQUE      = 'Trop de codes incorrects. Réessayez dans 15 minutes.';
const MESSAGE_RECONNEXION = 'Votre session de connexion a expiré. Reconnectez-vous.';

// Middleware : identifie le compte grâce au jeton reçu après le mot de passe
const verifierJetonEtape = async (req, res, next) => {
  try {
    let decode;
    try {
      decode = lireJetonEtape(req.body.jeton);
    } catch {
      return erreur(res, MESSAGE_RECONNEXION, 401);
    }

    const user = await User.findByPk(decode.id);
    if (!user || !user.actif) return erreur(res, MESSAGE_RECONNEXION, 401);
    // Mêmes règles qu'à la connexion, l'espace parents a pu fermer entre-temps
    if (user.role === 'parent' && !(await espaceParentsOuvert())) {
      return erreur(res, MESSAGE_ESPACE_FERME, 403);
    }

    req.compte = user;
    next();
  } catch (err) {
    console.error('Erreur jeton de connexion :', err);
    return erreur(res, 'Erreur lors de la vérification');
  }
};

// POST /api/auth/2fa/verifier — Vérifie le code reçu par email, puis ouvre la session
const verifier = async (req, res) => {
  try {
    const user = req.compte;

    // Transaction + ligne verrouillée : un code ne peut pas servir deux fois,
    // et des essais en parallèle ne contournent pas le compteur
    const statut = await sequelize.transaction(async (transaction) => {
      const ligne = await DeuxFacteurs.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
      const maintenant = new Date();
      if (ligne?.bloque_jusqu && new Date(ligne.bloque_jusqu) > maintenant) return 'bloque';
      if (!ligne?.code_empreinte || new Date(ligne.expire_le) <= maintenant) return 'expire';

      if (memeEmpreinte(ligne.code_empreinte, empreinteCode(user.id, req.body.code))) {
        await ligne.update({ code_empreinte: null, expire_le: null, envoye_le: null, tentatives: 0 }, { transaction });
        return 'ok';
      }

      // Code faux : au bout de 5 essais, le code est annulé et le compte bloqué
      const tentatives = ligne.tentatives + 1;
      if (tentatives >= MAX_TENTATIVES) {
        await ligne.update({
          code_empreinte: null, expire_le: null, envoye_le: null, tentatives: 0,
          bloque_jusqu: new Date(maintenant.getTime() + DUREE_BLOCAGE_MS)
        }, { transaction });
        return 'bloque';
      }
      await ligne.update({ tentatives }, { transaction });
      return 'faux';
    });

    if (statut === 'bloque') return erreur(res, MESSAGE_BLOQUE, 429);
    if (statut === 'expire') return erreur(res, 'Ce code a expiré. Demandez un nouveau code.', 400);
    if (statut === 'faux')   return erreur(res, 'Code incorrect', 401);

    return succes(res, await creerSession(user), 'Connexion réussie');
  } catch (err) {
    console.error('Erreur vérification du code :', err);
    return erreur(res, 'Erreur lors de la vérification');
  }
};

// POST /api/auth/2fa/renvoyer — Envoie un nouveau code (un par minute au maximum)
const renvoyer = async (req, res) => {
  try {
    const statut = await envoyerNouveauCode(req.compte);
    if (statut === 'bloque')      return erreur(res, MESSAGE_BLOQUE, 429);
    if (statut === 'trop_tot')    return erreur(res, 'Attendez une minute avant de demander un nouveau code.', 429);
    if (statut === 'echec_envoi') return erreur(res, "L'email n'a pas pu être envoyé. Réessayez dans un instant.", 503);
    return succes(res, null, 'Nouveau code envoyé');
  } catch (err) {
    console.error('Erreur renvoi du code :', err);
    return erreur(res, "Erreur lors de l'envoi du code");
  }
};

module.exports = { verifierJetonEtape, verifier, renvoyer };
