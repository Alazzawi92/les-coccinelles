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
app.use(helmet());                    // Sécurité : protège les headers HTTP
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000', // Autoriser le frontend
  credentials: true                   // Autoriser les cookies et headers d'auth
}));
app.use(express.json());              // Parser le corps des requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parser les formulaires
app.use(morgan('dev'));               // Afficher les logs de requêtes

// ── DOSSIER STATIQUE POUR LES FICHIERS UPLOADÉS ─────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── ROUTES API ───────────────────────────────────────────────────────
app.use('/api', routes); // Toutes les routes préfixées par /api

// ── ROUTE DE SANTÉ (vérifier que le serveur fonctionne) ─────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur Les Coccinelles opérationnel' });
});

// ── DÉMARRAGE DU SERVEUR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

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
