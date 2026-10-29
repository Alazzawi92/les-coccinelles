// Vérification des photos de la galerie — Les Coccinelles
//
// Chaque photo est enregistrée en base avec 3 fichiers (original, web,
// miniature). Si les fichiers ont disparu du disque (dossier uploads non
// sauvegardé, projet recloné, volume Docker supprimé...), la galerie
// demande des images qui n'existent plus : le serveur répond 404.
// Ce script liste ces photos "orphelines" et peut supprimer leurs fiches.
//
// Utilisation (depuis le dossier backend) :
//   node scripts/verifier-photos.js               → liste (aucune modification)
//   node scripts/verifier-photos.js --supprimer   → supprime les fiches sans fichiers
// Sous Docker : docker exec coccinelles-backend node scripts/verifier-photos.js

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');
const { GaleriePhoto, GalerieAlbum } = require('../src/models');

const supprimer = process.argv.includes('--supprimer');

// Chemin enregistré ("/uploads/photos/x.jpg") → fichier sur le disque
const surDisque = (chemin) => path.join(__dirname, '..', String(chemin || '').replace(/^\//, ''));

const executer = async () => {
  await sequelize.authenticate();
  const photos = await GaleriePhoto.findAll({ include: [{ model: GalerieAlbum, as: 'album', attributes: ['titre'] }] });
  let orphelines = 0;

  for (const p of photos) {
    // Fichiers manquants parmi les 3 versions de la photo
    const manquants = ['chemin_original', 'chemin_web', 'chemin_miniature'].filter(c => !fs.existsSync(surDisque(p[c])));
    if (!manquants.length) continue;
    orphelines += 1;
    console.log(`⚠️  Photo #${p.id} (album « ${p.album?.titre || '?'} ») — fichier(s) absent(s) : ${manquants.join(', ')}`);
    if (supprimer && manquants.length === 3) {          // Rien ne reste : la fiche est supprimée
      await p.destroy();
      console.log(`   🗑️  fiche supprimée`);
    }
  }
  console.log(`\n${photos.length} photo(s) vérifiée(s), ${orphelines} avec des fichiers manquants.`);
  if (orphelines && !supprimer) console.log('Pour supprimer les fiches sans aucun fichier : --supprimer (puis renvoyer les photos).');
};

executer()
  .catch(err => { console.error('Erreur :', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
