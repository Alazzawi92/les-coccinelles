// ============================================================
// FICHIER  : Login.jsx
// ROUTE    : /connexion
// RÔLE     : Page de connexion des parents et administrateurs.
//            Redirige vers l'espace admin si rôle admin,
//            sinon vers la page demandée avant la redirection.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { login as loginService } from '../../../services/auth.service';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './Login.css';

const Login = () => {

  // ── État du formulaire ────────────────────────────────────
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [envoi,   setEnvoi]   = useState(false);  // Désactive le bouton pendant l'envoi
  const [erreur,  setErreur]  = useState('');      // Message d'erreur API
  const [voirMdp, setVoirMdp] = useState(false);  // Afficher/masquer le mot de passe

  // ── Hooks de navigation ───────────────────────────────────
  const { connecter } = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();

  // Destination après connexion : page demandée avant la redirection (ou dashboard)
  const destination = location.state?.from?.pathname || '/parent/tableau-de-bord';

  // ── Soumission du formulaire ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();   // Évite le rechargement de page natif
    setErreur('');
    setEnvoi(true);

    try {
      const res  = await loginService(email, password);
      const data = res.data.data;

      // Sauvegarde les tokens et l'utilisateur dans le contexte
      connecter(data.user, data.accessToken, data.refreshToken);
      toast.success(`Bienvenue, ${data.user.prenom} !`);

      // Rediriger admin/super_admin vers leur dashboard dédié
      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        navigate('/admin/tableau-de-bord', { replace: true });
      } else {
        navigate(destination, { replace: true }); // Retour à la page demandée
      }
    } catch (err) {
      // Affiche le message d'erreur de l'API (ex: "Identifiants invalides")
      const msg = err.response?.data?.message || 'Erreur de connexion';
      setErreur(msg);
    }

    setEnvoi(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo coccinelle + sous-titre */}
        <div className="auth-logo">
          <span className="auth-logo__icone">🐞</span>
          <span className="auth-logo__nom">Les Coccinelles</span>
          <span className="auth-logo__sous">Espace parents & administration</span>
        </div>

        <h1 className="auth-titre">Connexion</h1>
        <p className="auth-sous-titre">Accédez à votre espace personnel</p>

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
              autoComplete="email"
              autoFocus  // Focus automatique à l'ouverture de la page
            />
          </div>

          {/* Champ mot de passe avec bouton afficher/masquer */}
          <div className="form-groupe">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Mot de passe <span className="requis">*</span>
              </label>
              {/* Lien "Oublié ?" à droite du label */}
              <Link to="/mot-de-passe-oublie" className="form-lien-oublie">
                Oublié ?
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
                aria-label={voirMdp ? 'Masquer' : 'Afficher'}
              >
                {voirMdp ? 'Masquer' : 'Voir'}
              </button>
            </div>
          </div>

          {/* Bouton soumission : désactivé si champs vides ou en cours d'envoi */}
          <button type="submit" className="btn-auth" disabled={envoi || !email || !password}>
            {envoi ? '⏳ Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-divider">ou</div>

        {/* Lien vers la création de compte */}
        <p className="auth-pied">
          Pas encore de compte ?{' '}
          <Link to="/creer-un-compte">Créer un compte parent</Link>
        </p>

        {/* Retour au site public */}
        <p className="auth-pied">
          <Link to="/">← Retour au site</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
