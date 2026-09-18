// ============================================================
// FICHIER  : AdminLayout.jsx
// RÔLE     : Layout de l'espace administration.
//            Sidebar sombre à gauche avec navigation groupée
//            par catégorie. Topbar avec titre + cloche de notifs.
//            Sur mobile (≤767px) : la sidebar est masquée et
//            remplacée par une barre avec logo + bouton burger,
//            qui ouvre un menu déroulant plein écran reprenant
//            la même navigation groupée (voir .admin-mobile-menu).
//            Les pages admin s'insèrent via <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import NotifCloche from '../../components/NotifCloche/NotifCloche';
import './AdminLayout.css';

// ── Configuration de la navigation admin ──────────────────────
// Regroupée par catégorie fonctionnelle pour la lisibilité
const GROUPES_NAV = [
  {
    titre: 'Tableau de bord',
    liens: [{ to: '/admin/tableau-de-bord', label: 'Dashboard',    icone: '📊' }]
  },
  {
    titre: 'Familles',
    liens: [
      { to: '/admin/familles',     label: 'Familles',     icone: '👨‍👩‍👧' },
      { to: '/admin/inscriptions', label: 'Inscriptions', icone: '📝' },
      { to: '/admin/enfants',      label: 'Enfants',      icone: '👶' }
    ]
  },
  {
    titre: 'Quotidien',
    liens: [
      { to: '/admin/emargement',  label: 'Émargement',      icone: '✍️' },
      { to: '/admin/suivi',       label: 'Suivi quotidien', icone: '📋' },
      { to: '/admin/absences',   label: 'Absences',        icone: '📅' },
      { to: '/admin/calendrier', label: 'Calendrier',      icone: '🗓️' },
      { to: '/admin/messagerie', label: 'Messagerie',      icone: '✉️' }
    ]
  },
  {
    titre: 'Site public',
    liens: [
      { to: '/admin/actualites', label: 'Actualités', icone: '📰' },
      { to: '/admin/menus',      label: 'Menus',      icone: '🍽️' },
      { to: '/admin/galerie',    label: 'Galerie',    icone: '🖼️' },
      { to: '/admin/cms',        label: 'CMS Pages',  icone: '🌐' }
    ]
  },
  {
    titre: 'Gestion',
    liens: [
      { to: '/admin/documents',    label: 'Documents',    icone: '📄' },
      { to: '/admin/statistiques', label: 'Statistiques', icone: '📈' },
      { to: '/admin/rapports',     label: 'Rapports',     icone: '🧾' }
    ]
  }
];

const AdminLayout = () => {

  // Récupère le profil admin et la fonction de déconnexion
  const { user, deconnecter } = useAuth();

  // Contrôle l'ouverture du menu burger (mobile uniquement)
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Déconnecte et affiche une notification de confirmation
  const handleDeconnexion = async () => {
    await deconnecter();
    toast.success('Déconnexion réussie');
  };

  // Un admin simple ne voit que le groupe "Quotidien" (émargement, suivi,
  // absences, calendrier, messagerie) ; le super_admin voit tout.
  const groupesNav = user?.role === 'super_admin'
    ? GROUPES_NAV
    : GROUPES_NAV.filter(g => g.titre === 'Quotidien');

  return (
    <div className="admin-layout">

      {/* ── SIDEBAR SOMBRE ──────────────────────────────────── */}
      <aside className="admin-sidebar">

        {/* Logo : cliquable pour retourner au site public */}
        <div className="admin-sidebar__logo">
          <Link to="/" className="admin-sidebar__logo-lien">
            <img src="/images/logo.png" alt="Les Coccinelles" className="admin-sidebar__logo-img" />
          </Link>
          <p className="admin-sidebar__logo-sous">Administration</p>
        </div>

        {/* Navigation groupée : titre de groupe + liens NavLink.
            isActive : React Router injecte la classe 'active' sur le lien courant. */}
        <nav className="admin-sidebar__nav">
          {groupesNav.map(({ titre, liens }) => (
            <div key={titre} className="admin-sidebar__groupe">
              <p className="admin-sidebar__groupe-titre">{titre}</p>
              {liens.map(({ to, label, icone }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `admin-sidebar__link ${isActive ? 'active' : ''}`
                  }
                >
                  <span>{icone}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pied de sidebar : nom/rôle de l'admin + bouton déconnexion */}
        <div className="admin-sidebar__pied">
          <p className="admin-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
          <p className="admin-sidebar__user-role">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Administrateur'}
          </p>
          <button className="admin-sidebar__deconnexion" onClick={handleDeconnexion}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* ── BARRE MOBILE (logo + burger) ─────────────────────── */}
      {/* Visible uniquement ≤767px (voir CSS) — remplace la sidebar
          sur mobile, qui n'a pas la place de s'afficher en entier. */}
      <header className="admin-mobile-topbar">
        <Link to="/" className="admin-mobile-topbar__logo">
          <img src="/images/logo.png" alt="Les Coccinelles" />
        </Link>
        <button
          className={`admin-mobile-burger ${menuOuvert ? 'admin-mobile-burger--actif' : ''}`}
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Menu"
          aria-expanded={menuOuvert}
        >
          {menuOuvert ? '✕' : '☰'}
        </button>
      </header>

      {/* ── MENU BURGER DÉROULANT (mobile) ───────────────────── */}
      {/* Reprend la même navigation groupée que la sidebar desktop.
          onClick sur chaque lien referme le menu après navigation. */}
      {menuOuvert && (
        <div className="admin-mobile-menu">
          <nav className="admin-mobile-menu__nav">
            {groupesNav.map(({ titre, liens }) => (
              <div key={titre} className="admin-mobile-menu__groupe">
                <p className="admin-mobile-menu__groupe-titre">{titre}</p>
                {liens.map(({ to, label, icone }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOuvert(false)}
                    className={({ isActive }) =>
                      `admin-mobile-menu__link ${isActive ? 'active' : ''}`
                    }
                  >
                    <span>{icone}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Profil + déconnexion, comme dans le pied de la sidebar desktop */}
          <div className="admin-mobile-menu__pied">
            <p className="admin-mobile-menu__user-nom">{user?.prenom} {user?.nom}</p>
            <p className="admin-mobile-menu__user-role">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Administrateur'}
            </p>
            <button className="admin-sidebar__deconnexion" onClick={handleDeconnexion}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* ── ZONE DE CONTENU ─────────────────────────────────── */}
      <div className="admin-content">

        {/* Topbar : titre de la section + cloche de notifications */}
        <header className="layout-topbar layout-topbar--admin">
          <span className="layout-topbar__titre">Administration</span>
          <NotifCloche />
        </header>

        {/* Outlet : la page admin active s'affiche ici */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
