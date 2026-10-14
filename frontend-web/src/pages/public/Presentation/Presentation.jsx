// ============================================================
// FICHIER  : Presentation.jsx
// ROUTE    : /presentation
// RÔLE     : Page de présentation de la crèche Les Coccinelles.
//            Sections : Qui sommes-nous → Nos espaces →
//            Informations pratiques → CTA contact.
//            Page statique (pas d'appel API).
//            Textes traduits via i18n (clés public.presentation.*).
// ============================================================

import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import './Presentation.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.presentation';

// Espaces de la crèche : icône + clé de traduction (public.presentation.espaces.*)
const ESPACES = [
  { icone: '🍼', cle: 'bebes' },
  { icone: '🎠', cle: 'jeux' },
  { icone: '🌿', cle: 'jardin' },
  { icone: '🍽️', cle: 'repas' },
  { icone: '😴', cle: 'sieste' },
  { icone: '🚿', cle: 'changes' }
];

// Instances de l'association : icône + clé de traduction (public.presentation.gouvernance.*)
const GOUVERNANCE = [
  { icone: '🗳️', cle: 'ag' },
  { icone: '🤝', cle: 'ca' },
  { icone: '🗂️', cle: 'bureau' }
];

const Presentation = () => {
  const { contenu } = usePageCMS('presentation');
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Récupère un tableau de textes traduits (listes, paragraphes)
  const liste = (cle) => t(`${P}.${cle}`, { returnObjects: true });

  return (
    <div className="presentation">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">🐞 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      {/* ── QUI SOMMES-NOUS ? ────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">{t(`${P}.quiTitre`)}</h2>
            {/* Contenu CMS saisi par l'admin (en français) sinon texte par défaut traduit */}
            {contenu
              ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
              : liste('quiParagraphes').map((_, i) => (
                  <p key={i}><Trans i18nKey={`${P}.quiParagraphes.${i}`} /></p>
                ))
            }
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">🏡</div>
            <div className="info-bulle">
              <strong>{t(`${P}.bullePlaces`)}</strong>
              <span>{t(`${P}.bulleAges`)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HISTORIQUE ───────────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.historiqueTitre`)}</h2>
          <div className="historique-contenu">
            {/* <sup> conservé pour "1er" via le composant Trans */}
            {liste('historique').map((_, i) => (
              <p key={i}><Trans i18nKey={`${P}.historique.${i}`} components={{ sup: <sup /> }} /></p>
            ))}

            <div className="historique-repartitions">
              <div className="historique-repartition">
                <h3 className="gouvernance-question">{t(`${P}.repartitionAvantTitre`)}</h3>
                <ul className="gouvernance-liste">
                  {liste('repartitionAvant').map((ligne) => <li key={ligne}>{ligne}</li>)}
                </ul>
              </div>

              <div className="historique-repartition">
                <h3 className="gouvernance-question">
                  <Trans i18nKey={`${P}.repartitionApresTitre`} components={{ sup: <sup /> }} />
                </h3>
                <ul className="gouvernance-liste">
                  {liste('repartitionApres').map((ligne) => <li key={ligne}>{ligne}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOS ESPACES ───────────────────────────────────────── */}
      {/* Grille de 6 cartes décrivant chaque zone de la crèche */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.espacesTitre`)}</h2>
          <div className="espaces-grille">
            {ESPACES.map(({ icone, cle }) => (
              <div key={cle} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{t(`${P}.espaces.${cle}.titre`)}</h3>
                <p className="espace-carte__texte">{t(`${P}.espaces.${cle}.texte`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFORMATIONS PRATIQUES ───────────────────────────── */}
      {/* 4 cartes : adresse, horaires, téléphone, email */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.infosTitre`)}</h2>
          <div className="infos-grille">
            <div className="info-carte">
              <span className="info-carte__icone">📍</span>
              <h3>{t(`${P}.adresse`)}</h3>
              <p>10 rue Saint Vincent<br />17138 Puilboreau</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">🕐</span>
              <h3>{t(`${P}.horaires`)}</h3>
              <p><Trans i18nKey={`${P}.horairesTexte`} /></p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">📞</span>
              <h3>{t(`${P}.telephone`)}</h3>
              <p>05 46 69 68 25</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">✉️</span>
              <h3>{t(`${P}.email`)}</h3>
              <p>les.coccinelles17@orange.fr</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOUVERNANCE ASSOCIATIVE ──────────────────────────── */}
      {/* Fonctionnement de l'association : Assemblée générale,
          Conseil d'Administration, Bureau. Contenu statique
          (règles de gouvernance, pas de données CMS/API). */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.gouvernanceTitre`)}</h2>
          <p className="gouvernance-intro">{t(`${P}.gouvernanceIntro`)}</p>

          <div className="gouvernance-grille">
            {/* Une carte par instance : titre, question, liste de rôles */}
            {GOUVERNANCE.map(({ icone, cle }) => (
              <div key={cle} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{t(`${P}.gouvernance.${cle}.titre`)}</h3>
                <p className="gouvernance-question">{t(`${P}.gouvernance.${cle}.question`)}</p>
                <ul className="gouvernance-liste">
                  {liste(`gouvernance.${cle}.points`).map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAVAIL MENÉ AVEC LES PARENTS ────────────────────── */}
      <section className="section-grise">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">{t(`${P}.parentsTitre`)}</h2>
            {liste('parents').map((texte) => <p key={texte}>{texte}</p>)}
            <p><strong>{t(`${P}.parentsConclusion`)}</strong></p>
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">🤝</div>
            <div className="info-bulle">
              <strong>{t(`${P}.ensemble`)}</strong>
              <span>{t(`${P}.ensembleSous`)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>{t(`${P}.ctaTexte`)}</p>
          <Link to="/contact" className="btn btn--primary btn--lg">{t(`${P}.ctaBouton`)}</Link>
        </div>
      </section>

    </div>
  );
};

export default Presentation;
