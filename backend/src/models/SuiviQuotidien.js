// Modèle Sequelize pour la table suivi_quotidien
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const SuiviQuotidien = sequelize.define('SuiviQuotidien', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enfant_id:     { type: DataTypes.INTEGER, allowNull: false },
  date_suivi:    { type: DataTypes.DATEONLY, allowNull: false },
  repas_matin:   { type: DataTypes.ENUM('tout', 'peu', 'rien', 'absent'), defaultValue: 'absent' },
  repas_midi:    { type: DataTypes.ENUM('tout', 'peu', 'rien', 'absent'), defaultValue: 'absent' },
  repas_gouter:  { type: DataTypes.ENUM('tout', 'peu', 'rien', 'absent'), defaultValue: 'absent' },
  repas_note:    { type: DataTypes.TEXT },
  sieste_debut:  { type: DataTypes.TIME },
  sieste_fin:    { type: DataTypes.TIME },
  sieste_note:   { type: DataTypes.TEXT },
  siestes:       { type: DataTypes.JSON },                         // Tableau [{debut, fin}] pour siestes multiples
  activites:     { type: DataTypes.TEXT },
  humeur:        { type: DataTypes.ENUM('joyeux', 'calme', 'fatigue', 'pleureur', 'autre') },
  biberon_nb:    { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 }, // Nombre de biberons
  biberon_ml:    { type: DataTypes.SMALLINT.UNSIGNED },                  // Ml par biberon (optionnel)
  selles:        { type: DataTypes.BOOLEAN, defaultValue: false },        // Selles oui/non
  selles_nb:     { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },  // Nombre de selles
  temperature:   { type: DataTypes.DECIMAL(4, 1) },
  note_generale: { type: DataTypes.TEXT },
  redige_par:    { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName:  'suivi_quotidien',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = SuiviQuotidien;
