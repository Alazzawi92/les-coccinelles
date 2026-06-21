// Modèle Sequelize pour la table menus
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Menu = sequelize.define('Menu', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  semaine_debut:   { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  lundi_midi:      { type: DataTypes.TEXT },
  lundi_gouter:    { type: DataTypes.TEXT },
  mardi_midi:      { type: DataTypes.TEXT },
  mardi_gouter:    { type: DataTypes.TEXT },
  mercredi_midi:   { type: DataTypes.TEXT },
  mercredi_gouter: { type: DataTypes.TEXT },
  jeudi_midi:      { type: DataTypes.TEXT },
  jeudi_gouter:    { type: DataTypes.TEXT },
  vendredi_midi:   { type: DataTypes.TEXT },
  vendredi_gouter: { type: DataTypes.TEXT },
  publie:          { type: DataTypes.BOOLEAN, defaultValue: false },
  redige_par:      { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName:  'menus',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Menu;
