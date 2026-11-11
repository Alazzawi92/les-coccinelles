// Service d'authentification — appels API auth
import api from './api';

// Créer un compte parent
export const register = (donnees) => api.post('/auth/register', donnees);

// Se connecter (turnstileToken : jeton de la case anti-robot)
export const login = (email, password, turnstileToken) => api.post('/auth/login', { email, password, turnstileToken });

// Se connecter (ou créer un compte parent) avec le jeton d'identité Google
export const googleLogin = (credential) => api.post('/auth/google', { credential });

// Double authentification : vérifier le code reçu par email, ou en demander un nouveau
export const verifier2fa = (jeton, code) => api.post('/auth/2fa/verifier', { jeton, code });
export const renvoyer2fa = (jeton)       => api.post('/auth/2fa/renvoyer', { jeton });

// Se déconnecter
export const logout = () => api.post('/auth/logout');

// Renouveler le token
export const refreshToken = (token) => api.post('/auth/refresh-token', { refreshToken: token });

// Confirmer l'adresse email (lien reçu par mail après la création du compte)
export const verifyEmail = (token) => api.get(`/auth/verify-email/${encodeURIComponent(token)}`);

// Demander un reset mot de passe (turnstileToken : jeton de la case anti-robot)
export const forgotPassword = (email, turnstileToken) => api.post('/auth/forgot-password', { email, turnstileToken });

// Réinitialiser le mot de passe
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
