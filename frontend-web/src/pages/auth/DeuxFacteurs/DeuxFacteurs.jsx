// ============================================================
// FICHIER  : DeuxFacteurs.jsx
// ROUTE    : /connexion/verification
// RÔLE     : Deuxième étape de la connexion, obligatoire pour tous :
//            saisie du code à 6 chiffres reçu par email.
//            La session ne s'ouvre qu'après ce code.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { verifier2fa, renvoyer2fa } from '../../../services/auth.service';
import '../../../styles/auth.css';
import './DeuxFacteurs.css';

// Préfixe des clés de traduction de la page
const P = 'auth.deuxFacteurs';

const DELAI_RENVOI = 60; // Secondes avant de pouvoir redemander un code

const DeuxFacteurs = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { connecter } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation(); // { jeton, emailMasque, emailEnvoye, destination } transmis à la connexion
  const jeton = state?.jeton;

  const [code,    setCode]    = useState('');
  const [erreur,  setErreur]  = useState(state?.emailEnvoye === false ? t(`${P}.emailNonEnvoye`) : '');
  const [envoi,   setEnvoi]   = useState(false);
  const [attente, setAttente] = useState(state?.emailEnvoye === false ? 0 : DELAI_RENVOI); // Secondes restantes

  // Compte à rebours du bouton "Renvoyer le code"
  useEffect(() => {
    if (attente <= 0) return undefined;
    const minuteur = setTimeout(() => setAttente(s => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [attente]);

  // Accès direct à l'adresse, sans être passé par la page de connexion
  if (!jeton) return <Navigate to="/connexion" replace />;

  // Ouvre la session puis envoie vers l'espace correspondant au rôle
  const terminer = (data) => {
    connecter(data.user, data.accessToken, data.refreshToken);
    toast.success(t('auth.bienvenue', { prenom: data.user.prenom }));
    if (data.user.role === 'super_admin')  navigate('/admin/tableau-de-bord', { replace: true });
    else if (data.user.role === 'admin')   navigate('/admin/emargement', { replace: true });
    else navigate(state.destination || '/parent/tableau-de-bord', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await verifier2fa(jeton, code);
      terminer(res.data.data);
    } catch (err) {
      setErreur(err.response?.data?.message || t(`${P}.erreur`));
      setCode('');
    }
    setEnvoi(false);
  };

  const renvoyer = async () => {
    setErreur('');
    try {
      await renvoyer2fa(jeton);
      toast.success(t(`${P}.renvoye`));
      setAttente(DELAI_RENVOI);
    } catch (err) {
      setErreur(err.response?.data?.message || t(`${P}.erreur`));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/images/logo.png" alt={t('auth.logoAlt')} className="auth-logo__img" />
        </div>

        <h1 className="auth-titre">{t(`${P}.titre`)}</h1>
        <p className="auth-sous-titre">{t(`${P}.sousTitre`, { email: state.emailMasque })}</p>

        {erreur && (
          <div className="auth-alerte" role="alert">
            <span>⚠️</span>
            <span>{erreur}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-groupe">
            <label htmlFor="code-2fa" className="form-label">{t(`${P}.label`)}</label>
            <input
              id="code-2fa"
              type="text"
              className="form-input deux-facteurs__saisie"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-auth" disabled={envoi || code.length !== 6}>
            {envoi ? t(`${P}.verificationEnCours`) : t(`${P}.valider`)}
          </button>
        </form>

        {/* Bouton inactif pendant le délai entre deux envois */}
        <button type="button" className="deux-facteurs__renvoyer" onClick={renvoyer} disabled={attente > 0}>
          {attente > 0 ? t(`${P}.renvoyerDans`, { secondes: attente }) : t(`${P}.renvoyer`)}
        </button>

        <p className="auth-pied"><Link to="/connexion">{t('auth.retourConnexion')}</Link></p>

      </div>
    </div>
  );
};

export default DeuxFacteurs;
