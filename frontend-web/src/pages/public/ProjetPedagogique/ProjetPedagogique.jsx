// ============================================================
// FICHIER  : ProjetPedagogique.jsx
// ROUTE    : /projet-pedagogique
// RÔLE     : Page du projet pédagogique de la crèche.
//            Philosophie chargée depuis le CMS, axes et timeline statiques.
//            Textes traduits via i18n (clés public.projetPeda.*).
// ============================================================

import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import './ProjetPedagogique.css';

// Préfixe commun à toutes les clés de traduction de la page
const P = 'public.projetPeda';

// 3 axes pédagogiques : icône, couleur + clé de traduction (public.projetPeda.axes.*)
const AXES = [
  { icone: '🌱', couleur: 'vert',   cle: 'nature' },
  { icone: '🎨', couleur: 'orange', cle: 'creativite' },
  { icone: '🤝', couleur: 'violet', cle: 'collectivite' }
];

// Icônes de la journée type, dans l'ordre des étapes (public.projetPeda.journee)
const ICONES_JOURNEE = ['👋', '🎨', '🧴', '🍽️', '😴', '🍪', '🌿', '🏠'];

const ProjetPedagogique = () => {
  const { contenu } = usePageCMS('projet-pedagogique');
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Étapes de la journée type : tableau de { heure, label }
  const journee = t(`${P}.journee`, { returnObjects: true });

  return (
    <div className="projet-peda">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--violet">
        <div className="container">
          <p className="page-hero__tag">📚 {t(`${P}.tag`)}</p>
          <h1 className="page-hero__titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t(`${P}.sousTitre`)}</p>
        </div>
      </section>

      {/* ── PHILOSOPHIE (CMS ou fallback) ────────────────────── */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">{t(`${P}.philoTitre`)}</h2>
            {contenu
              ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
              : t(`${P}.philo`, { returnObjects: true }).map((_, i) => (
                  // Trans conserve les balises <strong> et <em> de la traduction
                  <p key={i}><Trans i18nKey={`${P}.philo.${i}`} components={{ em: <em /> }} /></p>
                ))
            }
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">📚</div>
            <div className="info-bulle"><strong>{t(`${P}.bulleAxes`)}</strong><span>{t(`${P}.bulleSous`)}</span></div>
          </div>
        </div>
      </section>

      {/* ── 3 AXES PÉDAGOGIQUES ──────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.axesTitre`)}</h2>
          <div className="axes-grille">
            {AXES.map(({ icone, couleur, cle }) => (
              <div key={cle} className={`axe-carte axe-carte--${couleur}`}>
                <span className="axe-carte__icone">{icone}</span>
                <h3 className="axe-carte__titre">{t(`${P}.axes.${cle}.titre`)}</h3>
                <ul className="axe-carte__liste">
                  {t(`${P}.axes.${cle}.points`, { returnObjects: true }).map(p => <li key={p}>✓ {p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNÉE TYPE ─────────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">{t(`${P}.journeeTitre`)}</h2>
          <div className="journee-timeline">
            {journee.map(({ heure, label }, i) => (
              <div key={heure} className="timeline-item">
                <div className="timeline-heure">{heure}</div>
                <div className="timeline-point">{ICONES_JOURNEE[i]}</div>
                <div className="timeline-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProjetPedagogique;
