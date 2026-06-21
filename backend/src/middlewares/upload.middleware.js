// Middleware de gestion des uploads de fichiers avec Multer
const multer = require('multer');  // Gestion upload
const path   = require('path');    // Gestion chemins
const crypto = require('crypto'); // Génération noms uniques

// Types de fichiers autorisés selon la catégorie
const TYPES_AUTORISES = {
  documents: ['application/pdf', 'image/jpeg', 'image/png'],
  photos:    ['image/jpeg', 'image/png', 'image/webp'],
  avatars:   ['image/jpeg', 'image/png']
};

// Configuration du stockage sur disque
const stockage = multer.diskStorage({
  // Dossier de destination selon le type défini dans la route
  destination: (req, file, cb) => {
    const dossier = req.uploadDossier || 'documents'; // Par défaut : documents
    cb(null, `./uploads/${dossier}/`);
  },
  // Nom de fichier unique pour éviter les conflits
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);        // .pdf, .jpg...
    const nomUnique = crypto.randomBytes(16).toString('hex'); // Nom aléatoire en hex
    cb(null, `${nomUnique}${extension}`);
  }
});

// Filtre de validation des types MIME
const filtreTypes = (typesAutorises) => (req, file, cb) => {
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true); // Fichier accepté
  } else {
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false);
  }
};

// Uploader pour les documents (PDF + images, max 5 MB)
const uploadDocument = multer({
  storage:    stockage,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter: filtreTypes(TYPES_AUTORISES.documents)
});

// Uploader pour les photos (images uniquement, max 10 MB)
const uploadPhoto = multer({
  storage:    stockage,
  limits:     { fileSize: 10 * 1024 * 1024 }, // 10 MB maximum
  fileFilter: filtreTypes(TYPES_AUTORISES.photos)
});

// Uploader pour les avatars (images uniquement, max 2 MB)
const uploadAvatar = multer({
  storage:    stockage,
  limits:     { fileSize: 2 * 1024 * 1024 }, // 2 MB maximum
  fileFilter: filtreTypes(TYPES_AUTORISES.avatars)
});

// Uploader pour les pièces jointes de messages (images + PDF, max 10 MB)
const stockageMessages = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/messages/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  }
});

const uploadPieceJointe = multer({
  storage:    stockageMessages,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: filtreTypes([...TYPES_AUTORISES.documents, 'image/webp'])
});

module.exports = { uploadDocument, uploadPhoto, uploadAvatar, uploadPieceJointe };
