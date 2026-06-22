// Modèle Sequelize pour la table equipe_membres
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const EquipeMembre = sequelize.define('EquipeMembre', {
  id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  prenom: { type: DataTypes.STRING(100), allowNull: false },
  nom:    { type: DataTypes.STRING(100), allowNull: false },
  titre:  { type: DataTypes.STRING(200), allowNull: false },
  photo:  { type: DataTypes.STRING(500), defaultValue: null },
  ordre:  { type: DataTypes.INTEGER, defaultValue: 0 },
  actif:  { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'equipe_membres',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = EquipeMembre;
