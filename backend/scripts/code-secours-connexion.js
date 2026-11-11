// Script de secours : affiche un code de connexion quand les emails ne partent plus.
// La personne se connecte d'abord avec son mot de passe sur le site, puis saisit
// ce code (valable 10 minutes) sur la page de vérification.
//
// Usage sous Docker : docker exec coccinelles-backend node scripts/code-secours-connexion.js email@exemple.fr
// Usage sur le serveur : node scripts/code-secours-connexion.js email@exemple.fr
require('dotenv').config();
const { sequelize, User } = require('../src/models');
const { creerCode } = require('../src/services/deuxFacteurs.service');

const afficherCode = async () => {
  const email = process.argv[2];
  if (!email) throw new Error('Indiquez l\'email du compte : node scripts/code-secours-connexion.js email@exemple.fr');

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error(`Aucun compte pour ${email}`);

  console.log(`Code de connexion pour ${user.email}, valable 10 minutes : ${await creerCode(user.id)}`);
};

afficherCode()
  .catch((err) => { console.error('ERREUR :', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
