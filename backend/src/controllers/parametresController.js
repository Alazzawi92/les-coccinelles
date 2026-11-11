// Contrôleur des paramètres du site — Les Coccinelles
const { Parametre, User } = require('../models');
const { CLES, etatPublic, modifierInterrupteurs } = require('../services/parametres.service');
const { succes, erreur } = require('../utils/response');
const { DOSSIER_PRIVE } = require('../middlewares/upload.middleware');
const fs   = require('fs');
const path = require('path');

// Guide d'inscription : document livré avec le site, remplacé par celui du super admin s'il en envoie un
const GUIDE_INITIAL  = path.join(__dirname, '../../assets/guide-inscription.pdf');
const GUIDE_REMPLACE = path.join(DOSSIER_PRIVE, 'guide', 'guide-inscription.pdf');

// GET /api/parametres/guide-inscription — Téléchargement du guide (public)
const telechargerGuide = (req, res) => {
  const chemin = fs.existsSync(GUIDE_REMPLACE) ? GUIDE_REMPLACE : GUIDE_INITIAL;
  res.download(chemin, 'Guide-inscription-Les-Coccinelles.pdf', (err) => {
    if (!err) return;
    console.error('Erreur téléchargement du guide :', err.message);
    if (!res.headersSent) erreur(res, 'Document indisponible');
  });
};

// POST /api/parametres/guide-inscription — Remplace le guide par un nouveau PDF (super admin)
const remplacerGuide = (req, res) => {
  if (!req.file) return erreur(res, 'Aucun fichier envoyé', 400);
  if (req.file.mimetype !== 'application/pdf') {
    fs.unlink(req.file.path, () => {}); // Une image reçue n'est pas conservée
    return erreur(res, 'Le guide doit être un fichier PDF', 400);
  }
  try {
    fs.renameSync(req.file.path, GUIDE_REMPLACE); // Remplace l'ancien fichier d'un seul coup
    return succes(res, null, "Guide d'inscription remplacé");
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error('Erreur remplacement du guide :', err.message);
    return erreur(res, "Erreur lors de l'enregistrement du document");
  }
};

// GET /api/parametres/public — État des interrupteurs pour le site public
const getPublic = async (req, res) => {
  try {
    return succes(res, await etatPublic());
  } catch (err) { return erreur(res, 'Erreur récupération des paramètres'); }
};

// GET /api/parametres — Interrupteurs + dernière modification (super admin)
const getTout = async (req, res) => {
  try {
    const lignes = await Parametre.findAll({
      where:   { cle: CLES },
      include: [{ model: User, as: 'auteur', attributes: ['prenom', 'nom'] }]
    });
    // Valeurs enregistrées (la création peut être "ouverte" en base alors
    // que l'espace parents est fermé : elle reste alors sans effet)
    const donnees = {};
    for (const l of lignes) {
      donnees[l.cle] = {
        ouvert:      l.valeur === '1',
        modifie_le:  l.updated_at,
        modifie_par: l.auteur ? `${l.auteur.prenom} ${l.auteur.nom}` : null
      };
    }
    // Date du dernier remplacement du guide (null : document livré avec le site)
    donnees.guide_inscription = {
      modifie_le: fs.existsSync(GUIDE_REMPLACE) ? fs.statSync(GUIDE_REMPLACE).mtime : null
    };
    return succes(res, donnees);
  } catch (err) {
    console.error('Erreur paramètres :', err);
    return erreur(res, 'Erreur récupération des paramètres');
  }
};

// PUT /api/parametres — Ouvrir / fermer un interrupteur (super admin)
const modifier = async (req, res) => {
  try {
    await modifierInterrupteurs(req.body, req.user.id);
    return succes(res, await etatPublic(), 'Paramètres enregistrés');
  } catch (err) {
    console.error('Erreur modification paramètres :', err);
    return erreur(res, "Erreur lors de l'enregistrement des paramètres");
  }
};

module.exports = { getPublic, getTout, modifier, telechargerGuide, remplacerGuide };
