// Point d'entrée du serveur Express — Les Coccinelles
const express = require('express');   // Framework web
const cors    = require('cors');      // Permettre les requêtes cross-origin
const helmet  = require('helmet');    // Sécurité HTTP headers
const morgan  = require('morgan');    // Logs des requêtes
const path    = require('path');      // Gestion des chemins fichiers
require('dotenv').config();           // Charger les variables d'environnement

const sequelize = require('./src/config/database'); // Connexion BDD
const routes    = require('./src/routes');           // Toutes les routes

const app = express(); // Créer l'application Express

// ── MIDDLEWARES GLOBAUX ─────────────────────────────────────────────

// Sécurité des headers HTTP (corrections rapport ZAP) :
// - hidePoweredBy (inclus par défaut) : retire "X-Powered-By: Express"
//   pour ne pas révéler la techno du serveur (Information Disclosure).
// - noSniff (inclus par défaut) : X-Content-Type-Options: nosniff,
//   empêche le navigateur de deviner un type MIME différent de celui
//   déclaré (protection contre certaines attaques XSS/MIME sniffing).
// - hsts : force le navigateur à toujours utiliser HTTPS pour ce domaine
//   pendant 1 an, y compris les sous-domaines.
// - contentSecurityPolicy : ce serveur ne sert que du JSON (API pure,
//   le frontend React est servi séparément), donc une CSP très stricte
//   ("self" partout, aucun script/style externe) est possible sans
//   casser quoi que ce soit ici.
app.use(helmet({
  hsts: {
    maxAge:            31536000, // 1 an, en secondes
    includeSubDomains: true,
    preload:           true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", 'data:'], // data: pour les miniatures/base64 éventuelles
      objectSrc:  ["'none'"],          // Bloque <object>/<embed> (vecteur XSS classique)
      frameAncestors: ["'none'"]       // Interdit d'intégrer l'API dans une <iframe> (clickjacking)
    }
  }
}));

// Cache-Control restrictif sur toute l'API : les réponses contiennent
// des données personnelles (parents, enfants, messages...), donc on
// interdit leur mise en cache par le navigateur ou un proxy intermédiaire.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000', // Autoriser le frontend
  credentials: true                   // Autoriser les cookies et headers d'auth
}));
app.use(express.json());              // Parser le corps des requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parser les formulaires
app.use(morgan('dev'));               // Afficher les logs de requêtes

// ── DOSSIER STATIQUE POUR LES FICHIERS UPLOADÉS ─────────────────────
// Cross-Origin-Resource-Policy est mis à "cross-origin" pour permettre
// au frontend (localhost:3003) d'afficher les images du backend (localhost:3002).
// Helmet le force à "same-origin" par défaut, ce middleware l'écrase.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ── ROUTES API ───────────────────────────────────────────────────────
app.use('/api', routes); // Toutes les routes préfixées par /api

// ── ROUTE DE SANTÉ (vérifier que le serveur fonctionne) ─────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur Les Coccinelles opérationnel' });
});

// ── DÉMARRAGE DU SERVEUR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001 ;

sequelize.authenticate() // Vérifier la connexion à la BDD
  .then(() => {
    console.log('✅ Base de données connectée');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur connexion BDD :', err.message);
    console.log('⚠️  Démarrage sans BDD (mode dégradé)');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  });
