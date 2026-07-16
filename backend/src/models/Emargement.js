// Modèle Sequelize pour la table emargements (pointages journaliers)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Emargement = sequelize.define('Emargement', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enfant_id:     { type: DataTypes.INTEGER, allowNull: false },
  date_presence: { type: DataTypes.DATEONLY, allowNull: false },
  heure_arrivee: { type: DataTypes.TIME },                  // Heure d'arrivée (nullable avant pointage)
  heure_depart:  { type: DataTypes.TIME },                  // Heure de départ (nullable avant départ)
  signe_par:     { type: DataTypes.INTEGER, allowNull: false }, // Admin qui a pointé
  note:          { type: DataTypes.TEXT }
}, {
  tableName:  'emargements',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Emargement;
