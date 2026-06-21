// Modèle Sequelize pour la table inscriptions
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Inscription = sequelize.define('Inscription', {
  id:                   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enfant_id:            { type: DataTypes.INTEGER, allowNull: false },
  user_id:              { type: DataTypes.INTEGER, allowNull: false },
  statut: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'incomplet', 'accepte', 'refuse', 'liste_attente'),
    defaultValue: 'en_attente'
  },
  date_debut_souhaitee: { type: DataTypes.DATEONLY },
  jours_souhaites:      { type: DataTypes.STRING(100) },
  temps_accueil:        { type: DataTypes.ENUM('temps_plein', 'temps_partiel', 'occasionnel') },
  commentaire_parent:   { type: DataTypes.TEXT },
  commentaire_admin:    { type: DataTypes.TEXT },
  traite_par:           { type: DataTypes.INTEGER },
  date_traitement:      { type: DataTypes.DATE }
}, {
  tableName:  'inscriptions',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  'updated_at'
});

module.exports = Inscription;
