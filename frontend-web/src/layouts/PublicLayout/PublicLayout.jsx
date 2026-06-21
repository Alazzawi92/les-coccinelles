// ============================================================
// FICHIER  : PublicLayout.jsx
// RÔLE     : Layout enveloppant toutes les pages publiques.
//            Contient la barre de navigation (avec menu hamburger
//            mobile) et le footer. Les pages s'insèrent via
//            <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PublicLayout.css';

const PublicLayout = () => {

  const { user } = useAuth(); // Utilisateur connecté (ou null)

  // menuOuvert : contrôle l'affichage du menu hamburger sur mobile
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="public-layout">

      {/* ── BARRE DE NAVIGATION ─────────────────────────────── */}
      <nav className="public-navbar">

        {/* Logo avec emoji coccinelle → lien vers l'accueil */}
        <Link to="/" className="public-navbar__logo">
          <span className="public-navbar__logo-icone">🐞</span>
          <span className="public-navbar__logo-text">Les Coccinelles</span>
        </Link>

        {/* Liens de navigation (visibles sur desktop) */}
        <ul className="public-navbar__links">
          <li><NavLink to="/"             className="public-navbar__link">Accueil</NavLink></li>
          <li><NavLink to="/presentation" className="public-navbar__link">La crèche</NavLink></li>
          <li><NavLink to="/actualites"   className="public-navbar__link">Actualités</NavLink></li>
          <li><NavLink to="/menus"        className="public-navbar__link">Menus</NavLink></li>
          <li><NavLink to="/contact"      className="public-navbar__link">Contact</NavLink></li>
        </ul>

        {/* Bouton connexion / espace parent + hamburger mobile */}
        <div className="public-navbar__actions">

          {/* Si connecté : lien vers l'espace parent. Sinon : page connexion. */}
          {user ? (
            <Link to="/parent/tableau-de-bord" className="btn btn--primary btn--sm">
              Mon espace
            </Link>
          ) : (
            <Link to="/connexion" className="btn btn--primary btn--sm">
              Se connecter
            </Link>
          )}

          {/* Hamburger : visible uniquement sur mobile (CSS display:none > 768px) */}
          <button
            className="public-navbar__hamburger"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Menu mobile déroulant — affiché si menuOuvert est true.
          onClick ferme le menu après chaque navigation. */}
      {menuOuvert && (
        <div className="public-navbar__mobile">
          <NavLink to="/"             onClick={() => setMenuOuvert(false)}>Accueil</NavLink>
          <NavLink to="/presentation" onClick={() => setMenuOuvert(false)}>La crèche</NavLink>
          <NavLink to="/actualites"   onClick={() => setMenuOuvert(false)}>Actualités</NavLink>
          <NavLink to="/menus"        onClick={() => setMenuOuvert(false)}>Menus</NavLink>
          <NavLink to="/contact"      onClick={() => setMenuOuvert(false)}>Contact</NavLink>
          <NavLink to="/connexion"    onClick={() => setMenuOuvert(false)}>Se connecter</NavLink>
        </div>
      )}

      {/* ── CONTENU DE LA PAGE ──────────────────────────────── */}
      {/* Outlet : rendu de la page enfant selon la route active */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="public-footer">
        <div className="container">
          <div className="public-footer__grid">

            {/* Colonne 1 : identité de la crèche */}
            <div>
              <h3 className="public-footer__titre">🐞 Les Coccinelles</h3>
              <p>Crèche associative à Puilboreau (17)</p>
              <p>Accueil des enfants de 0 à 3 ans</p>
            </div>

            {/* Colonne 2 : liens rapides de navigation */}
            <div>
              <h4 className="public-footer__sous-titre">Navigation</h4>
              <ul>
                <li><Link to="/presentation">Présentation</Link></li>
                <li><Link to="/equipe">Notre équipe</Link></li>
                <li><Link to="/horaires">Horaires</Link></li>
                <li><Link to="/tarifs">Tarifs</Link></li>
              </ul>
            </div>

            {/* Colonne 3 : informations de contact */}
            <div>
              <h4 className="public-footer__sous-titre">Contact</h4>
              <p>📍 Puilboreau, 17138</p>
              <p>📞 05 46 XX XX XX</p>
              <p>✉️ contact@lescoccinelles.fr</p>
            </div>
          </div>

          {/* Bande basse : copyright + mentions légales */}
          <div className="public-footer__bas">
            <p>© {new Date().getFullYear()} Les Coccinelles — <Link to="/mentions-legales">Mentions légales</Link></p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLayout;
