// ============================================================
// FICHIER  : theme.js
// RÔLE     : Fonctions de gestion du thème clair / sombre.
//            Le thème actif est porté par l'attribut data-theme
//            de <html>, posé au chargement par public/theme-init.js.
// ============================================================

// Clé de mémorisation du choix du visiteur dans localStorage
const CLE_THEME = 'coccinelles_theme';

// Requête média : le système (téléphone / ordinateur) est-il en mode sombre ?
const requeteSombre = () => window.matchMedia('(prefers-color-scheme: dark)');

// Thème actuellement affiché : 'light' ou 'dark'
export const getTheme = () =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

// Nom de l'événement émis à chaque changement de thème : permet à tous
// les boutons ThemeToggle affichés de rester synchronisés
export const EVENEMENT_THEME = 'coccinelles-theme';

// Applique un thème à la page, sans l'enregistrer
export const appliquerTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  window.dispatchEvent(new CustomEvent(EVENEMENT_THEME, { detail: theme }));
};

// Le visiteur a-t-il déjà choisi un thème avec le bouton ?
export const aChoisiTheme = () => {
  try {
    const choix = localStorage.getItem(CLE_THEME);
    return choix === 'light' || choix === 'dark';
  } catch {
    return false; // localStorage bloqué : on considère qu'il n'a pas choisi
  }
};

// Applique ET enregistre le choix du visiteur
export const choisirTheme = (theme) => {
  appliquerTheme(theme);
  try {
    localStorage.setItem(CLE_THEME, theme);
  } catch { /* Stockage bloqué : le thème reste appliqué pour cette visite */ }
};

// Suit les changements du réglage système tant que le visiteur n'a rien choisi.
// Retourne une fonction pour arrêter l'écoute (utilisée au démontage du composant).
export const suivreThemeSysteme = () => {
  const requete = requeteSombre();
  const auChangement = (e) => {
    if (aChoisiTheme()) return;       // Le choix du visiteur reste prioritaire
    appliquerTheme(e.matches ? 'dark' : 'light');
  };
  requete.addEventListener('change', auChangement);
  return () => requete.removeEventListener('change', auChangement);
};
