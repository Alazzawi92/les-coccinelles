// ============================================================
// FICHIER  : App.jsx
// RÔLE     : Composant racine React — point d'entrée de l'app.
//            Enveloppe l'application dans le contexte Auth et
//            configure le système de notifications toast.
// ============================================================

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ParametresProvider } from './context/ParametresContext';
import AppRouter from './router';
import CookieBanner from './components/ui/CookieBanner/CookieBanner';
import BandeauHorsLigne from './components/ui/BandeauHorsLigne/BandeauHorsLigne';
import BandeauMiseAJour from './components/ui/BandeauMiseAJour/BandeauMiseAJour';
import './styles/global.css'; // Styles globaux (reset + variables)

const App = () => {
  return (
    // AuthProvider expose user/connecter/deconnecter dans toute l'app
    <AuthProvider>
    {/* Réglages du super admin (espace parents, création de comptes) */}
    <ParametresProvider>

      {/* Toaster : notifications visuelles en haut à droite.
          duration:4000 = disparaît après 4 secondes.
          Couleurs reprenant les variables CSS du projet. */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'var(--font-body)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            background: 'var(--surface)',   // Suit le thème clair / sombre
            color: 'var(--text-dark)'
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--white)' } },
          error:   { iconTheme: { primary: 'var(--error)',   secondary: 'var(--white)' } }
        }}
      />

      {/* AppRouter gère toutes les routes de l'application */}
      <AppRouter />

      {/* Bannière RGPD de consentement aux cookies */}
      <CookieBanner />

      {/* PWA : prévient quand la connexion internet est perdue */}
      <BandeauHorsLigne />

      {/* PWA : propose de passer à la nouvelle version après un déploiement */}
      <BandeauMiseAJour />

    </ParametresProvider>
    </AuthProvider>
  );
};

export default App;
