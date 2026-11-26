// ============================================================
// FICHIER  : useSuiteConnexion.js
// RÔLE     : Ce qui suit un mot de passe (ou un compte Google) valide :
//             - appareil de confiance reconnu → la session s'ouvre tout de suite
//             - sinon → page du code reçu par email (/connexion/verification)
//            Utilisé par la connexion, l'inscription (bouton Google)
//            et la page du code.
// Retourne { suiteConnexion(data, destination), ouvrirSession(data, destination) }
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { enregistrerAppareilConfiance } from '../utils/appareilConfiance';

const useSuiteConnexion = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { connecter } = useAuth();
  const navigate = useNavigate();

  // Ouvre la session puis envoie vers l'espace correspondant au rôle.
  // Si la case « Faire confiance à cet appareil » a été cochée, la clé
  // remise par le serveur est gardée pour les prochaines connexions.
  const ouvrirSession = (data, destination) => {
    enregistrerAppareilConfiance(data.appareil_confiance);
    connecter(data.user, data.accessToken, data.refreshToken);
    toast.success(t('auth.bienvenue', { prenom: data.user.prenom }));
    if (data.user.role === 'super_admin') navigate('/admin/tableau-de-bord', { replace: true });
    else if (data.user.role === 'admin')  navigate('/admin/emargement', { replace: true });
    else navigate(destination || '/parent/tableau-de-bord', { replace: true });
  };

  // Réponse de la connexion : session directe (appareil de confiance) ou code à saisir
  const suiteConnexion = (data, destination) => {
    if (data.accessToken) return ouvrirSession(data, destination);
    return navigate('/connexion/verification', {
      state: {
        jeton:           data.jeton_2fa,
        emailMasque:     data.email_masque,
        emailEnvoye:     data.email_envoye,
        confianceHeures: data.confiance_heures, // Durée proposée pour la case « Faire confiance »
        destination
      }
    });
  };

  return { suiteConnexion, ouvrirSession };
};

export default useSuiteConnexion;
