// Script d'import des partenaires de la crèche — Les Coccinelles
//
// Ajoute dans la table « partenaires » la liste de assets/partenaires/partenaires.json
// (issue du document pédagogique de la crèche), avec les logos vérifiés du
// même dossier. Chaque logo est copié dans uploads/partenaires sous un nom
// aléatoire, comme un logo envoyé depuis le back office.
//
// Un partenaire déjà présent (même nom) n'est jamais modifié ni dupliqué :
// le script peut être relancé sans risque. Ensuite, tout se gère depuis
// le back office (Admin → Partenaires).
//
// Utilisation (depuis le dossier backend) :
//   node scripts/importer-partenaires.js              → simulation (aucune modification)
//   node scripts/importer-partenaires.js --appliquer  → import réel
// Sous Docker : docker exec coccinelles-backend node scripts/importer-partenaires.js --appliquer

require('dotenv').config();
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const sequelize      = require('../src/config/database');
const { Partenaire } = require('../src/models');

const appliquer      = process.argv.includes('--appliquer');                // Sans lui : simulation
const DOSSIER_SOURCE = path.join(__dirname, '../assets/partenaires');       // Liste + logos vérifiés
const DOSSIER_UPLOAD = path.join(__dirname, '../uploads/partenaires');      // Logos servis par le site

const importer = async () => {
  const liste = JSON.parse(fs.readFileSync(path.join(DOSSIER_SOURCE, 'partenaires.json'), 'utf8'));
  fs.mkdirSync(DOSSIER_UPLOAD, { recursive: true });

  let ajoutes = 0;
  for (const [ordre, p] of liste.entries()) {
    // Déjà présent : on n'y touche pas (il a pu être modifié dans le back office)
    if (await Partenaire.findOne({ where: { nom: p.nom } })) {
      console.log(`= déjà présent  : ${p.nom}`);
      continue;
    }

    // Logo : copié sous un nom aléatoire (même règle que les envois du back office)
    let logo = null;
    if (p.logo) {
      const source = path.join(DOSSIER_SOURCE, path.basename(p.logo)); // Nom seul : reste dans le dossier
      if (!fs.existsSync(source)) throw new Error(`Logo introuvable : ${source}`);
      const nom = `${crypto.randomBytes(16).toString('hex')}${path.extname(source).toLowerCase()}`;
      if (appliquer) fs.copyFileSync(source, path.join(DOSSIER_UPLOAD, nom));
      logo = `/uploads/partenaires/${nom}`;
    }

    if (appliquer) {
      await Partenaire.create({ nom: p.nom, categorie: p.categorie || null, lien: p.lien || null, logo, ordre });
    }
    ajoutes++;
    console.log(`+ ${appliquer ? 'ajouté' : 'à ajouter'}     : ${p.nom}${logo ? ' (logo)' : ''}${p.lien ? ' (lien)' : ''}`);
  }

  console.log(`\n${ajoutes} partenaire(s) ${appliquer ? 'ajouté(s)' : 'à ajouter'} sur ${liste.length}.`);
  if (!appliquer && ajoutes) console.log('Simulation : relancer avec --appliquer pour importer.');
};

// Message d'erreur toujours lisible : certaines erreurs de connexion
// (ex : plusieurs adresses refusées) n'ont pas de « message » propre
const decrireErreur = (err) => {
  const cause = err.original || err.parent || err;                         // Erreur MySQL d'origine
  const details = [err.name, cause.code, cause.message || err.message].filter(Boolean).join(' — ');
  const sousErreurs = (cause.errors || []).map(e => `${e.code || ''} ${e.address || ''}:${e.port || ''}`.trim());
  return details + (sousErreurs.length ? ` (${sousErreurs.join(', ')})` : '');
};

importer()
  .catch(err => {
    console.error('Erreur import partenaires :', decrireErreur(err));
    // Connexion impossible : variables de la base absentes (.env) ou incorrectes
    if (/Connection|ECONNREFUSED|ENOTFOUND|ER_ACCESS_DENIED/i.test(decrireErreur(err))) {
      console.error(`Base visée : ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'coccinelles_db'}`);
      console.error('Vérifier les variables DB_HOST, DB_NAME, DB_USER, DB_PASSWORD (fichier .env ou variables du site).');
    }
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
