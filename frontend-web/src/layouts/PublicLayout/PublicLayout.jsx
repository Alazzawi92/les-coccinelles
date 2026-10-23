// ============================================================
// FICHIER  : PublicLayout.jsx
// RÔLE     : Layout enveloppant toutes les pages publiques.
//            Contient la barre de navigation (avec menu hamburger
//            mobile) et le footer. Les pages s'insèrent via
//            <Outlet />.
// ============================================================

import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle/ThemeToggle';
import CoccinelleDefilement from '../../components/ui/CoccinelleDefilement/CoccinelleDefilement';
import { useApparitionAuDefilement } from '../../utils/apparition';
import './PublicLayout.css';

const PublicLayout = () => {

  const { user } = useAuth(); // Utilisateur connecté (ou null)
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Zone de contenu : ses sections apparaissent en douceur au défilement
  const mainRef = useRef(null);
  useApparitionAuDefilement(mainRef);

  // menuOuvert : contrôle l'affichage du menu hamburger sur mobile
  const [menuOuvert, setMenuOuvert] = useState(false);
  const fermerMenu = () => setMenuOuvert(false);

  // Menu ouvert : la touche Échap le ferme
  useEffect(() => {
    if (!menuOuvert) return;
    const surTouche = (e) => { if (e.key === 'Escape') setMenuOuvert(false); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [menuOuvert]);

  // Liens du menu mobile : icône + couleur de pastille (variante CSS)
  const liensMobile = [
    { to: '/',             label: t('common.nav.accueil'),    icone: '🏠', couleur: 'orange' },
    { to: '/presentation', label: t('common.nav.laCreche'),   icone: '🐞', couleur: 'rose'   },
    { to: '/actualites',   label: t('common.nav.actualites'), icone: '📰', couleur: 'violet' },
    { to: '/menus',        label: t('common.nav.menus'),      icone: '🍎', couleur: 'vert'   },
    { to: '/contact',      label: t('common.nav.contact'),    icone: '💌', couleur: 'jaune'  },
  ];

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

          {/* Bouton thème clair / sombre + sélecteur de langue FR / EN */}
          <ThemeToggle />
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

          {/* Hamburger : visible uniquement ≤1023px. Les 3 barres
              se transforment en croix quand le menu est ouvert. */}
          <button
            className={`public-navbar__hamburger${menuOuvert ? ' public-navbar__hamburger--ouvert' : ''}`}
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label={menuOuvert ? t('common.fermer') : t('common.menu')}
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
          >
            <span className="public-navbar__barre" />
            <span className="public-navbar__barre" />
            <span className="public-navbar__barre" />
          </button>
        </div>

        {/* Menu mobile : carte arrondie qui descend sous la navbar.
            Toujours dans le DOM pour l'animation d'ouverture/fermeture ;
            inert le rend non focusable quand il est fermé. */}
        <div
          id="menu-mobile"
          className={`public-navbar__mobile${menuOuvert ? ' public-navbar__mobile--ouvert' : ''}`}
          inert={menuOuvert ? undefined : ''}  /* React 18 : attribut vide = actif */
        >
          <ul className="public-navbar__mobile-liste">
            {liensMobile.map((lien, i) => (
              // --i décale l'apparition de chaque lien (effet cascade)
              <li key={lien.to} style={{ '--i': i }}>
                <NavLink to={lien.to} end={lien.to === '/'} onClick={fermerMenu} className="public-navbar__mobile-lien">
                  <span className={`public-navbar__mobile-icone public-navbar__mobile-icone--${lien.couleur}`} aria-hidden="true">
                    {lien.icone}
                  </span>
                  <span className="public-navbar__mobile-texte">{lien.label}</span>
                  <span className="public-navbar__mobile-fleche" aria-hidden="true">›</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Bouton principal en bas du menu : espace parent ou connexion */}
          <Link
            to={user ? '/parent/tableau-de-bord' : '/connexion'}
            onClick={fermerMenu}
            className="btn btn--primary public-navbar__mobile-cta"
            style={{ '--i': liensMobile.length }}
          >
            {user ? t('common.nav.monEspace') : t('common.nav.seConnecter')}
          </Link>
        </div>
      </nav>

      {/* Voile flouté derrière le menu ouvert : un clic le ferme */}
      <div
        className={`public-navbar__voile${menuOuvert ? ' public-navbar__voile--visible' : ''}`}
        onClick={fermerMenu}
        aria-hidden="true"
      />

      {/* ── CONTENU DE LA PAGE ──────────────────────────────── */}
      {/* Outlet : rendu de la page enfant selon la route active */}
      <main className="public-main" ref={mainRef}>
        <Outlet />
      </main>

      {/* Coccinelle "retour en haut" qui avance avec le défilement */}
      <CoccinelleDefilement />

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
                <li><Link to="/mentions-legales">{t('common.footer.mentionsLegales')}</Link></li>
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
            <p>© {new Date().getFullYear()} Les Coccinelles</p>
            {/* Lien légal bien visible (pastille) plutôt que noyé dans le copyright */}
            <Link to="/mentions-legales" className="public-footer__lien-legal">
              ⚖️ {t('common.footer.mentionsLegales')}
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLayout;
