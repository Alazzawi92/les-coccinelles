// Modèle Sequelize pour la table deux_facteurs (code de connexion envoyé par email)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const DeuxFacteurs = sequelize.define('DeuxFacteurs', {
  user_id:        { type: DataTypes.INTEGER, primaryKey: true },
  code_empreinte: { type: DataTypes.CHAR(64) },  // Empreinte du code, jamais le code lui-même
  expire_le:      { type: DataTypes.DATE },
  envoye_le:      { type: DataTypes.DATE },      // Dernier envoi (limite les renvois)
  tentatives:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  bloque_jusqu:   { type: DataTypes.DATE }
}, {
  tableName:  'deux_facteurs',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = DeuxFacteurs;
