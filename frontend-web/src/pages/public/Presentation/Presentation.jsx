// ============================================================
// FICHIER  : Presentation.jsx
// ROUTE    : /presentation
// RÔLE     : Page de présentation de la crèche Les Coccinelles.
//            Sections : Qui sommes-nous → Nos espaces →
//            Informations pratiques → CTA contact.
//            Page statique (pas d'appel API).
// ============================================================

import { Link } from 'react-router-dom';
import './Presentation.css';

const Presentation = () => {
  return (
    <div className="presentation">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">🐞 Notre crèche</p>
          <h1 className="page-hero__titre">Présentation de <span>la crèche</span></h1>
          <p className="page-hero__sous">Découvrez les Coccinelles, une crèche associative au cœur de Puilboreau</p>
        </div>
      </section>

      {/* ── QUI SOMMES-NOUS ? ────────────────────────────────── */}
      {/* Texte de présentation à gauche + visuel emoji à droite */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">Qui sommes-nous ?</h2>
            <p>
              La crèche Les Coccinelles est une structure d'accueil associative implantée à Puilboreau,
              en Charente-Maritime. Ouverte depuis plusieurs années, elle accueille les enfants de
              <strong> 0 à 3 ans</strong> dans un cadre bienveillant et sécurisant.
            </p>
            <p>
              Gérée par une association de parents, notre crèche fonctionne en étroite collaboration
              avec les familles. Nous croyons fermement que la confiance entre parents et professionnels
              est la clé d'un accueil réussi pour chaque enfant.
            </p>
            <p>
              Notre capacité d'accueil est de <strong>30 places</strong>, réparties entre
              temps plein, temps partiel et accueil occasionnel, afin de répondre aux
              besoins variés des familles.
            </p>
          </div>
          {/* Visuel décoratif avec bulle d'info */}
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">🏡</div>
            <div className="info-bulle">
              <strong>30 places</strong>
              <span>enfants de 0 à 3 ans</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOS ESPACES ───────────────────────────────────────── */}
      {/* Grille de 6 cartes décrivant chaque zone de la crèche */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Nos espaces</h2>
          <div className="espaces-grille">
            {[
              { icone: '🍼', titre: 'Section bébés',      texte: "Espace dédié aux tout-petits (0-12 mois), avec zones de repos adaptées, tapis d'éveil et mobilier sécurisé." },
              { icone: '🎠', titre: 'Salle de jeux',      texte: 'Grande salle lumineuse avec coins jeux thématiques, bibliothèque, espace imitation et zone créative.' },
              { icone: '🌿', titre: 'Jardin pédagogique', texte: 'Espace extérieur aménagé pour les sorties quotidiennes, le jeu en plein air et les activités nature.' },
              { icone: '🍽️', titre: 'Salle de repas',     texte: "Espace convivial pour les repas, favorisant l'autonomie et la socialisation autour de la table." },
              { icone: '😴', titre: 'Salles de sieste',   texte: "Salles calmes et sécurisées avec lits adaptés à chaque tranche d'âge pour des siestes de qualité." },
              { icone: '🚿', titre: 'Espace changes',     texte: 'Plan de change surélevé et sécurisé, avec tout le matériel nécessaire aux soins quotidiens.' }
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

      {/* ── INFORMATIONS PRATIQUES ───────────────────────────── */}
      {/* 4 cartes : adresse, horaires, téléphone, email */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Informations pratiques</h2>
          <div className="infos-grille">
            <div className="info-carte">
              <span className="info-carte__icone">📍</span>
              <h3>Adresse</h3>
              <p>Rue des Coccinelles<br />17138 Puilboreau</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">🕐</span>
              <h3>Horaires</h3>
              <p>Lundi au vendredi<br />8h30 — 18h00</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">📞</span>
              <h3>Téléphone</h3>
              <p>05 46 XX XX XX</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">✉️</span>
              <h3>Email</h3>
              <p>contact@lescoccinelles.fr</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>Vous souhaitez visiter la crèche ou en savoir plus ?</p>
          <Link to="/contact" className="btn btn--primary btn--lg">Nous contacter</Link>
        </div>
      </section>

    </div>
  );
};

export default Presentation;
