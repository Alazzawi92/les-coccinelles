/* eslint-disable no-restricted-globals */
// ============================================================
// FICHIER  : service-worker.js
// RÔLE     : Service worker de la PWA Les Coccinelles.
//            Compilé automatiquement par react-scripts (Workbox
//            InjectManifest) lors de "npm run build", puis servi
//            à la racine du site : /service-worker.js
//
//   RÈGLE RGPD (non négociable) :
//     Le cache ne contient QUE l'interface du site (HTML, JS, CSS,
//     icônes, images publiques). AUCUNE réponse de l'API, aucune
//     photo d'enfant, aucun document n'est mis en cache : ces
//     données restent toujours sur le serveur. Un téléphone perdu
//     ou partagé n'expose donc aucune donnée personnelle.
//
//     Concrètement :
//       - l'API est sur un autre domaine (Alwaysdata) : toutes les
//         routes ci-dessous sont limitées au domaine du site, les
//         appels API ne sont donc jamais interceptés ;
//       - par sécurité, tout chemin /api ou /uploads est en plus
//         explicitement exclu.
// ============================================================

import { clientsClaim }                     from 'workbox-core';
import { ExpirationPlugin }                 from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute }                    from 'workbox-routing';
import { StaleWhileRevalidate }             from 'workbox-strategies';

// Le nouveau service worker prend le contrôle des onglets dès son activation
clientsClaim();

// Supprime les caches laissés par les anciennes versions de Workbox
cleanupOutdatedCaches();

// Pré-cache des fichiers générés par le build (JS, CSS, index.html...).
// self.__WB_MANIFEST est remplacé au build par la liste des fichiers
// avec leur empreinte : une nouvelle version = un nouveau cache.
precacheAndRoute(self.__WB_MANIFEST);

// Vrai si l'adresse appartient au site lui-même ET n'est pas une donnée privée
const estFichierDuSite = (url) =>
  url.origin === self.location.origin &&   // Même domaine que le site
  !url.pathname.startsWith('/api') &&      // Jamais l'API
  !url.pathname.startsWith('/uploads');    // Jamais les fichiers envoyés

// Vrai si le chemin ressemble à un fichier (ex : /images/logo.png)
const regexFichier = /\/[^/?]+\.[^/]+$/;

// ------------------------------------------------------------
// Navigation (React Router) : on sert toujours index.html, même
// hors ligne. React affiche ensuite la bonne page.
// ------------------------------------------------------------
registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' &&         // Ouverture d'une page
    estFichierDuSite(url) &&
    !regexFichier.test(url.pathname),      // Pas un vrai fichier (PDF...)
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// ------------------------------------------------------------
// Fichiers publics du dossier /public (logo, icônes, theme-init.js...) :
// servis depuis le cache puis mis à jour en arrière-plan.
// ------------------------------------------------------------
registerRoute(
  ({ request, url }) =>
    estFichierDuSite(url) &&
    ['image', 'script', 'style', 'font'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'coccinelles-fichiers-publics',
    plugins: [
      // Limite la taille du cache : 60 fichiers, 30 jours maximum
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// ------------------------------------------------------------
// Mise à jour : la page peut demander au nouveau service worker
// de s'activer tout de suite (utilisé par le bandeau
// « Nouvelle version disponible »).
// ------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // Remplace l'ancienne version sans attendre
  }
});
