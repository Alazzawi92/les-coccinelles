// ============================================================
// FICHIER  : MentionsLegales.jsx
// ROUTE    : /mentions-legales
// RÔLE     : Mentions légales et conformité RGPD.
//            Contenu chargé depuis le CMS si disponible,
//            sinon affichage du contenu statique de référence.
//            Le contenu statique est traduit via i18n
//            (clés public.mentions.*) : chaque section y est décrite
//            par { titre, avant[], tableau?, grille?, liste[], apres[] }.
// ============================================================

import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import { getLocale } from '../../../i18n';
import './MentionsLegales.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.mentions';

// Sections dans l'ordre d'affichage : id = ancre HTML (liens du sommaire
// et lien "#cookies" de la bannière), cle = clé de traduction
const SECTIONS = [
  { id: 'editeur',          cle: 'editeur' },
  { id: 'publication',      cle: 'publication' },
  { id: 'hebergement',      cle: 'hebergement' },
  { id: 'propriete',        cle: 'propriete' },
  { id: 'donnees',          cle: 'donnees' },
  { id: 'base-legale',      cle: 'baseLegale' },
  { id: 'sante',            cle: 'sante', alerte: true }, // Encadré d'alerte (données sensibles)
  { id: 'destinataires',    cle: 'destinataires' },
  { id: 'conservation',     cle: 'conservation' },
  { id: 'securite',         cle: 'securite' },
  { id: 'droits',           cle: 'droits' },
  { id: 'reclamation',      cle: 'reclamation' },
  { id: 'photos',           cle: 'photos' },
  { id: 'cookies',          cle: 'cookies' },
  { id: 'mineurs',          cle: 'mineurs' },
  { id: 'droit-applicable', cle: 'droitApplicable' }
];

// Icônes de la grille des droits RGPD, dans l'ordre de sections.droits.grille
const ICONES_DROITS = ['👁️', '✏️', '🗑️', '⏸️', '🚫', '📦', '🧭'];

// Balises autorisées dans les textes traduits (en plus de <strong>, <br/>)
const BALISES = { em: <em /> };

/**
 * Affiche une section des mentions légales à partir de ses traductions.
 * Props :
 * - id     : ancre HTML de la section
 * - cle    : clé de traduction (public.mentions.sections.<cle>)
 * - numero : numéro affiché devant le titre
 * - alerte : true = encadré d'alerte au lieu d'une section classique
 */
const Section = ({ id, cle, numero, alerte = false }) => {
  const { t, i18n } = useTranslation();
  const base = `${P}.sections.${cle}`;

  // Lit une partie de la section ; renvoie la valeur par défaut si elle n'existe pas
  const lire = (partie, defaut) => (
    i18n.exists(`${base}.${partie}`) ? t(`${base}.${partie}`, { returnObjects: true }) : defaut
  );
  const avant   = lire('avant', []);
  const liste   = lire('liste', []);
  const apres   = lire('apres', []);
  const tableau = lire('tableau', null);
  const grille  = lire('grille', null);

  return (
    <div className={alerte ? 'mentions-alerte' : 'mentions-section'} id={id}>
      <h2>{numero}. {t(`${base}.titre`)}</h2>

      {/* Paragraphes d'introduction (Trans conserve <strong> et <em>) */}
      {avant.map((_, i) => (
        <p key={i}><Trans i18nKey={`${base}.avant.${i}`} components={BALISES} /></p>
      ))}

      {/* Tableau éventuel : entêtes + lignes */}
      {tableau && (
        <div className="mentions-tableau-wrapper">
          <table className="mentions-tableau">
            <thead><tr>{tableau.entetes.map(e => <th key={e}>{e}</th>)}</tr></thead>
            <tbody>
              {tableau.lignes.map(ligne => (
                <tr key={ligne[0]}>{ligne.map((cellule, i) => <td key={i}>{cellule}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grille éventuelle (droits RGPD) : icône + titre + description */}
      {grille && (
        <div className="droits-grille">
          {grille.map(({ droit, desc }, i) => (
            <div key={droit} className="droit-item">
              <span>{ICONES_DROITS[i]}</span>
              <div><strong>{droit}</strong><p>{desc}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Liste à puces éventuelle */}
      {liste.length > 0 && (
        <ul>
          {liste.map((_, i) => (
            <li key={i}><Trans i18nKey={`${base}.liste.${i}`} components={BALISES} /></li>
          ))}
        </ul>
      )}

      {/* Paragraphes de conclusion */}
      {apres.map((_, i) => (
        <p key={i}><Trans i18nKey={`${base}.apres.${i}`} components={BALISES} /></p>
      ))}
    </div>
  );
};

const MentionsLegales = () => {
  const { contenu } = usePageCMS('mentions-legales');
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  return (
    <div className="mentions">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--bleu">
        <div className="container">
          <p className="page-hero__tag">📋 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      <section className="section-blanche">
        <div className="container mentions-contenu">

          {contenu
            ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
            : (
              <>
                {/* ── SOMMAIRE ──────────────────────────────────── */}
                <nav className="mentions-sommaire">
                  <p className="mentions-sommaire__titre">{t(`${P}.sommaire`)}</p>
                  <ol>
                    {SECTIONS.map(({ id, cle }) => (
                      <li key={id}><a href={`#${id}`}>{t(`${P}.sections.${cle}.titreCourt`, { defaultValue: t(`${P}.sections.${cle}.titre`) })}</a></li>
                    ))}
                  </ol>
                </nav>

                {/* ── SECTIONS NUMÉROTÉES ───────────────────────── */}
                {SECTIONS.map(({ id, cle, alerte }, i) => (
                  <Section key={id} id={id} cle={cle} numero={i + 1} alerte={alerte} />
                ))}
              </>
            )
          }

          <p className="mentions-date">
            {t(`${P}.miseAJour`, { date: new Date().toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) })}
          </p>

        </div>
      </section>

    </div>
  );
};

export default MentionsLegales;
