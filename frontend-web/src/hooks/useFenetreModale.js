// ============================================================
// FICHIER  : useFenetreModale.js
// RÔLE     : Comportement accessible d'une fenêtre modale :
//            - touche Échap → fermeture ;
//            - à l'ouverture, focus sur le 1er champ de la fenêtre ;
//            - Tab / Maj+Tab restent DANS la fenêtre (piège de focus) ;
//            - à la fermeture, le focus revient sur le bouton d'ouverture.
// Utilisation : const ref = useFenetreModale(ouvert, fermer);
//               <div ref={ref} role="dialog" aria-modal="true">...</div>
// ============================================================

import { useEffect, useRef } from 'react';

// Éléments qui peuvent recevoir le focus clavier
const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useFenetreModale = (ouvert, fermer) => {
  const ref = useRef(null);
  // fermer peut changer à chaque rendu : on garde toujours la dernière version
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;

  useEffect(() => {
    if (!ouvert) return;
    const declencheur = document.activeElement;            // Bouton qui a ouvert la fenêtre
    const fenetre = ref.current;
    const elements = () => Array.from(fenetre?.querySelectorAll(FOCUSABLES) || []);

    // Focus initial : 1er champ de saisie, sinon 1er élément focusable
    const premierChamp = fenetre?.querySelector('input:not([type="hidden"]), select, textarea') || elements()[0];
    premierChamp?.focus();

    const surTouche = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); fermerRef.current(); return; }
      if (e.key !== 'Tab') return;
      const liste = elements();
      if (!liste.length) return;
      const premier = liste[0];
      const dernier = liste[liste.length - 1];
      // Tab sur le dernier → retour au premier ; Maj+Tab sur le premier → dernier
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    };
    document.addEventListener('keydown', surTouche);

    return () => {
      document.removeEventListener('keydown', surTouche);
      declencheur?.focus?.();                               // Focus rendu à l'ouverture
    };
  }, [ouvert]);

  return ref;
};

export default useFenetreModale;
