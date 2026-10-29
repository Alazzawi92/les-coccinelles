// ============================================================
// FICHIER  : joursOuvres.js
// RÔLE     : Nombre de jours d'ouverture de la crèche entre deux dates
//            (lundi au vendredi, hors jours fériés français).
//            Même calcul que le serveur (backend/src/utils/joursOuvres.js) :
//            le serveur renvoie "jours_ouvres" avec chaque absence (valeur
//            de référence pour la facturation) ; ce fichier sert à l'aperçu
//            dans le formulaire, avant l'envoi.
// ============================================================

// Dimanche de Pâques (algorithme de Meeus / Jones / Butcher)
const dimanchePaques = (annee) => {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(annee, mois - 1, jour);
};

// Calculs en UTC : aucun décalage de fuseau horaire
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const JOUR_MS = 86400000;

// Les 11 jours fériés d'une année ("AAAA-MM-JJ")
export const joursFeries = (annee) => {
  const paques = dimanchePaques(annee);
  return new Set([
    `${annee}-01-01`, iso(paques + JOUR_MS), `${annee}-05-01`, `${annee}-05-08`,
    iso(paques + 39 * JOUR_MS), iso(paques + 50 * JOUR_MS), `${annee}-07-14`,
    `${annee}-08-15`, `${annee}-11-01`, `${annee}-11-11`, `${annee}-12-25`
  ]);
};

// Jours d'ouverture entre deux dates incluses ("AAAA-MM-JJ")
export const compterJoursOuvres = (debut, fin) => {
  if (!debut || !fin) return 0;
  let jour = Date.parse(`${String(debut).slice(0, 10)}T00:00:00Z`);
  const dernier = Date.parse(`${String(fin).slice(0, 10)}T00:00:00Z`);
  if (isNaN(jour) || isNaN(dernier) || jour > dernier) return 0;
  const feries = {};
  let total = 0;
  for (; jour <= dernier; jour += JOUR_MS) {
    const d = new Date(jour);
    const semaine = d.getUTCDay();                               // 0 = dimanche, 6 = samedi
    const annee = d.getUTCFullYear();
    feries[annee] = feries[annee] || joursFeries(annee);
    if (semaine !== 0 && semaine !== 6 && !feries[annee].has(iso(jour))) total += 1;
  }
  return total;
};
