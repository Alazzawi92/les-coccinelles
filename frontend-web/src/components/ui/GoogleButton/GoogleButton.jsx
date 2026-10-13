// ============================================================
// FICHIER  : GoogleButton.jsx
// ROUTE    : Composant utilisé sur /connexion et /creer-un-compte
// RÔLE     : Bouton officiel "Se connecter avec Google".
//            Charge le script Google Identity Services, affiche le
//            bouton, puis envoie le jeton d'identité reçu au backend
//            (POST /api/auth/google) qui le vérifie lui-même.
//            Le bouton n'est pas affiché si REACT_APP_GOOGLE_CLIENT_ID
//            n'est pas configuré (fonctionnalité désactivée).
// ============================================================

import { useEffect, useRef } from 'react';
import { googleLogin } from '../../../services/auth.service';
import './GoogleButton.css';

// Identifiant de l'application déclaré dans la Google Cloud Console
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Adresse du script officiel Google Identity Services
const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

// Charge le script Google une seule fois pour toute l'application
let promesseScript = null;
const chargerScriptGoogle = () => {
  if (!promesseScript) {
    promesseScript = new Promise((resolve, reject) => {
      const script   = document.createElement('script');
      script.src     = URL_SCRIPT;
      script.async   = true;
      script.onload  = resolve;
      script.onerror = () => {
        promesseScript = null; // Permettre un nouvel essai plus tard
        reject(new Error('Script Google non chargé'));
      };
      document.head.appendChild(script);
    });
  }
  return promesseScript;
};

/**
 * Props :
 * - texte        : libellé Google, 'signin_with' (Se connecter avec Google)
 *                  ou 'signup_with' (S'inscrire avec Google)
 * - onConnexion  : appelé avec { user, accessToken, refreshToken } si la connexion réussit
 * - onCompteCree : appelé avec le message de l'API si un compte vient d'être créé
 *                  (il doit encore être validé par un administrateur)
 * - onErreur     : appelé avec un message d'erreur à afficher
 */
const GoogleButton = ({
  texte        = 'signin_with',
  onConnexion  = () => {},
  onCompteCree = () => {},
  onErreur     = () => {}
}) => {

  // Conteneur dans lequel Google dessine son bouton
  const conteneurRef = useRef(null);

  // Garde toujours les dernières fonctions reçues en props :
  // le callback Google est enregistré une seule fois au montage
  const callbacksRef = useRef({ onConnexion, onCompteCree, onErreur });
  callbacksRef.current = { onConnexion, onCompteCree, onErreur };

  useEffect(() => {
    if (!CLIENT_ID) return; // Fonctionnalité désactivée

    let annule = false; // Évite d'agir si le composant est démonté entre-temps

    // Reçoit le jeton d'identité Google et l'envoie au backend
    const traiterReponseGoogle = async ({ credential }) => {
      const { onConnexion, onCompteCree, onErreur } = callbacksRef.current;
      try {
        const res = await googleLogin(credential);
        if (res.status === 201) {
          onCompteCree(res.data.message); // Nouveau compte en attente de validation
        } else {
          onConnexion(res.data.data);     // Connexion réussie
        }
      } catch (err) {
        onErreur(err.response?.data?.message || 'Erreur lors de la connexion avec Google');
      }
    };

    chargerScriptGoogle()
      .then(() => {
        if (annule || !conteneurRef.current) return;

        // Configurer Google avec notre Client ID et notre fonction de retour
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback:  traiterReponseGoogle
        });

        // Google impose une largeur en pixels (entre 200 et 400)
        const largeur = Math.min(400, Math.max(200, conteneurRef.current.offsetWidth));

        // Dessiner le bouton officiel dans notre conteneur
        window.google.accounts.id.renderButton(conteneurRef.current, {
          theme:  'outline',
          size:   'large',
          shape:  'pill',
          text:   texte,
          locale: 'fr',
          width:  largeur
        });
      })
      .catch(() => {
        if (!annule) callbacksRef.current.onErreur('Impossible de charger la connexion Google');
      });

    return () => { annule = true; };
  }, [texte]);

  // Aucun Client ID configuré : on n'affiche rien
  if (!CLIENT_ID) return null;

  return <div className="google-bouton" ref={conteneurRef} />;
};

export default GoogleButton;
