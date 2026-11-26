// ============================================================
// FICHIER  : appareilConfiance.js
// RÔLE     : Clé « Faire confiance à cet appareil » gardée par ce
//            navigateur (localStorage). Remise par le serveur quand la
//            case est cochée sur la page du code ; renvoyée ensuite à
//            chaque connexion : le code reçu par email n'est plus demandé
//            pendant 30 jours (parents) ou 24 heures (équipe).
//            Le mot de passe reste toujours demandé.
//            La clé est conservée après une déconnexion (c'est son but) ;
//            le serveur l'annule si le mot de passe change.
// ============================================================

const CLE_STOCKAGE = 'appareilConfiance';

// Clé de ce navigateur, ou undefined (jamais une valeur au mauvais format)
export const lireAppareilConfiance = () => {
  const cle = localStorage.getItem(CLE_STOCKAGE);
  return cle && /^[a-f0-9]{64}$/.test(cle) ? cle : undefined;
};

// Enregistre la clé remise par le serveur (case cochée)
export const enregistrerAppareilConfiance = (cle) => {
  if (cle) localStorage.setItem(CLE_STOCKAGE, cle);
};
