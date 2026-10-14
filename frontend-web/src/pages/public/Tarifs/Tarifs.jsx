// ============================================================
// FICHIER  : Tarifs.jsx
// ROUTE    : /tarifs
// RÔLE     : Page publique d'information sur la grille tarifaire.
//            Explication chargée depuis le CMS, tableau PSU statique.
//            Textes traduits via i18n (clés public.tarifs.*) ;
//            montants formatés selon la langue (0,06 € / €0.06).
// ============================================================

import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import { getLocale } from '../../../i18n';
import './Tarifs.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.tarifs';

// Tranches de revenus (en €) et tarifs horaires pour 1, 2 et 3+ enfants
const TRANCHES = [
  { min: null, max: 1000, t1: 0.06, t2: 0.05, t3: 0.04 },
  { min: 1000, max: 2000, t1: 0.13, t2: 0.10, t3: 0.09 },
  { min: 2000, max: 3000, t1: 0.20, t2: 0.16, t3: 0.14 },
  { min: 3000, max: 4000, t1: 0.27, t2: 0.22, t3: 0.19 },
  { min: 4000, max: null, t1: 0.36, t2: 0.29, t3: 0.25 }
];

// Cartes d'explication : icône + clé de traduction (public.tarifs.explications.*)
const EXPLICATIONS = [
  { icone: '🏛️', cle: 'psu' },
  { icone: '📊', cle: 'revenus' },
  { icone: '💳', cle: 'caf' }
];

// Éléments inclus dans le tarif : icône + clé de traduction (public.tarifs.inclus.*)
const INCLUS = [
  { icone: '🍽️', cle: 'repas' },
  { icone: '🧴', cle: 'soins' },
  { icone: '🎨', cle: 'activites' }
];

const Tarifs = () => {
  const { contenu } = usePageCMS('tarifs');
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Formate un montant en euros selon la langue active
  const euros = (montant, decimales = 2) => new Intl.NumberFormat(getLocale(), {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: decimales, maximumFractionDigits: decimales
  }).format(montant);

  // Libellé d'une tranche de revenus : "< 1 000 €", "1 000 € — 2 000 €", "> 4 000 €"
  const libelleTranche = ({ min, max }) => {
    if (min === null) return `< ${euros(max, 0)}`;
    if (max === null) return `> ${euros(min, 0)}`;
    return `${euros(min, 0)} — ${euros(max, 0)}`;
  };

  return (
    <div className="tarifs">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">💶 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      {/* ── EXPLICATION (CMS ou fallback) ────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.calculTitre`)}</h2>
          {contenu
            ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
            : (
              <div className="tarifs-explication">
                {EXPLICATIONS.map(({ icone, cle }) => (
                  <div key={cle} className="explication-carte">
                    <span className="explication-icone">{icone}</span>
                    <h3>{t(`${P}.explications.${cle}.titre`)}</h3>
                    <p><Trans i18nKey={`${P}.explications.${cle}.texte`} /></p>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </section>

      {/* ── TABLEAU TARIFAIRE ─────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.tableauTitre`)}</h2>
          <div className="tarifs-tableau-wrapper">
            <table className="tarifs-tableau">
              <thead>
                <tr>
                  <th>{t(`${P}.colRevenu`)}</th>
                  <th>{t(`${P}.col1`)}</th>
                  <th>{t(`${P}.col2`)}</th>
                  <th>{t(`${P}.col3`)}</th>
                </tr>
              </thead>
              <tbody>
                {TRANCHES.map((tranche) => (
                  <tr key={tranche.max ?? 'max'}>
                    <td>{libelleTranche(tranche)}</td>
                    <td className="tarif-montant">{euros(tranche.t1)}</td>
                    <td className="tarif-montant">{euros(tranche.t2)}</td>
                    <td className="tarif-montant">{euros(tranche.t3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tarifs-note">{t(`${P}.note`)}</p>
        </div>
      </section>

      {/* ── CE QUI EST INCLUS ─────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.inclusTitre`)}</h2>
          <div className="espaces-grille">
            {INCLUS.map(({ icone, cle }) => (
              <div key={cle} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{t(`${P}.inclus.${cle}.titre`)}</h3>
                <p className="espace-carte__texte">{t(`${P}.inclus.${cle}.texte`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Tarifs;
