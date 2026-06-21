// Modèle Sequelize pour la table galerie_photos
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const GaleriePhoto = sequelize.define('GaleriePhoto', {
  id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  album_id:          { type: DataTypes.INTEGER, allowNull: false },
  chemin_original:   { type: DataTypes.STRING(500), allowNull: false },
  chemin_web:        { type: DataTypes.STRING(500), allowNull: false },
  chemin_miniature:  { type: DataTypes.STRING(500), allowNull: false },
  legende:           { type: DataTypes.TEXT },
  cree_par:          { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName:  'galerie_photos',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false
});

module.exports = GaleriePhoto;
