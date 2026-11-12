// ============================================================
// FICHIER  : BandeauInstallation.jsx
// ROUTE    : Composant global (toutes les pages)
// RÔLE     : Propose d'installer l'application Les Coccinelles
//            sur le téléphone ou l'ordinateur.
//
//   Quand s'affiche-t-il tout seul ? (pour ne pas gêner)
//     - le visiteur a déjà fait son choix de cookies (pas deux
//       bandeaux en même temps) ;
//     - ET c'est au moins sa 2e visite, OU c'est un parent connecté
//       (ce sont eux qui ont vraiment besoin de l'application) ;
//     - ET il n'a pas cliqué « Plus tard » ces 30 derniers jours ;
//     - ET l'application n'est pas déjà installée.
//   Il s'affiche aussi à la demande, avec le lien « Installer
//   l'application » du pied de page.
//
//   Deux contenus :
//     - Android / Chrome / Edge : bouton « Installer » qui ouvre la
//       vraie fenêtre d'installation du navigateur ;
//     - iPhone / iPad : les 2 étapes à suivre dans Safari.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { getCookieConsent, EVENEMENT_COOKIES_CHOISIS } from '../CookieBanner/CookieBanner';
import { miseAJourDisponible } from '../../../serviceWorkerRegistration';
import {
  installationPossible,
  installationDirectePossible,
  nombreVisites,
  reporteeRecemment,
  reporterInstallation,
  lancerInstallation,
  EVENEMENT_INSTALLATION_DISPONIBLE,
  EVENEMENT_OUVRIR_INSTALLATION,
  EVENEMENT_APPLICATION_INSTALLEE
} from '../../../utils/installationPwa';
import './BandeauInstallation.css';

// Attente avant l'affichage automatique (laisse le temps de découvrir la page)
const DELAI_AFFICHAGE_MS = 4000;

// Icône « Partager » d'iPhone (carré avec une flèche vers le haut)
const IconePartager = () => (
  <svg className="bandeau-install__icone-partager" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10H5v11h14V10h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BandeauInstallation = () => {
  const { t }    = useTranslation();
  const { user } = useAuth();

  // Bandeau visible ou non
  const [visible, setVisible] = useState(false);

  // Vrai pendant l'ouverture de la fenêtre du navigateur (évite les doubles clics)
  const [enCours, setEnCours] = useState(false);

  // Vrai si un parent est connecté
  const estParent = user?.role === 'parent';

  // Toutes les conditions de l'affichage automatique
  const peutProposerSeul = useCallback(() =>
    installationPossible() &&
    !miseAJourDisponible() &&            // Pas en même temps que « Nouvelle version »
    getCookieConsent() !== null &&       // Choix des cookies déjà fait
    !reporteeRecemment() &&              // Pas de « Plus tard » récent
    (nombreVisites() >= 2 || estParent), // 2e visite ou parent connecté
  [estParent]);

  // Affichage automatique, après un petit délai
  useEffect(() => {
    let minuteur = null;

    const essayer = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        if (peutProposerSeul()) setVisible(true);
      }, DELAI_AFFICHAGE_MS);
    };

    essayer(); // Au chargement et quand un parent se connecte

    // Nouvel essai quand l'installation devient possible ou que les cookies sont choisis
    window.addEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, essayer);
    window.addEventListener(EVENEMENT_COOKIES_CHOISIS, essayer);

    return () => {
      clearTimeout(minuteur);
      window.removeEventListener(EVENEMENT_INSTALLATION_DISPONIBLE, essayer);
      window.removeEventListener(EVENEMENT_COOKIES_CHOISIS, essayer);
    };
  }, [peutProposerSeul]);

  // Ouverture à la demande (lien du pied de page) et fermeture après installation
  useEffect(() => {
    const ouvrir  = () => { if (installationPossible()) setVisible(true); };
    const fermer  = () => setVisible(false);
    window.addEventListener(EVENEMENT_OUVRIR_INSTALLATION, ouvrir);
    window.addEventListener(EVENEMENT_APPLICATION_INSTALLEE, fermer);
    return () => {
      window.removeEventListener(EVENEMENT_OUVRIR_INSTALLATION, ouvrir);
      window.removeEventListener(EVENEMENT_APPLICATION_INSTALLEE, fermer);
    };
  }, []);

  // Clic « Plus tard » (ou « J'ai compris » sur iPhone) : on ne repropose pas avant 30 jours
  const plusTard = () => {
    reporterInstallation();
    setVisible(false);
  };

  // Clic « Installer » : fenêtre officielle du navigateur
  const installer = async () => {
    setEnCours(true);
    const installee = await lancerInstallation();
    setEnCours(false);
    if (!installee) reporterInstallation(); // Refus dans la fenêtre = « Plus tard »
    setVisible(false);
  };

  if (!visible) return null;

  // Android / Chrome / Edge : vrai bouton ; sinon (iPhone) : explications
  const direct = installationDirectePossible();

  return (
    <div className="bandeau-install" role="dialog" aria-labelledby="bandeau-install-titre">
      <img src="/icons/icon-192.png" alt="" className="bandeau-install__icone" />

      <div className="bandeau-install__contenu">
        <p id="bandeau-install-titre" className="bandeau-install__titre">
          {t('common.installation.titre')}
        </p>

        {direct ? (
          <p className="bandeau-install__texte">{t('common.installation.texte')}</p>
        ) : (
          // iPhone : les 2 étapes dans Safari
          <ol className="bandeau-install__etapes">
            <li>
              {t('common.installation.appleEtape1')} <IconePartager />
            </li>
            <li>{t('common.installation.appleEtape2')}</li>
          </ol>
        )}

        <div className="bandeau-install__actions">
          {direct ? (
            <>
              <button type="button" className="btn btn--outline" onClick={plusTard} disabled={enCours}>
                {t('common.installation.plusTard')}
              </button>
              <button type="button" className="btn btn--primary" onClick={installer} disabled={enCours}>
                {t('common.installation.installer')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={plusTard}>
              {t('common.installation.compris')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BandeauInstallation;
