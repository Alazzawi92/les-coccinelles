// ============================================================
// FICHIER  : BandeauMiseAJour.jsx
// ROUTE    : Composant global (toutes les pages)
// RÔLE     : Bandeau « Nouvelle version disponible » de la PWA.
//            Apparaît quand une nouvelle version du site a été
//            déployée et téléchargée en arrière-plan.
//            - « Mettre à jour » : active la nouvelle version et
//              recharge la page.
//            - « Plus tard » : masque le bandeau ; la nouvelle
//              version s'appliquera à la prochaine ouverture.
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EVENEMENT_MISE_A_JOUR,
  miseAJourDisponible,
  appliquerMiseAJour
} from '../../../serviceWorkerRegistration';
import './BandeauMiseAJour.css';

const BandeauMiseAJour = () => {
  const { t } = useTranslation('common');

  // Visible si une mise à jour attendait déjà avant l'affichage du composant
  const [visible, setVisible] = useState(miseAJourDisponible());

  // Vrai pendant l'activation (évite les doubles clics)
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    // Affiche le bandeau dès qu'une nouvelle version est prête
    const afficher = () => setVisible(true);
    window.addEventListener(EVENEMENT_MISE_A_JOUR, afficher);
    return () => window.removeEventListener(EVENEMENT_MISE_A_JOUR, afficher);
  }, []);

  // Clic sur « Mettre à jour »
  const mettreAJour = () => {
    setEnCours(true);
    appliquerMiseAJour(); // La page se recharge toute seule ensuite
  };

  if (!visible) return null;

  return (
    // role="status" : annoncé par les lecteurs d'écran sans couper la lecture
    <div className="bandeau-maj" role="status" aria-live="polite">
      <p className="bandeau-maj__texte">
        <span aria-hidden="true">✨</span> {t('miseAJour.message')}
      </p>
      <div className="bandeau-maj__actions">
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => setVisible(false)}
          disabled={enCours}
        >
          {t('miseAJour.plusTard')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={mettreAJour}
          disabled={enCours}
        >
          {enCours ? t('chargement') : t('miseAJour.mettreAJour')}
        </button>
      </div>
    </div>
  );
};

export default BandeauMiseAJour;
