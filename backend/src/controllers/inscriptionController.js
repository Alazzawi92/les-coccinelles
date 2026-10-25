// Contrôleur inscriptions — Les Coccinelles
const fs = require('fs');
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
    const labels = req.body.labels
      ? (Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels])
      : [];
    await Promise.all(fichiers.map((f, i) => InscriptionDocument.create({
      inscription_id: inscription.id,
      label:          labels[i] || f.originalname,
      fichier_path:   `/uploads/justificatifs/${f.filename}`,
      fichier_nom:    f.originalname
    })));

    // Prévenir toute l'équipe (admin + super admin actifs) de la nouvelle demande.
    // creerNotification ne lève jamais d'erreur : la demande reste enregistrée
    // même si une notification échoue.
    const admins = await User.findAll({ where: { role: ['admin', 'super_admin'], actif: true } });
    await Promise.all(admins.map(admin => creerNotification(
      admin.id,
      'Nouvelle demande d\'inscription',
      `${req.user.prenom} ${req.user.nom} a envoyé une demande d'inscription pour ${enfant.prenom}`,
      'inscription',
      '/admin/inscriptions'
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

    await inscription.update(req.body);
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
    await notifierStatutInscription(inscription.user_id, statut, enfant.prenom, inscription.id);

    // Email : un échec d'envoi (SMTP indisponible...) ne bloque pas le changement de statut
    try {
      const parent = await User.findByPk(inscription.user_id);
      if (parent?.email) {
        await envoyerStatutInscription({
          email:         parent.email,
          prenom:        parent.prenom,
          prenomEnfant:  enfant.prenom,
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

    const docs = await Promise.all(
      fichiers.map((f, i) => InscriptionDocument.create({
        inscription_id: inscription.id,
        label:          labels[i] || f.originalname,
        fichier_path:   `/uploads/justificatifs/${f.filename}`,
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
        `${req.user.prenom} ${req.user.nom} a ajouté ${docs.length} document(s) au dossier de ${enfant?.prenom || ''}`,
        'inscription',
        '/admin/inscriptions'
      )));
    }

    return cree(res, docs, 'Documents ajoutés');
  } catch (err) {
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

module.exports = { lister, acces, stats, creer, getInscription, modifier, changerStatut, ajouterDocuments, listerDocuments };
