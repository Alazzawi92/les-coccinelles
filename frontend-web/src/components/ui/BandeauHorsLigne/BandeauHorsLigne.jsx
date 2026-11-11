// ============================================================
// FICHIER  : BandeauHorsLigne.jsx
// ROUTE    : Composant global (toutes les pages)
// RÔLE     : Bandeau affiché en haut de l'écran quand le
//            téléphone ou l'ordinateur perd la connexion internet.
//            Utile surtout pour l'application installée (PWA) :
//            l'interface s'ouvre même hors ligne, mais les données
//            (suivi, messages, photos...) ne sont jamais gardées
//            sur l'appareil (RGPD), il faut donc prévenir le parent.
//            Disparaît tout seul au retour de la connexion.
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './BandeauHorsLigne.css';

const BandeauHorsLigne = () => {
  const { t } = useTranslation('common');

  // État initial : le navigateur sait déjà s'il est connecté
  const [horsLigne, setHorsLigne] = useState(!navigator.onLine);

  useEffect(() => {
    // Mise à jour de l'état quand la connexion change
    const passerHorsLigne = () => setHorsLigne(true);
    const passerEnLigne   = () => setHorsLigne(false);

    window.addEventListener('offline', passerHorsLigne);
    window.addEventListener('online',  passerEnLigne);

    // Nettoyage des écouteurs quand le composant disparaît
    return () => {
      window.removeEventListener('offline', passerHorsLigne);
      window.removeEventListener('online',  passerEnLigne);
    };
  }, []);

  // Connecté : rien à afficher
  if (!horsLigne) return null;

  return (
    // role="status" : lu automatiquement par les lecteurs d'écran
    <div className="bandeau-hors-ligne" role="status" aria-live="polite">
      <span aria-hidden="true">📡</span> {t('horsLigne.message')}
    </div>
  );
};

export default BandeauHorsLigne;
