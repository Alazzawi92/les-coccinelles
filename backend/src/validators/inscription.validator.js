// Validation des demandes d'inscription (POST /api/inscriptions) — Les Coccinelles
//
// Mêmes règles que le formulaire parent (Inscription.jsx) : le serveur ne
// fait jamais confiance au navigateur. La requête est en multipart (champs +
// fichiers) : tous les champs arrivent en texte, "preinscription" est un JSON.
// En cas d'erreur, les fichiers déjà enregistrés par multer sont supprimés.

const fs = require('fs');                                      // Suppression des fichiers refusés
const { body, validationResult } = require('express-validator'); // Règles de validation

// ── Listes de valeurs autorisées (identiques au frontend) ──
const SITUATIONS    = ['marie', 'pacse', 'concubinage', 'separe', 'divorce', 'celibataire', 'veuf'];
const FRATRIE       = ['1er enfant', '2ème enfant', '3ème enfant', '4ème enfant ou plus'];
const JOURS         = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const TYPES_ACCUEIL = ['temps_plein', 'temps_partiel', 'occasionnel'];

// ── Formats ──
const RE_TEL   = /^0[1-9]([ .-]?\d{2}){4}$/;     // Téléphone français : 06 12 34 56 78
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // Email simple
const RE_DATE  = /^\d{4}-\d{2}-\d{2}$/;          // AAAA-MM-JJ
const RE_CAF   = /^\d{7}$/;                      // Numéro allocataire CAF : 7 chiffres

// Date du jour en France au format AAAA-MM-JJ (le serveur peut être en UTC)
const aujourdhuiParis = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });

// Numéro de sécurité sociale (NIR) : 15 caractères = 13 + clé de contrôle.
// Corse : département 2A / 2B, remplacé par 19 / 18 pour le calcul de la clé.
// Clé = 97 - (13 premiers chiffres modulo 97).
const nirValide = (valeur) => {
  const nir = String(valeur || '').replace(/\s/g, '').toUpperCase();     // Espaces retirés
  if (!/^[1-478]\d{4}(\d{2}|2A|2B)\d{6}\d{2}$/.test(nir)) return false;  // Forme générale
  const corps = nir.slice(0, 13).replace('2A', '19').replace('2B', '18'); // Corse → chiffres
  const cle   = Number(nir.slice(13));                                     // 2 derniers chiffres
  return cle === 97 - Number(BigInt(corps) % 97n);                         // Contrôle de la clé
};

// Normalise un texte (null / undefined → '')
const txt = (v) => (typeof v === 'string' ? v.trim() : '');

// Vérifie un bloc parent ; obligatoire = tous les champs requis
const verifierParent = (p, nom, obligatoire) => {
  const vide = !['nom', 'prenom', 'telephone', 'email', 'adresse', 'situation_familiale'].some(c => txt(p?.[c]));
  if (!obligatoire && vide) return;                                      // Facultatif et vide : OK
  if (!txt(p?.nom))     throw new Error(`${nom} : nom requis`);
  if (!txt(p?.prenom))  throw new Error(`${nom} : prénom requis`);
  if (!RE_TEL.test(txt(p?.telephone)))  throw new Error(`${nom} : téléphone invalide`);
  if (!RE_EMAIL.test(txt(p?.email)))    throw new Error(`${nom} : email invalide`);
  if (!txt(p?.adresse)) throw new Error(`${nom} : adresse requise`);
  if (!SITUATIONS.includes(p?.situation_familiale)) throw new Error(`${nom} : situation familiale invalide`);
};

// Contact d'urgence : facultatif, seul le format du téléphone est contrôlé
const verifierContact = (c, nom) => {
  if (txt(c?.telephone) && !RE_TEL.test(txt(c.telephone))) throw new Error(`${nom} : téléphone invalide`);
};

// Profession obligatoire ; employeur obligatoire sauf "sans emploi / étudiant"
const verifierEmployeur = (e, nom, obligatoire) => {
  if (!obligatoire && !txt(e?.profession) && !txt(e?.nom_employeur)) return;
  if (!txt(e?.profession)) throw new Error(`${nom} : profession requise`);
  if (!e?.sans_emploi && !txt(e?.nom_employeur)) throw new Error(`${nom} : employeur requis (ou cochez « Sans emploi / Étudiant »)`);
};

const reglesCreation = [
  // Enfant concerné (l'appartenance au parent est vérifiée dans le contrôleur)
  body('enfant_id').isInt({ min: 1 }).withMessage('Enfant invalide'),

  // Date de début : obligatoire, valide, pas dans le passé
  // (la comparaison avec la date de naissance se fait dans le contrôleur)
  body('date_debut_souhaitee')
    .matches(RE_DATE).withMessage('Date de début souhaitée requise (AAAA-MM-JJ)')
    .bail()
    .custom(v => !isNaN(new Date(`${v}T00:00:00Z`))).withMessage('Date de début invalide')
    .bail()
    .custom(v => v >= aujourdhuiParis()).withMessage('La date de début souhaitée ne peut pas être dans le passé'),

  // Type d'accueil
  body('temps_accueil').isIn(TYPES_ACCUEIL).withMessage('Type d\'accueil invalide'),

  // Jours : liste "Lundi,Mardi" cohérente avec le type d'accueil
  body('jours_souhaites').custom((valeur, { req }) => {
    const jours = txt(valeur) ? txt(valeur).split(',') : [];                  // Liste des jours
    if (jours.some(j => !JOURS.includes(j))) throw new Error('Jour d\'accueil invalide');
    if (new Set(jours).size !== jours.length) throw new Error('Jour d\'accueil en double');
    if (req.body.temps_accueil === 'temps_plein' && jours.length !== 5)
      throw new Error('Temps plein : les 5 jours (lundi au vendredi) doivent être sélectionnés');
    if (req.body.temps_accueil === 'temps_partiel' && (jours.length < 2 || jours.length > 3))
      throw new Error('Temps partiel : choisissez 2 ou 3 jours');
    req.body.jours_souhaites = jours.join(',');                               // Valeur nettoyée
    return true;
  }),

  // Message facultatif, longueur raisonnable
  body('commentaire_parent').optional({ checkFalsy: true }).isLength({ max: 2000 })
    .withMessage('Message trop long (2000 caractères maximum)'),

  // Fiche de pré-inscription (JSON)
  body('preinscription').custom((valeur, { req }) => {
    let pi;
    try { pi = typeof valeur === 'string' ? JSON.parse(valeur) : valeur; }    // Texte → objet
    catch { throw new Error('Fiche de pré-inscription illisible'); }
    if (!pi || typeof pi !== 'object') throw new Error('Fiche de pré-inscription manquante');

    const seul = pi.seul_responsable === true;                                 // Parent seul
    verifierParent(pi.parent1, 'Parent 1', true);
    verifierParent(pi.parent2, 'Parent 2', !seul);                             // Facultatif si seul
    if (!FRATRIE.includes(pi.place_fratrie)) throw new Error('Place dans la fratrie requise');
    verifierContact(pi.contact1, 'Contact 1');
    verifierContact(pi.contact2, 'Contact 2');
    verifierEmployeur(pi.employeur1, 'Parent 1', true);
    verifierEmployeur(pi.employeur2, 'Parent 2', !seul);

    // Numéros des justificatifs (sécurité sociale + CAF)
    if (!nirValide(pi.numero_securite_sociale)) throw new Error('Numéro de sécurité sociale invalide (15 caractères, clé de contrôle comprise)');
    if (!RE_CAF.test(String(pi.numero_caf || '').replace(/\s/g, ''))) throw new Error('Numéro allocataire CAF invalide (7 chiffres)');

    // On garde les numéros sans espaces
    pi.numero_securite_sociale = String(pi.numero_securite_sociale).replace(/\s/g, '').toUpperCase();
    pi.numero_caf              = String(pi.numero_caf).replace(/\s/g, '');
    req.body.preinscription = pi;                                              // Objet validé
    return true;
  })
];

// Résultat de la validation : 400 + suppression des fichiers déjà reçus
const verifierResultat = (req, res, next) => {
  const erreurs = validationResult(req);
  if (erreurs.isEmpty()) return next();
  const fichiers = req.files || (req.file ? [req.file] : []);
  fichiers.forEach(f => fs.unlink(f.path, () => {}));                          // Rien ne reste sur le disque
  return res.status(400).json({
    success: false,
    message: erreurs.array()[0].msg,                                           // 1re erreur, lisible
    erreurs: erreurs.array()
  });
};

module.exports = {
  validerCreationInscription: [...reglesCreation, verifierResultat],
  nirValide,
  aujourdhuiParis
};
