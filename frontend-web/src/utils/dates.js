// ============================================================
// FICHIER  : dates.js
// RÔLE     : Dates "AAAA-MM-JJ" en HEURE LOCALE (Europe/Paris).
//
// Ne pas utiliser date.toISOString().split('T')[0] : toISOString()
// convertit en UTC. En France (UTC+1 / +2), le 30 octobre à 00:00
// devient le 29 octobre à 23:00 UTC → le mauvais jour est affiché
// ("aujourd'hui" décalé dans le calendrier, absences d'un jour trop tôt,
// mauvaise semaine de menus...).
// ============================================================

// Date → "AAAA-MM-JJ" selon le calendrier local (par défaut : aujourd'hui)
export const versDateISO = (date = new Date()) => {
  const annee = date.getFullYear();
  const mois  = String(date.getMonth() + 1).padStart(2, '0');   // getMonth() : 0 = janvier
  const jour  = String(date.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
};

// "AAAA-MM-JJ" → Date à minuit LOCAL (new Date("AAAA-MM-JJ") donnerait minuit UTC)
export const depuisDateISO = (iso) => {
  const [annee, mois, jour] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(annee, mois - 1, jour);
};

// Lundi de la semaine d'une date (décalage en semaines possible) → "AAAA-MM-JJ"
export const lundiDeLaSemaine = (date = new Date(), decalageSemaines = 0) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jour = d.getDay();                                       // 0 = dimanche
  d.setDate(d.getDate() - (jour === 0 ? 6 : jour - 1) + decalageSemaines * 7);
  return versDateISO(d);
};
