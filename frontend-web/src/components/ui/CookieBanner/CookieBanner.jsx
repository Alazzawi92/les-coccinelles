// ============================================================
// FICHIER  : CookieBanner.jsx
// ROUTE    : Composant global (toutes pages publiques)
// RÔLE     : Bannière RGPD de consentement aux cookies.
//            Affichée tant qu'aucun choix n'est enregistré dans
//            localStorage (clé "coccinelles_cookie_consent").
//            3 choix : Tout accepter / Tout refuser / Personnaliser
//            (mesure d'audience uniquement, les cookies "essentiels"
//            ne sont jamais désactivables).
//            Le consentement est relu par le reste de l'app via
//            getCookieConsent() pour ne charger les scripts de
//            mesure d'audience que si consent.mesure === true.
// ============================================================

import { useState, useEffect } from 'react';
import './CookieBanner.css';

const CLE_CONSENTEMENT = 'coccinelles_cookie_consent';

// Lit le consentement enregistré (utilisable depuis tout le reste de l'app
// pour savoir si on a le droit de charger un script de mesure d'audience)
export const getCookieConsent = () => {
  try {
    const brut = localStorage.getItem(CLE_CONSENTEMENT);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
};

const CookieBanner = () => {
  // null = aucun choix fait → bannière visible
  const [consentement, setConsentement] = useState(() => getCookieConsent());
  // true = affiche le détail "Personnaliser" (case mesure d'audience)
  const [personnaliser, setPersonnaliser] = useState(false);
  // Case à cocher du mode personnalisation
  const [mesureActive, setMesureActive] = useState(false);

  // Enregistre le choix et ferme la bannière
  const enregistrer = (choix) => {
    localStorage.setItem(CLE_CONSENTEMENT, JSON.stringify(choix));
    setConsentement(choix);
  };

  const toutAccepter = () => enregistrer({ essentiels: true, mesure: true, date: new Date().toISOString() });
  const toutRefuser  = () => enregistrer({ essentiels: true, mesure: false, date: new Date().toISOString() });
  const validerChoix = () => enregistrer({ essentiels: true, mesure: mesureActive, date: new Date().toISOString() });

  // Rien à afficher si un choix a déjà été enregistré
  useEffect(() => {}, [consentement]);

  if (consentement) return null;

  return (
    <div className="cookie-banniere" role="dialog" aria-label="Gestion des cookies">
      <div className="cookie-banniere__contenu">
        <p className="cookie-banniere__texte">
          🍪 Nous utilisons des cookies essentiels au fonctionnement du site, ainsi que
          des cookies de mesure d'audience (facultatifs) pour améliorer votre expérience.
          Vous pouvez accepter, refuser ou personnaliser votre choix à tout moment depuis
          les <a href="/mentions-legales#cookies">mentions légales</a>.
        </p>

        {personnaliser && (
          <div className="cookie-banniere__options">
            <label className="cookie-option">
              <input type="checkbox" checked disabled />
              Cookies essentiels (toujours actifs — connexion, sécurité)
            </label>
            <label className="cookie-option">
              <input
                type="checkbox"
                checked={mesureActive}
                onChange={e => setMesureActive(e.target.checked)}
              />
              Cookies de mesure d'audience
            </label>
          </div>
        )}

        <div className="cookie-banniere__actions">
          {!personnaliser ? (
            <>
              <button className="btn btn--outline" onClick={() => setPersonnaliser(true)}>
                Personnaliser
              </button>
              <button className="btn btn--outline" onClick={toutRefuser}>
                Tout refuser
              </button>
              <button className="btn btn--primary" onClick={toutAccepter}>
                Tout accepter
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={validerChoix}>
              Valider mon choix
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
