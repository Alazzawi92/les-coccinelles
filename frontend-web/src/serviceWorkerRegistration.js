// ============================================================
// FICHIER  : serviceWorkerRegistration.js
// RÔLE     : Enregistre le service worker de la PWA dans le
//            navigateur. Uniquement en production (npm run build) :
//            en développement, un service worker garderait en
//            cache d'anciennes versions et gênerait le travail.
//
//   Mises à jour :
//     Quand une nouvelle version du site est déployée, le nouveau
//     service worker s'installe puis ATTEND. On prévient alors la
//     page (événement EVENEMENT_MISE_A_JOUR) qui affiche le bandeau
//     « Nouvelle version disponible ». Le parent clique sur
//     « Mettre à jour » → appliquerMiseAJour() active la nouvelle
//     version et recharge la page.
// ============================================================

// Nom de l'événement envoyé à la page quand une mise à jour attend
export const EVENEMENT_MISE_A_JOUR = 'coccinelles:mise-a-jour';

// Vérifier s'il existe une nouvelle version toutes les heures
// (l'application installée peut rester ouverte longtemps)
const INTERVALLE_VERIFICATION = 60 * 60 * 1000;

// Service worker installé qui attend d'être activé (ou null)
let serviceWorkerEnAttente = null;

// Vrai si le navigateur sait gérer les service workers
const estCompatible = () => 'serviceWorker' in navigator;

// Mémorise la version en attente et prévient la page
const signalerMiseAJour = (worker) => {
  serviceWorkerEnAttente = worker;
  window.dispatchEvent(new CustomEvent(EVENEMENT_MISE_A_JOUR));
};

// Vrai si une mise à jour attend déjà (le bandeau peut s'afficher
// même s'il a été monté après l'événement)
export const miseAJourDisponible = () => serviceWorkerEnAttente !== null;

// Active la nouvelle version puis recharge la page une seule fois
export const appliquerMiseAJour = () => {
  // Aucune version en attente : simple rechargement
  if (!serviceWorkerEnAttente) {
    window.location.reload();
    return;
  }

  // Rechargement dès que la nouvelle version a pris le contrôle
  let dejaRecharge = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (dejaRecharge) return; // Évite une boucle de rechargements
    dejaRecharge = true;
    window.location.reload();
  });

  // Demande au service worker en attente de s'activer tout de suite
  serviceWorkerEnAttente.postMessage({ type: 'SKIP_WAITING' });
};

// Surveille l'installation d'une nouvelle version
const surveillerMisesAJour = (registration) => {
  // Cas 1 : une version attendait déjà à l'ouverture du site
  if (registration.waiting && navigator.serviceWorker.controller) {
    signalerMiseAJour(registration.waiting);
  }

  // Cas 2 : une nouvelle version est trouvée pendant l'utilisation
  registration.addEventListener('updatefound', () => {
    const nouveau = registration.installing;
    if (!nouveau) return;

    nouveau.addEventListener('statechange', () => {
      // "installed" + un ancien service worker actif = vraie mise à jour
      // (sans ancien service worker, c'est la toute première visite :
      // rien à signaler, le site est déjà à jour)
      if (nouveau.state === 'installed' && navigator.serviceWorker.controller) {
        signalerMiseAJour(nouveau);
      }
    });
  });

  // Vérification régulière + à chaque retour sur l'application
  setInterval(() => registration.update().catch(() => {}), INTERVALLE_VERIFICATION);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      registration.update().catch(() => {}); // Hors ligne : on réessaiera plus tard
    }
  });
};

// Enregistre /service-worker.js une fois la page chargée
export const enregistrer = () => {
  // Pas de service worker en développement ni sur un vieux navigateur
  if (process.env.NODE_ENV !== 'production' || !estCompatible()) return;

  // Attendre la fin du chargement pour ne pas ralentir l'affichage
  window.addEventListener('load', () => {
    const adresse = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker
      .register(adresse)
      .then(surveillerMisesAJour)
      .catch((erreur) => {
        // Le site fonctionne normalement même sans service worker
        console.error('Service worker non enregistré :', erreur);
      });
  });
};

// Désinstalle le service worker (utile en cas de problème)
export const desinscrire = () => {
  if (!estCompatible()) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch((erreur) => console.error(erreur.message));
};
