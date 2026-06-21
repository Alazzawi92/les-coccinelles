# 🌐 03 — FRONTEND WEB (React)
# Fichier : 03-FRONTEND-WEB.md
# Description : Architecture complète du frontend React
# Structure, pages, layouts CSS, routing

---

## 📁 STRUCTURE DU FRONTEND

```
frontend-web/
└── src/
    ├── assets/
    │   ├── images/             # Images du projet
    │   ├── svg/                # SVG coccinelles, illustrations
    │   └── fonts/              # Fonts locales si besoin
    ├── components/
    │   ├── common/             # Composants réutilisables partout
    │   │   ├── Button/
    │   │   │   ├── Button.jsx
    │   │   │   └── Button.css
    │   │   ├── Input/
    │   │   ├── Card/
    │   │   ├── Modal/
    │   │   ├── Badge/
    │   │   ├── Alert/
    │   │   ├── Loader/
    │   │   └── Avatar/
    │   ├── forms/              # Formulaires spécifiques au projet
    │   │   ├── LoginForm/
    │   │   ├── RegisterForm/
    │   │   ├── InscriptionForm/
    │   │   └── AbsenceForm/
    │   └── ui/                 # Composants design system
    │       ├── Navbar/
    │       ├── Sidebar/
    │       ├── Footer/
    │       └── Notification/
    ├── pages/
    │   ├── public/             # Accessibles sans connexion
    │   │   ├── Accueil/
    │   │   ├── Presentation/
    │   │   ├── Equipe/
    │   │   ├── ProjetPedagogique/
    │   │   ├── Horaires/
    │   │   ├── Tarifs/
    │   │   ├── Inscriptions/
    │   │   ├── Actualites/
    │   │   ├── Menus/
    │   │   ├── Galerie/
    │   │   ├── Contact/
    │   │   └── MentionsLegales/
    │   ├── parent/             # Espace parents (auth requis)
    │   │   ├── Dashboard/
    │   │   ├── MonProfil/
    │   │   ├── MesEnfants/
    │   │   ├── Inscription/
    │   │   ├── Suivi/
    │   │   ├── Absences/
    │   │   ├── Documents/
    │   │   ├── Messages/
    │   │   ├── GaleriePrivee/
    │   │   └── Consentement/
    │   ├── admin/              # Espace admin (auth + rôle admin)
    │   │   ├── Dashboard/
    │   │   ├── Familles/
    │   │   ├── Inscriptions/
    │   │   ├── Enfants/
    │   │   ├── SuiviAdmin/
    │   │   ├── Absences/
    │   │   ├── Messagerie/
    │   │   ├── Actualites/
    │   │   ├── Menus/
    │   │   ├── Documents/
    │   │   ├── Galerie/
    │   │   ├── CMS/
    │   │   └── Statistiques/
    │   └── auth/
    │       ├── Login/
    │       ├── Register/
    │       ├── ForgotPassword/
    │       └── ResetPassword/
    ├── layouts/
    │   ├── PublicLayout/
    │   │   ├── PublicLayout.jsx  # Layout site public
    │   │   └── PublicLayout.css  # Styles propres au layout public
    │   ├── ParentLayout/
    │   │   ├── ParentLayout.jsx  # Layout espace parents
    │   │   └── ParentLayout.css  # Styles propres au layout parent
    │   └── AdminLayout/
    │       ├── AdminLayout.jsx   # Layout espace admin
    │       └── AdminLayout.css   # Styles propres au layout admin
    ├── hooks/
    │   ├── useAuth.js            # Hook authentification
    │   ├── useApi.js             # Hook appels API
    │   └── useNotifications.js   # Hook notifications
    ├── context/
    │   ├── AuthContext.jsx       # Contexte authentification global
    │   └── NotifContext.jsx      # Contexte notifications
    ├── services/
    │   ├── api.js                # Instance Axios configurée
    │   ├── auth.service.js       # Appels API auth
    │   ├── enfant.service.js     # Appels API enfants
    │   ├── inscription.service.js
    │   ├── absence.service.js
    │   ├── message.service.js
    │   └── galerie.service.js
    ├── styles/
    │   ├── variables.css         # Variables CSS design system
    │   ├── global.css            # Styles globaux
    │   └── reset.css             # Reset CSS
    ├── utils/
    │   ├── formatDate.js         # Formater les dates en français
    │   ├── validators.js         # Fonctions de validation
    │   └── constants.js          # Constantes du projet
    ├── router/
    │   └── index.jsx             # React Router — toutes les routes
    └── App.jsx                   # Composant racine
```

---

## 🔀 ROUTING COMPLET (router/index.jsx)

```jsx
// Configuration React Router du projet Les Coccinelles
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout  from '../layouts/PublicLayout/PublicLayout';
import ParentLayout  from '../layouts/ParentLayout/ParentLayout';
import AdminLayout   from '../layouts/AdminLayout/AdminLayout';

// Pages publiques
import Accueil           from '../pages/public/Accueil/Accueil';
import Presentation      from '../pages/public/Presentation/Presentation';
import Equipe            from '../pages/public/Equipe/Equipe';
import Horaires          from '../pages/public/Horaires/Horaires';
import Tarifs            from '../pages/public/Tarifs/Tarifs';
import Actualites        from '../pages/public/Actualites/Actualites';
import Menus             from '../pages/public/Menus/Menus';
import Contact           from '../pages/public/Contact/Contact';
import MentionsLegales   from '../pages/public/MentionsLegales/MentionsLegales';

// Pages auth
import Login             from '../pages/auth/Login/Login';
import Register          from '../pages/auth/Register/Register';
import ForgotPassword    from '../pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword     from '../pages/auth/ResetPassword/ResetPassword';

// Pages parents
import ParentDashboard   from '../pages/parent/Dashboard/Dashboard';
import MesEnfants        from '../pages/parent/MesEnfants/MesEnfants';
import SuiviEnfant       from '../pages/parent/Suivi/Suivi';
import MesAbsences       from '../pages/parent/Absences/Absences';
import MesDocuments      from '../pages/parent/Documents/Documents';
import MesMessages       from '../pages/parent/Messages/Messages';
import GaleriePrivee     from '../pages/parent/GaleriePrivee/GaleriePrivee';

// Pages admin
import AdminDashboard    from '../pages/admin/Dashboard/Dashboard';
import GestionFamilles   from '../pages/admin/Familles/Familles';
import GestionEnfants    from '../pages/admin/Enfants/Enfants';
import Statistiques      from '../pages/admin/Statistiques/Statistiques';

// Composants de protection
import ProtectedRoute    from './ProtectedRoute';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── SITE PUBLIC ─────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"              element={<Accueil />} />
          <Route path="/presentation"  element={<Presentation />} />
          <Route path="/equipe"        element={<Equipe />} />
          <Route path="/horaires"      element={<Horaires />} />
          <Route path="/tarifs"        element={<Tarifs />} />
          <Route path="/actualites"    element={<Actualites />} />
          <Route path="/menus"         element={<Menus />} />
          <Route path="/contact"       element={<Contact />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Route>

        {/* ── AUTHENTIFICATION ────────────────────────── */}
        <Route path="/connexion"        element={<Login />} />
        <Route path="/inscription"      element={<Register />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />

        {/* ── ESPACE PARENTS (connexion requise) ──────── */}
        <Route element={<ProtectedRoute roles={['parent', 'admin', 'super_admin']} />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/tableau-de-bord" element={<ParentDashboard />} />
            <Route path="/parent/mes-enfants"     element={<MesEnfants />} />
            <Route path="/parent/suivi/:id"       element={<SuiviEnfant />} />
            <Route path="/parent/absences"        element={<MesAbsences />} />
            <Route path="/parent/documents"       element={<MesDocuments />} />
            <Route path="/parent/messages"        element={<MesMessages />} />
            <Route path="/parent/galerie"         element={<GaleriePrivee />} />
          </Route>
        </Route>

        {/* ── ESPACE ADMIN (rôle admin requis) ────────── */}
        <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/tableau-de-bord"  element={<AdminDashboard />} />
            <Route path="/admin/familles"         element={<GestionFamilles />} />
            <Route path="/admin/enfants"          element={<GestionEnfants />} />
            <Route path="/admin/statistiques"     element={<Statistiques />} />
          </Route>
        </Route>

        {/* ── PAGE 404 ─────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
```

---

## 🔒 PROTECTED ROUTE (router/ProtectedRoute.jsx)

```jsx
// Composant qui protège les routes selon l'authentification et le rôle
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Hook auth personnalisé

// props : roles = tableau des rôles autorisés ex: ['admin', 'super_admin']
const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth(); // Récupérer l'utilisateur connecté

  // Afficher un loader pendant la vérification
  if (loading) return <div className="loader">Chargement...</div>;

  // Pas connecté → rediriger vers la page de connexion
  if (!user) return <Navigate to="/connexion" replace />;

  // Rôle insuffisant → rediriger vers le tableau de bord
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/parent/tableau-de-bord" replace />;
  }

  // Tout est OK → afficher la page demandée
  return <Outlet />;
};

export default ProtectedRoute;
```

---

## 🎨 CSS PAR LAYOUT

### styles/variables.css (variables globales)
```css
/* Variables CSS du Design System Les Coccinelles */
/* Importées dans tous les fichiers CSS du projet */

:root {
  /* ── COULEURS ───────────────────────────────── */
  --primary:      #FF9800;    /* Orange principal */
  --primary-dark: #E65100;    /* Orange foncé (hover) */
  --primary-light:#FFF3E0;    /* Orange très clair (fond) */
  --secondary:    #66BB6A;    /* Vert nature */
  --secondary-dark:#2E7D32;   /* Vert foncé */
  --accent-1:     #4FC3F7;    /* Bleu ciel */
  --accent-2:     #F06292;    /* Rose doux */
  --accent-3:     #BA68C8;    /* Violet tendre */
  --accent-4:     #FFEB3B;    /* Jaune soleil */
  --bg-light:     #FFFDF7;    /* Fond blanc chaud */
  --bg-gray:      #F5F5F5;    /* Fond gris clair */
  --text-dark:    #2D3436;    /* Texte principal */
  --text-gray:    #636e72;    /* Texte secondaire */
  --text-light:   #b2bec3;    /* Texte désactivé */
  --white:        #FFFFFF;
  --error:        #E53935;    /* Rouge erreur */
  --success:      #43A047;    /* Vert succès */
  --warning:      #FB8C00;    /* Orange avertissement */
  --info:         #1E88E5;    /* Bleu information */

  /* ── TYPOGRAPHIE ────────────────────────────── */
  --font-heading: 'Fredoka', sans-serif;   /* Titres */
  --font-body:    'Nunito', sans-serif;    /* Corps du texte */

  /* ── ESPACEMENTS ────────────────────────────── */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* ── BORDER RADIUS ──────────────────────────── */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-pill: 50px;   /* Boutons arrondis */

  /* ── OMBRES ─────────────────────────────────── */
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.1);
  --shadow-md:      0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg:      0 8px 24px rgba(0,0,0,0.15);
  --shadow-colored: 0 4px 15px rgba(255,152,0,0.3); /* Ombre orange */

  /* ── TRANSITIONS ────────────────────────────── */
  --transition: all 0.2s ease;   /* Transition standard */
}
```

### layouts/PublicLayout/PublicLayout.css
```css
/* Styles du Layout Public — Site visible par tous */
@import '../../styles/variables.css'; /* Importer les variables */

/* Conteneur principal du layout public */
.public-layout {
  min-height: 100vh;           /* Hauteur minimum = viewport */
  background: var(--bg-light); /* Fond blanc chaud */
  font-family: var(--font-body);
}

/* Barre de navigation publique */
.public-navbar {
  position: sticky;            /* Reste en haut lors du scroll */
  top: 0;
  z-index: 100;                /* Au-dessus du contenu */
  background: var(--white);
  box-shadow: var(--shadow-sm);
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo dans la navbar */
.public-navbar__logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  color: var(--text-dark);
}

.public-navbar__logo-text {
  font-family: var(--font-heading); /* Police ludique */
  font-size: 1.4rem;
  color: var(--primary);
}

/* Liens de navigation */
.public-navbar__links {
  display: flex;
  gap: var(--space-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.public-navbar__link {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--text-dark);
  text-decoration: none;
  transition: var(--transition);
}

.public-navbar__link:hover {
  color: var(--primary); /* Orange au survol */
}

/* Contenu principal */
.public-main {
  min-height: calc(100vh - 80px); /* Hauteur moins la navbar */
}

/* Footer */
.public-footer {
  background: var(--text-dark);
  color: var(--white);
  padding: var(--space-3xl) var(--space-xl) var(--space-xl);
}

/* ── RESPONSIVE ──────────────────────────────── */
@media (max-width: 768px) {
  /* Masquer les liens sur mobile */
  .public-navbar__links {
    display: none; /* Géré par un menu hamburger */
  }
}
```

### layouts/ParentLayout/ParentLayout.css
```css
/* Styles du Layout Parent — Espace sécurisé parents */
@import '../../styles/variables.css';

/* Conteneur avec sidebar */
.parent-layout {
  display: flex;              /* Sidebar + contenu côte à côte */
  min-height: 100vh;
  background: var(--bg-gray);
}

/* Sidebar de navigation parent */
.parent-sidebar {
  width: 260px;               /* Largeur fixe */
  min-height: 100vh;
  background: var(--white);
  box-shadow: var(--shadow-md);
  padding: var(--space-xl) 0;
  display: flex;
  flex-direction: column;
  position: sticky;           /* Reste visible lors du scroll */
  top: 0;
}

/* Logo dans la sidebar */
.parent-sidebar__logo {
  padding: 0 var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--bg-gray);
}

/* Liens de navigation */
.parent-sidebar__nav {
  flex: 1;
  padding: var(--space-lg) 0;
}

.parent-sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  color: var(--text-gray);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
}

/* Lien actif (page actuelle) */
.parent-sidebar__link.active,
.parent-sidebar__link:hover {
  color: var(--primary);
  background: var(--primary-light);
  border-right: 3px solid var(--primary); /* Indicateur visuel */
}

/* Contenu principal à droite */
.parent-content {
  flex: 1;                    /* Prend tout l'espace restant */
  padding: var(--space-xl);
  max-width: 1100px;
}

/* ── RESPONSIVE ──────────────────────────────── */
@media (max-width: 768px) {
  /* Sidebar se transforme en barre du bas sur mobile */
  .parent-layout    { flex-direction: column; }
  .parent-sidebar   { width: 100%; min-height: auto; position: fixed; bottom: 0; }
  .parent-content   { padding-bottom: 80px; } /* Espace pour la sidebar */
}
```

### layouts/AdminLayout/AdminLayout.css
```css
/* Styles du Layout Admin — Interface de gestion interne */
@import '../../styles/variables.css';

/* Layout admin similaire au parent mais avec couleurs différentes */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #F0F2F5;         /* Fond légèrement bleuté pour admin */
}

/* Sidebar admin plus sombre */
.admin-sidebar {
  width: 280px;
  min-height: 100vh;
  background: var(--text-dark); /* Fond sombre pour admin */
  padding: var(--space-xl) 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
}

/* Logo admin blanc sur fond sombre */
.admin-sidebar__logo {
  padding: 0 var(--space-lg) var(--space-xl);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.admin-sidebar__logo-text {
  color: var(--white);
  font-family: var(--font-heading);
  font-size: 1.3rem;
}

/* Groupes de liens */
.admin-sidebar__group {
  margin: var(--space-md) 0;
}

.admin-sidebar__group-title {
  font-size: 0.7rem;
  text-transform: uppercase;   /* Lettres capitales */
  letter-spacing: 0.1em;       /* Espacement lettres */
  color: var(--text-light);
  padding: var(--space-sm) var(--space-lg);
}

.admin-sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  color: rgba(255,255,255,0.7); /* Blanc semi-transparent */
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
}

/* Lien admin actif */
.admin-sidebar__link.active,
.admin-sidebar__link:hover {
  color: var(--white);
  background: rgba(255,152,0,0.2); /* Orange transparent */
  border-right: 3px solid var(--primary);
}

/* Contenu admin */
.admin-content {
  flex: 1;
  padding: var(--space-xl);
}

/* Header de page admin */
.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
}

.admin-page-title {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  color: var(--text-dark);
}
```

---

## ⚙️ SERVICE API (services/api.js)

```javascript
// Instance Axios configurée pour le projet
import axios from 'axios';

// Créer une instance avec l'URL de base du backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // http://localhost:3001/api
  headers: {
    'Content-Type': 'application/json'    // Envoyer du JSON par défaut
  }
});

// Intercepteur : ajouter le token JWT à chaque requête automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // Récupérer le token stocké
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Ajouter au header
  }
  return config;
});

// Intercepteur : gérer les erreurs de token expiré
api.interceptors.response.use(
  (response) => response, // Réponse OK → retourner directement
  async (error) => {
    if (error.response?.status === 403) {
      // Token expiré → déconnecter l'utilisateur
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/connexion'; // Rediriger vers login
    }
    return Promise.reject(error); // Propager l'erreur
  }
);

export default api; // Exporter pour utiliser dans les services
```

---

## 📦 DÉPENDANCES NPM

```json
{
  "dependencies": {
    "react":              "^18.0.0",
    "react-dom":          "^18.0.0",
    "react-router-dom":   "^6.0.0",
    "axios":              "^1.4.0",
    "react-hook-form":    "^7.0.0",
    "react-hot-toast":    "^2.0.0",
    "date-fns":           "^2.30.0"
  }
}
```

---

## 📌 RÈGLES FRONTEND IMPORTANTES

1. **CSS par layout** : chaque layout a son propre fichier `.css`
2. **Variables CSS** : toujours utiliser `var(--nom-variable)`
3. **Pas de styles inline** : utiliser des classes CSS uniquement
4. **Composants isolés** : chaque composant dans son propre dossier
5. **Noms de classes** : format BEM recommandé (`bloc__element--modifieur`)
6. **Responsive** : mobile-first, breakpoint principal à 768px
7. **Accessibilité** : attributs `alt`, `aria-label` sur tous les éléments
