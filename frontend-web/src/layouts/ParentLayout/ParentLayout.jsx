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
import { useTranslation } from 'react-i18next';
import NotifCloche from '../../components/NotifCloche/NotifCloche';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle/ThemeToggle';
import './ParentLayout.css';

// ── Liens de la sidebar parent ────────────────────────────────
// cle : clé de traduction du libellé (common.parentLayout.liens.*)
const LIENS_PARENT = [
  { to: '/parent/tableau-de-bord', cle: 'tableauDeBord',   icone: '🏠' },
  { to: '/parent/mes-enfants',     cle: 'mesEnfants',      icone: '👶' },
  { to: '/parent/inscription',     cle: 'inscription',     icone: '📝' },
  { to: '/parent/suivi',           cle: 'suivi',           icone: '📊' },
  { to: '/parent/absences',        cle: 'absences',        icone: '📅' },
  { to: '/parent/documents',       cle: 'documents',       icone: '📄' },
  { to: '/parent/messages',        cle: 'messages',        icone: '✉️' },
  { to: '/parent/galerie',         cle: 'galerie',         icone: '🖼️' },
  { to: '/parent/mon-profil',      cle: 'monProfil',       icone: '👤' }
];

const ParentLayout = () => {

  // Récupère les données du parent connecté et la fonction de déconnexion
  const { user, deconnecter } = useAuth();
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Contrôle l'ouverture du menu burger (mobile uniquement)
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Déconnecte le parent et affiche un toast de confirmation
  const handleDeconnexion = async () => {
    await deconnecter();
    toast.success(t('common.deconnexionReussie'));
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
              ? <img src={user.avatar} alt={t('common.parentLayout.avatar')} />
              : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
            }
          </div>
          <div>
            <p className="parent-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
            <p className="parent-sidebar__user-role">{t('common.parentLayout.espaceParent')}</p>
          </div>
        </div>

        {/* Liens de navigation.
            isActive : React Router ajoute 'active' sur le lien de la page courante. */}
        <nav className="parent-sidebar__nav">
          {LIENS_PARENT.map(({ to, cle, icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `parent-sidebar__link ${isActive ? 'active' : ''}`
              }
            >
              <span>{icone}</span>
              <span>{t(`common.parentLayout.liens.${cle}`)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bouton déconnexion en bas de la sidebar */}
        <button className="parent-sidebar__deconnexion" onClick={handleDeconnexion}>
          <span>🚪</span>
          <span>{t('common.parentLayout.seDeconnecter')}</span>
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
          aria-label={t('common.menu')}
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
                ? <img src={user.avatar} alt={t('common.parentLayout.avatar')} />
                : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
              }
            </div>
            <div>
              <p className="parent-sidebar__user-nom">{user?.prenom} {user?.nom}</p>
              <p className="parent-sidebar__user-role">{t('common.parentLayout.espaceParent')}</p>
            </div>
          </div>

          <nav className="parent-mobile-menu__nav">
            {LIENS_PARENT.map(({ to, cle, icone }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOuvert(false)}
                className={({ isActive }) =>
                  `parent-mobile-menu__link ${isActive ? 'active' : ''}`
                }
              >
                <span>{icone}</span>
                <span>{t(`common.parentLayout.liens.${cle}`)}</span>
              </NavLink>
            ))}
          </nav>

          <button className="parent-sidebar__deconnexion parent-mobile-menu__deconnexion" onClick={handleDeconnexion}>
            <span>🚪</span>
            <span>{t('common.parentLayout.seDeconnecter')}</span>
          </button>
        </div>
      )}

      {/* ── ZONE DE CONTENU ─────────────────────────────────── */}
      <div className="parent-content">

        {/* Topbar : titre + sélecteur de langue + cloche de notifications */}
        <header className="layout-topbar">
          <span className="layout-topbar__titre">{t('common.parentLayout.espaceParent')}</span>
          <div className="layout-topbar__actions">
            <ThemeToggle />
            <LanguageSwitcher />
            <NotifCloche />
          </div>
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
