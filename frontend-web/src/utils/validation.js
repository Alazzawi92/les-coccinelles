// ============================================================
// FICHIER  : validation.js
// RÔLE     : Règles de format partagées par les formulaires.
//            Mêmes règles que le serveur (express-validator).
// ============================================================

// Prénom / nom : lettres (accents compris), espaces, apostrophe, tiret, point.
// 2 à 80 caractères. Identique à backend/src/routes/auth.routes.js.
export const RE_NOM_PERSONNE = /^[\p{L}][\p{L}\p{M}\s'’.-]{1,79}$/u;

// true si le prénom / nom est valide
export const nomPersonneValide = (valeur) => RE_NOM_PERSONNE.test(String(valeur || '').trim());
