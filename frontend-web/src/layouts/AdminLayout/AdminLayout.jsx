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
import { useTranslation } from 'react-i18next';
import NotifCloche from '../../components/NotifCloche/NotifCloche';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle/ThemeToggle';
import './AdminLayout.css';

// ── Configuration de la navigation admin ──────────────────────
// Regroupée par catégorie fonctionnelle pour la lisibilité.
// groupe / cle : clés de traduction (common.adminLayout.groupes.* / .liens.*)
const GROUPES_NAV = [
  {
    groupe: 'tableauDeBord',
    liens: [{ to: '/admin/tableau-de-bord', cle: 'dashboard',      icone: '📊' }]
  },
  {
    groupe: 'familles',
    liens: [
      { to: '/admin/familles',     cle: 'familles',       icone: '👨‍👩‍👧' },
      { to: '/admin/inscriptions', cle: 'inscriptions',   icone: '📝' },
      { to: '/admin/enfants',      cle: 'enfants',        icone: '👶' }
    ]
  },
  {
    groupe: 'quotidien',
    liens: [
      { to: '/admin/emargement',  cle: 'emargement',        icone: '✍️' },
      { to: '/admin/suivi',       cle: 'suivi',             icone: '📋' },
      { to: '/admin/absences',   cle: 'absences',          icone: '📅' },
      { to: '/admin/calendrier', cle: 'calendrier',        icone: '🗓️' },
      { to: '/admin/messagerie', cle: 'messagerie',        icone: '✉️' }
    ]
  },
  {
    groupe: 'sitePublic',
    liens: [
      { to: '/admin/actualites', cle: 'actualites',   icone: '📰' },
      { to: '/admin/menus',      cle: 'menus',        icone: '🍽️' },
      { to: '/admin/galerie',    cle: 'galerie',      icone: '🖼️' },
      { to: '/admin/cms',        cle: 'cms',          icone: '🌐' }
    ]
  },
  {
    groupe: 'gestion',
    liens: [
      { to: '/admin/documents',    cle: 'documents',      icone: '📄' },
      { to: '/admin/statistiques', cle: 'statistiques',   icone: '📈' },
      { to: '/admin/rapports',     cle: 'rapports',       icone: '🧾' }
    ]
  }
];

const AdminLayout = () => {

  // Récupère le profil admin et la fonction de déconnexion
  const { user, deconnecter } = useAuth();
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Contrôle l'ouverture du menu burger (mobile uniquement)
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Déconnecte et affiche une notification de confirmation
  const handleDeconnexion = async () => {
    await deconnecter();
    toast.success(t('common.deconnexionReussie'));
  };

  // Un admin simple ne voit que le groupe "Quotidien" (émargement, suivi,
  // absences, calendrier, messagerie) ; le super_admin voit tout.
  const groupesNav = user?.role === 'super_admin'
    ? GROUPES_NAV
    : GROUPES_NAV.filter(g => g.groupe === 'quotidien');

  return (
    <div className="admin-layout">

      {/* ── SIDEBAR SOMBRE ──────────────────────────────────── */}
      <aside className="admin-sidebar">

        {/* Logo : cliquable pour retourner au site public */}
        <div className="admin-sidebar__logo">
          <Link to="/" className="admin-sidebar__logo-lien">
            <img src="/images/logo.png" alt="Les Coccinelles" className="admin-sidebar__logo-img" />
          </Link>
          <p className="admin-sidebar__logo-sous">{t('common.adminLayout.administration')}</p>
        </div>

        {/* Navigation groupée : titre de groupe + liens NavLink.
            isActive : React Router injecte la classe 'active' sur le lien courant. */}
        <nav className="admin-sidebar__nav">
          {groupesNav.map(({ groupe, liens }) => (
            <div key={groupe} className="admin-sidebar__groupe">
              <p className="admin-sidebar__groupe-titre">{t(`common.adminLayout.groupes.${groupe}`)}</p>
              {liens.map(({ to, cle, icone }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `admin-sidebar__link ${isActive ? 'active' : ''}`
                  }
                >
                  <span>{icone}</span>
                  <span>{t(`common.adminLayout.liens.${cle}`)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pied de sidebar : nom/rôle de l'admin + bouton déconnexion */}
        <div className="admin-sidebar__pied">
          <p className="admin-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
          <p className="admin-sidebar__user-role">
            {user?.role === 'super_admin' ? t('common.adminLayout.superAdmin') : t('common.adminLayout.administrateur')}
          </p>
          <button className="admin-sidebar__deconnexion" onClick={handleDeconnexion}>
            🚪 {t('common.adminLayout.deconnexion')}
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
          aria-label={t('common.menu')}
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
            {groupesNav.map(({ groupe, liens }) => (
              <div key={groupe} className="admin-mobile-menu__groupe">
                <p className="admin-mobile-menu__groupe-titre">{t(`common.adminLayout.groupes.${groupe}`)}</p>
                {liens.map(({ to, cle, icone }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOuvert(false)}
                    className={({ isActive }) =>
                      `admin-mobile-menu__link ${isActive ? 'active' : ''}`
                    }
                  >
                    <span>{icone}</span>
                    <span>{t(`common.adminLayout.liens.${cle}`)}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Profil + déconnexion, comme dans le pied de la sidebar desktop */}
          <div className="admin-mobile-menu__pied">
            <p className="admin-mobile-menu__user-nom">{user?.prenom} {user?.nom}</p>
            <p className="admin-mobile-menu__user-role">
              {user?.role === 'super_admin' ? t('common.adminLayout.superAdmin') : t('common.adminLayout.administrateur')}
            </p>
            <button className="admin-sidebar__deconnexion" onClick={handleDeconnexion}>
              🚪 {t('common.adminLayout.deconnexion')}
            </button>
          </div>
        </div>
      )}

      {/* ── ZONE DE CONTENU ─────────────────────────────────── */}
      <div className="admin-content">

        {/* Topbar : titre de la section + sélecteur de langue + cloche de notifications */}
        <header className="layout-topbar layout-topbar--admin">
          <span className="layout-topbar__titre">{t('common.adminLayout.administration')}</span>
          <div className="layout-topbar__actions">
            <ThemeToggle />
            <LanguageSwitcher />
            <NotifCloche />
          </div>
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
