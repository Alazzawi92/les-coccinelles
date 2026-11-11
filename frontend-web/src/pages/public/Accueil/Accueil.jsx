// ============================================================
// FICHIER  : Accueil.jsx
// ROUTE    : /
// RÔLE     : Page d'accueil publique de la crèche Les Coccinelles.
//            Sections : Hero → Message CMS → Chiffres clés →
//            Valeurs → CTA.
//            Équipe, Menu de la semaine et Actualités ne sont plus
//            sur l'accueil (version réduite du site) : l'équipe est
//            sur /presentation, menus et actualités ont leurs pages.
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import usePageCMS from '../../../hooks/usePageCMS';
import ModaleEmailConfirme from '../../../components/ui/ModaleEmailConfirme/ModaleEmailConfirme';
import './Accueil.css';

const Accueil = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Arrivée depuis le lien de confirmation d'email (/verify-email) :
  // fenêtre "email confirmé" affichée une seule fois. L'indicateur est
  // retiré de l'historique tout de suite pour qu'un rechargement de la
  // page ne la réaffiche pas.
  const location = useLocation();
  const navigate = useNavigate();
  const [modaleEmail, setModaleEmail] = useState(Boolean(location.state?.emailConfirme));
  useEffect(() => {
    if (location.state?.emailConfirme) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);
  const fermerModaleEmail = useCallback(() => setModaleEmail(false), []);

  const { contenu: contenuCMS } = usePageCMS('accueil');

  return (
    <div className="accueil">
      {/* Fenêtre après confirmation de l'email (voir plus haut) */}
      {modaleEmail && <ModaleEmailConfirme onFermer={fermerModaleEmail} />}


      {/* ── HERO ────────────────────────────────────────────── */}
      {/* Section principale : slogan + boutons CTA + visuels décoratifs */}
      <section className="hero">

        {/* Bulles flottantes en arrière-plan (animations CSS) */}
        <div className="hero__fond" aria-hidden="true">
          <span className="hero__bulle hero__bulle--1">🐞</span>
          <span className="hero__bulle hero__bulle--2">🌿</span>
          <span className="hero__bulle hero__bulle--3">⭐</span>
          <span className="hero__bulle hero__bulle--4">🌸</span>
          <span className="hero__bulle hero__bulle--5">🦋</span>
          <span className="hero__bulle hero__bulle--6">🍄</span>
          <span className="hero__bulle hero__bulle--7">🌼</span>
          <span className="hero__bulle hero__bulle--8">🌈</span>
          <span className="hero__bulle hero__bulle--9">🐝</span>
          <span className="hero__bulle hero__bulle--10">🍃</span>
          <span className="hero__bulle hero__bulle--11">☁️</span>
          <span className="hero__bulle hero__bulle--12">✨</span>
          {/* Petit groupe supplémentaire autour de l'arc-en-ciel, en bas à gauche */}
          <span className="hero__bulle hero__bulle--13">🌻</span>
          <span className="hero__bulle hero__bulle--14">🐌</span>
          <span className="hero__bulle hero__bulle--15">🌱</span>
          <span className="hero__bulle hero__bulle--16">✨</span>
          <span className="hero__bulle hero__bulle--17">🌾</span>
        </div>

        <div className="container hero__contenu">
          {/* Texte + boutons à gauche */}
          <div className="hero__texte">
            <p className="hero__surtitle">{t('public.accueil.surtitre')}</p>
            {/* Trans : traduction contenant des balises (<br/>, <s> → <span>) */}
            <h1 className="hero__titre">
              <Trans i18nKey="public.accueil.titre" components={{ s: <span /> }} />
            </h1>
            <p className="hero__description">
              {t('public.accueil.description')}
            </p>
            <div className="hero__actions">
              <Link to="/conditions-inscription" className="btn btn--primary btn--lg hero__inscrire">
                {t('public.accueil.inscrire')}
              </Link>
            </div>
          </div>

          {/* Visuels décoratifs à droite */}
          <div className="hero__visuel" aria-hidden="true">
            {/* Arcs-en-ciel derrière la coccinelle : 3 arcs SVG (même dessin,
                tailles/angles/positions différents via les classes --1/--2/--3),
                chacun flotte doucement (voir animation "flotter-arc") */}
            <svg className="hero__arc-en-ciel hero__arc-en-ciel--1" viewBox="0 0 400 220" fill="none">
              <path d="M 20 200 A 180 180 0 0 1 380 200" stroke="#F06292" strokeWidth="20" strokeLinecap="round" />
              <path d="M 44 200 A 156 156 0 0 1 356 200" stroke="#FF9800" strokeWidth="20" strokeLinecap="round" />
              <path d="M 68 200 A 132 132 0 0 1 332 200" stroke="#FFEB3B" strokeWidth="20" strokeLinecap="round" />
              <path d="M 92 200 A 108 108 0 0 1 308 200" stroke="#66BB6A" strokeWidth="20" strokeLinecap="round" />
              <path d="M 116 200 A 84 84 0 0 1 284 200"  stroke="#4FC3F7" strokeWidth="20" strokeLinecap="round" />
              <path d="M 140 200 A 60 60 0 0 1 260 200"  stroke="#BA68C8" strokeWidth="20" strokeLinecap="round" />
            </svg>
            <svg className="hero__arc-en-ciel hero__arc-en-ciel--2" viewBox="0 0 400 220" fill="none">
              <path d="M 20 200 A 180 180 0 0 1 380 200" stroke="#F06292" strokeWidth="20" strokeLinecap="round" />
              <path d="M 44 200 A 156 156 0 0 1 356 200" stroke="#FF9800" strokeWidth="20" strokeLinecap="round" />
              <path d="M 68 200 A 132 132 0 0 1 332 200" stroke="#FFEB3B" strokeWidth="20" strokeLinecap="round" />
              <path d="M 92 200 A 108 108 0 0 1 308 200" stroke="#66BB6A" strokeWidth="20" strokeLinecap="round" />
              <path d="M 116 200 A 84 84 0 0 1 284 200"  stroke="#4FC3F7" strokeWidth="20" strokeLinecap="round" />
              <path d="M 140 200 A 60 60 0 0 1 260 200"  stroke="#BA68C8" strokeWidth="20" strokeLinecap="round" />
            </svg>
            <svg className="hero__arc-en-ciel hero__arc-en-ciel--3" viewBox="0 0 400 220" fill="none">
              <path d="M 20 200 A 180 180 0 0 1 380 200" stroke="#F06292" strokeWidth="20" strokeLinecap="round" />
              <path d="M 44 200 A 156 156 0 0 1 356 200" stroke="#FF9800" strokeWidth="20" strokeLinecap="round" />
              <path d="M 68 200 A 132 132 0 0 1 332 200" stroke="#FFEB3B" strokeWidth="20" strokeLinecap="round" />
              <path d="M 92 200 A 108 108 0 0 1 308 200" stroke="#66BB6A" strokeWidth="20" strokeLinecap="round" />
              <path d="M 116 200 A 84 84 0 0 1 284 200"  stroke="#4FC3F7" strokeWidth="20" strokeLinecap="round" />
              <path d="M 140 200 A 60 60 0 0 1 260 200"  stroke="#BA68C8" strokeWidth="20" strokeLinecap="round" />
            </svg>
            <img src="/images/logo.png" alt={t('public.accueil.logoAlt')} className="hero__logo-grand" />
            <div className="hero__deco">
              <span>🌿</span><span>🌼</span><span>🍄</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MESSAGE CMS (si l'admin a saisi du contenu) ─────── */}
      {contenuCMS && (
        <section className="section-blanche">
          <div className="container">
            <div className="cms-html accueil-cms" dangerouslySetInnerHTML={{ __html: contenuCMS }} />
          </div>
        </section>
      )}

      {/* ── CHIFFRES CLÉS ───────────────────────────────────── */}
      <section className="chiffres">
        <div className="container chiffres__grille">
          {/* 4 indicateurs clés : places, horaires, jours, équipe
              detail : ligne facultative sous le chiffre (places garderie) */}
          {[
            { valeur: '28',   unite: t('public.accueil.chiffres.placesUnite'),   detail: t('public.accueil.chiffres.placesGarderie'), label: t('public.accueil.chiffres.placesLabel'),   icone: '👶' },
            { valeur: t('public.accueil.chiffres.horairesValeur'), unite: t('public.accueil.chiffres.horairesUnite'), label: t('public.accueil.chiffres.horairesLabel'), icone: '🕐' },
            { valeur: '5',    unite: t('public.accueil.chiffres.joursUnite'),    label: t('public.accueil.chiffres.joursLabel'),    icone: '📅' },
            { valeur: '100%', unite: '',                                         label: t('public.accueil.chiffres.equipeLabel'),   icone: '🎓' }
          ].map(({ valeur, unite, detail, label, icone }) => (
            <div key={label} className="chiffre-carte">
              <span className="chiffre-carte__icone">{icone}</span>
              <div className="chiffre-carte__nombre">
                <strong>{valeur}</strong>
                {unite && <span> {unite}</span>}
              </div>
              {detail && <p className="chiffre-carte__detail">{detail}</p>}
              <p className="chiffre-carte__label">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOS VALEURS ─────────────────────────────────────── */}
      <section className="valeurs">
        <div className="container">
          <h2 className="section-titre text-center">
            <Trans i18nKey="public.accueil.valeursTitre" components={{ s: <span /> }} />
          </h2>
          <div className="valeurs__grille">
            {/* 4 cartes valeurs : Nature, Bienveillance, Créativité, Familles
                cle : clé de traduction (public.accueil.valeurs.*) */}
            {[
              { icone: '🌿', couleur: 'vert',   cle: 'nature' },
              { icone: '❤️', couleur: 'rose',   cle: 'bienveillance' },
              { icone: '🎨', couleur: 'orange', cle: 'creativite' },
              { icone: '👨‍👩‍👧', couleur: 'violet', cle: 'familles' }
            ].map(({ icone, couleur, cle }) => (
              <div key={cle} className={`valeur-carte valeur-carte--${couleur}`}>
                <div className="valeur-carte__icone">{icone}</div>
                <h3 className="valeur-carte__titre">{t(`public.accueil.valeurs.${cle}.titre`)}</h3>
                <p className="valeur-carte__texte">{t(`public.accueil.valeurs.${cle}.texte`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION FINAL ──────────────────────────── */}
      <section className="cta">
        <div className="container cta__contenu">
          <h2 className="cta__titre">{t('public.accueil.ctaTitre')}</h2>
          <p className="cta__texte">
            {t('public.accueil.ctaTexte')}
          </p>
          <div className="cta__actions">
            <Link to="/conditions-inscription" className="btn btn--primary btn--lg">
              {t('public.accueil.voirConditions')}
            </Link>
            <Link to="/contact" className="cta__btn-contact">
              {t('public.accueil.nousContacter')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Accueil;
