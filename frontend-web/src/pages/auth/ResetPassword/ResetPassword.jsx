// ============================================================
// FICHIER  : ResetPassword.jsx
// ROUTE    : /reset-password?token=xxx
// RÔLE     : Formulaire de saisie du nouveau mot de passe.
//            Le token JWT est lu depuis les query params.
//            Si le token est absent ou invalide, affiche une
//            alerte et propose de redemander un lien.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../../../services/auth.service';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../../components/ui/ThemeToggle/ThemeToggle';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './ResetPassword.css';

const ResetPassword = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [envoi,           setEnvoi]           = useState(false);  // En cours d'envoi
  const [erreur,          setErreur]          = useState('');      // Message d'erreur

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // Lire le token depuis ?token=xxx (reçu par email)
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    // Validations locales avant appel API
    if (password !== confirmPassword) {
      setErreur(t('auth.reset.mdpDifferents'));
      return;
    }
    if (password.length < 8) {
      setErreur(t('auth.reset.mdpCourt'));
      return;
    }

    setEnvoi(true);
    try {
      await resetPassword(token, password);
      toast.success(t('auth.reset.toastSucces'));
      navigate('/connexion'); // Redirection vers la connexion
    } catch (err) {
      // Lien expiré (>24h) ou déjà utilisé
      setErreur(err.response?.data?.message || t('auth.reset.lienExpire'));
    }
    setEnvoi(false);
  };

  // ── Guard : token manquant ─────────────────────────────────
  // Si on arrive sur la page sans token, afficher une alerte
  if (!token) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-alerte">
          <span>⚠️</span>
          <span>{t('auth.reset.lienInvalide')}</span>
        </div>
        <p className="auth-pied">
          <Link to="/mot-de-passe-oublie">{t('auth.reset.nouveauLien')}</Link>
        </p>
      </div>
    </div>
  );

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

        <h1 className="auth-titre">{t('auth.reset.titre')}</h1>
        <p className="auth-sous-titre">{t('auth.reset.sousTitre')}</p>

        {/* Alerte d'erreur (token expiré, mots de passe non conformes...) */}
        {erreur && <div className="auth-alerte"><span>⚠️</span><span>{erreur}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Nouveau mot de passe */}
          <div className="form-groupe">
            <label htmlFor="password" className="form-label">
              {t('auth.reset.nouveauMdp')} <span className="requis">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {/* Confirmation du nouveau mot de passe */}
          <div className="form-groupe">
            <label htmlFor="confirm" className="form-label">
              {t('auth.reset.confirmer')} <span className="requis">*</span>
            </label>
            <input
              id="confirm"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {/* Désactivé pendant l'envoi ou si le champ est vide */}
          <button type="submit" className="btn-auth" disabled={envoi || !password}>
            {envoi ? t('auth.reset.maj') : t('auth.reset.changer')}
          </button>
        </form>

        <p className="auth-pied">
          <Link to="/connexion">{t('auth.retourConnexion')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
