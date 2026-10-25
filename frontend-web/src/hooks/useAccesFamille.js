// ============================================================
// FICHIER  : useAccesFamille.js
// RÔLE     : Indique si la famille connectée a accès aux pages
//            réservées (galerie, suivi, absences, consentement),
//            c.-à-d. si au moins une inscription est ACCEPTÉE.
//            GET /inscriptions/acces → { acces: true|false }
//            Revérifié à chaque changement de page, pour que le
//            verrou disparaisse dès que l'admin accepte la demande.
//            Le vrai contrôle est fait par le serveur : ce hook ne
//            sert qu'à l'affichage (menu 🔒, écran "accès réservé").
// ============================================================

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const useAccesFamille = () => {
  // null = vérification en cours
  const [acces, setAcces] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
    let actif = true; // Ignore une réponse arrivée après démontage
    api.get('/inscriptions/acces')
      .then(r => { if (actif) setAcces(Boolean(r.data.data?.acces)); })
      .catch(() => { if (actif) setAcces(false); });
    return () => { actif = false; };
  }, [pathname]);

  return { acces, chargement: acces === null };
};

export default useAccesFamille;
