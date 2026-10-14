// ============================================================
// FICHIER  : Inscriptions.jsx
// ROUTE    : /conditions-inscription
// RÔLE     : Page d'information sur les conditions d'inscription.
//            Contenu fidèle au site actuel de la crèche :
//            conditions générales, bouton Pirouette, inclusion
//            handicap et fiche de pré-inscription à télécharger.
//            Textes traduits via i18n (clés public.inscriptions.*).
// ============================================================

import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import './Inscriptions.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.inscriptions';

// Icônes des documents nécessaires, dans l'ordre de public.inscriptions.documents
const ICONES_DOCUMENTS = ['🪪', '💼', '💳', '💉', '🏥', '📋', '🛡️', '📞', '✍️'];

// Critères d'admission : icône + clé de traduction (public.inscriptions.criteres.*)
const CRITERES = [
  { icone: '🎂', cle: 'age' },
  { icone: '📍', cle: 'residence' },
  { icone: '📊', cle: 'priorites' }
];

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

      {/* ── CONDITIONS D'INSCRIPTION ──────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section">{t(`${P}.conditionsTitre`)}</h2>

          <div className="insc-paragraphes">
            {t(`${P}.conditions`, { returnObjects: true }).map((texte) => <p key={texte}>{texte}</p>)}
          </div>

          {/* Bouton vers Pirouette (plateforme d'inscription CAF) */}
          <div className="insc-pirouette">
            <a
              href="https://www.mon-enfant.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pirouette"
            >
              {t(`${P}.pirouette`)}
            </a>
          </div>
        </div>
      </section>

      {/* ── INCLUSION HANDICAP ────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <div className="insc-handicap">
            <span className="insc-handicap__icone">♿</span>
            <div>
              <h3 className="insc-handicap__titre">{t(`${P}.handicapTitre`)}</h3>
              <p>{t(`${P}.handicapTexte`)}</p>
              <p style={{ marginTop: '0.75rem' }}>{t(`${P}.handicapConditions`)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOCUMENTS NÉCESSAIRES ─────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.documentsTitre`)}</h2>
          <div className="documents-liste">
            {t(`${P}.documents`, { returnObjects: true }).map((doc, i) => (
              <div key={doc} className="document-item">
                <span>{ICONES_DOCUMENTS[i]}</span>
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FICHE DE PRÉ-INSCRIPTION ──────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.ficheTitre`)}</h2>
          <p className="text-center" style={{ color: 'var(--text-gray)', marginBottom: 'var(--space-xl)' }}>
            {t(`${P}.ficheIntro`)}
          </p>

          {/* Aperçu + bouton de téléchargement */}
          <div className="insc-fiche">
            <div className="insc-fiche__apercu">
              {/* Remplacez /fiche-preinscription.jpg par le vrai fichier dans public/ */}
              <img
                src="/fiche-preinscription.jpg"
                alt={t(`${P}.ficheAlt`)}
                className="insc-fiche__img"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="insc-fiche__actions">
              <a
                href="/fiche-preinscription.pdf"
                download="Fiche-preinscription-Les-Coccinelles.pdf"
                className="btn btn--primary btn--lg"
              >
                ⬇️ {t(`${P}.ficheTelecharger`)}
              </a>
              {/* Trans : le lien email est injecté dans la phrase traduite */}
              <p className="insc-fiche__hint">
                <Trans
                  i18nKey={`${P}.ficheHint`}
                  components={{ lien: <a href="mailto:contact@lescoccinelles.fr">contact@lescoccinelles.fr</a> }}
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CRITÈRES D'ADMISSION ──────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.criteresTitre`)}</h2>
          <div className="espaces-grille">
            {CRITERES.map(({ icone, cle }) => (
              <div key={cle} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{t(`${P}.criteres.${cle}.titre`)}</h3>
                <p className="espace-carte__texte">{t(`${P}.criteres.${cle}.texte`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION ──────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>{t(`${P}.ctaTexte`)}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/creer-un-compte" className="btn btn--primary btn--lg">
              {t(`${P}.ctaCompte`)}
            </Link>
            <Link to="/contact" className="btn btn--outline btn--lg"
              style={{ borderColor: 'white', color: 'white' }}>
              {t(`${P}.ctaContact`)}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Inscriptions;
