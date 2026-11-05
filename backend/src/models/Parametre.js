// Modèle Sequelize pour la table parametres (réglages du site, clé → valeur)
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Parametre = sequelize.define('Parametre', {
  cle:         { type: DataTypes.STRING(50), primaryKey: true },   // Nom du réglage
  valeur:      { type: DataTypes.STRING(255), allowNull: false },  // '1' / '0' pour un interrupteur
  modifie_par: { type: DataTypes.INTEGER }                         // Dernier super admin à l'avoir changé
}, {
  tableName:  'parametres',
  timestamps: true,
  createdAt:  false,         // Pas de colonne created_at
  updatedAt:  'updated_at'
});

module.exports = Parametre;
