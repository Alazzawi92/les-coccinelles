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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
    <div className="cookie-banniere" role="dialog" aria-label={t('common.cookies.aria')}>
      <div className="cookie-banniere__contenu">
        <p className="cookie-banniere__texte">
          {t('common.cookies.texteAvant')}{' '}
          <a href="/mentions-legales#cookies">{t('common.cookies.lienMentions')}</a>.
        </p>

        {personnaliser && (
          <div className="cookie-banniere__options">
            <label className="cookie-option">
              <input type="checkbox" checked disabled />
              {t('common.cookies.essentiels')}
            </label>
            <label className="cookie-option">
              <input
                type="checkbox"
                checked={mesureActive}
                onChange={e => setMesureActive(e.target.checked)}
              />
              {t('common.cookies.mesure')}
            </label>
          </div>
        )}

        <div className="cookie-banniere__actions">
          {!personnaliser ? (
            <>
              <button className="btn btn--outline" onClick={() => setPersonnaliser(true)}>
                {t('common.cookies.personnaliser')}
              </button>
              <button className="btn btn--outline" onClick={toutRefuser}>
                {t('common.cookies.toutRefuser')}
              </button>
              <button className="btn btn--primary" onClick={toutAccepter}>
                {t('common.cookies.toutAccepter')}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={validerChoix}>
              {t('common.cookies.valider')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
