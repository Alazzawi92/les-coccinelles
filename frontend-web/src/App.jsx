// ============================================================
// FICHIER  : App.jsx
// RÔLE     : Composant racine React — point d'entrée de l'app.
//            Enveloppe l'application dans le contexte Auth et
//            configure le système de notifications toast.
// ============================================================

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router';
import './styles/global.css'; // Styles globaux (reset + variables)

const App = () => {
  return (
    // AuthProvider expose user/connecter/deconnecter dans toute l'app
    <AuthProvider>

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
            boxShadow: 'var(--shadow-md)'
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--error)',   secondary: '#fff' } }
        }}
      />

      {/* AppRouter gère toutes les routes de l'application */}
      <AppRouter />

    </AuthProvider>
  );
};

export default App;
