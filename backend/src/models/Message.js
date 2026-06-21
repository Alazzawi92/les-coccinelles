// Modèle Sequelize pour la table messages
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Message = sequelize.define('Message', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  expediteur_id:   { type: DataTypes.INTEGER, allowNull: false },
  destinataire_id: { type: DataTypes.INTEGER, allowNull: false },
  sujet:           { type: DataTypes.STRING(255), allowNull: false },
  contenu:         { type: DataTypes.TEXT, allowNull: false },
  lu:              { type: DataTypes.BOOLEAN, defaultValue: false },
  date_lecture:    { type: DataTypes.DATE },
  parent_id:       { type: DataTypes.INTEGER },
  piece_jointe:    { type: DataTypes.STRING(500) },
  piece_jointe_nom:{ type: DataTypes.STRING(255) }
}, {
  tableName:  'messages',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false
});

module.exports = Message;
