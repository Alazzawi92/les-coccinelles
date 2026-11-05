// ============================================================
// FICHIER  : ParametreRoute.jsx
// RÔLE     : Garde de route selon les réglages du super admin.
//            Réglage fermé → retour à l'accueil.
//            Pendant le chargement des réglages : écran d'attente
//            (sinon un parent connecté serait renvoyé à l'accueil
//            à chaque rechargement de page).
// PROPS    : reglage — 'espaceParentsOuvert' (défaut) ou
//                      'creationComptesOuverte'
//            children — page protégée (sinon routes enfants via <Outlet />)
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';
import { useParametres } from '../context/ParametresContext';
import Chargement from '../components/ui/Chargement/Chargement';

const ParametreRoute = ({ reglage = 'espaceParentsOuvert', children = null }) => {
  const parametres = useParametres();

  if (!parametres.charge)    return <Chargement />;
  if (!parametres[reglage])  return <Navigate to="/" replace />;
  return children || <Outlet />;
};

export default ParametreRoute;
