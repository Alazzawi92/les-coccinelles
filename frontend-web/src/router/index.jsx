// ============================================================
// FICHIER  : router/index.jsx
// RÔLE     : Configuration React Router de l'application.
//            Déclare toutes les routes publiques, auth, parent
//            et admin. Les espaces protégés sont enveloppés
//            dans ProtectedRoute avec les rôles autorisés.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Layouts ──────────────────────────────────────────────────
import PublicLayout from '../layouts/PublicLayout/PublicLayout';   // Site public (navbar + footer)
import ParentLayout from '../layouts/ParentLayout/ParentLayout';   // Espace parent (sidebar)
import AdminLayout  from '../layouts/AdminLayout/AdminLayout';     // Espace admin (sidebar sombre)

// ── Pages publiques ───────────────────────────────────────────
import Accueil           from '../pages/public/Accueil/Accueil';
import Presentation      from '../pages/public/Presentation/Presentation';
import Equipe            from '../pages/public/Equipe/Equipe';
import ProjetPedagogique from '../pages/public/ProjetPedagogique/ProjetPedagogique';
import Horaires          from '../pages/public/Horaires/Horaires';
import Tarifs            from '../pages/public/Tarifs/Tarifs';
import Inscriptions      from '../pages/public/Inscriptions/Inscriptions';
import Actualites        from '../pages/public/Actualites/Actualites';
import Menus             from '../pages/public/Menus/Menus';
import Contact           from '../pages/public/Contact/Contact';
import MentionsLegales   from '../pages/public/MentionsLegales/MentionsLegales';

// ── Pages authentification ────────────────────────────────────
import Login          from '../pages/auth/Login/Login';
import Register       from '../pages/auth/Register/Register';
import ForgotPassword from '../pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword  from '../pages/auth/ResetPassword/ResetPassword';

// ── Pages espace parents ──────────────────────────────────────
import ParentDashboard from '../pages/parent/Dashboard/Dashboard';
import MonProfil       from '../pages/parent/MonProfil/MonProfil';
import MesEnfants      from '../pages/parent/MesEnfants/MesEnfants';
import Inscription     from '../pages/parent/Inscription/Inscription';
import Suivi           from '../pages/parent/Suivi/Suivi';
import Absences        from '../pages/parent/Absences/Absences';
import Documents       from '../pages/parent/Documents/Documents';
import Messages        from '../pages/parent/Messages/Messages';
import GaleriePrivee   from '../pages/parent/GaleriePrivee/GaleriePrivee';
import Consentement    from '../pages/parent/Consentement/Consentement';

// ── Pages espace admin ────────────────────────────────────────
import AdminDashboard    from '../pages/admin/Dashboard/Dashboard';
import Familles          from '../pages/admin/Familles/Familles';
import InscriptionsAdmin from '../pages/admin/Inscriptions/Inscriptions';
import EnfantsAdmin      from '../pages/admin/Enfants/Enfants';
import SuiviAdmin        from '../pages/admin/SuiviAdmin/SuiviAdmin';
import AbsencesAdmin     from '../pages/admin/Absences/Absences';
import CalendrierAdmin   from '../pages/admin/Calendrier/Calendrier';
import EmargementAdmin   from '../pages/admin/Emargement/Emargement';
import MessagerieAdmin   from '../pages/admin/Messagerie/Messagerie';
import ActualitesAdmin   from '../pages/admin/Actualites/Actualites';
import MenusAdmin        from '../pages/admin/Menus/Menus';
import DocumentsAdmin    from '../pages/admin/Documents/Documents';
import GalerieAdmin      from '../pages/admin/Galerie/Galerie';
import CMS               from '../pages/admin/CMS/CMS';
import Statistiques      from '../pages/admin/Statistiques/Statistiques';

// Garde des routes (vérifie auth + rôle)
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── SITE PUBLIC ─────────────────────────────────────
            PublicLayout : navbar + footer communs à toutes les pages.
            Ces routes sont accessibles sans connexion. */}
        <Route element={<PublicLayout />}>
          <Route path="/"                       element={<Accueil />} />
          <Route path="/presentation"           element={<Presentation />} />
          <Route path="/equipe"                 element={<Equipe />} />
          <Route path="/projet-pedagogique"     element={<ProjetPedagogique />} />
          <Route path="/horaires"               element={<Horaires />} />
          <Route path="/tarifs"                 element={<Tarifs />} />
          <Route path="/conditions-inscription" element={<Inscriptions />} />
          <Route path="/actualites"             element={<Actualites />} />
          <Route path="/actualites/:id"         element={<Actualites />} /> {/* Détail d'une actualité */}
          <Route path="/menus"                  element={<Menus />} />
          <Route path="/contact"               element={<Contact />} />
          <Route path="/mentions-legales"      element={<MentionsLegales />} />
        </Route>

        {/* ── AUTHENTIFICATION ────────────────────────────────
            Pas de layout : pages plein écran centrées */}
        <Route path="/connexion"           element={<Login />} />
        <Route path="/creer-un-compte"     element={<Register />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reset-password"      element={<ResetPassword />} /> {/* Reçoit ?token= en query */}

        {/* ── ESPACE PARENTS ──────────────────────────────────
            Accessible aux rôles parent, admin et super_admin.
            Admin peut accéder à l'espace parent pour tests. */}
        <Route element={<ProtectedRoute roles={['parent', 'admin', 'super_admin']} />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/tableau-de-bord" element={<ParentDashboard />} />
            <Route path="/parent/mon-profil"      element={<MonProfil />} />
            <Route path="/parent/mes-enfants"     element={<MesEnfants />} />
            <Route path="/parent/inscription"     element={<Inscription />} />
            <Route path="/parent/suivi/:id"       element={<Suivi />} />  {/* :id = id de l'enfant */}
            <Route path="/parent/absences"        element={<Absences />} />
            <Route path="/parent/documents"       element={<Documents />} />
            <Route path="/parent/messages"        element={<Messages />} />
            <Route path="/parent/galerie"         element={<GaleriePrivee />} />
            <Route path="/parent/consentement"    element={<Consentement />} />
          </Route>
        </Route>

        {/* ── ESPACE ADMIN ────────────────────────────────────
            Réservé aux rôles admin et super_admin uniquement */}
        <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/tableau-de-bord"  element={<AdminDashboard />} />
            <Route path="/admin/familles"         element={<Familles />} />
            <Route path="/admin/inscriptions"     element={<InscriptionsAdmin />} />
            <Route path="/admin/enfants"          element={<EnfantsAdmin />} />
            <Route path="/admin/suivi"            element={<SuiviAdmin />} />
            <Route path="/admin/absences"         element={<AbsencesAdmin />} />
            <Route path="/admin/calendrier"       element={<CalendrierAdmin />} />
            <Route path="/admin/emargement"       element={<EmargementAdmin />} />
            <Route path="/admin/messagerie"       element={<MessagerieAdmin />} />
            <Route path="/admin/actualites"       element={<ActualitesAdmin />} />
            <Route path="/admin/menus"            element={<MenusAdmin />} />
            <Route path="/admin/documents"        element={<DocumentsAdmin />} />
            <Route path="/admin/galerie"          element={<GalerieAdmin />} />
            <Route path="/admin/cms"              element={<CMS />} />
            <Route path="/admin/statistiques"     element={<Statistiques />} />
          </Route>
        </Route>

        {/* ── PAGE 404 ─────────────────────────────────────────
            Toute route inconnue → accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
