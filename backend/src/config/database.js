// Configuration de la connexion à la base de données MySQL
const { Sequelize } = require('sequelize');

// Création de l'instance Sequelize avec les variables d'environnement
const sequelize = new Sequelize(
  process.env.DB_NAME     || 'coccinelles_db', // Nom de la base
  process.env.DB_USER     || 'root',           // Utilisateur
  process.env.DB_PASSWORD || '',               // Mot de passe
  {
    host:    process.env.DB_HOST || 'localhost', // Hôte
    port:    process.env.DB_PORT || 3306,        // Port MySQL
    dialect: 'mysql',                            // Type de base de données
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Logs SQL en dev
    pool: {
      max:     10,    // Maximum 10 connexions simultanées
      min:     0,     // Minimum 0 connexion
      acquire: 30000, // Timeout d'acquisition (30s)
      idle:    10000  // Fermer après 10s d'inactivité
    },
    define: {
      underscored:  true,         // Noms de colonnes en snake_case automatiquement
      timestamps:   true,         // created_at et updated_at sur chaque table
      createdAt:    'created_at',
      updatedAt:    'updated_at'
    }
  }
);

module.exports = sequelize; // Exporter pour utiliser partout
