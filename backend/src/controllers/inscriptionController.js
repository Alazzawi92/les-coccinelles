// Contrôleur inscriptions — Les Coccinelles
const fs   = require('fs');
const path = require('path');
const { empreinteFichier, detecterTypeReel, DOSSIER_PRIVE } = require('../middlewares/upload.middleware');
const { aujourdhuiParis } = require('../validators/inscription.validator');
const { Inscription, Enfant, User, InscriptionDocument } = require('../models');
const { notifierStatutInscription, creerNotification } = require('../services/notification.service');
const { envoyerStatutInscription } = require('../services/mail.service');
const { familleInscrite } = require('../middlewares/inscription.middleware');
const { succes, erreur, cree } = require('../utils/response');

// GET /api/inscriptions
const lister = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent' ? { user_id: req.user.id } : {};
    const inscriptions = await Inscription.findAll({
      where: filtre,
      include: [
        { model: Enfant, as: 'enfant', attributes: ['id', 'prenom', 'nom'] },
        { model: User,   as: 'parent', attributes: ['id', 'prenom', 'nom', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return succes(res, inscriptions);
  } catch (err) {
    return erreur(res, 'Erreur récupération inscriptions');
  }
};

// GET /api/inscriptions/acces → { acces: true|false }
// Admins : toujours true. Parents : au moins une inscription acceptée.
const acces = async (req, res) => {
  try {
    const ok = req.user.role !== 'parent' || await familleInscrite(req.user.id);
    return succes(res, { acces: ok });
  } catch (err) {
    return erreur(res, 'Erreur vérification accès');
  }
};

// GET /api/inscriptions/stats (admin)
const stats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const statuts = ['en_attente', 'en_cours', 'incomplet', 'accepte', 'refuse', 'liste_attente'];
    const resultat = {};

    for (const statut of statuts) {
      resultat[statut] = await Inscription.count({ where: { statut } });
    }
    resultat.total = await Inscription.count();
    return succes(res, resultat);
  } catch (err) {
    return erreur(res, 'Erreur statistiques');
  }
};

// Nombre de pièces justificatives obligatoires pour une demande
// (doit correspondre à la liste PIECES du formulaire parent)
const NB_PIECES_OBLIGATOIRES = 5;

// Supprime du disque les fichiers uploadés d'une requête refusée
const supprimerFichiers = (fichiers = []) =>
  fichiers.forEach(f => fs.unlink(f.path, () => {}));

// Statuts d'une demande "active" : tant qu'une demande est dans l'un de ces
// statuts, on ne peut pas en créer une 2e pour le même enfant
// (seule une demande refusée permet d'en refaire une)
const STATUTS_ACTIFS = ['en_attente', 'en_cours', 'incomplet', 'liste_attente', 'accepte'];

// Chemin enregistré en base pour une pièce justificative (stockage privé)
const cheminPrive = (fichier) => `/prive/justificatifs/${fichier.filename}`;

// Chemin sur le disque d'une pièce justificative :
//  - "/prive/justificatifs/x.pdf"   → stockage privé (nouveau format)
//  - "/uploads/justificatifs/x.pdf" → ancien format, encore lisible
// path.basename empêche toute remontée de dossier ("../").
const cheminDisque = (fichierPath) => {
  const nom = path.basename(fichierPath || '');
  if (fichierPath?.startsWith('/prive/justificatifs/')) return path.join(DOSSIER_PRIVE, 'justificatifs', nom);
  return path.join(__dirname, '../../uploads/justificatifs', nom);
};

// Cherche un même fichier envoyé deux fois (comparaison des empreintes SHA-256).
// empreintesExistantes : { empreinte: libellé } des documents déjà enregistrés.
// Retourne un message d'erreur, ou null si tous les fichiers sont différents.
const chercherDoublon = (fichiers, labels, empreintesExistantes = {}) => {
  const vues = { ...empreintesExistantes };
  for (let i = 0; i < fichiers.length; i++) {
    const empreinte = empreinteFichier(fichiers[i].path);
    const libelle   = labels[i] || fichiers[i].originalname;
    if (vues[empreinte]) {
      return `Le même fichier « ${fichiers[i].originalname} » est envoyé pour deux documents différents (« ${vues[empreinte]} » et « ${libelle} »)`;
    }
    vues[empreinte] = libelle;
  }
  return null;
};

// POST /api/inscriptions (multipart : champs + fichiers + labels[])
const creer = async (req, res) => {
  const fichiers = req.files || [];
  try {
    // Toutes les pièces justificatives sont obligatoires
    if (fichiers.length < NB_PIECES_OBLIGATOIRES) {
      supprimerFichiers(fichiers);
      return erreur(res, `Les ${NB_PIECES_OBLIGATOIRES} documents obligatoires doivent être fournis`, 400);
    }

    // Vérifier que l'enfant appartient bien au parent connecté
    const enfant = await Enfant.findOne({ where: { id: req.body.enfant_id, user_id: req.user.id } });
    if (!enfant) { supprimerFichiers(fichiers); return erreur(res, 'Enfant non trouvé', 404); }

    // La date de début ne peut pas précéder la naissance de l'enfant
    // (la date passée est déjà refusée par le validateur)
    const naissance = String(enfant.date_naissance).slice(0, 10);
    if (req.body.date_debut_souhaitee < naissance) {
      supprimerFichiers(fichiers);
      return erreur(res, 'La date de début souhaitée ne peut pas être antérieure à la naissance de l\'enfant', 400);
    }

    // Une seule demande active par enfant
    const demandeActive = await Inscription.findOne({
      where: { enfant_id: enfant.id, statut: STATUTS_ACTIFS }
    });
    if (demandeActive) {
      supprimerFichiers(fichiers);
      return erreur(res, `${enfant.prenom} ${enfant.nom} a déjà une demande d'inscription en cours ou acceptée`, 409);
    }

    // Un même fichier ne peut pas servir pour deux documents différents
    const labelsEnvoyes = req.body.labels
      ? (Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels])
      : [];
    const doublon = chercherDoublon(fichiers, labelsEnvoyes);
    if (doublon) { supprimerFichiers(fichiers); return erreur(res, doublon, 400); }

    // Champs autorisés uniquement (jamais statut, commentaire_admin... envoyés
    // par le parent). En multipart tout arrive en texte : '' → null, JSON parsé.
    const { enfant_id, date_debut_souhaitee, jours_souhaites, temps_accueil, commentaire_parent, preinscription } = req.body;
    const inscription = await Inscription.create({
      enfant_id,
      user_id:              req.user.id,
      date_debut_souhaitee: date_debut_souhaitee || null,
      jours_souhaites:      jours_souhaites || null,
      temps_accueil:        temps_accueil || null,
      commentaire_parent:   commentaire_parent || null,
      preinscription:       typeof preinscription === 'string' ? JSON.parse(preinscription) : preinscription
    });

    // Rattacher les pièces justificatives (labels[] dans le même ordre que les fichiers)
    await Promise.all(fichiers.map((f, i) => InscriptionDocument.create({
      inscription_id: inscription.id,
      label:          labelsEnvoyes[i] || f.originalname,
      fichier_path:   cheminPrive(f),                 // Stockage privé (hors dossier public)
      fichier_nom:    f.originalname
    })));

    // Prévenir toute l'équipe (admin + super admin actifs) de la nouvelle demande.
    // creerNotification ne lève jamais d'erreur : la demande reste enregistrée
    // même si une notification échoue.
    const admins = await User.findAll({ where: { role: ['admin', 'super_admin'], actif: true } });
    await Promise.all(admins.map(admin => creerNotification(
      admin.id,
      'Nouvelle demande d\'inscription',
      `${req.user.prenom} ${req.user.nom} a envoyé une demande d'inscription pour ${enfant.prenom} ${enfant.nom}`,
      'inscription',
      '/admin/inscriptions',
      { code: 'nouvelleDemande', params: { parent: `${req.user.prenom} ${req.user.nom}`, enfant: `${enfant.prenom} ${enfant.nom}` } }
    )));

    return cree(res, inscription, 'Demande d\'inscription envoyée');
  } catch (err) {
    supprimerFichiers(fichiers);
    console.error('Erreur création inscription :', err.message);
    return erreur(res, 'Erreur lors de la création de la demande');
  }
};

// GET /api/inscriptions/:id
const getInscription = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };

    const inscription = await Inscription.findOne({
      where: filtre,
      include: [
        { model: Enfant, as: 'enfant' },
        { model: User,   as: 'parent', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }
      ]
    });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);
    return succes(res, inscription);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération');
  }
};

// PUT /api/inscriptions/:id (parent, si en_attente)
const modifier = async (req, res) => {
  try {
    const inscription = await Inscription.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);
    if (inscription.statut !== 'en_attente') return erreur(res, 'Impossible de modifier une inscription déjà traitée', 400);

    // Champs modifiables par le parent UNIQUEMENT (jamais statut, commentaire_admin...)
    const modifs = {};
    ['date_debut_souhaitee', 'temps_accueil', 'jours_souhaites', 'commentaire_parent']
      .forEach(c => { if (req.body[c] !== undefined) modifs[c] = req.body[c]; });

    // Date : ni dans le passé, ni avant la naissance de l'enfant
    if (modifs.date_debut_souhaitee !== undefined) {
      const d = String(modifs.date_debut_souhaitee);
      const enfant = await Enfant.findByPk(inscription.enfant_id);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < aujourdhuiParis()) {
        return erreur(res, 'La date de début souhaitée ne peut pas être dans le passé', 400);
      }
      if (enfant && d < String(enfant.date_naissance).slice(0, 10)) {
        return erreur(res, 'La date de début souhaitée ne peut pas être antérieure à la naissance de l\'enfant', 400);
      }
    }
    if (modifs.temps_accueil !== undefined && !['temps_plein', 'temps_partiel', 'occasionnel'].includes(modifs.temps_accueil)) {
      return erreur(res, 'Type d\'accueil invalide', 400);
    }

    await inscription.update(modifs);
    return succes(res, inscription, 'Inscription mise à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors de la mise à jour');
  }
};

// PATCH /api/inscriptions/:id/statut (admin)
const changerStatut = async (req, res) => {
  try {
    const { statut, commentaire_admin } = req.body;
    const inscription = await Inscription.findByPk(req.params.id);
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    await inscription.update({
      statut,
      commentaire_admin: commentaire_admin || inscription.commentaire_admin,
      traite_par:        req.user.id,
      date_traitement:   new Date()
    });

    // Notifier le parent du changement de statut (cloche + email)
    const enfant = await Enfant.findByPk(inscription.enfant_id);
    await notifierStatutInscription(inscription.user_id, statut, `${enfant.prenom} ${enfant.nom}`, inscription.id);

    // Email : un échec d'envoi (SMTP indisponible...) ne bloque pas le changement de statut
    try {
      const parent = await User.findByPk(inscription.user_id);
      if (parent?.email) {
        await envoyerStatutInscription({
          email:         parent.email,
          prenom:        parent.prenom,
          prenomEnfant:  `${enfant.prenom} ${enfant.nom}`,
          statut,
          commentaire:   inscription.commentaire_admin,
          inscriptionId: inscription.id
        });
      }
    } catch (errMail) {
      console.error('Erreur email statut inscription :', errMail.message);
    }

    return succes(res, inscription, 'Statut mis à jour');
  } catch (err) {
    return erreur(res, 'Erreur lors du changement de statut');
  }
};

// POST /api/inscriptions/:id/documents — Upload des pièces justificatives (parent ou admin)
const ajouterDocuments = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const inscription = await Inscription.findOne({ where: filtre });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    const fichiers = req.files || [];
    if (fichiers.length === 0) return erreur(res, 'Aucun fichier reçu', 400);

    // labels[] en body correspond à chaque fichier dans le même ordre
    const labels = req.body.labels
      ? (Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels])
      : [];

    // Doublons : entre les fichiers envoyés ET avec ceux déjà dans le dossier
    const existants = await InscriptionDocument.findAll({ where: { inscription_id: inscription.id } });
    const empreintesExistantes = {};
    existants.forEach(d => {
      try { empreintesExistantes[empreinteFichier(cheminDisque(d.fichier_path))] = d.label; }
      catch { /* fichier absent du disque : ignoré */ }
    });
    const doublon = chercherDoublon(fichiers, labels, empreintesExistantes);
    if (doublon) { supprimerFichiers(fichiers); return erreur(res, doublon, 400); }

    const docs = await Promise.all(
      fichiers.map((f, i) => InscriptionDocument.create({
        inscription_id: inscription.id,
        label:          labels[i] || f.originalname,
        fichier_path:   cheminPrive(f),               // Stockage privé (hors dossier public)
        fichier_nom:    f.originalname
      }))
    );

    // Dossier incomplet complété par le parent : la demande repasse
    // "en cours" et toute l'équipe est prévenue
    if (req.user.role === 'parent' && inscription.statut === 'incomplet') {
      await inscription.update({ statut: 'en_cours' });
      const enfant = await Enfant.findByPk(inscription.enfant_id);
      const admins = await User.findAll({ where: { role: ['admin', 'super_admin'], actif: true } });
      await Promise.all(admins.map(admin => creerNotification(
        admin.id,
        'Dossier complété',
        `${req.user.prenom} ${req.user.nom} a ajouté ${docs.length} document(s) au dossier de ${enfant ? `${enfant.prenom} ${enfant.nom}` : ''}`,
        'inscription',
        '/admin/inscriptions',
        { code: 'dossierComplete', params: { parent: `${req.user.prenom} ${req.user.nom}`, count: docs.length, enfant: enfant ? `${enfant.prenom} ${enfant.nom}` : '' } }
      )));
    }

    return cree(res, docs, 'Documents ajoutés');
  } catch (err) {
    supprimerFichiers(req.files);
    console.error('Erreur ajouterDocuments :', err.message);
    return erreur(res, 'Erreur lors de l\'ajout des documents : ' + err.message);
  }
};

// GET /api/inscriptions/:id/documents — Liste des documents du dossier
const listerDocuments = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }
      : { id: req.params.id };
    const inscription = await Inscription.findOne({ where: filtre });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    const docs = await InscriptionDocument.findAll({
      where: { inscription_id: inscription.id },
      order: [['created_at', 'ASC']]
    });
    return succes(res, docs);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des documents');
  }
};

// GET /api/inscriptions/mes-documents
// Toutes les pièces justificatives envoyées par le parent avec ses demandes
// d'inscription (affichées dans "Mes documents"), avec l'enfant concerné.
// Le fichier lui-même se lit par la route /:id/documents/:docId/fichier.
const mesDocuments = async (req, res) => {
  try {
    const inscriptions = await Inscription.findAll({
      where:      { user_id: req.user.id },                        // Les demandes du parent connecté
      attributes: ['id', 'statut', 'created_at'],
      include: [
        { model: Enfant, as: 'enfant', attributes: ['id', 'prenom', 'nom'] },
        { model: InscriptionDocument, as: 'pieces', attributes: ['id', 'inscription_id', 'label', 'fichier_nom', 'created_at'] }
      ],
      order: [['created_at', 'DESC']]
    });
    // Une ligne par document (le chemin sur le disque n'est jamais envoyé)
    const documents = inscriptions.flatMap(insc => (insc.pieces || []).map(p => ({
      id:             p.id,
      inscription_id: p.inscription_id,
      label:          p.label,                                     // Catégorie : "Carnet de santé..."
      fichier_nom:    p.fichier_nom,
      created_at:     p.created_at,
      statut_demande: insc.statut,
      enfant:         insc.enfant
    })));
    return succes(res, documents);
  } catch (err) {
    return erreur(res, 'Erreur lors de la récupération des documents');
  }
};

// GET /api/inscriptions/:id/documents/:docId/fichier
// Envoie le fichier d'une pièce justificative. Accès : le parent propriétaire
// de la demande ou l'équipe (admin / super admin). Le fichier est lu dans le
// stockage privé : il n'existe aucune adresse publique pour l'atteindre.
const lireDocument = async (req, res) => {
  try {
    const filtre = req.user.role === 'parent'
      ? { id: req.params.id, user_id: req.user.id }       // Parent : ses demandes uniquement
      : { id: req.params.id };                            // Admin : toutes les demandes
    const inscription = await Inscription.findOne({ where: filtre });
    if (!inscription) return erreur(res, 'Inscription non trouvée', 404);

    const doc = await InscriptionDocument.findOne({
      where: { id: req.params.docId, inscription_id: inscription.id }
    });
    if (!doc) return erreur(res, 'Document non trouvé', 404);

    const fichier = cheminDisque(doc.fichier_path);
    if (!fs.existsSync(fichier)) return erreur(res, 'Fichier introuvable sur le serveur', 404);

    // Type RÉEL du contenu (et non l'extension) : seuls PDF / JPG / PNG sont servis
    const typeReel = detecterTypeReel(fichier);
    if (!typeReel) return erreur(res, 'Format de document non pris en charge', 415);

    res.type(typeReel);                                         // Content-Type imposé
    res.setHeader('X-Content-Type-Options', 'nosniff');         // Pas de "devinette" du navigateur
    res.setHeader('Content-Security-Policy', 'sandbox');        // Aucun script ne peut s'exécuter
    // inline : le navigateur l'affiche (PDF, image) ; nom d'origine proposé à l'enregistrement
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.fichier_nom || path.basename(fichier))}`);
    return res.sendFile(fichier);
  } catch (err) {
    return erreur(res, 'Erreur lors de la lecture du document');
  }
};

module.exports = { mesDocuments, lireDocument, lister, acces, stats, creer, getInscription, modifier, changerStatut, ajouterDocuments, listerDocuments };
