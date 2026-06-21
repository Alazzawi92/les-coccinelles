// Modèle Sequelize pour la table notifications
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Notification = sequelize.define('Notification', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  titre:   { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type:    { type: DataTypes.ENUM('info', 'inscription', 'message', 'absence', 'document', 'alerte'), defaultValue: 'info' },
  lue:     { type: DataTypes.BOOLEAN, defaultValue: false },
  lien:    { type: DataTypes.STRING(255) }
}, {
  tableName:  'notifications',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false
});

module.exports = Notification;
