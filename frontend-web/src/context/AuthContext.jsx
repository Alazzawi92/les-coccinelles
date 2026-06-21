// ============================================================
// FICHIER  : AuthContext.jsx
// RÔLE     : Contexte React d'authentification global.
//            Fournit l'état de l'utilisateur connecté et les
//            fonctions connecter / deconnecter / majUser à tous
//            les composants enfants via useAuth().
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Instance Axios avec intercepteurs de tokens

// Contexte vide — initialisé dans AuthProvider
const AuthContext = createContext(null);

// ── PROVIDER ─────────────────────────────────────────────────

// Enveloppe l'ensemble de l'application (voir App.jsx)
export const AuthProvider = ({ children }) => {

  // user : objet { id, prenom, nom, email, role } ou null si non connecté
  const [user,    setUser]    = useState(null);

  // loading : true pendant la vérification initiale du token au démarrage
  const [loading, setLoading] = useState(true);

  // ── Vérification du token au démarrage de l'app ──────────
  useEffect(() => {
    const verifierSession = async () => {
      const token = localStorage.getItem('accessToken');

      if (token) {
        try {
          // Appel API pour récupérer le profil à partir du token
          const reponse = await api.get('/users/me');
          setUser(reponse.data.data); // Hydrate le contexte avec l'utilisateur
        } catch {
          // Token invalide ou expiré → nettoyer le stockage local
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      setLoading(false); // La vérification est terminée, afficher l'app
    };

    verifierSession();
  }, []); // S'exécute une seule fois au montage

  // ── Connexion ─────────────────────────────────────────────

  // Sauvegarde les tokens dans localStorage et met à jour l'état user
  const connecter = (userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  // ── Déconnexion ───────────────────────────────────────────

  // Révoque le refresh token côté serveur puis vide le localStorage et l'état
  const deconnecter = async () => {
    try {
      await api.post('/auth/logout'); // Invalider le refresh token en base
    } catch { /* Continuer même si le réseau est indisponible */ }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null); // Déconnecte visuellement l'utilisateur
  };

  // ── Mise à jour du profil ─────────────────────────────────

  // Fusionne les nouvelles données avec le profil existant
  // (utilisé après une modification du profil)
  const majUser = (nouvellesData) => {
    setUser(prev => ({ ...prev, ...nouvellesData }));
  };

  // ── Valeurs exposées via useAuth() ────────────────────────
  return (
    <AuthContext.Provider value={{ user, loading, connecter, deconnecter, majUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── HOOK ─────────────────────────────────────────────────────

// Simplifie l'accès au contexte : const { user } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};

export default AuthContext;
