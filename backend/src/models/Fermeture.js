// Modèle Sequelize pour la table fermetures
// Calendrier des fermetures de la crèche (page Présentation)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Fermeture = sequelize.define('Fermeture', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date_debut: { type: DataTypes.DATEONLY, allowNull: false },     // Premier jour de fermeture
  date_fin:   { type: DataTypes.DATEONLY, allowNull: false },     // Dernier jour (= date_debut pour 1 jour)
  motif:      { type: DataTypes.STRING(150), allowNull: false }   // Ex : « Vacances de Noël »
}, {
  tableName:  'fermetures',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Fermeture;
