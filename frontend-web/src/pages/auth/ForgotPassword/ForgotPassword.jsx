// ============================================================
// FICHIER  : ForgotPassword.jsx
// ROUTE    : /mot-de-passe-oublie
// RÔLE     : Formulaire de demande de réinitialisation de mot
//            de passe. Envoie un email avec un lien sécurisé.
//            Affiche toujours le même message de succès pour
//            éviter l'énumération d'emails (sécurité RGPD).
// ============================================================

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../../../services/auth.service';
import Turnstile, { TURNSTILE_ACTIF } from '../../../components/ui/Turnstile/Turnstile';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../../components/ui/ThemeToggle/ThemeToggle';
import '../../../styles/auth.css';
import './ForgotPassword.css';

const ForgotPassword = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [email,  setEmail]  = useState('');
  const [envoi,  setEnvoi]  = useState(false);   // Désactive le bouton pendant l'envoi
  const [envoye, setEnvoye] = useState(false);   // Affiche l'écran de confirmation
  const [erreur, setErreur] = useState('');      // Erreur anti-robot ou email mal saisi
  const [jeton,  setJeton]  = useState('');      // Jeton de la case anti-robot
  const turnstileRef = useRef(null);             // Pour redemander une vérification

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);

    try {
      await forgotPassword(email, jeton);
    } catch (err) {
      // 400 (anti-robot échoué, email mal formé) et 503 (vérification indisponible) :
      // la demande n'est pas partie, il faut le dire. Ces erreurs ne révèlent pas
      // si un compte existe. Les autres erreurs sont ignorées : qu'il y ait un compte
      // ou non, on affiche le même message de succès (anti-énumération des emails).
      const status = err.response?.status;
      if (status === 400 || status === 503) {
        setErreur(err.response.data?.message || t('auth.forgot.erreur'));
        turnstileRef.current?.reset();
        setEnvoi(false);
        return;
      }
    }

    // Passer à l'écran de confirmation dans tous les cas
    setEnvoye(true);
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

        {/* Logo */}
        <div className="auth-logo">
          <img src="/images/logo.png" alt={t('auth.logoAlt')} className="auth-logo__img" />
        </div>

        {/* Après l'envoi : écran de confirmation (même si email inconnu) */}
        {envoye ? (
          <div className="auth-alerte auth-alerte--succes"
            style={{ flexDirection: 'column', textAlign: 'center', padding: 'var(--space-xl)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-md)' }}>✉️</span>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-sm)' }}>{t('auth.forgot.envoyeTitre')}</h2>
            <p>{t('auth.forgot.envoyeTexte')}</p>
          </div>
        ) : (

          // Formulaire de saisie de l'email
          <>
            <h1 className="auth-titre">{t('auth.forgot.titre')}</h1>
            <p className="auth-sous-titre">
              {t('auth.forgot.sousTitre')}
            </p>

            {erreur && <div className="auth-alerte" role="alert"><span>⚠️</span><span>{erreur}</span></div>}

            <form className="auth-form" onSubmit={handleSubmit}>
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
                  autoFocus
                />
              </div>

              {/* Case anti-robot */}
              <Turnstile ref={turnstileRef} onJeton={setJeton} />

              {/* Désactivé si champ vide, case anti-robot non validée ou envoi en cours */}
              <button type="submit" className="btn-auth" disabled={envoi || !email || (TURNSTILE_ACTIF && !jeton)}>
                {envoi ? t('auth.forgot.envoi') : t('auth.forgot.envoyer')}
              </button>
            </form>
          </>
        )}

        {/* Lien retour dans tous les cas */}
        <p className="auth-pied" style={{ marginTop: 'var(--space-lg)' }}>
          <Link to="/connexion">{t('auth.retourConnexion')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
