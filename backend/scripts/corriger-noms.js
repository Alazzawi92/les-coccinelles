// Script de correction des prénoms / noms — Les Coccinelles
//
// 1. Inversion prénom / nom (ex : compte Google dont le profil indique
//    "Al azzawi" comme prénom et "Sabah" comme nom).
//    Le bon ordre ne peut pas être deviné automatiquement : on inverse
//    UNIQUEMENT les comptes dont l'id est donné.
// 2. Noms enregistrés encodés en HTML par l'ancienne validation (.escape()) :
//    "D&#x27;Arc" → "D'Arc".
//
// Utilisation (depuis le dossier backend) :
//   node scripts/corriger-noms.js                          → liste les comptes (aucune modification)
//   node scripts/corriger-noms.js --inverser 30            → simulation pour le compte 30
//   node scripts/corriger-noms.js --inverser 30,31 --appliquer
//   node scripts/corriger-noms.js --entites --appliquer    → décode les noms encodés en HTML
// Sous Docker : docker exec coccinelles-backend node scripts/corriger-noms.js ...

require('dotenv').config();
const sequelize = require('../src/config/database');
const { User }  = require('../src/models');

// ── Lecture des options de la ligne de commande ──
const args      = process.argv.slice(2);
const appliquer = args.includes('--appliquer');                      // Sans lui : simulation
const idxInv    = args.indexOf('--inverser');
const idsInverser = idxInv >= 0 && args[idxInv + 1]
  ? args[idxInv + 1].split(',').map(Number).filter(Boolean)          // "30,31" → [30, 31]
  : [];
const decoderEntites = args.includes('--entites');

// Entités HTML produites par express-validator .escape()
const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#x2F;': '/', '&#x5C;': '\\', '&#96;': '`' };
const decoder = (texte) => String(texte || '').replace(/&(amp|lt|gt|quot|#x27|#x2F|#x5C|#96);/g, e => ENTITES[e]);

const executer = async () => {
  await sequelize.authenticate();
  const comptes = await User.findAll({
    attributes: ['id', 'prenom', 'nom', 'email', 'role', 'google_id'],
    order: [['id', 'ASC']]
  });

  // Sans action demandée : simple liste pour choisir les comptes à corriger
  if (!idsInverser.length && !decoderEntites) {
    console.log('Comptes (id | prénom | nom | rôle | Google) :');
    comptes.forEach(u => console.log(`  ${u.id} | ${u.prenom} | ${u.nom} | ${u.role} | ${u.google_id ? 'oui' : 'non'}`));
    console.log('\nPour inverser prénom/nom : node scripts/corriger-noms.js --inverser <id> --appliquer');
    return;
  }

  const modifications = [];

  // 1. Inversion des comptes demandés
  for (const id of idsInverser) {
    const u = comptes.find(c => c.id === id);
    if (!u) { console.log(`⚠️  Compte ${id} introuvable`); continue; }
    modifications.push({ u, prenom: u.nom, nom: u.prenom, raison: 'inversion' });
  }

  // 2. Décodage des noms encodés en HTML
  if (decoderEntites) {
    comptes.forEach(u => {
      const prenom = decoder(u.prenom);
      const nom    = decoder(u.nom);
      if (prenom !== u.prenom || nom !== u.nom) modifications.push({ u, prenom, nom, raison: 'entités HTML' });
    });
  }

  if (!modifications.length) { console.log('Aucune modification nécessaire.'); return; }

  for (const m of modifications) {
    console.log(`${appliquer ? '✅' : '🔎'} [${m.raison}] compte ${m.u.id} : "${m.u.prenom} ${m.u.nom}" → "${m.prenom} ${m.nom}"`);
    if (appliquer) await m.u.update({ prenom: m.prenom, nom: m.nom });
  }
  if (!appliquer) console.log('\nSimulation uniquement. Ajoutez --appliquer pour enregistrer.');
};

executer()
  .catch(err => { console.error('Erreur :', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
