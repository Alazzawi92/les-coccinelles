// Modèle Sequelize pour la table cms_pages
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const CmsPage = sequelize.define('CmsPage', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug:             { type: DataTypes.STRING(100), allowNull: false, unique: true },
  titre:            { type: DataTypes.STRING(255), allowNull: false },
  contenu:          { type: DataTypes.TEXT('long') }, // LONGTEXT pour le contenu HTML/JSON
  meta_description: { type: DataTypes.STRING(255) },
  publie:           { type: DataTypes.BOOLEAN, defaultValue: true },
  modifie_par:      { type: DataTypes.INTEGER }
}, {
  tableName:  'cms_pages',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = CmsPage;
