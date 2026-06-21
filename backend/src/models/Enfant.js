// Modèle Sequelize pour la table enfants
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Enfant = sequelize.define('Enfant', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  prenom:         { type: DataTypes.STRING(100), allowNull: false },
  nom:            { type: DataTypes.STRING(100), allowNull: false },
  date_naissance: { type: DataTypes.DATEONLY, allowNull: false },
  sexe:           { type: DataTypes.ENUM('M', 'F'), allowNull: false },
  groupe:         { type: DataTypes.STRING(50) },
  allergies:      { type: DataTypes.TEXT },
  medicaments:    { type: DataTypes.TEXT },
  medecin_nom:    { type: DataTypes.STRING(200) },
  medecin_tel:    { type: DataTypes.STRING(20) },
  photo:          { type: DataTypes.STRING(255) },
  actif:          { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName:  'enfants',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Enfant;
