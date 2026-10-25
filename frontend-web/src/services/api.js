// Instance Axios configurée pour le projet Les Coccinelles
import axios from 'axios';
import i18n from '../i18n';

// URL de base de l'API (ex: http://localhost:3002/api ou :3001 sous Docker)
// Si l'URL pointe sur "localhost" mais que le site est ouvert depuis un
// autre poste du réseau (ex: http://192.168.1.234:3000), "localhost"
// désignerait CE poste-là : on remplace donc par l'adresse du site.
const API_URL = (() => {
  const url  = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  const hote = window.location.hostname;
  if (hote !== 'localhost' && hote !== '127.0.0.1' && /\/\/(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    return url.replace(/\/\/(localhost|127\.0\.0\.1)/, `//${hote}`);
  }
  return url;
})();

// URL racine du backend (sans /api) — utile pour les fichiers statiques
// servis par /uploads (documents, photos, avatars...). Toujours dérivée
// de API_URL pour rester correcte quel que soit l'environnement (local
// ou Docker, où le port du backend n'est pas le même).
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

// Adresse complète d'un fichier servi par le backend (/uploads/...).
// Les chemins privés arrivent déjà signés par l'API (?exp=...&sig=...).
// Les autres chemins (ex : /images/photo-floue.jpg, fichiers du frontend)
// sont renvoyés tels quels.
export const urlFichier = (chemin) =>
  chemin && chemin.startsWith('/uploads/') ? `${BACKEND_URL}${chemin}` : chemin;

// Teste l'extension d'un chemin en ignorant la signature (?exp=...&sig=...)
export const estCheminImage = (chemin) =>
  /\.(jpg|jpeg|png|webp)$/i.test((chemin || '').split('?')[0]);

// Créer l'instance avec l'URL de base du backend
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur : ajouter le token JWT à chaque requête automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // Récupérer le token stocké
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Ajouter le token au header
  }
  // Indiquer au backend la langue choisie par l'utilisateur (fr / en)
  config.headers['Accept-Language'] = i18n.resolvedLanguage || 'fr';
  // Pour les FormData (uploads), supprimer le Content-Type JSON par défaut
  // afin qu'Axios le génère automatiquement avec le bon boundary multipart
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Intercepteur : gérer les erreurs et le token expiré
api.interceptors.response.use(
  (response) => response, // Réponse OK → retourner directement
  async (error) => {
    const requeteOrigine = error.config;

    // Token expiré (403) et pas encore en train de retenter
    // (sauf "inscription requise" : un nouveau token n'y changerait rien)
    if (error.response?.status === 403 && !requeteOrigine._retry
        && error.response?.data?.code !== 'INSCRIPTION_REQUISE') {
      requeteOrigine._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Tenter de renouveler le token
          const reponse = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken }
          );
          const { accessToken } = reponse.data.data;
          localStorage.setItem('accessToken', accessToken); // Sauvegarder le nouveau token
          requeteOrigine.headers.Authorization = `Bearer ${accessToken}`;
          return api(requeteOrigine); // Relancer la requête originale
        }
      } catch (refreshErr) {
        // Refresh token invalide → déconnecter l'utilisateur
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/connexion';
      }
    }

    return Promise.reject(error); // Propager l'erreur pour le catch dans les composants
  }
);

export default api;
