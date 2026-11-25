// ============================================================
// FICHIER  : Presentation.jsx
// ROUTE    : /presentation
// RÔLE     : Page de présentation de la crèche Les Coccinelles.
//            Sections (ordre du menu de la crèche) : Gestion associative →
//            Qui sommes-nous (capacité d'accueil) → Notre équipe →
//            Travail avec les parents → Historique → Documentation →
//            Calendrier des fermetures → Partenaires → CTA contact.
//            Documentation, fermetures et partenaires sont gérés par le
//            super admin (back office) et chargés depuis l'API ; l'aperçu
//            de l'équipe charge ses propres données.
//            Textes traduits via i18n (clés public.presentation.*).
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api, { urlFichier } from '../../../services/api';
import { getLocale } from '../../../i18n';
import { depuisDateISO } from '../../../utils/dates'; // Dates en heure locale
import usePageCMS from '../../../hooks/usePageCMS';
import ApercuEquipe from '../../../components/ui/ApercuEquipe/ApercuEquipe';
import './Presentation.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.presentation';

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

  // ── Contenus gérés depuis le back office ──────────────────
  // null = chargement en cours ; une erreur donne une liste vide
  const [documents,   setDocuments]   = useState(null);
  const [fermetures,  setFermetures]  = useState(null);
  const [partenaires, setPartenaires] = useState(null);

  useEffect(() => {
    const charger = (url, setter) => api.get(url)
      .then(res => setter(res.data.data || []))
      .catch(() => setter([]));
    charger('/documentation', setDocuments);
    charger('/fermetures',    setFermetures);   // En cours et à venir seulement
    charger('/partenaires',   setPartenaires);
  }, []);

  // Date lisible : « mercredi 24 décembre 2026 »
  const formaterDate = (iso) => depuisDateISO(iso).toLocaleDateString(getLocale(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Sections visibles après « Historique » (documentation et partenaires
  // masqués tant qu'ils sont vides) : leur fond alterne gris / blanc
  const sectionsFin = [
    documents?.length   ? 'documentation' : null,
    'fermetures',
    partenaires?.length ? 'partenaires'   : null
  ].filter(Boolean);
  const fond = (section) => (sectionsFin.indexOf(section) % 2 === 0 ? 'section-grise' : 'section-blanche');

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

      {/* ── QUI SOMMES-NOUS ? ────────────────────────────────── */}
      <section className="section-grise">
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
              {/* Places fixes + places garderie (accueil occasionnel) */}
              <strong>{t(`${P}.bullePlaces`)}</strong>
              <span className="info-bulle__detail">{t(`${P}.bulleGarderie`)}</span>
              <span>{t(`${P}.bulleAges`)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTRE ÉQUIPE ─────────────────────────────────────── */}
      {/* Aperçu des premiers membres + lien vers /equipe (toujours sur fond
          blanc : les sections voisines sont grises pour garder l'alternance) */}
      <ApercuEquipe />

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

      {/* ── HISTORIQUE ───────────────────────────────────────── */}
      <section className="section-blanche">
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

      {/* ── DOCUMENTATION ────────────────────────────────────── */}
      {/* Documents PDF publics (back office → Documentation) */}
      {documents?.length > 0 && (
        <section className={fond('documentation')}>
          <div className="container">
            <h2 className="titre-section text-center">{t(`${P}.documentationTitre`)}</h2>
            <p className="presentation-intro">{t(`${P}.documentationIntro`)}</p>
            <ul className="documentation-liste">
              {documents.map(doc => (
                <li key={doc.id} className="documentation-carte">
                  <span className="documentation-carte__icone" aria-hidden="true">📄</span>
                  <div className="documentation-carte__texte">
                    <h3 className="documentation-carte__titre">{doc.titre}</h3>
                    {doc.description && <p className="documentation-carte__description">{doc.description}</p>}
                  </div>
                  {/* Ouvre le PDF dans un nouvel onglet (consultation ou téléchargement) */}
                  <a href={urlFichier(doc.fichier)} target="_blank" rel="noopener noreferrer"
                    className="btn btn--outline btn--sm" aria-label={`${t(`${P}.telechargerPdf`)} : ${doc.titre}`}>
                    ⬇️ {t(`${P}.telechargerPdf`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CALENDRIER DES FERMETURES ────────────────────────── */}
      {/* Fermetures en cours et à venir (back office → Fermetures) */}
      <section className={fond('fermetures')}>
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.fermeturesTitre`)}</h2>
          {fermetures === null ? null : fermetures.length === 0 ? (
            <p className="presentation-intro">{t(`${P}.fermeturesVide`)}</p>
          ) : (
            <>
              <p className="presentation-intro">{t(`${P}.fermeturesIntro`)}</p>
              <ul className="fermetures-liste">
                {fermetures.map(f => (
                  <li key={f.id} className="fermeture-ligne">
                    <span className="fermeture-ligne__icone" aria-hidden="true">🚪</span>
                    <div>
                      <p className="fermeture-ligne__dates">
                        {f.date_debut === f.date_fin
                          ? t(`${P}.fermetureJour`, { date: formaterDate(f.date_debut) })
                          : t(`${P}.fermeturePeriode`, { debut: formaterDate(f.date_debut), fin: formaterDate(f.date_fin) })}
                      </p>
                      <p className="fermeture-ligne__motif">{f.motif}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* ── LES PARTENAIRES ──────────────────────────────────── */}
      {/* Logos cliquables vers le site de chaque partenaire (back office → Partenaires) */}
      {partenaires?.length > 0 && (
        <section className={fond('partenaires')}>
          <div className="container">
            <h2 className="titre-section text-center">{t(`${P}.partenairesTitre`)}</h2>
            <p className="presentation-intro">{t(`${P}.partenairesIntro`)}</p>
            <ul className="partenaires-grille">
              {/* Une carte par partenaire : logo (sinon icône neutre), nom, catégorie,
                  bouton « Visiter le site » seulement si un site est renseigné */}
              {partenaires.map(p => (
                <li key={p.id} className="partenaire-carte">
                  <span className="partenaire-carte__logo">
                    {p.logo
                      ? <img src={urlFichier(p.logo)} alt={t(`${P}.logoDe`, { nom: p.nom })} loading="lazy" />
                      : <span className="partenaire-carte__icone" aria-hidden="true">🤝</span>}
                  </span>
                  <h3 className="partenaire-carte__nom">{p.nom}</h3>
                  {p.categorie && <p className="partenaire-carte__categorie">{p.categorie}</p>}
                  {/* Lien externe : nouvel onglet, sans accès à la page d'origine (noopener) */}
                  {p.lien && (
                    <a href={p.lien} target="_blank" rel="noopener noreferrer"
                      className="btn btn--outline btn--sm partenaire-carte__bouton"
                      aria-label={t(`${P}.visiterSiteAria`, { nom: p.nom })}>
                      {t(`${P}.visiterSite`)} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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
