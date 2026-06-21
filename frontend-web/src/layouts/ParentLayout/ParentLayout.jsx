// ============================================================
// FICHIER  : ParentLayout.jsx
// RÔLE     : Layout de l'espace parent.
//            Sidebar blanche à gauche avec avatar + navigation.
//            Topbar avec titre + cloche de notifications.
//            Les pages parent s'insèrent via <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
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
            <span>🐞</span>
            <span className="parent-sidebar__logo-text">Les Coccinelles</span>
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
