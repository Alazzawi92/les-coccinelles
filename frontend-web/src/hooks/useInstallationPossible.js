// ============================================================
// FICHIER  : useInstallationPossible.js
// RÔLE     : Hook React — renvoie true si l'application peut être
//            installée sur cet appareil (et ne l'est pas déjà).
//            Se met à jour quand le navigateur signale que
//            l'installation devient possible, ou qu'elle est faite.
// ============================================================

import { useState, useEffect } from 'react';
import {
  installationPossible,
  EVENEMENT_INSTALLATION_DISPONIBLE,
  EVENEMENT_APPLICATION_INSTALLEE
} from '../utils/installationPwa';

const useInstallationPossible = () => {
  // Valeur de départ : état actuel de l'appareil
  const [possible, setPossible] = useState(installationPossible);

  useEffect(() => {
    // Relit l'état à chaque changement signalé
    const relire = () => setPossible(installationPossible());
    window.addEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, relire);
    window.addEventListener(EVENEMENT_APPLICATION_INSTALLEE, relire);
    return () => {
      window.removeEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, relire);
      window.removeEventListener(EVENEMENT_APPLICATION_INSTALLEE, relire);
    };
  }, []);

  return possible;
};

export default useInstallationPossible;
