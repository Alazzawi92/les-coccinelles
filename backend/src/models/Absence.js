// Modèle Sequelize pour la table absences
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Absence = sequelize.define('Absence', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enfant_id:       { type: DataTypes.INTEGER, allowNull: false },
  user_id:         { type: DataTypes.INTEGER, allowNull: false },
  date_debut:      { type: DataTypes.DATEONLY, allowNull: false },
  date_fin:        { type: DataTypes.DATEONLY, allowNull: false },
  motif:           { type: DataTypes.ENUM('maladie', 'vacances', 'rendez_vous', 'autre'), allowNull: false },
  description:     { type: DataTypes.TEXT },
  justificatif:    { type: DataTypes.STRING(255) },
  statut:          { type: DataTypes.ENUM('en_attente', 'validee', 'refusee'), defaultValue: 'en_attente' },
  valide_par:      { type: DataTypes.INTEGER },
  date_validation: { type: DataTypes.DATE }
}, {
  tableName:  'absences',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Absence;
