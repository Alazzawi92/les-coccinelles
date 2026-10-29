// Middleware de gestion des uploads de fichiers avec Multer
const multer = require('multer');  // Gestion upload
const path   = require('path');    // Gestion chemins
const crypto = require('crypto'); // Génération noms uniques
const fs     = require('fs');      // Lecture de l'en-tête des fichiers reçus
const { TAILLE_MAX_DOCUMENT, TAILLE_MAX_PHOTO, TAILLE_MAX_AVATAR } = require('../config/limites'); // Source unique

// Types de fichiers autorisés selon la catégorie
const TYPES_AUTORISES = {
  documents: ['application/pdf', 'image/jpeg', 'image/png'],
  photos:    ['image/jpeg', 'image/png', 'image/webp'],
  avatars:   ['image/jpeg', 'image/png']
};

// Dossier PRIVÉ : jamais servi en statique (contrairement à ./uploads).
// Les pièces justificatives d'inscription y sont rangées et ne sont
// lisibles que par une route authentifiée (parent propriétaire ou admin).
const DOSSIER_PRIVE = path.join(__dirname, '../../stockage');

// Extension du fichier enregistré, déduite du type MIME accepté.
// On ne reprend JAMAIS l'extension du nom envoyé : un fichier "piege.html"
// déclaré en PDF serait sinon servi comme une page web (script exécuté).
const EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/jpeg':      '.jpg',
  'image/jpg':       '.jpg',
  'image/png':       '.png',
  'image/webp':      '.webp'
};
const extensionSure = (mimetype) => EXTENSIONS[mimetype] || '.bin';

// Configuration du stockage sur disque
const stockage = multer.diskStorage({
  // Dossier de destination selon le type défini dans la route
  destination: (req, file, cb) => {
    const dossier = req.uploadDossier || 'documents'; // Par défaut : documents
    // req.uploadPrive : fichier sensible → stockage privé hors dossier public
    cb(null, req.uploadPrive ? path.join(DOSSIER_PRIVE, dossier) : `./uploads/${dossier}/`);
  },
  // Nom de fichier unique pour éviter les conflits
  filename: (req, file, cb) => {
    const extension = extensionSure(file.mimetype);           // .pdf, .jpg... (d'après le type)
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

// Uploader pour les documents (PDF + images, TAILLE_MAX_DOCUMENT)
const uploadDocument = multer({
  storage:    stockage,
  limits:     { fileSize: TAILLE_MAX_DOCUMENT }, // 5 Mo (config/limites.js)
  fileFilter: filtreTypes(TYPES_AUTORISES.documents)
});

// Uploader pour les photos de la galerie (images uniquement, TAILLE_MAX_PHOTO)
const uploadPhoto = multer({
  storage:    stockage,
  limits:     { fileSize: TAILLE_MAX_PHOTO }, // 10 Mo (config/limites.js)
  fileFilter: filtreTypes(TYPES_AUTORISES.photos)
});

// Uploader pour les avatars (images uniquement, max 2 MB)
const uploadAvatar = multer({
  storage:    stockage,
  limits:     { fileSize: TAILLE_MAX_AVATAR }, // 2 Mo (config/limites.js)
  fileFilter: filtreTypes(TYPES_AUTORISES.avatars)
});

// Uploader pour les pièces jointes de messages (images + PDF) : même limite
// que les autres documents (TAILLE_MAX_DOCUMENT), harmonisée partout
const stockageMessages = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/messages/'),
  filename:    (req, file, cb) => {
    const ext = extensionSure(file.mimetype);                 // D'après le type, pas le nom
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  }
});

const uploadPieceJointe = multer({
  storage:    stockageMessages,
  limits:     { fileSize: TAILLE_MAX_DOCUMENT },
  fileFilter: filtreTypes([...TYPES_AUTORISES.documents, 'image/webp'])
});

// ── Contrôle du contenu RÉEL des fichiers ──────────────────
// Le type MIME envoyé par le navigateur se falsifie facilement (un .exe
// renommé en .pdf). On lit donc les premiers octets du fichier
// ("signature" ou "nombre magique") pour connaître son vrai format.
const SIGNATURES = [
  { type: 'application/pdf', octets: [0x25, 0x50, 0x44, 0x46, 0x2D] },             // %PDF-
  { type: 'image/jpeg',      octets: [0xFF, 0xD8, 0xFF] },                          // JPEG
  { type: 'image/png',       octets: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] } // PNG
];

// Retourne le vrai type d'un fichier enregistré (ou null s'il est inconnu)
const detecterTypeReel = (cheminFichier) => {
  const entete = Buffer.alloc(8);                       // 8 premiers octets suffisent
  const fd = fs.openSync(cheminFichier, 'r');
  try { fs.readSync(fd, entete, 0, 8, 0); } finally { fs.closeSync(fd); }
  const trouve = SIGNATURES.find(s => s.octets.every((o, i) => entete[i] === o));
  return trouve ? trouve.type : null;
};

// Middleware à placer APRÈS multer : refuse la requête si un fichier n'est
// pas réellement un PDF / JPG / PNG, ou si son contenu ne correspond pas au
// type annoncé. Tous les fichiers reçus sont alors supprimés.
const verifierContenuFichiers = (req, res, next) => {
  const fichiers = req.files || (req.file ? [req.file] : []);
  for (const f of fichiers) {
    let typeReel = null;
    try { typeReel = detecterTypeReel(f.path); } catch { /* fichier illisible */ }
    // JPEG annoncé "image/jpg" par certains navigateurs : on l'accepte comme image/jpeg
    const annonce = f.mimetype === 'image/jpg' ? 'image/jpeg' : f.mimetype;
    if (!typeReel || typeReel !== annonce) {
      fichiers.forEach(x => fs.unlink(x.path, () => {}));
      return res.status(400).json({
        success: false,
        message: `« ${f.originalname} » n'est pas un vrai fichier PDF, JPG ou PNG`
      });
    }
  }
  next();
};

// Empreinte SHA-256 d'un fichier (détection d'un même fichier envoyé deux fois)
const empreinteFichier = (cheminFichier) =>
  crypto.createHash('sha256').update(fs.readFileSync(cheminFichier)).digest('hex');

module.exports = {
  uploadDocument, uploadPhoto, uploadAvatar, uploadPieceJointe,
  verifierContenuFichiers, detecterTypeReel, empreinteFichier, DOSSIER_PRIVE
};
