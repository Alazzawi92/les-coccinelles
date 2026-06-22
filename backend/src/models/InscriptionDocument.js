// Modèle Sequelize — documents justificatifs liés à un dossier d'inscription
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const InscriptionDocument = sequelize.define('InscriptionDocument', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  inscription_id: { type: DataTypes.INTEGER, allowNull: false },
  label:          { type: DataTypes.STRING(255) }, // Nom de la pièce (ex: "Carnet de santé")
  fichier_path:   { type: DataTypes.STRING(500) }, // Chemin relatif ex: /uploads/justificatifs/abc.pdf
  fichier_nom:    { type: DataTypes.STRING(255) }, // Nom original du fichier uploadé
}, {
  tableName:  'inscription_documents',
  timestamps: true,
  createdAt:  'created_at',
  updatedAt:  false
});

module.exports = InscriptionDocument;
