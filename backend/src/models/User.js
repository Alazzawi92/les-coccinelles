// Modèle Sequelize pour la table users
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },
  email: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true } // Vérifier le format email
  },
  password: {
    type:      DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type:         DataTypes.ENUM('parent', 'admin', 'super_admin'),
    defaultValue: 'parent'
  },
  prenom: {
    type:      DataTypes.STRING(100),
    allowNull: false
  },
  nom: {
    type:      DataTypes.STRING(100),
    allowNull: false
  },
  telephone:     { type: DataTypes.STRING(20) },
  adresse:       { type: DataTypes.TEXT },
  avatar:        { type: DataTypes.STRING(255) },
  actif:         { type: DataTypes.BOOLEAN, defaultValue: true },
  email_verifie: { type: DataTypes.BOOLEAN, defaultValue: false },
  token_reset:   { type: DataTypes.STRING(255) },
  token_expire:  { type: DataTypes.DATE },
  refresh_token: { type: DataTypes.STRING(500) }
}, {
  tableName:  'users',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = User;
