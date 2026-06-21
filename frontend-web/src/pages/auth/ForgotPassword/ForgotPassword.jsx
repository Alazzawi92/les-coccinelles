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
import { forgotPassword } from '../../../services/auth.service';
import '../../../styles/auth.css';
import './ForgotPassword.css';

const ForgotPassword = () => {

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

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo__icone">🐞</span>
          <span className="auth-logo__nom">Les Coccinelles</span>
        </div>

        {/* Après l'envoi : écran de confirmation (même si email inconnu) */}
        {envoye ? (
          <div className="auth-alerte auth-alerte--succes"
            style={{ flexDirection: 'column', textAlign: 'center', padding: 'var(--space-xl)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-md)' }}>✉️</span>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-sm)' }}>Email envoyé !</h2>
            <p>Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes.</p>
          </div>
        ) : (

          // Formulaire de saisie de l'email
          <>
            <h1 className="auth-titre">Mot de passe oublié</h1>
            <p className="auth-sous-titre">
              Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-groupe">
                <label htmlFor="email" className="form-label">
                  Adresse email <span className="requis">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="marie@exemple.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Désactivé si champ vide ou envoi en cours */}
              <button type="submit" className="btn-auth" disabled={envoi || !email}>
                {envoi ? '⏳ Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          </>
        )}

        {/* Lien retour dans tous les cas */}
        <p className="auth-pied" style={{ marginTop: 'var(--space-lg)' }}>
          <Link to="/connexion">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
