// ============================================================
// FICHIER  : ModaleEmailConfirme.jsx
// RÔLE     : Fenêtre affichée sur la page d'accueil juste après la
//            confirmation de l'email (redirection depuis /verify-email).
//            Explique la suite : l'équipe va vérifier le compte et le
//            parent recevra un email à l'activation.
//            Fermeture : "J'ai compris", Échap, clic sur le fond.
//            "Découvrir la crèche" mène à la page de présentation.
// ============================================================

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ModaleEmailConfirme.css';

const ModaleEmailConfirme = ({ onFermer }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const boutonPrincipal = useRef(null);

  // Focus sur le bouton principal à l'ouverture + fermeture avec Échap
  useEffect(() => {
    boutonPrincipal.current?.focus();
    const surTouche = (e) => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [onFermer]);

  return (
    <div className="modale-email" onClick={onFermer}>
      <div
        className="modale-email__carte"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-email-titre"
        onClick={e => e.stopPropagation()}
      >
        <img src="/images/logo.png" alt="" className="modale-email__logo" />
        <h2 id="modale-email-titre" className="modale-email__titre">
          ✅ {t('auth.emailConfirme.titre')}
        </h2>
        <p className="modale-email__texte">{t('auth.emailConfirme.texte')}</p>
        <p className="modale-email__texte modale-email__texte--accent">{t('auth.emailConfirme.enAttendant')}</p>
        <div className="modale-email__actions">
          <Link to="/presentation" className="btn btn--outline" onClick={onFermer}>
            {t('auth.emailConfirme.decouvrir')}
          </Link>
          <button type="button" className="btn btn--primary" onClick={onFermer} ref={boutonPrincipal}>
            {t('auth.emailConfirme.compris')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModaleEmailConfirme;
