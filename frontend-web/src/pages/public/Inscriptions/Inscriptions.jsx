// ============================================================
// FICHIER  : Inscriptions.jsx
// ROUTE    : /conditions-inscription
// RÔLE     : Page courte sur l'inscription : quelques lignes, puis
//            le guide d'inscription à télécharger (PDF remplaçable
//            par le super admin dans Admin → Paramètres) et le lien
//            vers Pirouette.
//            Textes traduits via i18n (clés public.inscriptions.*).
// ============================================================

import { useTranslation, Trans } from 'react-i18next';
import { URL_GUIDE_INSCRIPTION } from '../../../services/api';
import './Inscriptions.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.inscriptions';

const Inscriptions = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  return (
    <div className="page-inscriptions">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--orange">
        <div className="container">
          <p className="page-hero__tag">📝 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      {/* ── QUELQUES LIGNES PUIS LE GUIDE À TÉLÉCHARGER ───────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section">{t(`${P}.conditionsTitre`)}</h2>

          <div className="insc-paragraphes">
            {t(`${P}.conditions`, { returnObjects: true }).map((texte) => <p key={texte}>{texte}</p>)}
          </div>

          <div className="insc-actions">
            <a href={URL_GUIDE_INSCRIPTION} className="btn btn--primary btn--lg">
              ⬇️ {t(`${P}.guideTelecharger`)}
            </a>

            {/* Bouton vers Pirouette (site d'inscription de la crèche) */}
            <a
              href="https://lescoccinelles.pirouette.pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pirouette"
            >
              {t(`${P}.pirouette`)}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Inscriptions;
