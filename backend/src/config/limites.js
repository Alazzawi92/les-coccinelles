// Limites de taille des fichiers — Les Coccinelles
//
// SOURCE UNIQUE côté serveur. Le frontend a la même valeur dans
// frontend-web/src/config/limites.js (deux applications séparées) :
// modifier les deux fichiers ensemble.

const MO = 1024 * 1024; // 1 Mo en octets

module.exports = {
  // Documents envoyés par les familles et l'équipe : pièces justificatives,
  // documents, justificatifs d'absence, pièces jointes des messages
  TAILLE_MAX_DOCUMENT_MO: 5,
  TAILLE_MAX_DOCUMENT:    5 * MO,
  // Photos de la galerie (admin) : redimensionnées ensuite par Sharp
  TAILLE_MAX_PHOTO:       10 * MO,
  // Photo de profil
  TAILLE_MAX_AVATAR:      2 * MO
};
