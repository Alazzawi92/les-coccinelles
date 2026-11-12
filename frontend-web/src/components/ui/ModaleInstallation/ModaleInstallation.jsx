// ============================================================
// FICHIER  : ModaleInstallation.jsx
// ROUTE    : Composant global (toutes les pages)
// RÔLE     : Fenêtre (pop-up) qui propose d'installer l'application
//            Les Coccinelles dès l'ouverture du site.
//
//   Quand s'ouvre-t-elle toute seule ?
//     - dès l'ouverture du site (petit délai pour laisser la page
//       s'afficher) ;
//     - mais APRÈS le choix des cookies : à la toute première visite,
//       la bannière cookies passe d'abord (obligation RGPD), puis la
//       fenêtre s'ouvre juste après ;
//     - jamais si l'application est déjà installée, ni dans l'espace
//       admin ou sur les pages de connexion ;
//     - pas pendant 7 jours après un clic sur « Plus tard ».
//   Elle s'ouvre aussi à la demande, avec le bouton « Installer
//   l'application » du pied de page.
//
//   Deux contenus :
//     - Android / Chrome / Edge : bouton « Installer » qui ouvre la
//       vraie fenêtre d'installation du navigateur ;
//     - iPhone / iPad : les 2 étapes à suivre dans Safari (Apple
//       n'autorise pas de bouton d'installation).
//
//   Fermeture : « Plus tard », Échap, clic sur le fond.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookieConsent, EVENEMENT_COOKIES_CHOISIS } from '../CookieBanner/CookieBanner';
import { miseAJourDisponible } from '../../../serviceWorkerRegistration';
import {
  installationPossible,
  installationDirectePossible,
  reporteeRecemment,
  reporterInstallation,
  lancerInstallation,
  EVENEMENT_INSTALLATION_DISPONIBLE,
  EVENEMENT_OUVRIR_INSTALLATION,
  EVENEMENT_APPLICATION_INSTALLEE
} from '../../../utils/installationPwa';
import './ModaleInstallation.css';

// Petit délai avant l'ouverture : la page s'affiche d'abord
const DELAI_OUVERTURE_MS = 1500;

// Icône « Partager » d'iPhone (carré avec une flèche vers le haut)
const IconePartager = () => (
  <svg className="modale-install__icone-partager" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10H5v11h14V10h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Pages où la fenêtre ne s'ouvre jamais toute seule : espace admin et
// pages de connexion / création de compte (elle gênerait la saisie)
const PAGES_SANS_OUVERTURE = [
  '/admin', '/connexion', '/creer-un-compte', '/mot-de-passe-oublie',
  '/reset-password', '/verify-email'
];

// Vrai si la page actuelle fait partie des pages ci-dessus
const pageSansOuverture = () =>
  PAGES_SANS_OUVERTURE.some((debut) => window.location.pathname.startsWith(debut));

// Vrai si toutes les conditions de l'ouverture automatique sont réunies
const peutSOuvrirSeule = () =>
  installationPossible() &&
  !pageSansOuverture() &&
  !miseAJourDisponible() &&       // Pas en même temps que « Nouvelle version »
  getCookieConsent() !== null &&  // Choix des cookies déjà fait (RGPD d'abord)
  !reporteeRecemment();           // Pas de « Plus tard » ces 7 derniers jours

const ModaleInstallation = () => {
  const { t } = useTranslation();
  const boutonPrincipal = useRef(null);

  // Fenêtre ouverte ou non
  const [ouverte, setOuverte] = useState(false);

  // Vrai pendant l'ouverture de la fenêtre du navigateur (évite les doubles clics)
  const [enCours, setEnCours] = useState(false);

  // Ouverture automatique à l'arrivée sur le site
  useEffect(() => {
    let minuteur = null;

    const essayer = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        if (peutSOuvrirSeule()) setOuverte(true);
      }, DELAI_OUVERTURE_MS);
    };

    essayer(); // À l'ouverture du site

    // Nouvel essai quand l'installation devient possible (Android : le
    // navigateur prévient un peu après le chargement) ou quand les
    // cookies viennent d'être choisis (première visite)
    window.addEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, essayer);
    window.addEventListener(EVENEMENT_COOKIES_CHOISIS, essayer);

    return () => {
      clearTimeout(minuteur);
      window.removeEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, essayer);
      window.removeEventListener(EVENEMENT_COOKIES_CHOISIS, essayer);
    };
  }, []);

  // Ouverture à la demande (pied de page) et fermeture après installation
  useEffect(() => {
    const ouvrir = () => { if (installationPossible()) setOuverte(true); };
    const fermer = () => setOuverte(false);
    window.addEventListener(EVENEMENT_OUVRIR_INSTALLATION, ouvrir);
    window.addEventListener(EVENEMENT_APPLICATION_INSTALLEE, fermer);
    return () => {
      window.removeEventListener(EVENEMENT_OUVRIR_INSTALLATION, ouvrir);
      window.removeEventListener(EVENEMENT_APPLICATION_INSTALLEE, fermer);
    };
  }, []);

  // « Plus tard », Échap ou clic sur le fond : pas de nouvelle proposition avant 7 jours
  const plusTard = useCallback(() => {
    reporterInstallation();
    setOuverte(false);
  }, []);

  // Focus sur le bouton principal à l'ouverture + fermeture avec Échap
  useEffect(() => {
    if (!ouverte) return undefined;
    boutonPrincipal.current?.focus();
    const surTouche = (e) => { if (e.key === 'Escape') plusTard(); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouverte, plusTard]);

  // Clic « Installer » : fenêtre officielle du navigateur
  const installer = async () => {
    setEnCours(true);
    const installee = await lancerInstallation();
    setEnCours(false);
    if (!installee) reporterInstallation(); // Refus dans la fenêtre = « Plus tard »
    setOuverte(false);
  };

  if (!ouverte) return null;

  // Android / Chrome / Edge : vrai bouton ; sinon (iPhone) : explications
  const direct = installationDirectePossible();

  return (
    // Fond sombre : un clic dessus ferme la fenêtre
    <div className="modale-install" onClick={plusTard}>
      <div
        className="modale-install__carte"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-install-titre"
        onClick={(e) => e.stopPropagation()} // Un clic dans la carte ne ferme pas
      >
        {/* Icône telle qu'elle apparaîtra sur l'écran d'accueil */}
        <img src="/icons/icon-192.png" alt="" className="modale-install__icone" />

        <h2 id="modale-install-titre" className="modale-install__titre">
          📱 {t('common.installation.titre')}
        </h2>

        {direct ? (
          <p className="modale-install__texte">{t('common.installation.texte')}</p>
        ) : (
          // iPhone : les 2 étapes dans Safari
          <ol className="modale-install__etapes">
            <li>{t('common.installation.appleEtape1')} <IconePartager /></li>
            <li>{t('common.installation.appleEtape2')}</li>
          </ol>
        )}

        <div className="modale-install__actions">
          {direct ? (
            <>
              <button type="button" className="btn btn--outline" onClick={plusTard} disabled={enCours}>
                {t('common.installation.plusTard')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={installer}
                disabled={enCours}
                ref={boutonPrincipal}
              >
                {t('common.installation.installer')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={plusTard} ref={boutonPrincipal}>
              {t('common.installation.compris')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModaleInstallation;
