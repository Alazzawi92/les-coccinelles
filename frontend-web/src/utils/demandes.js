// ============================================================
// FICHIER  : demandes.js
// RÔLE     : Règles communes sur les demandes d'inscription
//            (pages "Mes enfants" et formulaire d'inscription).
// ============================================================

// Statuts d'une demande "active" : pas de 2e demande pour le même enfant
// (même liste que le serveur ; seule une demande refusée en permet une autre)
export const STATUTS_ACTIFS = ['en_attente', 'en_cours', 'incomplet', 'liste_attente', 'accepte'];

export const estDemandeActive = (statut) => STATUTS_ACTIFS.includes(statut);

// Statut de la demande la PLUS RÉCENTE de chaque enfant → { [enfant_id]: statut }
export const statutParEnfant = (demandes = []) => {
  const resultat = {};
  [...demandes]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))   // Plus récente d'abord
    .forEach(d => { if (!(d.enfant_id in resultat)) resultat[d.enfant_id] = d.statut; });
  return resultat;
};
