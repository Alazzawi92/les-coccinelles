// ============================================================
// FICHIER  : useMenuDuJour.js
// RÔLE     : Récupère le déjeuner et le goûter prévus au menu pour
//            une date (GET /menus/jour/:date), pour les afficher
//            dans le suivi quotidien ("Au menu : ...").
//            Le texte du menu (parfois du HTML saisi dans l'éditeur)
//            est converti en une ligne de texte simple :
//            "<p>Carottes</p><p>Poulet</p>" → "Carottes • Poulet".
// ============================================================

import { useState, useEffect } from 'react';
import api from '../services/api';

// Convertit le HTML de l'éditeur en texte : chaque paragraphe / ligne
// de liste devient un élément séparé par " • ". textContent ne garde
// que le texte : aucun HTML n'est injecté dans la page.
export const menuEnTexte = (html) => {
  if (!html) return '';
  const avecSeparateurs = html.replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, ' • ');
  const texte = new DOMParser().parseFromString(avecSeparateurs, 'text/html').body.textContent || '';
  return texte
    .split('•').map(m => m.trim()).filter(Boolean)  // Retire les éléments vides
    .join(' • ');
};

const useMenuDuJour = (date) => {
  const [menu, setMenu] = useState({ midi: '', gouter: '' });

  useEffect(() => {
    if (!date) return;
    let actif = true; // Ignore une réponse arrivée après un changement de date
    api.get(`/menus/jour/${date}`)
      .then(r => {
        if (!actif) return;
        const d = r.data.data || {};
        setMenu({ midi: menuEnTexte(d.midi), gouter: menuEnTexte(d.gouter) });
      })
      .catch(() => { if (actif) setMenu({ midi: '', gouter: '' }); });
    return () => { actif = false; };
  }, [date]);

  return menu;
};

export default useMenuDuJour;
