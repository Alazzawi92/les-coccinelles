// ============================================================
// FICHIER  : Chargement.jsx
// ROUTE    : Composant utilisé sur toutes les pages qui chargent
//            des données (public, parent, admin)
// RÔLE     : Indicateur de chargement : une coccinelle qui fait le
//            tour d'une petite piste en pointillés, avec le texte
//            "Chargement...". Annoncé aux lecteurs d'écran (role=status).
// ============================================================

import { useTranslation } from 'react-i18next';
import CoccinelleSvg from '../CoccinelleSvg/CoccinelleSvg';
import './Chargement.css';

/**
 * Props :
 * - className : classe du conteneur selon l'espace (ex : 'a-chargement',
 *               'p-chargement', 'page-loader') pour garder la mise en page
 */
const Chargement = ({ className = '' }) => {
  const { t } = useTranslation();

  return (
    <div className={`chargement ${className}`} role="status">
      {/* Piste ronde parcourue par la coccinelle (décorative) */}
      <span className="chargement__piste" aria-hidden="true">
        <span className="chargement__tour">
          <span className="chargement__coccinelle">
            <CoccinelleSvg />
          </span>
        </span>
      </span>
      <span className="chargement__texte">{t('common.chargement')}</span>
    </div>
  );
};

export default Chargement;
