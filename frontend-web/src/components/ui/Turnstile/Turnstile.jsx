// ============================================================
// FICHIER  : Turnstile.jsx
// ROUTE    : Composant utilisé sur /connexion, /creer-un-compte,
//            /mot-de-passe-oublie et /contact
// RÔLE     : Case anti-robot Cloudflare Turnstile.
//            Charge le script Cloudflare, affiche la case, puis
//            transmet le jeton obtenu au formulaire parent, qui
//            l'envoie au backend (vérifié par turnstile.middleware).
//            Rien n'est affiché si REACT_APP_TURNSTILE_SITE_KEY
//            n'est pas configuré (fonctionnalité désactivée).
// ============================================================

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getTheme } from '../../../utils/theme';
import './Turnstile.css';

// Clé publique du widget déclaré sur le tableau de bord Cloudflare
const SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY;

// Indique aux formulaires s'ils doivent attendre un jeton avant l'envoi
export const TURNSTILE_ACTIF = Boolean(SITE_KEY);

// Script officiel ; render=explicit : la case est dessinée par notre code
const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Charge le script Cloudflare une seule fois pour toute l'application
let promesseScript = null;
const chargerScriptTurnstile = () => {
  if (!promesseScript) {
    promesseScript = new Promise((resolve, reject) => {
      const script   = document.createElement('script');
      script.src     = URL_SCRIPT;
      script.async   = true;
      script.onload  = resolve;
      script.onerror = () => {
        promesseScript = null; // Permettre un nouvel essai plus tard
        reject(new Error('Script Turnstile non chargé'));
      };
      document.head.appendChild(script);
    });
  }
  return promesseScript;
};

/**
 * Props :
 * - onJeton : appelé avec le jeton quand la case est validée,
 *             puis avec '' quand le jeton expire ou en cas d'erreur
 *
 * Méthode exposée via ref :
 * - reset() : redemande une vérification. À appeler après chaque envoi
 *             du formulaire : un jeton n'est valable qu'une seule fois.
 */
const Turnstile = forwardRef(({ onJeton = () => {} }, ref) => {

  // Langue active : la case est redessinée dans la bonne langue
  const { t, i18n } = useTranslation();
  const langue = i18n.resolvedLanguage || 'fr';

  const conteneurRef = useRef(null);  // Div dans lequel Cloudflare dessine la case
  const widgetIdRef  = useRef(null);  // Identifiant du widget (pour reset / remove)

  // Garde toujours la dernière fonction reçue en props
  const onJetonRef = useRef(onJeton);
  onJetonRef.current = onJeton;

  // Le formulaire parent peut redemander une vérification
  useImperativeHandle(ref, () => ({
    reset: () => {
      onJetonRef.current('');
      if (widgetIdRef.current !== null) window.turnstile?.reset(widgetIdRef.current);
    }
  }));

  useEffect(() => {
    if (!SITE_KEY) return; // Fonctionnalité désactivée

    let annule = false; // Évite d'agir si le composant est démonté entre-temps

    chargerScriptTurnstile()
      .then(() => {
        if (annule || !conteneurRef.current) return;

        widgetIdRef.current = window.turnstile.render(conteneurRef.current, {
          sitekey:            SITE_KEY,
          language:           langue,
          theme:              getTheme(), // Suit le thème clair / sombre du site
          callback:           (jeton) => onJetonRef.current(jeton),
          'expired-callback': () => onJetonRef.current(''),
          'error-callback':   () => onJetonRef.current('')
        });
      })
      .catch(() => {
        if (!annule) onJetonRef.current('');
      });

    // Démontage ou changement de langue : supprimer l'ancienne case
    return () => {
      annule = true;
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
        onJetonRef.current('');
      }
    };
  }, [langue]);

  // Aucune clé configurée : on n'affiche rien
  if (!SITE_KEY) return null;

  return (
    <div className="turnstile" ref={conteneurRef}
      role="group" aria-label={t('common.turnstile.libelle')} />
  );
});

export default Turnstile;
