// ============================================================
// FICHIER  : ProjetPedagogique.jsx
// ROUTE    : /projet-pedagogique
// RÔLE     : Page du projet pédagogique de la crèche.
//            Présente la philosophie, les 3 axes pédagogiques
//            et la journée type sous forme de timeline.
//            Page statique (aucun appel API).
// ============================================================

import './ProjetPedagogique.css';

// Composant statique en expression fléchée directe
const ProjetPedagogique = () => (
  <div className="projet-peda">

    {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
    <section className="page-hero page-hero--violet">
      <div className="container">
        <p className="page-hero__tag">📚 Pédagogie</p>
        <h1 className="page-hero__titre">Notre <span>projet pédagogique</span></h1>
        <p className="page-hero__sous">Un projet centré sur le bien-être, l'éveil et le respect du rythme de chaque enfant</p>
      </div>
    </section>

    {/* ── PHILOSOPHIE ──────────────────────────────────────── */}
    {/* Texte de présentation avec références pédagogiques */}
    <section className="section-blanche">
      <div className="container contenu-deux-colonnes">
        <div className="contenu-texte">
          <h2 className="titre-section">Notre philosophie</h2>
          <p>Notre projet pédagogique est fondé sur le respect du rythme individuel de chaque enfant. Nous croyons que chaque tout-petit est un être unique, compétent et capable d'initiative.</p>
          <p>Nous nous inspirons des approches de <strong>Maria Montessori</strong> et de <strong>Loris Malaguzzi</strong> (pédagogie Reggio Emilia), en plaçant l'enfant au centre de ses apprentissages.</p>
          <p>L'espace est pensé comme un <em>troisième éducateur</em> : il invite à explorer, créer, expérimenter et socialiser dans un cadre sécurisant.</p>
        </div>
        {/* Visuel avec bulle d'info "3 axes" */}
        <div className="contenu-visuel">
          <div className="visuel-emoji-grand">📚</div>
          <div className="info-bulle"><strong>3 axes</strong><span>de notre projet</span></div>
        </div>
      </div>
    </section>

    {/* ── 3 AXES PÉDAGOGIQUES ──────────────────────────────── */}
    {/* Cartes colorées : Nature, Créativité, Vie en collectivité */}
    <section className="section-grise">
      <div className="container">
        <h2 className="titre-section text-center">Nos axes pédagogiques</h2>
        <div className="axes-grille">
          {[
            { icone: '🌱', couleur: 'vert',   titre: 'Connexion à la nature', points: ['Jardinage et potager', 'Sorties quotidiennes en extérieur', 'Observation des saisons', 'Matériaux naturels dans les jeux'] },
            { icone: '🎨', couleur: 'orange', titre: 'Créativité libre',      points: ["Ateliers d'arts plastiques", 'Peinture, modelage, collage', "Jeux symboliques et d'imitation", 'Musique et comptines'] },
            { icone: '🤝', couleur: 'violet', titre: 'Vie en collectivité',   points: ["Respect des autres et de l'espace", 'Apprentissage par le jeu', 'Moments de regroupement', 'Règles de vie simples'] }
          ].map(({ icone, couleur, titre, points }) => (
            <div key={titre} className={`axe-carte axe-carte--${couleur}`}>
              <span className="axe-carte__icone">{icone}</span>
              <h3 className="axe-carte__titre">{titre}</h3>
              {/* Liste des activités de cet axe */}
              <ul className="axe-carte__liste">
                {points.map(p => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── JOURNÉE TYPE ─────────────────────────────────────── */}
    {/* Timeline verticale : heure → activité */}
    <section className="section-blanche">
      <div className="container">
        <h2 className="titre-section text-center">La journée type</h2>
        <div className="journee-timeline">
          {[
            { heure: '8h30 — 9h30',  label: 'Accueil des enfants',       icone: '👋' },
            { heure: '9h30 — 10h30', label: 'Activités du matin',        icone: '🎨' },
            { heure: '10h30 — 11h',  label: 'Soins et change',           icone: '🧴' },
            { heure: '11h — 11h30',  label: 'Repas du midi',             icone: '🍽️' },
            { heure: '11h30 — 14h',  label: 'Sieste / repos',            icone: '😴' },
            { heure: '14h — 15h',    label: 'Réveil échelonné, goûter',  icone: '🍪' },
            { heure: '15h — 17h',    label: "Activités de l'après-midi", icone: '🌿' },
            { heure: '17h — 18h',    label: 'Retours progressifs',       icone: '🏠' }
          ].map(({ heure, label, icone }) => (
            <div key={heure} className="timeline-item">
              <div className="timeline-heure">{heure}</div>
              <div className="timeline-point">{icone}</div>
              <div className="timeline-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

  </div>
);

export default ProjetPedagogique;
