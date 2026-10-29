// Service de nettoyage automatique — Les Coccinelles
//
// Supprime les comptes parents dont l'email n'a pas été confirmé dans les
// 24 heures suivant la création (le lien de confirmation expire au bout de
// 24 h, voir authController.register). Avantages :
//  - RGPD (minimisation) : on ne garde pas les données d'une personne qui
//    n'a jamais finalisé son inscription ;
//  - l'adresse email est libérée : le parent peut recréer un compte ;
//  - la liste "En attente" de l'admin ne contient que des comptes réels.
//
// Ne sont JAMAIS supprimés : les comptes admin / super admin, les comptes
// actifs, et les comptes dont l'email est confirmé (dont les comptes Google).

const { Op } = require('sequelize');
const { User } = require('../models');

const DELAI_CONFIRMATION_MS = 24 * 60 * 60 * 1000; // 24 heures
const INTERVALLE_MS         = 60 * 60 * 1000;      // Vérification toutes les heures

// Supprime les comptes non confirmés depuis plus de 24 h ; renvoie leur nombre
const supprimerComptesNonConfirmes = async () => {
  const limite = new Date(Date.now() - DELAI_CONFIRMATION_MS);
  const nombre = await User.destroy({
    where: {
      role:          'parent',
      email_verifie: false,
      actif:         false,
      created_at:    { [Op.lt]: limite }
    }
  });
  if (nombre > 0) {
    console.log(`🧹 ${nombre} compte(s) non confirmé(s) depuis plus de 24 h supprimé(s)`);
  }
  return nombre;
};

// Lance le nettoyage au démarrage du serveur, puis toutes les heures.
// Une erreur (BDD indisponible...) est journalisée sans arrêter le serveur.
const demarrerNettoyageAutomatique = () => {
  const executer = () => supprimerComptesNonConfirmes()
    .catch(err => console.error('Erreur nettoyage des comptes :', err.message));
  executer();
  setInterval(executer, INTERVALLE_MS);
};

module.exports = { supprimerComptesNonConfirmes, demarrerNettoyageAutomatique };
