// ============================================================
// FICHIER  : DeuxFacteurs.jsx
// ROUTE    : /connexion/verification
// RÔLE     : Deuxième étape de la connexion, obligatoire pour tous :
//            saisie du code à 6 chiffres reçu par email.
//            La session ne s'ouvre qu'après ce code.
//            Case « Faire confiance à cet appareil » (décochée par défaut) :
//            plus de code sur ce navigateur pendant 30 jours (parents) ou
//            24 heures (équipe) ; le mot de passe reste toujours demandé.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { verifier2fa, renvoyer2fa } from '../../../services/auth.service';
import useSuiteConnexion from '../../../hooks/useSuiteConnexion';
import '../../../styles/auth.css';
import './DeuxFacteurs.css';

// Préfixe des clés de traduction de la page
const P = 'auth.deuxFacteurs';

const DELAI_RENVOI = 60; // Secondes avant de pouvoir redemander un code

const DeuxFacteurs = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { ouvrirSession } = useSuiteConnexion();
  const { state } = useLocation(); // { jeton, emailMasque, emailEnvoye, confianceHeures, destination } transmis à la connexion
  const jeton = state?.jeton;

  const [code,    setCode]    = useState('');
  const [erreur,  setErreur]  = useState(state?.emailEnvoye === false ? t(`${P}.emailNonEnvoye`) : '');
  const [envoi,   setEnvoi]   = useState(false);
  const [confiance, setConfiance] = useState(false); // Case « Faire confiance à cet appareil » (décochée par défaut)
  const [attente, setAttente] = useState(state?.emailEnvoye === false ? 0 : DELAI_RENVOI); // Secondes restantes

  // Compte à rebours du bouton "Renvoyer le code"
  useEffect(() => {
    if (attente <= 0) return undefined;
    const minuteur = setTimeout(() => setAttente(s => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [attente]);

  // Accès direct à l'adresse, sans être passé par la page de connexion
  if (!jeton) return <Navigate to="/connexion" replace />;

  // Durée de la confiance proposée, en clair : « 30 jours » (parents) ou « 24 heures » (équipe)
  const heures = state.confianceHeures || 24;
  const dureeConfiance = heures >= 48 && heures % 24 === 0
    ? t('common.jours', { count: heures / 24 })
    : t(`${P}.heures`, { count: heures });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await verifier2fa(jeton, code, confiance);
      ouvrirSession(res.data.data, state.destination); // Garde aussi la clé si la case est cochée
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

          {/* Appareil de confiance : à ne pas cocher sur un ordinateur partagé */}
          <label className="deux-facteurs__confiance">
            <input type="checkbox" checked={confiance} onChange={e => setConfiance(e.target.checked)} />
            <span>
              <strong>{t(`${P}.confiance`, { duree: dureeConfiance })}</strong>
              <span className="deux-facteurs__confiance-aide">{t(`${P}.confianceAide`)}</span>
            </span>
          </label>

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
