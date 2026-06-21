// Modèle Sequelize pour la table documents
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Document = sequelize.define('Document', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  enfant_id:      { type: DataTypes.INTEGER },
  inscription_id: { type: DataTypes.INTEGER },
  nom_fichier:    { type: DataTypes.STRING(255), allowNull: false },
  chemin_fichier: { type: DataTypes.STRING(500), allowNull: false },
  type_mime:      { type: DataTypes.STRING(100), allowNull: false },
  taille:         { type: DataTypes.INTEGER, allowNull: false },
  categorie:      { type: DataTypes.ENUM('identite', 'medical', 'caf', 'autre'), defaultValue: 'autre' },
  description:    { type: DataTypes.STRING(255) },
  visible_parent: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName:  'documents',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false // Pas d'updated_at sur cette table
});

module.exports = Document;
