// Modèle Sequelize pour la table consentements_photo (RGPD)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Consentement = sequelize.define('Consentement', {
  id:                 { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enfant_id:          { type: DataTypes.INTEGER, allowNull: false, unique: true },
  user_id:            { type: DataTypes.INTEGER, allowNull: false },
  consenti:           { type: DataTypes.BOOLEAN, defaultValue: false },
  date_consentement:  { type: DataTypes.DATE },
  ip_adresse:         { type: DataTypes.STRING(45) } // IPv4 ou IPv6
}, {
  tableName:  'consentements_photo',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Consentement;
