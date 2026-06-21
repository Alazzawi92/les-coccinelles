// ============================================================
// FICHIER  : ProtectedRoute.jsx
// RÔLE     : Composant de garde des routes protégées.
//            Redirige vers /connexion si non authentifié,
//            vers /parent/tableau-de-bord si le rôle est insuffisant.
//            Utilisé dans router/index.jsx pour les espaces
//            parent et admin.
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// props.roles : tableau des rôles autorisés, ex: ['admin', 'super_admin']
const ProtectedRoute = ({ roles }) => {

  // Récupère l'utilisateur connecté et l'état de chargement initial
  const { user, loading } = useAuth();

  // Pendant la vérification du token au démarrage, afficher un loader.
  // Évite un flash de redirection avant que la session soit connue.
  if (loading) {
    return <div className="page-loader">Chargement...</div>;
  }

  // Pas de session active → rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  // Le rôle de l'utilisateur n'est pas dans la liste autorisée.
  // Ex : un parent tente d'accéder à /admin → renvoyé sur son dashboard.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/parent/tableau-de-bord" replace />;
  }

  // Authentifié et autorisé → affiche la page enfant de la route
  return <Outlet />;
};

export default ProtectedRoute;
