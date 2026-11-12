// ============================================================
// FICHIER  : installationPwa.js
// RÔLE     : Gère la proposition d'installer l'application (PWA).
//
//   Deux cas selon le téléphone :
//     - Android / Chrome / Edge : le navigateur envoie l'événement
//       "beforeinstallprompt". On le garde de côté pour ouvrir plus
//       tard la vraie fenêtre d'installation au clic sur « Installer ».
//     - iPhone / iPad : Apple ne permet pas de bouton d'installation.
//       On affiche seulement les étapes à suivre (Partager → Sur l'écran
//       d'accueil).
//
//   Ce fichier est importé dans index.js, AVANT l'affichage de React :
//   l'événement du navigateur peut arriver très tôt et serait perdu.
//
//   Mémorisation (localStorage, uniquement des réglages de confort,
//   aucune donnée personnelle) :
//     - nombre de visites (pour ne rien proposer à la 1re visite)
//     - date du clic « Plus tard » (on ne repropose pas pendant 30 jours)
// ============================================================

// Événements envoyés à la page quand l'état change
export const EVENEMENT_INSTALLATION_DISPONIBLE = 'coccinelles:installation-disponible';
export const EVENEMENT_OUVRIR_INSTALLATION    = 'coccinelles:ouvrir-installation';
export const EVENEMENT_APPLICATION_INSTALLEE  = 'coccinelles:application-installee';

// Clés localStorage
const CLE_VISITES    = 'coccinelles_pwa_visites';
const CLE_PLUS_TARD  = 'coccinelles_pwa_plus_tard';
const CLE_SESSION    = 'coccinelles_pwa_visite_comptee';

// Délai pendant lequel on ne repropose pas après « Plus tard »
const DUREE_PLUS_TARD_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// Événement "beforeinstallprompt" gardé de côté (Android / Chrome / Edge)
let evenementInstallation = null;

// ------------------------------------------------------------
// Lecture / écriture protégées : localStorage peut être bloqué
// (navigation privée, réglages du navigateur)
// ------------------------------------------------------------
const lire = (stockage, cle) => {
  try { return stockage.getItem(cle); } catch { return null; }
};
const ecrire = (stockage, cle, valeur) => {
  try { stockage.setItem(cle, valeur); } catch { /* sans effet : le site marche quand même */ }
};

// ------------------------------------------------------------
// Détections
// ------------------------------------------------------------

// Vrai si le site est ouvert depuis l'application déjà installée
export const estDejaInstallee = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true; // Ancien iPhone

// Vrai sur iPhone / iPad (les iPad récents se présentent comme un Mac tactile)
export const estAppareilApple = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

// Vrai si le navigateur a fourni un vrai bouton d'installation
export const installationDirectePossible = () => evenementInstallation !== null;

// Vrai si on peut proposer l'installation sur cet appareil
export const installationPossible = () =>
  !estDejaInstallee() && (installationDirectePossible() || estAppareilApple());

// ------------------------------------------------------------
// Visites et « Plus tard »
// ------------------------------------------------------------

// Nombre de visites (une visite = un nouvel onglet ou une réouverture)
export const nombreVisites = () => Number(lire(localStorage, CLE_VISITES)) || 0;

// Vrai si le visiteur a cliqué « Plus tard » il y a moins de 30 jours
export const reporteeRecemment = () => {
  const date = Number(lire(localStorage, CLE_PLUS_TARD));
  return date > 0 && Date.now() - date < DUREE_PLUS_TARD_MS;
};

// Enregistre le clic sur « Plus tard »
export const reporterInstallation = () => ecrire(localStorage, CLE_PLUS_TARD, String(Date.now()));

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

// Ouvre la vraie fenêtre d'installation du navigateur (Android / Chrome / Edge).
// Renvoie true si l'application a été installée.
export const lancerInstallation = async () => {
  if (!evenementInstallation) return false;
  const evenement = evenementInstallation;
  evenementInstallation = null; // L'événement ne peut servir qu'une seule fois

  evenement.prompt();                          // Affiche la fenêtre du navigateur
  const { outcome } = await evenement.userChoice; // "accepted" ou "dismissed"
  return outcome === 'accepted';
};

// Demande l'affichage du bandeau (lien « Installer l'application » du pied de page)
export const ouvrirInstallation = () =>
  window.dispatchEvent(new CustomEvent(EVENEMENT_OUVRIR_INSTALLATION));

// ------------------------------------------------------------
// Démarrage (exécuté une seule fois, à l'import du fichier)
// ------------------------------------------------------------

// Compte une visite par session (et non à chaque changement de page)
if (!lire(sessionStorage, CLE_SESSION)) {
  ecrire(sessionStorage, CLE_SESSION, '1');
  ecrire(localStorage, CLE_VISITES, String(nombreVisites() + 1));
}

// Le navigateur indique que le site peut être installé
window.addEventListener('beforeinstallprompt', (evenement) => {
  evenement.preventDefault();              // Pas de mini-barre automatique du navigateur
  evenementInstallation = evenement;       // On garde l'événement pour plus tard
  window.dispatchEvent(new CustomEvent(EVENEMENT_INSTALLATION_DISPONIBLE));
});

// L'application vient d'être installée (par notre bouton ou par le menu du navigateur)
window.addEventListener('appinstalled', () => {
  evenementInstallation = null;
  window.dispatchEvent(new CustomEvent(EVENEMENT_APPLICATION_INSTALLEE));
});
