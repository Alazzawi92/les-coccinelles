// ============================================================
// FICHIER  : Login.jsx
// ROUTE    : /connexion
// RÔLE     : Page de connexion des parents et administrateurs.
//            Redirige vers l'espace admin si rôle admin,
//            sinon vers la page demandée avant la redirection.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { login as loginService } from '../../../services/auth.service';
import GoogleButton from '../../../components/ui/GoogleButton/GoogleButton';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../../components/ui/ThemeToggle/ThemeToggle';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './Login.css';

const Login = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // ── État du formulaire ────────────────────────────────────
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [envoi,   setEnvoi]   = useState(false);  // Désactive le bouton pendant l'envoi
  const [erreur,  setErreur]  = useState('');      // Message d'erreur API
  const [voirMdp, setVoirMdp] = useState(false);  // Afficher/masquer le mot de passe
  const [info,    setInfo]    = useState('');      // Message d'info (ex: compte Google créé)

  // ── Hooks de navigation ───────────────────────────────────
  const { connecter } = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();

  // Destination après connexion : page demandée avant la redirection (ou dashboard)
  const destination = location.state?.from?.pathname || '/parent/tableau-de-bord';

  // ── Après une connexion réussie (mot de passe ou Google) ──
  const terminerConnexion = (data) => {
    // Sauvegarde les tokens et l'utilisateur dans le contexte
    connecter(data.user, data.accessToken, data.refreshToken);
    toast.success(t('auth.bienvenue', { prenom: data.user.prenom }));

    // Rediriger admin/super_admin vers leur page d'accueil dédiée.
    // L'admin simple n'a pas accès au dashboard (réservé au super_admin,
    // voir SuperAdminRoute) : il part directement sur l'émargement.
    if (data.user.role === 'super_admin') {
      navigate('/admin/tableau-de-bord', { replace: true });
    } else if (data.user.role === 'admin') {
      navigate('/admin/emargement', { replace: true });
    } else {
      navigate(destination, { replace: true }); // Retour à la page demandée
    }
  };

  // ── Connexion Google : nouveau compte en attente de validation ──
  const compteGoogleCree = (message) => {
    setErreur('');
    setInfo(message);
  };

  // ── Connexion Google : erreur (compte bloqué, admin, jeton invalide...) ──
  const erreurGoogle = (message) => {
    setInfo('');
    setErreur(message);
  };

  // ── Soumission du formulaire ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();   // Évite le rechargement de page natif
    setErreur('');
    setInfo('');
    setEnvoi(true);

    try {
      const res = await loginService(email, password);
      terminerConnexion(res.data.data);
    } catch (err) {
      // Affiche le message d'erreur de l'API (ex: "Identifiants invalides")
      const msg = err.response?.data?.message || t('auth.login.erreur');
      setErreur(msg);
    }

    setEnvoi(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Sélecteur de langue (pas de layout sur les pages auth) */}
        <div className="auth-langue">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Logo + sous-titre */}
        <div className="auth-logo">
          <img src="/images/logo.png" alt={t('auth.logoAlt')} className="auth-logo__img" />
          <span className="auth-logo__sous">{t('auth.login.logoSous')}</span>
        </div>

        <h1 className="auth-titre">{t('auth.login.titre')}</h1>
        <p className="auth-sous-titre">{t('auth.login.sousTitre')}</p>

        {/* Message d'info après inscription (redirigé depuis /creer-un-compte).
            messageCle = clé de traduction (suit la langue) ; message = texte de l'API */}
        {(info || location.state?.messageCle || location.state?.message) && (
          <div className="auth-info" role="status">
            <span>ℹ️</span>
            <span>{info || (location.state.messageCle ? t(location.state.messageCle) : location.state.message)}</span>
          </div>
        )}

        {/* Alerte d'erreur (identifiants incorrects, compte bloqué...) */}
        {erreur && (
          <div className="auth-alerte" role="alert">
            <span>⚠️</span>
            <span>{erreur}</span>
          </div>
        )}

        {/* Formulaire de connexion : noValidate = validation JS uniquement */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Champ email */}
          <div className="form-groupe">
            <label htmlFor="email" className="form-label">
              {t('auth.email')} <span className="requis">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus  // Focus automatique à l'ouverture de la page
            />
          </div>

          {/* Champ mot de passe avec bouton afficher/masquer */}
          <div className="form-groupe">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                {t('auth.motDePasse')} <span className="requis">*</span>
              </label>
              {/* Lien "Oublié ?" à droite du label */}
              <Link to="/mot-de-passe-oublie" className="form-lien-oublie">
                {t('auth.login.oublie')}
              </Link>
            </div>
            <div className="password-wrapper">
              {/* type bascule entre 'password' et 'text' selon voirMdp */}
              <input
                id="password"
                type={voirMdp ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setVoirMdp(v => !v)}
                aria-label={voirMdp ? t('auth.masquer') : t('auth.afficher')}
              >
                {voirMdp ? t('auth.masquer') : t('auth.voir')}
              </button>
            </div>
          </div>

          {/* Bouton soumission : désactivé si champs vides ou en cours d'envoi */}
          <button type="submit" className="btn-auth" disabled={envoi || !email || !password}>
            {envoi ? t('auth.login.connexion') : t('auth.login.seConnecter')}
          </button>
        </form>

        <div className="auth-divider">{t('auth.ou')}</div>

        {/* Connexion avec Google (parents uniquement) */}
        <GoogleButton
          texte="signin_with"
          onConnexion={terminerConnexion}
          onCompteCree={compteGoogleCree}
          onErreur={erreurGoogle}
        />

        {/* Lien vers la création de compte */}
        <p className="auth-pied">
          {t('auth.login.pasDeCompte')}{' '}
          <Link to="/creer-un-compte">{t('auth.login.creerCompte')}</Link>
        </p>

        {/* Retour au site public */}
        <p className="auth-pied">
          <Link to="/">{t('auth.retourSite')}</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
