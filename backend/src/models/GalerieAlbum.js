// Modèle Sequelize pour la table galerie_albums
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const GalerieAlbum = sequelize.define('GalerieAlbum', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titre:           { type: DataTypes.STRING(255), allowNull: false },
  description:     { type: DataTypes.TEXT },
  couverture:      { type: DataTypes.STRING(255) },
  visible_parents: { type: DataTypes.BOOLEAN, defaultValue: true },
  visible_public:  { type: DataTypes.BOOLEAN, defaultValue: false },
  cree_par:        { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName:  'galerie_albums',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = GalerieAlbum;
