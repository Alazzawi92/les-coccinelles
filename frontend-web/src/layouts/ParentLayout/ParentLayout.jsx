// ============================================================
// FICHIER  : ParentLayout.jsx
// RÔLE     : Layout de l'espace parent.
//            Sidebar blanche à gauche avec avatar + navigation.
//            Topbar avec titre + cloche de notifications.
//            Sur mobile (≤767px) : la sidebar est masquée et
//            remplacée par une barre logo + burger, qui ouvre un
//            menu déroulant plein écran (voir .parent-mobile-menu).
//            Les pages parent s'insèrent via <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import NotifCloche from '../../components/NotifCloche/NotifCloche';
import './ParentLayout.css';

// ── Liens de la sidebar parent ────────────────────────────────
const LIENS_PARENT = [
  { to: '/parent/tableau-de-bord', label: 'Tableau de bord', icone: '🏠' },
  { to: '/parent/mes-enfants',     label: 'Mes enfants',     icone: '👶' },
  { to: '/parent/inscription',     label: 'Inscription',     icone: '📝' },
  { to: '/parent/suivi',           label: 'Suivi quotidien', icone: '📊' },
  { to: '/parent/absences',        label: 'Absences',        icone: '📅' },
  { to: '/parent/documents',       label: 'Documents',       icone: '📄' },
  { to: '/parent/messages',        label: 'Messages',        icone: '✉️' },
  { to: '/parent/galerie',         label: 'Galerie photos',  icone: '🖼️' },
  { to: '/parent/mon-profil',      label: 'Mon profil',      icone: '👤' }
];

const ParentLayout = () => {

  // Récupère les données du parent connecté et la fonction de déconnexion
  const { user, deconnecter } = useAuth();

  // Contrôle l'ouverture du menu burger (mobile uniquement)
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Déconnecte le parent et affiche un toast de confirmation
  const handleDeconnexion = async () => {
    await deconnecter();
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="parent-layout">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="parent-sidebar">

        {/* Logo : cliquable pour retourner au site public */}
        <div className="parent-sidebar__logo">
          <Link to="/" className="parent-sidebar__logo-lien">
            <img src="/images/logo.png" alt="Les Coccinelles" className="parent-sidebar__logo-img" />
          </Link>
        </div>

        {/* Avatar + nom du parent.
            Si un avatar est uploadé, affiche la photo. Sinon, initiales. */}
        <div className="parent-sidebar__user">
          <div className="parent-sidebar__avatar">
            {user?.avatar
              ? <img src={user.avatar} alt="Avatar" />
              : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
            }
          </div>
          <div>
            <p className="parent-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
            <p className="parent-sidebar__user-role">Espace parent</p>
          </div>
        </div>

        {/* Liens de navigation.
            isActive : React Router ajoute 'active' sur le lien de la page courante. */}
        <nav className="parent-sidebar__nav">
          {LIENS_PARENT.map(({ to, label, icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `parent-sidebar__link ${isActive ? 'active' : ''}`
              }
            >
              <span>{icone}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bouton déconnexion en bas de la sidebar */}
        <button className="parent-sidebar__deconnexion" onClick={handleDeconnexion}>
          <span>🚪</span>
          <span>Se déconnecter</span>
        </button>
      </aside>

      {/* ── BARRE MOBILE (logo + burger) ─────────────────────── */}
      {/* Visible uniquement ≤767px (voir CSS) — remplace la sidebar
          sur mobile, qui n'a pas la place de s'afficher en entier. */}
      <header className="parent-mobile-topbar">
        <Link to="/" className="parent-mobile-topbar__logo">
          <img src="/images/logo.png" alt="Les Coccinelles" />
        </Link>
        <button
          className={`parent-mobile-burger ${menuOuvert ? 'parent-mobile-burger--actif' : ''}`}
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Menu"
          aria-expanded={menuOuvert}
        >
          {menuOuvert ? '✕' : '☰'}
        </button>
      </header>

      {/* ── MENU BURGER DÉROULANT (mobile) ───────────────────── */}
      {menuOuvert && (
        <div className="parent-mobile-menu">
          {/* Avatar + nom, comme dans la sidebar desktop */}
          <div className="parent-mobile-menu__user">
            <div className="parent-sidebar__avatar">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" />
                : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
              }
            </div>
            <div>
              <p className="parent-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
              <p className="parent-sidebar__user-role">Espace parent</p>
            </div>
          </div>

          <nav className="parent-mobile-menu__nav">
            {LIENS_PARENT.map(({ to, label, icone }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOuvert(false)}
                className={({ isActive }) =>
                  `parent-mobile-menu__link ${isActive ? 'active' : ''}`
                }
              >
                <span>{icone}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="parent-sidebar__deconnexion parent-mobile-menu__deconnexion" onClick={handleDeconnexion}>
            <span>🚪</span>
            <span>Se déconnecter</span>
          </button>
        </div>
      )}

      {/* ── ZONE DE CONTENU ─────────────────────────────────── */}
      <div className="parent-content">

        {/* Topbar : titre + cloche de notifications */}
        <header className="layout-topbar">
          <span className="layout-topbar__titre">Espace parent</span>
          <NotifCloche />
        </header>

        {/* Outlet : la page parent active s'affiche ici */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default ParentLayout;
