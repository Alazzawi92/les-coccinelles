// Liens signés pour les fichiers privés — Les Coccinelles
//
// Problème : les fichiers uploadés (photos d'enfants, pièces justificatives,
// documents, pièces jointes) étaient servis en statique sur /uploads, donc
// accessibles SANS connexion à quiconque connaissait l'adresse.
// Une balise <img> ne peut pas envoyer le jeton JWT : on ne peut donc pas
// simplement exiger "Authorization" sur /uploads.
//
// Solution : liens signés (HMAC-SHA256) à durée limitée.
//  - Quand l'API renvoie un chemin de fichier privé à un utilisateur qui a
//    le droit de le voir, elle y ajoute ?exp=<expiration>&sig=<signature>.
//  - Le serveur de fichiers refuse toute demande sans signature valide.
// Le secret ne quitte jamais le serveur : impossible de fabriquer un lien.

const crypto = require('crypto');
const path   = require('path');

const SECRET = process.env.FILES_SECRET || process.env.JWT_SECRET;

// Liste BLANCHE des sous-dossiers publics de /uploads (affichés sur le site
// public). Tout autre dossier — photos, justificatifs, documents, messages,
// ou tout dossier ajouté plus tard — exige un lien signé (on refuse par défaut).
const DOSSIERS_PUBLICS = ['equipe', 'actualites', 'avatars'];

// Dossiers privés connus (sert à reconnaître les chemins à signer)
const DOSSIERS_PROTEGES = ['photos', 'justificatifs', 'documents', 'messages'];

// Chemin de fichier privé tel que stocké en base : /uploads/<dossier>/<fichier>
const RE_CHEMIN_PROTEGE = new RegExp(`^/uploads/(${DOSSIERS_PROTEGES.join('|')})/[^?#]+$`);

// Noms des colonnes qui contiennent un chemin de fichier. On ne signe QUE
// ces champs : un texte saisi par un utilisateur (message, commentaire...)
// qui ressemblerait à un chemin n'est jamais signé.
const CHAMPS_FICHIERS = new Set([
  'chemin_web', 'chemin_miniature', 'chemin_original', // GaleriePhoto
  'fichier_path',                                      // InscriptionDocument
  'chemin_fichier',                                    // Document
  'justificatif',                                      // Absence
  'piece_jointe',                                      // Message
  'photo'                                              // Enfant
]);

// Décode et normalise un chemin demandé (ex : /%70hotos/x.jpg, /equipe/../photos/x.jpg,
// /Photos/x.jpg) pour décider sur le VRAI chemin, celui que express.static servira.
// Retourne null si le chemin est invalide.
const normaliserChemin = (cheminDemande) => {
  try {
    const decode = decodeURIComponent(cheminDemande);
    if (decode.includes('\0') || decode.includes('\\')) return null;
    return path.posix.normalize(decode).replace(/^\/+/, '');
  } catch {
    return null; // Encodage invalide (ex : %E0%A4%A)
  }
};

// Validité d'un lien : entre 2 et 3 heures. L'expiration est arrondie à
// l'heure pleine pour que le même fichier garde la même adresse pendant
// une heure (le navigateur peut alors réutiliser l'image en cache).
const DUREE_MIN = 2 * 60 * 60;
const ARRONDI   = 60 * 60;

const calculerSignature = (chemin, exp) =>
  crypto.createHmac('sha256', SECRET).update(`${chemin}:${exp}`).digest('hex');

// Ajoute ?exp=...&sig=... à un chemin de fichier privé
const signerChemin = (chemin) => {
  const maintenant = Math.floor(Date.now() / 1000);
  const exp = Math.ceil((maintenant + DUREE_MIN) / ARRONDI) * ARRONDI;
  return `${chemin}?exp=${exp}&sig=${calculerSignature(chemin, exp)}`;
};

// Vérifie une signature (comparaison à temps constant, lien non expiré)
const verifierSignature = (chemin, exp, sig) => {
  if (!exp || !sig || typeof sig !== 'string') return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  const attendu = Buffer.from(calculerSignature(chemin, exp));
  const recu    = Buffer.from(sig);
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);
};

// Parcourt une réponse JSON et signe les chemins de fichiers privés,
// uniquement dans les champs listés dans CHAMPS_FICHIERS
const signerDonnees = (valeur) => {
  if (Array.isArray(valeur)) return valeur.map(signerDonnees);
  if (valeur && typeof valeur === 'object') {
    const copie = {};
    for (const [cle, v] of Object.entries(valeur)) {
      copie[cle] = (CHAMPS_FICHIERS.has(cle) && typeof v === 'string' && RE_CHEMIN_PROTEGE.test(v))
        ? signerChemin(v)
        : signerDonnees(v);
    }
    return copie;
  }
  return valeur;
};

// Middleware API : signe automatiquement les chemins privés de toutes les
// réponses JSON. Seules les données que la route a déjà autorisées pour cet
// utilisateur passent par res.json : signer ici revient donc à autoriser.
const signerReponsesApi = (req, res, next) => {
  const jsonOriginal = res.json.bind(res);
  res.json = (corps) => {
    try {
      // JSON.parse(JSON.stringify()) : convertit les objets Sequelize en objets simples
      return jsonOriginal(signerDonnees(JSON.parse(JSON.stringify(corps))));
    } catch {
      return jsonOriginal(corps);
    }
  };
  next();
};

// Middleware /uploads : la décision se fait sur le chemin décodé et
// normalisé (le même que celui servi par express.static).
// Dossier public (liste blanche) → libre ; tout le reste → signature exigée.
const protegerUploads = (req, res, next) => {
  const chemin = normaliserChemin(req.path);
  if (!chemin || chemin.startsWith('..')) {
    return res.status(400).json({ success: false, message: 'Chemin invalide' });
  }

  // toLowerCase : le volume Docker monté depuis Windows ignore la casse (/Photos = /photos)
  const dossier = chemin.split('/')[0].toLowerCase();
  if (DOSSIERS_PUBLICS.includes(dossier) && chemin.split('/')[0] === dossier) return next();

  // La signature porte sur le chemin canonique stocké en base
  if (!verifierSignature(`/uploads/${chemin}`, req.query.exp, req.query.sig)) {
    return res.status(403).json({ success: false, message: 'Lien de fichier invalide ou expiré' });
  }
  // Fichier personnel : cache navigateur privé uniquement, jamais par un proxy
  res.setHeader('Cache-Control', 'private, max-age=3600');
  next();
};

module.exports = { signerChemin, verifierSignature, signerReponsesApi, protegerUploads, DOSSIERS_PROTEGES, DOSSIERS_PUBLICS };
