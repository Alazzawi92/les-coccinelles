// ============================================================
// FICHIER  : ThemeToggle.jsx
// ROUTE    : Composant utilisé à côté du sélecteur de langue
//            (3 layouts + pages de connexion / inscription)
// RÔLE     : Bouton ☀️ / 🌙 pour passer du thème clair au thème
//            sombre. Au premier passage, le thème suit le réglage
//            du système (voir public/theme-init.js) ; dès que le
//            visiteur clique, son choix est mémorisé.
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTheme, choisirTheme, suivreThemeSysteme, EVENEMENT_THEME } from '../../../utils/theme';
import './ThemeToggle.css';

/**
 * Props :
 * - className : classe CSS supplémentaire pour l'adapter au layout parent
 */
const ThemeToggle = ({ className = '' }) => {

  const { t } = useTranslation();

  // Thème affiché actuellement : 'light' ou 'dark'
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    // Met à jour l'icône quand le thème change (autre bouton, réglage système)
    const auChangement = (e) => setTheme(e.detail);
    window.addEventListener(EVENEMENT_THEME, auChangement);

    // Suit le réglage du système tant que le visiteur n'a pas choisi
    const arreterSuivi = suivreThemeSysteme();

    return () => {
      window.removeEventListener(EVENEMENT_THEME, auChangement);
      arreterSuivi();
    };
  }, []);

  const estSombre = theme === 'dark';

  // Libellé décrivant l'ACTION du bouton (lu par les lecteurs d'écran)
  const libelle = estSombre ? t('common.theme.passerClair') : t('common.theme.passerSombre');

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={() => choisirTheme(estSombre ? 'light' : 'dark')}
      aria-label={libelle}
      title={libelle}
    >
      {/* Icône décorative : le sens est donné par aria-label */}
      <span aria-hidden="true">{estSombre ? '☀️' : '🌙'}</span>
    </button>
  );
};

export default ThemeToggle;
