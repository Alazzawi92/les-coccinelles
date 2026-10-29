// ============================================================
// FICHIER  : VerifyEmail.jsx
// ROUTE    : /verify-email/:token
// RÔLE     : Page ouverte par le lien de l'email de confirmation.
//            Envoie le jeton au serveur (GET /auth/verify-email/:token)
//            puis affiche le résultat :
//            - succès : redirection vers l'accueil, où une fenêtre
//              explique la suite (ModaleEmailConfirme)
//            - erreur : lien invalide ou expiré (compte supprimé au
//              bout de 24 h sans confirmation → en créer un nouveau)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmail } from '../../../services/auth.service';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../../components/ui/ThemeToggle/ThemeToggle';
import '../../../styles/auth.css';

const VerifyEmail = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { token } = useParams();
  const navigate  = useNavigate();

  // 'chargement' | 'erreur' (en cas de succès : redirection vers l'accueil)
  const [etat,   setEtat]   = useState('chargement');
  const [erreur, setErreur] = useState('');

  // Le jeton n'est utilisable qu'une fois : en développement, React exécute
  // les effets deux fois (StrictMode) → sans ce garde-fou, le 2e appel
  // échouerait et afficherait "lien invalide" alors que l'email est confirmé.
  const dejaEnvoye = useRef(false);

  useEffect(() => {
    if (dejaEnvoye.current) return;
    dejaEnvoye.current = true;
    verifyEmail(token)
      // Succès : accueil des Coccinelles + fenêtre d'explication.
      // replace : le bouton "retour" ne relance pas la vérification.
      .then(() => navigate('/', { replace: true, state: { emailConfirme: true } }))
      .catch(err => {
        setErreur(err.response?.data?.message || t('auth.verifyEmail.erreurDefaut'));
        setEtat('erreur');
      });
  }, [token, t, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Sélecteur de langue (pas de layout sur les pages auth) */}
        <div className="auth-langue">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="auth-logo">
          <img src="/images/logo.png" alt={t('auth.logoAlt')} className="auth-logo__img" />
        </div>

        <h1 className="auth-titre">{t('auth.verifyEmail.titre')}</h1>

        {etat === 'chargement' && (
          <p className="auth-sous-titre" role="status">{t('auth.verifyEmail.enCours')}</p>
        )}

        {etat === 'erreur' && (
          <>
            <div className="auth-alerte" role="alert">
              <span>⚠️</span>
              <span>{erreur}</span>
            </div>
            <p className="auth-pied">
              <Link to="/creer-un-compte">{t('auth.verifyEmail.creerCompte')}</Link>
              {' · '}
              <Link to="/connexion">{t('auth.verifyEmail.allerConnexion')}</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
