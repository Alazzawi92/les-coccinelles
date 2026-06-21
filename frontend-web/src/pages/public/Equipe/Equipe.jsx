// ============================================================
// FICHIER  : Equipe.jsx
// ROUTE    : /equipe
// RÔLE     : Page de présentation de l'équipe éducative.
//            Grille statique des membres avec nom, poste et diplôme.
//            Page statique (pas d'appel API).
// ============================================================

import { Link } from 'react-router-dom';
import './Equipe.css';

// ── Données statiques de l'équipe ─────────────────────────────
// couleur : définit la teinte de la carte (classe CSS membre-carte--{couleur})
const EQUIPE = [
  { nom: 'Marie Dupont',   poste: 'Directrice',                   diplome: 'Éducatrice de jeunes enfants', icone: '👩‍💼', couleur: 'orange' },
  { nom: 'Sophie Martin',  poste: 'Puéricultrice référente',      diplome: 'Infirmière puéricultrice',      icone: '👩‍⚕️', couleur: 'rose'   },
  { nom: 'Julie Bernard',  poste: 'Auxiliaire de puériculture',   diplome: "Diplôme d'auxiliaire",          icone: '👩‍🍼', couleur: 'vert'   },
  { nom: 'Camille Leroy',  poste: 'Auxiliaire de puériculture',   diplome: "Diplôme d'auxiliaire",          icone: '👩‍🍼', couleur: 'bleu'   },
  { nom: 'Lucie Moreau',   poste: 'Éducatrice de jeunes enfants', diplome: "Diplôme d'État EJE",            icone: '👩‍🎨', couleur: 'violet' },
  { nom: 'Nathalie Simon', poste: "Agent d'accueil",              diplome: 'CAP Petite Enfance',            icone: '👩',   couleur: 'orange' }
];

// Composant en expression fléchée directe (pas de hooks, page statique)
const Equipe = () => (
  <div className="equipe">

    {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
    <section className="page-hero page-hero--bleu">
      <div className="container">
        <p className="page-hero__tag">👥 L'équipe</p>
        <h1 className="page-hero__titre">Notre <span>équipe éducative</span></h1>
        <p className="page-hero__sous">Des professionnelles qualifiées et passionnées à l'écoute de vos enfants</p>
      </div>
    </section>

    {/* ── TEXTE D'INTRODUCTION ─────────────────────────────── */}
    <section className="section-blanche">
      <div className="container contenu-deux-colonnes">
        <div className="contenu-texte">
          <h2 className="titre-section">Une équipe diplômée</h2>
          <p>Notre équipe est composée de <strong>6 professionnelles</strong> de la petite enfance, toutes diplômées. Elles se forment régulièrement pour offrir les meilleures pratiques d'accueil.</p>
          <p>La continuité des soins est une priorité : les mêmes professionnelles accompagnent votre enfant tout au long de son parcours à la crèche.</p>
        </div>
        {/* Bulle d'info avec le ratio équipe/enfants */}
        <div className="contenu-visuel">
          <div className="visuel-emoji-grand">👩‍👧‍👦</div>
          <div className="info-bulle"><strong>6 pro.</strong><span>pour 30 enfants</span></div>
        </div>
      </div>
    </section>

    {/* ── GRILLE DES MEMBRES ───────────────────────────────── */}
    {/* Carte par membre : avatar emoji + nom + poste + diplôme */}
    <section className="section-grise">
      <div className="container">
        <h2 className="titre-section text-center">Les membres de l'équipe</h2>
        <div className="equipe-grille">
          {EQUIPE.map(({ nom, poste, diplome, icone, couleur }) => (
            <div key={nom} className={`membre-carte membre-carte--${couleur}`}>
              <div className="membre-carte__avatar">{icone}</div>
              <h3 className="membre-carte__nom">{nom}</h3>
              <p className="membre-carte__poste">{poste}</p>
              <p className="membre-carte__diplome">🎓 {diplome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
    <section className="cta-bas">
      <div className="container cta-bas__contenu">
        <p>Vous voulez rencontrer l'équipe ?</p>
        <Link to="/contact" className="btn btn--primary btn--lg">Prendre contact</Link>
      </div>
    </section>

  </div>
);

export default Equipe;
