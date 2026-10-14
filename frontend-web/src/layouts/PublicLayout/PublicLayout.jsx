// ============================================================
// FICHIER  : PublicLayout.jsx
// RÔLE     : Layout enveloppant toutes les pages publiques.
//            Contient la barre de navigation (avec menu hamburger
//            mobile) et le footer. Les pages s'insèrent via
//            <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher/LanguageSwitcher';
import './PublicLayout.css';

const PublicLayout = () => {

  const { user } = useAuth(); // Utilisateur connecté (ou null)
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // menuOuvert : contrôle l'affichage du menu hamburger sur mobile
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="public-layout">

      {/* ── BARRE DE NAVIGATION ─────────────────────────────── */}
      <nav className="public-navbar">

        {/* Logo → lien vers l'accueil. Le texte "Crèche Coccinelles"
            est déjà intégré à l'image, pas besoin de le répéter. */}
        <Link to="/" className="public-navbar__logo">
          <img src="/images/logo.png" alt={t('common.footer.logoAlt')} className="public-navbar__logo-img" />
        </Link>

        {/* Liens de navigation (visibles sur desktop) */}
        <ul className="public-navbar__links">
          <li><NavLink to="/"             className="public-navbar__link">{t('common.nav.accueil')}</NavLink></li>
          <li><NavLink to="/presentation" className="public-navbar__link">{t('common.nav.laCreche')}</NavLink></li>
          <li><NavLink to="/actualites"   className="public-navbar__link">{t('common.nav.actualites')}</NavLink></li>
          <li><NavLink to="/menus"        className="public-navbar__link">{t('common.nav.menus')}</NavLink></li>
          <li><NavLink to="/contact"      className="public-navbar__link">{t('common.nav.contact')}</NavLink></li>
        </ul>

        {/* Bouton connexion / espace parent + hamburger mobile */}
        <div className="public-navbar__actions">

          {/* Sélecteur de langue FR / EN */}
          <LanguageSwitcher />

          {/* Si connecté : lien vers l'espace parent. Sinon : page connexion. */}
          {user ? (
            <Link to="/parent/tableau-de-bord" className="btn btn--primary btn--sm">
              {t('common.nav.monEspace')}
            </Link>
          ) : (
            <Link to="/connexion" className="btn btn--primary btn--sm">
              {t('common.nav.seConnecter')}
            </Link>
          )}

          {/* Hamburger : visible uniquement sur mobile (CSS display:none > 768px) */}
          <button
            className="public-navbar__hamburger"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label={t('common.menu')}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Menu mobile déroulant — affiché si menuOuvert est true.
          onClick ferme le menu après chaque navigation. */}
      {menuOuvert && (
        <div className="public-navbar__mobile">
          <NavLink to="/"             onClick={() => setMenuOuvert(false)}>{t('common.nav.accueil')}</NavLink>
          <NavLink to="/presentation" onClick={() => setMenuOuvert(false)}>{t('common.nav.laCreche')}</NavLink>
          <NavLink to="/actualites"   onClick={() => setMenuOuvert(false)}>{t('common.nav.actualites')}</NavLink>
          <NavLink to="/menus"        onClick={() => setMenuOuvert(false)}>{t('common.nav.menus')}</NavLink>
          <NavLink to="/contact"      onClick={() => setMenuOuvert(false)}>{t('common.nav.contact')}</NavLink>
          <NavLink to="/connexion"    onClick={() => setMenuOuvert(false)}>{t('common.nav.seConnecter')}</NavLink>
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
              <h3 className="public-footer__titre">
                <img src="/images/logo.png" alt="" className="public-footer__logo-img" />
                Les Coccinelles
              </h3>
              <p>{t('common.footer.description')}</p>
              <p>{t('common.footer.ages')}</p>
              <p>{t('common.footer.communes')}</p>
            </div>

            {/* Colonne 2 : liens rapides de navigation */}
            <div>
              <h4 className="public-footer__sous-titre">{t('common.footer.navigation')}</h4>
              <ul>
                <li><Link to="/presentation">{t('common.footer.presentation')}</Link></li>
                <li><Link to="/equipe">{t('common.footer.equipe')}</Link></li>
                <li><Link to="/horaires">{t('common.footer.horaires')}</Link></li>
                <li><Link to="/tarifs">{t('common.footer.tarifs')}</Link></li>
              </ul>
            </div>

            {/* Colonne 3 : informations de contact */}
            <div>
              <h4 className="public-footer__sous-titre">{t('common.footer.contact')}</h4>
              <p>📍 10 rue Saint Vincent, 17138 Puilboreau</p>
              <p>📞 05 46 69 68 25</p>
              <p>✉️ les.coccinelles17@orange.fr</p>
            </div>
          </div>

          {/* Bande basse : copyright + mentions légales */}
          <div className="public-footer__bas">
            <p>© {new Date().getFullYear()} Les Coccinelles — <Link to="/mentions-legales">{t('common.footer.mentionsLegales')}</Link></p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLayout;
