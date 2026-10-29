// Jours d'ouverture de la crèche — Les Coccinelles
//
// La crèche est ouverte du lundi au vendredi, hors jours fériés français.
// Ces jours servent à la facturation : une absence du 10 au 12 novembre
// compte 2 jours (le 11 novembre est férié), pas 3.
// Même calcul côté frontend : frontend-web/src/utils/joursOuvres.js

// Dimanche de Pâques (algorithme de Meeus / Jones / Butcher), en date locale
const dimanchePaques = (annee) => {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);        // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
};

// Date UTC → "AAAA-MM-JJ" (calculs en UTC : aucun décalage de fuseau)
const iso = (d) => d.toISOString().slice(0, 10);
const plusJours = (d, n) => new Date(d.getTime() + n * 86400000);

// Les 11 jours fériés d'une année, au format "AAAA-MM-JJ"
const joursFeries = (annee) => {
  const paques = dimanchePaques(annee);
  return new Set([
    `${annee}-01-01`,              // Jour de l'an
    iso(plusJours(paques, 1)),     // Lundi de Pâques
    `${annee}-05-01`,              // Fête du travail
    `${annee}-05-08`,              // Victoire 1945
    iso(plusJours(paques, 39)),    // Ascension
    iso(plusJours(paques, 50)),    // Lundi de Pentecôte
    `${annee}-07-14`,              // Fête nationale
    `${annee}-08-15`,              // Assomption
    `${annee}-11-01`,              // Toussaint
    `${annee}-11-11`,              // Armistice 1918
    `${annee}-12-25`               // Noël
  ]);
};

// Nombre de jours d'ouverture entre deux dates incluses ("AAAA-MM-JJ")
const compterJoursOuvres = (debut, fin) => {
  if (!debut || !fin) return 0;
  let jour = new Date(`${String(debut).slice(0, 10)}T00:00:00Z`);
  const dernier = new Date(`${String(fin).slice(0, 10)}T00:00:00Z`);
  if (isNaN(jour) || isNaN(dernier) || jour > dernier) return 0;
  const feries = {};                                         // Cache par année
  let total = 0;
  while (jour <= dernier) {
    const semaine = jour.getUTCDay();                        // 0 = dimanche, 6 = samedi
    const annee   = jour.getUTCFullYear();
    feries[annee] = feries[annee] || joursFeries(annee);
    if (semaine !== 0 && semaine !== 6 && !feries[annee].has(iso(jour))) total += 1;
    jour = plusJours(jour, 1);
  }
  return total;
};

module.exports = { compterJoursOuvres, joursFeries };
