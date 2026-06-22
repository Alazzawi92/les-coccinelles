// ============================================================
// FICHIER  : Horaires.jsx
// ROUTE    : /horaires
// RÔLE     : Page des horaires d'ouverture de la crèche.
//            Tableau statique des heures + contenu CMS informatif.
// ============================================================

import usePageCMS from '../../../hooks/usePageCMS';
import './Horaires.css';

const JOURS = [
  { jour: 'Lundi',    ouverture: '8h30', fermeture: '18h00', ouvert: true  },
  { jour: 'Mardi',    ouverture: '8h30', fermeture: '18h00', ouvert: true  },
  { jour: 'Mercredi', ouverture: '8h30', fermeture: '18h00', ouvert: true  },
  { jour: 'Jeudi',    ouverture: '8h30', fermeture: '18h00', ouvert: true  },
  { jour: 'Vendredi', ouverture: '8h30', fermeture: '18h00', ouvert: true  },
  { jour: 'Samedi',   ouverture: '',     fermeture: '',       ouvert: false },
  { jour: 'Dimanche', ouverture: '',     fermeture: '',       ouvert: false }
];

const Horaires = () => {
  const { contenu } = usePageCMS('horaires');

  return (
    <div className="horaires">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--orange">
        <div className="container">
          <p className="page-hero__tag">🕐 Horaires</p>
          <h1 className="page-hero__titre">Horaires <span>d'accueil</span></h1>
          <p className="page-hero__sous">La crèche est ouverte du lundi au vendredi, hors jours fériés et congés annuels</p>
        </div>
      </section>

      {/* ── TABLEAU DES HORAIRES ──────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Horaires d'ouverture</h2>

          <div className="horaires-tableau">
            {JOURS.map(({ jour, ouverture, fermeture, ouvert }) => (
              <div key={jour} className={`horaire-ligne ${ouvert ? '' : 'horaire-ligne--ferme'}`}>
                <span className="horaire-jour">{jour}</span>
                <span className="horaire-statut">
                  {ouvert
                    ? <><strong>{ouverture}</strong> — <strong>{fermeture}</strong></>
                    : <span className="ferme-label">Fermé</span>
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
                  <p>La crèche est fermée les <strong>jours fériés</strong> et durant les périodes de congés annuels (en général 3 semaines en août et 1 semaine entre Noël et le Nouvel An).</p>
                </div>
                <div className="info-box info-box--bleu">
                  <span>📞</span>
                  <p>En cas d'absence non prévue de votre enfant, merci de nous prévenir <strong>avant 9h00</strong> par téléphone.</p>
                </div>
              </div>
            )
          }
        </div>
      </section>

      {/* ── TYPES D'ACCUEIL ───────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Types d'accueil</h2>
          <div className="espaces-grille">
            {[
              { icone: '📅', titre: 'Temps plein',   texte: 'Accueil régulier 5 jours/semaine, sur des plages horaires fixes définies avec la famille.' },
              { icone: '🕰️', titre: 'Temps partiel', texte: 'Accueil régulier sur 2 ou 3 jours par semaine, idéal pour les parents travaillant à temps partiel.' },
              { icone: '🎲', titre: 'Occasionnel',   texte: 'Accueil ponctuel selon les disponibilités de la structure, sous réserve de places disponibles.' }
            ].map(({ icone, titre, texte }) => (
              <div key={titre} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{titre}</h3>
                <p className="espace-carte__texte">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Horaires;
