// ============================================================
// FICHIER  : LanguageSwitcher.jsx
// ROUTE    : Composant utilisé dans les 3 layouts (public, parent, admin)
// RÔLE     : Sélecteur de langue FR / EN.
//            Change la langue de toute l'application via i18next ;
//            le choix est mémorisé dans localStorage par le
//            détecteur de langue (voir i18n/index.js).
// ============================================================

import { useTranslation } from 'react-i18next';
import { LANGUES } from '../../../i18n';
import './LanguageSwitcher.css';

/**
 * Props :
 * - className : classe CSS supplémentaire pour l'adapter au layout parent
 */
const LanguageSwitcher = ({ className = '' }) => {

  const { t, i18n } = useTranslation();

  // Langue active réduite à son code court ("en-GB" → "en")
  const langueActive = i18n.resolvedLanguage || 'fr';

  return (
    <div
      className={`langue-switch ${className}`}
      role="group"
      aria-label={t('common.langue.choisir')}
    >
      {LANGUES.map((langue) => (
        <button
          key={langue}
          type="button"
          // Bouton de la langue active mis en évidence
          className={`langue-switch__btn ${langueActive === langue ? 'langue-switch__btn--actif' : ''}`}
          onClick={() => i18n.changeLanguage(langue)}
          aria-pressed={langueActive === langue}
          // Nom complet de la langue lu par les lecteurs d'écran
          title={t(`common.langue.${langue}`)}
          lang={langue}
        >
          {langue.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
