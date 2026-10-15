// ============================================================
// FICHIER  : theme-init.js
// RÔLE     : Applique le thème clair / sombre AVANT l'affichage
//            de la page, pour éviter un "flash" blanc au chargement
//            en mode sombre. Chargé dans le <head> de index.html,
//            avant React.
//            Fichier séparé (et non script dans index.html) car la
//            CSP du site interdit les scripts écrits dans la page.
//
//   Ordre de priorité :
//     1. Choix enregistré par le visiteur (bouton ☀️/🌙)
//     2. Sinon, réglage clair/sombre du téléphone ou de l'ordinateur
// ============================================================

(function () {
  var theme = null;

  // Lecture protégée : localStorage peut être bloqué (navigation privée)
  try {
    theme = localStorage.getItem('coccinelles_theme');
  } catch (e) { /* Pas de choix enregistré */ }

  // Aucun choix valide : on suit le réglage du système
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // L'attribut data-theme active la palette correspondante (variables.css)
  document.documentElement.setAttribute('data-theme', theme);
})();
