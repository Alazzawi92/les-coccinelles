// Modèle Sequelize pour la table appareils_confiance
// « Faire confiance à cet appareil » : plus de code email à la connexion
// pendant 30 jours (parents) ou 24 heures (équipe). Seule l'empreinte
// de la clé gardée par le navigateur est enregistrée.
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const AppareilConfiance = sequelize.define('AppareilConfiance', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id:       { type: DataTypes.INTEGER, allowNull: false },  // Compte concerné
  cle_empreinte: { type: DataTypes.CHAR(64), allowNull: false },  // Empreinte HMAC de la clé
  expire_le:     { type: DataTypes.DATE, allowNull: false }       // Fin de la confiance
}, {
  tableName:  'appareils_confiance',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false // Une confiance n'est jamais modifiée : supprimée puis recréée
});

module.exports = AppareilConfiance;
