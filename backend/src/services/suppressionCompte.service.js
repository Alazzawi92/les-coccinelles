// Service de suppression d'un compte parent — Les Coccinelles (RGPD)
//
// Supprime un compte parent et TOUTES ses données personnelles :
//   - en base : compte, enfants, inscriptions et pièces justificatives,
//     absences, suivis, émargements, documents (y compris ceux déposés par
//     l'équipe pour ses enfants), messages, notifications, consentements,
//     appareils de confiance (suppressions en cascade + documents liés)
//   - sur le disque : photo de profil, photos des enfants, documents,
//     pièces justificatives (stockage privé), justificatifs d'absence,
//     pièces jointes des messages
// Les photos de groupe de la galerie restent (elles appartiennent à la
// crèche) : l'enfant n'y est simplement plus identifié.
//
// Utilisé par « Supprimer mon compte » (espace parents) et par la
// suppression d'un compte parent depuis Admin → Familles.
const fs   = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, Enfant, Inscription, InscriptionDocument, Document, Absence, Message } = require('../models');
const { DOSSIER_PRIVE } = require('../middlewares/upload.middleware');

const RACINE_UPLOADS = path.join(__dirname, '../../uploads');

// Sous-dossiers de /uploads qui peuvent contenir des fichiers d'une famille
const DOSSIERS_FAMILLE = ['avatars', 'photos', 'documents', 'justificatifs', 'messages'];

// Chemin enregistré en base → fichier sur le disque (ou null si inconnu).
// Seul le NOM du fichier est repris, dans un dossier imposé : un chemin
// modifié (« ../../.env ») ne peut jamais viser un autre fichier.
const cheminDisque = (chemin) => {
  if (!chemin || typeof chemin !== 'string') return null;
  const propre = chemin.split('?')[0];                         // Sans signature éventuelle
  const nom = path.basename(propre);
  if (propre.startsWith('/prive/justificatifs/')) return path.join(DOSSIER_PRIVE, 'justificatifs', nom);
  const dossier = propre.split('/')[2];                         // "/uploads/<dossier>/<fichier>"
  if (propre.startsWith('/uploads/') && DOSSIERS_FAMILLE.includes(dossier)) return path.join(RACINE_UPLOADS, dossier, nom);
  return null;
};

// Colonnes de la base qui peuvent pointer vers un fichier des dossiers famille
const COLONNES_FICHIERS = [
  ['users', 'avatar'], ['enfants', 'photo'], ['documents', 'chemin_fichier'],
  ['inscription_documents', 'fichier_path'], ['absences', 'justificatif'], ['messages', 'piece_jointe'],
  ['galerie_photos', 'chemin_original'], ['galerie_photos', 'chemin_web'], ['galerie_photos', 'chemin_miniature']
];

// Vrai si un fichier est encore utilisé par une AUTRE ligne de la base.
// Appelé après la suppression du compte : ses propres lignes n'existent
// plus, donc toute référence restante appartient à quelqu'un d'autre et
// le fichier est conservé (défense contre un chemin enregistré à tort).
const fichierEncoreUtilise = async (cheminFichier) => {
  const nom = path.basename(cheminFichier).replace(/[\\%_]/g, c => `\\${c}`); // Échappe les jokers de LIKE
  for (const [table, colonne] of COLONNES_FICHIERS) {
    const [lignes] = await sequelize.query(
      `SELECT 1 FROM ${table} WHERE ${colonne} LIKE :motif LIMIT 1`, // Tables et colonnes : liste fixe ci-dessus
      { replacements: { motif: `%${nom}%` } }
    );
    if (lignes.length) return true;
  }
  return false;
};

// Vrai si le parent a au moins un enfant ACCEPTÉ à la crèche (inscrit ou
// accueilli) : la suppression passe alors par l'équipe
const aUnEnfantAccepte = async (userId) =>
  (await Inscription.count({ where: { user_id: userId, statut: 'accepte' } })) > 0;

// Supprime le compte et toutes ses données, puis ses fichiers.
// Renvoie le nombre de fichiers supprimés du disque.
const supprimerCompteEtDonnees = async (user) => {
  // 1. Liste des fichiers à supprimer (lue AVANT la suppression en base)
  const enfants    = await Enfant.findAll({ where: { user_id: user.id }, attributes: ['id', 'photo'] });
  const idsEnfants = enfants.map(e => e.id);
  const surLesEnfants = idsEnfants.length ? [{ enfant_id: { [Op.in]: idsEnfants } }] : [];

  const [documents, pieces, absences, messages] = await Promise.all([
    // Documents du parent + documents déposés par l'équipe pour ses enfants
    Document.findAll({ where: { [Op.or]: [{ user_id: user.id }, ...surLesEnfants] }, attributes: ['id', 'chemin_fichier'] }),
    // Pièces justificatives de ses demandes d'inscription
    InscriptionDocument.findAll({
      include: [{ model: Inscription, as: 'inscription', where: { user_id: user.id }, attributes: [] }],
      attributes: ['fichier_path']
    }),
    Absence.findAll({ where: { [Op.or]: [{ user_id: user.id }, ...surLesEnfants] }, attributes: ['justificatif'] }),
    Message.findAll({ where: { [Op.or]: [{ expediteur_id: user.id }, { destinataire_id: user.id }] }, attributes: ['piece_jointe'] })
  ]);

  const fichiers = [
    user.avatar,
    ...enfants.map(e => e.photo),
    ...documents.map(d => d.chemin_fichier),
    ...pieces.map(p => p.fichier_path),
    ...absences.map(a => a.justificatif),
    ...messages.map(m => m.piece_jointe)
  ].map(cheminDisque).filter(Boolean);

  // 2. Suppression en base, tout ou rien (transaction)
  await sequelize.transaction(async (transaction) => {
    // Documents de l'équipe sur ses enfants : sinon gardés sans enfant (SET NULL)
    if (documents.length) {
      await Document.destroy({ where: { id: documents.map(d => d.id) }, transaction });
    }
    // Le reste suit par les suppressions en cascade de la base
    await User.destroy({ where: { id: user.id }, transaction });
  });

  // 3. Fichiers supprimés du disque une fois la base à jour, SAUF ceux
  //    encore utilisés par une autre famille ou par la galerie
  let supprimes = 0;
  for (const fichier of new Set(fichiers)) {
    if (await fichierEncoreUtilise(fichier)) continue;
    await fs.promises.unlink(fichier).then(() => { supprimes++; }).catch(() => {}); // Déjà absent : rien à faire
  }
  return supprimes;
};

module.exports = { aUnEnfantAccepte, supprimerCompteEtDonnees, cheminDisque };
