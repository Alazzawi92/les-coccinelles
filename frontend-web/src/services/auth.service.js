// Service d'authentification — appels API auth
import api from './api';

// Créer un compte parent
export const register = (donnees) => api.post('/auth/register', donnees);

// Se connecter
export const login = (email, password) => api.post('/auth/login', { email, password });

// Se déconnecter
export const logout = () => api.post('/auth/logout');

// Renouveler le token
export const refreshToken = (token) => api.post('/auth/refresh-token', { refreshToken: token });

// Demander un reset mot de passe
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

// Réinitialiser le mot de passe
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
