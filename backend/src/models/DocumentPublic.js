// Modèle Sequelize pour la table documents_publics
// Documentation de la crèche téléchargeable par tous (page Présentation)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const DocumentPublic = sequelize.define('DocumentPublic', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titre:        { type: DataTypes.STRING(150), allowNull: false },  // Ex : « Règlement de fonctionnement »
  description:  { type: DataTypes.STRING(255) },                    // Courte phrase facultative
  fichier:      { type: DataTypes.STRING(500), allowNull: false },  // /uploads/documentation/<nom>.pdf
  nom_original: { type: DataTypes.STRING(255) },                    // Nom du fichier envoyé par l'admin
  taille:       { type: DataTypes.INTEGER },                        // Taille en octets
  ordre:        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 } // Ordre d'affichage
}, {
  tableName:  'documents_publics',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = DocumentPublic;
