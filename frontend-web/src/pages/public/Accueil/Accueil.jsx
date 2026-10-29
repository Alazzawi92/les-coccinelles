// ============================================================
// FICHIER  : Accueil.jsx
// ROUTE    : /
// RÔLE     : Page d'accueil publique de la crèche Les Coccinelles.
//            Sections : Hero → Chiffres clés → Valeurs →
//            Menu de la semaine → Actualités → CTA.
//            Les données actualités et menus sont chargées
//            dynamiquement depuis l'API au montage.
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import api, { BACKEND_URL, urlFichier } from '../../../services/api';
import usePageCMS from '../../../hooks/usePageCMS';
import { getLocale } from '../../../i18n';
import ModaleEmailConfirme from '../../../components/ui/ModaleEmailConfirme/ModaleEmailConfirme';
import './Accueil.css';

// Quill produit "<p><br></p>" pour un champ vide
const quillVide = v => !v || v === '<p><br></p>';

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

  // Dernières actualités (3 maximum pour la page d'accueil)
  const [actualites, setActualites] = useState([]);
  const [menu,       setMenu]       = useState(null);
  const [membres,    setMembres]    = useState([]);
  const { contenu: contenuCMS } = usePageCMS('accueil');

  useEffect(() => {
    const chargerDonnees = async () => {
      const [resActu, resMenu, resEquipe] = await Promise.allSettled([
        api.get('/actualites?limite=3'),
        api.get('/menus'),
        api.get('/equipe')
      ]);
      if (resActu.status === 'fulfilled')   setActualites(resActu.value.data.data?.actualites || []);
      if (resMenu.status === 'fulfilled')   setMenu(resMenu.value.data.data);
      if (resEquipe.status === 'fulfilled') setMembres((resEquipe.value.data.data || []).slice(0, 4));
    };
    chargerDonnees();
  }, []);

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
              <Link to="/conditions-inscription" className="btn btn--primary btn--lg">
                {t('public.accueil.inscrire')}
              </Link>
              <Link to="/presentation" className="btn btn--outline btn--lg">
                {t('public.accueil.decouvrir')}
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
          {/* 4 indicateurs clés : places, horaires, jours, équipe */}
          {[
            { valeur: '28',   unite: t('public.accueil.chiffres.placesUnite'),   label: t('public.accueil.chiffres.placesLabel'),   icone: '👶' },
            { valeur: t('public.accueil.chiffres.horairesValeur'), unite: t('public.accueil.chiffres.horairesUnite'), label: t('public.accueil.chiffres.horairesLabel'), icone: '🕐' },
            { valeur: '5',    unite: t('public.accueil.chiffres.joursUnite'),    label: t('public.accueil.chiffres.joursLabel'),    icone: '📅' },
            { valeur: '100%', unite: '',                                         label: t('public.accueil.chiffres.equipeLabel'),   icone: '🎓' }
          ].map(({ valeur, unite, label, icone }) => (
            <div key={label} className="chiffre-carte">
              <span className="chiffre-carte__icone">{icone}</span>
              <div className="chiffre-carte__nombre">
                <strong>{valeur}</strong>
                {unite && <span> {unite}</span>}
              </div>
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

      {/* ── NOTRE ÉQUIPE ────────────────────────────────────── */}
      {membres.length > 0 && (
        <section className="accueil-equipe">
          <div className="container">
            <div className="accueil-equipe__entete">
              <h2 className="section-titre"><Trans i18nKey="public.accueil.equipeTitre" components={{ s: <span /> }} /></h2>
              <Link to="/equipe" className="btn btn--ghost btn--sm">{t('public.accueil.toutEquipe')}</Link>
            </div>
            <div className="accueil-equipe__grille">
              {membres.map(m => {
                let imgUrl = null;
                try { imgUrl = `${BACKEND_URL}${JSON.parse(m.photo).miniature}`; } catch {}
                return (
                  <div key={m.id} className="accueil-equipe__carte">
                    <div className="accueil-equipe__photo">
                      {imgUrl
                        ? <img src={imgUrl} alt={`${m.prenom} ${m.nom}`} />
                        : <span>{m.prenom[0]}{m.nom[0]}</span>
                      }
                    </div>
                    <p className="accueil-equipe__nom">{m.prenom} {m.nom}</p>
                    <p className="accueil-equipe__titre">{m.titre}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── MENU DE LA SEMAINE ──────────────────────────────── */}
      <section className="accueil-menus">
        <div className="container">
          <div className="accueil-menus__entete">
            <h2 className="section-titre"><Trans i18nKey="public.accueil.menuTitre" components={{ s: <span /> }} /></h2>
            <Link to="/menus" className="btn btn--ghost btn--sm">{t('public.accueil.tousMenus')}</Link>
          </div>

          {/* Affiché si le menu existe en base, sinon message d'indisponibilité */}
          {menu ? (
            <div className="menu-semaine">
              {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((jour) => (
                <div key={jour} className="menu-jour">
                  <p className="menu-jour__nom">{t(`common.jours.${jour}`)}</p>
                  <div className="menu-jour__repas">
                    <span className="menu-jour__label">🍽️ {t('common.repas.midi')}</span>
                    {quillVide(menu[`${jour}_midi`])
                      ? <span>—</span>
                      : <div className="menu-jour__html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_midi`] }} />
                    }
                  </div>
                  <div className="menu-jour__repas">
                    <span className="menu-jour__label">🍪 {t('common.repas.gouter')}</span>
                    {quillVide(menu[`${jour}_gouter`])
                      ? <span>—</span>
                      : <div className="menu-jour__html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_gouter`] }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="menu-vide">
              <p>{t('public.accueil.menuIndispo')}</p>
              <Link to="/menus" className="btn btn--outline btn--sm">{t('public.accueil.voirMenus')}</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── DERNIÈRES ACTUALITÉS ────────────────────────────── */}
      {/* Section affichée uniquement si des actualités existent en base */}
      {actualites.length > 0 && (
        <section className="accueil-actualites">
          <div className="container">
            <div className="accueil-actualites__entete">
              <h2 className="section-titre"><Trans i18nKey="public.accueil.actusTitre" components={{ s: <span /> }} /></h2>
              <Link to="/actualites" className="btn btn--ghost btn--sm">{t('public.accueil.toutesActus')}</Link>
            </div>
            <div className="actualites-grille">
              {actualites.map((actu) => (
                <article key={actu.id} className="actu-carte">
                  {/* Image de couverture (optionnelle) */}
                  {actu.image && (
                    <div className="actu-carte__image">
                      <img src={urlFichier(actu.image)} alt={actu.titre} />
                    </div>
                  )}
                  <div className="actu-carte__corps">
                    {/* Date en format long, dans la langue active */}
                    <p className="actu-carte__date">
                      {new Date(actu.date_publication).toLocaleDateString(getLocale(), {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <h3 className="actu-carte__titre">{actu.titre}</h3>
                    <p className="actu-carte__extrait">{actu.extrait}</p>
                    <Link to={`/actualites/${actu.id}`} className="actu-carte__lien">
                      {t('public.accueil.lireSuite')}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
