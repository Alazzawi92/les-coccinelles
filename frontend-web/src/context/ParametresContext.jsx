// ============================================================
// FICHIER  : ParametresContext.jsx
// RÔLE     : Réglages du site choisis par le super admin
//            (Admin → Paramètres), lus une fois au démarrage :
//             - espaceParentsOuvert    : connexion des parents
//             - creationComptesOuverte : nouveaux comptes et
//               nouvelles demandes d'inscription
//            Sert seulement à afficher / masquer les boutons :
//            le vrai blocage est fait par le serveur.
//            Tant que les réglages ne sont pas chargés (ou si
//            l'API ne répond pas), tout est considéré fermé.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ParametresContext = createContext(null);

// Valeurs utilisées avant le chargement et en cas d'erreur : fermé
const FERME = { espaceParentsOuvert: false, creationComptesOuverte: false };

export const ParametresProvider = ({ children }) => {
  const [parametres, setParametres] = useState(FERME);
  const [charge,     setCharge]     = useState(false); // true une fois la réponse reçue (ou l'erreur)

  // Relit les réglages (au démarrage, et après une modification par le super admin)
  const recharger = useCallback(async () => {
    try {
      const res = await api.get('/parametres/public');
      const d = res.data.data;
      setParametres({
        espaceParentsOuvert:    Boolean(d.espace_parents_ouvert),
        creationComptesOuverte: Boolean(d.creation_comptes_ouverte)
      });
    } catch {
      setParametres(FERME); // API indisponible : on n'affiche rien de réservé aux parents
    }
    setCharge(true);
  }, []);

  useEffect(() => { recharger(); }, [recharger]);

  return (
    <ParametresContext.Provider value={{ ...parametres, charge, recharger }}>
      {children}
    </ParametresContext.Provider>
  );
};

// Hook d'accès : const { espaceParentsOuvert } = useParametres();
export const useParametres = () => useContext(ParametresContext);
