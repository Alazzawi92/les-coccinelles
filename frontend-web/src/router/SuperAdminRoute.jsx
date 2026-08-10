// ============================================================
// FICHIER  : SuperAdminRoute.jsx
// RÔLE     : Garde des routes admin réservées au super_admin.
//            Un admin simple n'a accès qu'au groupe "Quotidien"
//            (émargement, suivi, absences, calendrier, messagerie) ;
//            toute autre page admin (familles, inscriptions,
//            statistiques, site public...) lui est fermée et le
//            renvoie sur l'émargement plutôt que de casser sa session.
//            À utiliser imbriqué DANS le layout admin (donc après
//            ProtectedRoute roles=['admin','super_admin']).
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = () => {
  const { user } = useAuth();

  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin/emargement" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
