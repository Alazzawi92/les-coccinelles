// ============================================================
// FICHIER  : Horaires.jsx
// ROUTE    : /horaires
// RÔLE     : Page des horaires d'ouverture de la crèche.
//            Tableau statique des heures + contenu CMS informatif.
//            Textes traduits via i18n (clés public.horaires.*).
// ============================================================

import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import './Horaires.css';

// Jours de la semaine : cle = clé de traduction du jour (common.jours.*)
const JOURS = [
  { cle: 'lundi',    ouvert: true  },
  { cle: 'mardi',    ouvert: true  },
  { cle: 'mercredi', ouvert: true  },
  { cle: 'jeudi',    ouvert: true  },
  { cle: 'vendredi', ouvert: true  },
  { cle: 'samedi',   ouvert: false },
  { cle: 'dimanche', ouvert: false }
];

// Types d'accueil : icône + clé de traduction (public.horaires.types.*)
const TYPES_ACCUEIL = [
  { icone: '📅', cle: 'plein' },
  { icone: '🕰️', cle: 'partiel' },
  { icone: '🎲', cle: 'occasionnel' }
];

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.horaires';

const Horaires = () => {
  const { contenu } = usePageCMS('horaires');
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  return (
    <div className="horaires">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--orange">
        <div className="container">
          <p className="page-hero__tag">🕐 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      {/* ── TABLEAU DES HORAIRES ──────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.ouvertureTitre`)}</h2>

          <div className="horaires-tableau">
            {JOURS.map(({ cle, ouvert }) => (
              <div key={cle} className={`horaire-ligne ${ouvert ? '' : 'horaire-ligne--ferme'}`}>
                <span className="horaire-jour">{t(`common.jours.${cle}`)}</span>
                <span className="horaire-statut">
                  {/* Heures au format de la langue (7h30 / 7:30am) */}
                  {ouvert
                    ? <><strong>{t(`${P}.ouverture`)}</strong> — <strong>{t(`${P}.fermeture`)}</strong></>
                    : <span className="ferme-label">{t(`${P}.ferme`)}</span>
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Contenu CMS ou encarts statiques */}
          {contenu
            ? <div className="cms-html" style={{ marginTop: 'var(--space-xl)' }} dangerouslySetInnerHTML={{ __html: contenu }} />
            : (
              <div className="horaires-info">
                <div className="info-box info-box--orange">
                  <span>⚠️</span>
                  <p><Trans i18nKey={`${P}.infoFeries`} /></p>
                </div>
                <div className="info-box info-box--bleu">
                  <span>📞</span>
                  <p><Trans i18nKey={`${P}.infoAbsence`} /></p>
                </div>
              </div>
            )
          }
        </div>
      </section>

      {/* ── TYPES D'ACCUEIL ───────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.typesTitre`)}</h2>
          <div className="espaces-grille">
            {TYPES_ACCUEIL.map(({ icone, cle }) => (
              <div key={cle} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{t(`${P}.types.${cle}.titre`)}</h3>
                <p className="espace-carte__texte">{t(`${P}.types.${cle}.texte`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Horaires;
