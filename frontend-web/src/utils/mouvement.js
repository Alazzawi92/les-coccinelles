// ============================================================
// FICHIER  : mouvement.js
// RÔLE     : Détecte le réglage "Réduire les animations" du
//            téléphone / ordinateur (accessibilité, critère RGAA 13.8).
//            Les animations décoratives ne doivent pas se lancer
//            quand ce réglage est activé.
// ============================================================

import { useState, useEffect } from 'react';

// Requête média du réglage système
const REQUETE = '(prefers-reduced-motion: reduce)';

// Lecture ponctuelle : le visiteur a-t-il demandé moins d'animations ?
export const mouvementReduit = () => window.matchMedia(REQUETE).matches;

// Hook React : renvoie true si le réglage est activé, et se met à jour
// si le visiteur le change pendant sa visite
export const useMouvementReduit = () => {
  const [reduit, setReduit] = useState(mouvementReduit);

  useEffect(() => {
    const requete = window.matchMedia(REQUETE);
    const auChangement = (e) => setReduit(e.matches);
    requete.addEventListener('change', auChangement);
    return () => requete.removeEventListener('change', auChangement);
  }, []);

  return reduit;
};
