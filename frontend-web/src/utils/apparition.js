// ============================================================
// FICHIER  : apparition.js
// RÔLE     : Fait apparaître en douceur les sections des pages
//            publiques quand elles entrent dans l'écran au défilement.
//
//   - IntersectionObserver : le navigateur prévient quand une section
//     devient visible (pas de calcul à chaque défilement = léger).
//   - MutationObserver : repère les sections affichées plus tard
//     (après un chargement de données ou un changement de page).
//   - Les sections déjà visibles à l'arrivée ne sont pas cachées
//     (pas de "flash" en haut de page).
//   - Rien n'est fait si "Réduire les animations" est activé.
// ============================================================

import { useEffect } from 'react';
import { useMouvementReduit } from './mouvement';

// Éléments animés : chaque <section> du contenu principal
const SELECTEUR = 'section';

/**
 * @param conteneurRef : ref React vers la zone de contenu (<main>)
 */
export const useApparitionAuDefilement = (conteneurRef) => {
  const reduit = useMouvementReduit();

  useEffect(() => {
    const conteneur = conteneurRef.current;
    if (!conteneur) return undefined;

    // Sections cachées par un passage précédent de cet effet
    const cachees = () => conteneur.querySelectorAll('.apparition:not(.apparition--visible)');

    // Animations désactivées (ou navigateur trop ancien) : tout afficher
    if (reduit || !('IntersectionObserver' in window)) {
      cachees().forEach((el) => el.classList.add('apparition--visible'));
      return undefined;
    }

    // Révèle une section dès que son bord entre dans l'écran (un peu au-dessus
    // du bas de l'écran), quelle que soit sa hauteur. Une section déjà dépassée
    // (défilement rapide vers le bas) est aussi révélée, pour ne jamais rester cachée.
    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach((entree) => {
        if (!entree.isIntersecting && entree.boundingClientRect.top > 0) return;
        entree.target.classList.add('apparition--visible');
        observateur.unobserve(entree.target);   // Une seule apparition
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    // Prépare les nouvelles sections (une seule fois chacune)
    const preparer = () => {
      conteneur.querySelectorAll(`${SELECTEUR}:not([data-apparition])`).forEach((el) => {
        el.dataset.apparition = '';
        // Déjà à l'écran : on la laisse telle quelle
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.classList.add('apparition');
        observateur.observe(el);
      });
    };

    // L'effet peut être relancé (mode strict de React, changement de réglage) :
    // on surveille à nouveau les sections déjà préparées mais pas encore révélées
    cachees().forEach((el) => observateur.observe(el));
    preparer();
    const surveillant = new MutationObserver(preparer);
    surveillant.observe(conteneur, { childList: true, subtree: true });

    return () => {
      observateur.disconnect();
      surveillant.disconnect();
    };
  }, [conteneurRef, reduit]);
};
