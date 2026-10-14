// ============================================================
// FICHIER  : ForgotPassword.jsx
// ROUTE    : /mot-de-passe-oublie
// RÔLE     : Formulaire de demande de réinitialisation de mot
//            de passe. Envoie un email avec un lien sécurisé.
//            Affiche toujours le même message de succès pour
//            éviter l'énumération d'emails (sécurité RGPD).
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../../../services/auth.service';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import '../../../styles/auth.css';
import './ForgotPassword.css';

const ForgotPassword = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [email,  setEmail]  = useState('');
  const [envoi,  setEnvoi]  = useState(false);   // Désactive le bouton pendant l'envoi
  const [envoye, setEnvoye] = useState(false);   // Affiche l'écran de confirmation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);

    try {
      await forgotPassword(email);
    } catch {
      // On ignore l'erreur : qu'il y ait un compte ou non, on affiche le même
      // message de succès. Cela empêche de deviner si un email est inscrit.
    }

    // Passer à l'écran de confirmation dans tous les cas
    setEnvoye(true);
    setEnvoi(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Sélecteur de langue (pas de layout sur les pages auth) */}
        <LanguageSwitcher className="auth-langue" />

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

              {/* Désactivé si champ vide ou envoi en cours */}
              <button type="submit" className="btn-auth" disabled={envoi || !email}>
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
