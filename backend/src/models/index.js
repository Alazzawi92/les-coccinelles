// Point d'entrée des modèles — définit toutes les associations entre tables
const sequelize     = require('../config/database');

// Importer tous les modèles
const User           = require('./User');
const Enfant         = require('./Enfant');
const Inscription    = require('./Inscription');
const Absence        = require('./Absence');
const SuiviQuotidien = require('./SuiviQuotidien');
const Document       = require('./Document');
const Message        = require('./Message');
const Actualite      = require('./Actualite');
const Menu           = require('./Menu');
const Notification   = require('./Notification');
const GalerieAlbum   = require('./GalerieAlbum');
const GaleriePhoto   = require('./GaleriePhoto');
const Consentement   = require('./Consentement');
const CmsPage        = require('./CmsPage');
const EquipeMembre          = require('./EquipeMembre');
const InscriptionDocument   = require('./InscriptionDocument');

// ── ASSOCIATIONS ────────────────────────────────────────────────────

// User → Enfants (1 parent peut avoir plusieurs enfants)
User.hasMany(Enfant,    { foreignKey: 'user_id', as: 'enfants' });
Enfant.belongsTo(User,  { foreignKey: 'user_id', as: 'parent' });

// User → Inscriptions
User.hasMany(Inscription,      { foreignKey: 'user_id',    as: 'inscriptions' });
Inscription.belongsTo(User,    { foreignKey: 'user_id',    as: 'parent' });
Inscription.belongsTo(User,    { foreignKey: 'traite_par', as: 'admin' });

// Enfant → Inscriptions (1 enfant peut avoir plusieurs dossiers)
Enfant.hasMany(Inscription,    { foreignKey: 'enfant_id', as: 'inscriptions' });
Inscription.belongsTo(Enfant,  { foreignKey: 'enfant_id', as: 'enfant' });

// Enfant → Absences
User.hasMany(Absence,          { foreignKey: 'user_id',    as: 'absences' });
Absence.belongsTo(User,        { foreignKey: 'user_id',    as: 'parent' });
Absence.belongsTo(User,        { foreignKey: 'valide_par', as: 'validateur' });
Enfant.hasMany(Absence,        { foreignKey: 'enfant_id',  as: 'absences' });
Absence.belongsTo(Enfant,      { foreignKey: 'enfant_id',  as: 'enfant' });

// Enfant → SuiviQuotidien
Enfant.hasMany(SuiviQuotidien,         { foreignKey: 'enfant_id',  as: 'suivis' });
SuiviQuotidien.belongsTo(Enfant,       { foreignKey: 'enfant_id',  as: 'enfant' });
SuiviQuotidien.belongsTo(User,         { foreignKey: 'redige_par', as: 'auteur' });

// User → Documents
User.hasMany(Document,         { foreignKey: 'user_id',   as: 'documents' });
Document.belongsTo(User,       { foreignKey: 'user_id',   as: 'auteur' });
Enfant.hasMany(Document,       { foreignKey: 'enfant_id', as: 'documents' });
Document.belongsTo(Enfant,     { foreignKey: 'enfant_id', as: 'enfant' });
Inscription.hasMany(Document,  { foreignKey: 'inscription_id', as: 'documents' });
Document.belongsTo(Inscription,{ foreignKey: 'inscription_id', as: 'inscription' });

// Messages (expéditeur et destinataire)
User.hasMany(Message,          { foreignKey: 'expediteur_id',   as: 'messagesEnvoyes' });
User.hasMany(Message,          { foreignKey: 'destinataire_id', as: 'messagesRecus' });
Message.belongsTo(User,        { foreignKey: 'expediteur_id',   as: 'expediteur' });
Message.belongsTo(User,        { foreignKey: 'destinataire_id', as: 'destinataire' });
Message.belongsTo(Message,     { foreignKey: 'parent_id',       as: 'messageParent' });
Message.hasMany(Message,       { foreignKey: 'parent_id',       as: 'reponses' });

// Actualités
User.hasMany(Actualite,        { foreignKey: 'auteur_id', as: 'actualites' });
Actualite.belongsTo(User,      { foreignKey: 'auteur_id', as: 'auteur' });

// Menus
User.hasMany(Menu,             { foreignKey: 'redige_par', as: 'menus' });
Menu.belongsTo(User,           { foreignKey: 'redige_par', as: 'auteur' });

// Notifications
User.hasMany(Notification,     { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User,   { foreignKey: 'user_id', as: 'destinataire' });

// Galerie Albums → Photos
GalerieAlbum.hasMany(GaleriePhoto, { foreignKey: 'album_id', as: 'photos' });
GaleriePhoto.belongsTo(GalerieAlbum, { foreignKey: 'album_id', as: 'album' });
User.hasMany(GalerieAlbum,     { foreignKey: 'cree_par', as: 'albums' });
GalerieAlbum.belongsTo(User,   { foreignKey: 'cree_par', as: 'createur' });
User.hasMany(GaleriePhoto,     { foreignKey: 'cree_par', as: 'photosUplodees' });
GaleriePhoto.belongsTo(User,   { foreignKey: 'cree_par', as: 'uploadeur' });

// Photos ↔ Enfants (many-to-many via photo_enfants)
// La table pivot n'a pas de timestamps : on déclare un modèle explicite pour éviter
// que Sequelize tente de sélectionner created_at (inexistant dans photo_enfants)
const PhotoEnfant = sequelize.define('photo_enfants', {}, {
  tableName:  'photo_enfants',
  timestamps: false
});
GaleriePhoto.belongsToMany(Enfant,  { through: PhotoEnfant, foreignKey: 'photo_id',  as: 'enfants' });
Enfant.belongsToMany(GaleriePhoto,  { through: PhotoEnfant, foreignKey: 'enfant_id', as: 'photos' });

// Consentements RGPD
Enfant.hasOne(Consentement,    { foreignKey: 'enfant_id', as: 'consentement' });
Consentement.belongsTo(Enfant, { foreignKey: 'enfant_id', as: 'enfant' });
User.hasMany(Consentement,     { foreignKey: 'user_id',   as: 'consentements' });
Consentement.belongsTo(User,   { foreignKey: 'user_id',   as: 'parent' });

// CMS Pages
User.hasMany(CmsPage,          { foreignKey: 'modifie_par', as: 'pagesModifiees' });
CmsPage.belongsTo(User,        { foreignKey: 'modifie_par', as: 'auteur' });

// Inscription → Documents justificatifs
Inscription.hasMany(InscriptionDocument, { foreignKey: 'inscription_id', as: 'pieces' });
InscriptionDocument.belongsTo(Inscription, { foreignKey: 'inscription_id', as: 'inscription' });

// Exporter tous les modèles et l'instance sequelize
module.exports = {
  sequelize,
  User,
  Enfant,
  Inscription,
  Absence,
  SuiviQuotidien,
  Document,
  Message,
  Actualite,
  Menu,
  Notification,
  GalerieAlbum,
  GaleriePhoto,
  Consentement,
  CmsPage,
  EquipeMembre,
  InscriptionDocument
};
