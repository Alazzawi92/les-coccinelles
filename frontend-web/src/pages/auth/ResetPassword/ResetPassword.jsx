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
import { resetPassword } from '../../../services/auth.service';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './ResetPassword.css';

const ResetPassword = () => {

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
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      setErreur('Mot de passe trop court (8 caractères min)');
      return;
    }

    setEnvoi(true);
    try {
      await resetPassword(token, password);
      toast.success('Mot de passe réinitialisé !');
      navigate('/connexion'); // Redirection vers la connexion
    } catch (err) {
      // Lien expiré (>24h) ou déjà utilisé
      setErreur(err.response?.data?.message || 'Lien invalide ou expiré');
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
          <span>Lien invalide. Demandez un nouveau lien.</span>
        </div>
        <p className="auth-pied">
          <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo__icone">🐞</span>
          <span className="auth-logo__nom">Les Coccinelles</span>
        </div>

        <h1 className="auth-titre">Nouveau mot de passe</h1>
        <p className="auth-sous-titre">Choisissez un mot de passe sécurisé pour votre compte.</p>

        {/* Alerte d'erreur (token expiré, mots de passe non conformes...) */}
        {erreur && <div className="auth-alerte"><span>⚠️</span><span>{erreur}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Nouveau mot de passe */}
          <div className="form-groupe">
            <label htmlFor="password" className="form-label">
              Nouveau mot de passe <span className="requis">*</span>
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
              Confirmer <span className="requis">*</span>
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
            {envoi ? '⏳ Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>

        <p className="auth-pied">
          <Link to="/connexion">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
