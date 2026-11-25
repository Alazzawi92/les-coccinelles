// Modèle Sequelize pour la table partenaires
// Partenaires de la crèche : nom, catégorie, logo, lien (page Présentation)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Partenaire = sequelize.define('Partenaire', {
  id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom:   { type: DataTypes.STRING(150), allowNull: false },          // Ex : « CAF de la Charente-Maritime »
  categorie: { type: DataTypes.STRING(100) },                        // Ex : « Culture » (facultatif)
  logo:  { type: DataTypes.STRING(500) },                            // /uploads/partenaires/<nom>.png (facultatif)
  lien:  { type: DataTypes.STRING(500) },                            // Site web du partenaire (facultatif)
  ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 } // Ordre d'affichage
}, {
  tableName:  'partenaires',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Partenaire;
