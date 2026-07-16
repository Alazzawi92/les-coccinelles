// ============================================================
// FICHIER  : Accueil.jsx
// ROUTE    : /
// RÔLE     : Page d'accueil publique de la crèche Les Coccinelles.
//            Sections : Hero → Chiffres clés → Valeurs →
//            Menu de la semaine → Actualités → CTA.
//            Les données actualités et menus sont chargées
//            dynamiquement depuis l'API au montage.
// ============================================================

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import usePageCMS from '../../../hooks/usePageCMS';
import './Accueil.css';

// Quill produit "<p><br></p>" pour un champ vide
const quillVide = v => !v || v === '<p><br></p>';

const Accueil = () => {

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
        </div>

        <div className="container hero__contenu">
          {/* Texte + boutons à gauche */}
          <div className="hero__texte">
            <p className="hero__surtitle">Crèche associative à Puilboreau (17)</p>
            <h1 className="hero__titre">
              Un lieu de vie joyeux<br />pour vos <span>tout-petits</span>
            </h1>
            <p className="hero__description">
              Bienvenue aux Coccinelles ! Nous accueillons vos enfants de 0 à 3 ans
              dans un environnement chaleureux, sécurisé et stimulant, du lundi au vendredi.
            </p>
            <div className="hero__actions">
              <Link to="/conditions-inscription" className="btn btn--primary btn--lg">
                Inscrire mon enfant
              </Link>
              <Link to="/presentation" className="btn btn--outline btn--lg">
                Découvrir la crèche
              </Link>
            </div>
          </div>

          {/* Visuels décoratifs à droite */}
          <div className="hero__visuel" aria-hidden="true">
            <div className="hero__coccinelle-grande">🐞</div>
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
            { valeur: '30',   unite: 'places', label: 'enfants accueillis',   icone: '👶' },
            { valeur: '8h30', unite: 'à 18h',  label: "horaires d'ouverture", icone: '🕐' },
            { valeur: '5',    unite: 'jours',  label: 'du lundi au vendredi', icone: '📅' },
            { valeur: '100%', unite: '',       label: 'équipe diplômée',       icone: '🎓' }
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
            Pourquoi nous <span>faire confiance</span> ?
          </h2>
          <div className="valeurs__grille">
            {/* 4 cartes valeurs : Nature, Bienveillance, Créativité, Familles */}
            {[
              { icone: '🌿', couleur: 'vert',   titre: 'Projet nature',        texte: 'Activités en lien avec la nature et les saisons. Jardin pédagogique, sorties et éveil sensoriel en plein air.' },
              { icone: '❤️', couleur: 'rose',   titre: 'Accueil bienveillant', texte: 'Chaque enfant est unique. Notre équipe veille à respecter le rythme et les besoins de chacun au quotidien.' },
              { icone: '🎨', couleur: 'orange', titre: 'Éveil créatif',        texte: "Ateliers artistiques, jeux d'éveil, activités sensorielles pour développer la curiosité et la créativité." },
              { icone: '👨‍👩‍👧', couleur: 'violet', titre: 'Partenariat familles', texte: 'Relation de confiance : compte rendu quotidien, réunions régulières, espace numérique dédié aux parents.' }
            ].map(({ icone, couleur, titre, texte }) => (
              <div key={titre} className={`valeur-carte valeur-carte--${couleur}`}>
                <div className="valeur-carte__icone">{icone}</div>
                <h3 className="valeur-carte__titre">{titre}</h3>
                <p className="valeur-carte__texte">{texte}</p>
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
              <h2 className="section-titre">Notre <span>équipe</span></h2>
              <Link to="/equipe" className="btn btn--ghost btn--sm">Toute l'équipe →</Link>
            </div>
            <div className="accueil-equipe__grille">
              {membres.map(m => {
                let imgUrl = null;
                try { imgUrl = `http://localhost:3002${JSON.parse(m.photo).miniature}`; } catch {}
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
            <h2 className="section-titre">Menu de <span>la semaine</span></h2>
            <Link to="/menus" className="btn btn--ghost btn--sm">Voir tous les menus →</Link>
          </div>

          {/* Affiché si le menu existe en base, sinon message d'indisponibilité */}
          {menu ? (
            <div className="menu-semaine">
              {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((jour) => (
                <div key={jour} className="menu-jour">
                  <p className="menu-jour__nom">{jour.charAt(0).toUpperCase() + jour.slice(1)}</p>
                  <div className="menu-jour__repas">
                    <span className="menu-jour__label">🍽️ Midi</span>
                    {quillVide(menu[`${jour}_midi`])
                      ? <span>—</span>
                      : <div className="menu-jour__html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_midi`] }} />
                    }
                  </div>
                  <div className="menu-jour__repas">
                    <span className="menu-jour__label">🍪 Goûter</span>
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
              <p>Le menu de la semaine n'est pas encore disponible.</p>
              <Link to="/menus" className="btn btn--outline btn--sm">Voir les menus</Link>
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
              <h2 className="section-titre">Nos <span>actualités</span></h2>
              <Link to="/actualites" className="btn btn--ghost btn--sm">Toutes les actualités →</Link>
            </div>
            <div className="actualites-grille">
              {actualites.map((actu) => (
                <article key={actu.id} className="actu-carte">
                  {/* Image de couverture (optionnelle) */}
                  {actu.image && (
                    <div className="actu-carte__image">
                      <img src={actu.image} alt={actu.titre} />
                    </div>
                  )}
                  <div className="actu-carte__corps">
                    {/* Date en format long français */}
                    <p className="actu-carte__date">
                      {new Date(actu.date_publication).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <h3 className="actu-carte__titre">{actu.titre}</h3>
                    <p className="actu-carte__extrait">{actu.extrait}</p>
                    <Link to={`/actualites/${actu.id}`} className="actu-carte__lien">
                      Lire la suite →
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
          <h2 className="cta__titre">Vous souhaitez inscrire votre enfant ?</h2>
          <p className="cta__texte">
            Consultez nos conditions d'inscription et contactez-nous pour vérifier les disponibilités.
          </p>
          <div className="cta__actions">
            <Link to="/conditions-inscription" className="btn btn--primary btn--lg">
              Voir les conditions
            </Link>
            <Link to="/contact" className="cta__btn-contact">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Accueil;
