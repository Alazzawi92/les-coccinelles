// Modèle Sequelize pour la table actualites
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Actualite = sequelize.define('Actualite', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titre:            { type: DataTypes.STRING(255), allowNull: false },
  contenu:          { type: DataTypes.TEXT, allowNull: false },
  extrait:          { type: DataTypes.TEXT },
  image:            { type: DataTypes.STRING(255) },
  publie:           { type: DataTypes.BOOLEAN, defaultValue: false },
  date_publication: { type: DataTypes.DATE },
  auteur_id:        { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName:  'actualites',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Actualite;
