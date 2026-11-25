// Fichiers des dossiers publics de /uploads — Les Coccinelles
// Suppression sûre d'un fichier dont le chemin est stocké en base
// (ex : "/uploads/documentation/abc.pdf") : on ne garde que le nom du
// fichier et on le cherche dans le dossier attendu, pour qu'un chemin
// modifié ("../../.env") ne puisse jamais viser un autre fichier.
const fs   = require('fs');
const path = require('path');

const RACINE_UPLOADS = path.join(__dirname, '../../uploads');

// dossier : sous-dossier attendu ('documentation', 'partenaires'...)
// chemin  : chemin enregistré en base (peut être null)
const supprimerFichierPublic = (dossier, chemin) => {
  if (!chemin) return;
  const absolu = path.join(RACINE_UPLOADS, dossier, path.basename(chemin)); // Nom seul, dossier imposé
  fs.unlink(absolu, () => {}); // Fichier déjà absent : rien à faire
};

module.exports = { supprimerFichierPublic };
