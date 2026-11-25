// ============================================================
// FICHIER  : limites.js
// RÔLE     : Taille maximale des documents envoyés (SOURCE UNIQUE
//            côté frontend). Même valeur que le serveur :
//            backend/src/config/limites.js — modifier les deux ensemble.
// ============================================================

// Documents, pièces justificatives, pièces jointes des messages : 5 Mo
export const TAILLE_MAX_DOCUMENT_MO = 5;
export const TAILLE_MAX_DOCUMENT    = TAILLE_MAX_DOCUMENT_MO * 1024 * 1024;

// true si le fichier dépasse la taille maximale d'un document
export const documentTropLourd = (fichier) => Boolean(fichier) && fichier.size > TAILLE_MAX_DOCUMENT;

// Logos des partenaires : 2 Mo (même valeur que TAILLE_MAX_AVATAR côté serveur)
export const TAILLE_MAX_LOGO_MO = 2;
export const logoTropLourd = (fichier) => Boolean(fichier) && fichier.size > TAILLE_MAX_LOGO_MO * 1024 * 1024;
