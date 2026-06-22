// Contrôleur équipe — Les Coccinelles
// CRUD membres de l'équipe avec upload photo (Sharp : web 600px + miniature 150px)
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const { EquipeMembre } = require('../models');
const { succes, erreur, cree } = require('../utils/response');

// ── Compresser et redimensionner la photo du membre ──────────────────
const traiterPhoto = async (fichier) => {
  const nom      = crypto.randomBytes(12).toString('hex');
  const dossier  = path.resolve('./uploads/equipe');

  const chemins = {
    web:        path.join(dossier, `${nom}_web.webp`),
    miniature:  path.join(dossier, `${nom}_mini.webp`)
  };

  await sharp(fichier.path)
    .resize(600, 600, { fit: 'cover', position: 'top' })
    .webp({ quality: 85 })
    .toFile(chemins.web);

  await sharp(fichier.path)
    .resize(150, 150, { fit: 'cover', position: 'top' })
    .webp({ quality: 80 })
    .toFile(chemins.miniature);

  // Supprimer le fichier temporaire Multer
  fs.unlink(fichier.path, () => {});

  return {
    web:       `/uploads/equipe/${nom}_web.webp`,
    miniature: `/uploads/equipe/${nom}_mini.webp`
  };
};

const supprimerFichiers = (membre) => {
  if (!membre.photo) return;
  try {
    const data = JSON.parse(membre.photo);
    [data.web, data.miniature].forEach(p => {
      const absolu = path.resolve(`.${p}`);
      if (fs.existsSync(absolu)) fs.unlinkSync(absolu);
    });
  } catch {}
};

// ── GET /equipe — liste publique des membres actifs ──────────────────
const listerMembres = async (req, res) => {
  try {
    const membres = await EquipeMembre.findAll({
      where: { actif: true },
      order: [['ordre', 'ASC'], ['nom', 'ASC']]
    });
    return succes(res, membres);
  } catch (err) {
    console.error('Erreur listerMembres :', err);
    return erreur(res, 'Erreur récupération équipe');
  }
};

// ── GET /equipe/tous — liste admin (tous) ────────────────────────────
const listerTous = async (req, res) => {
  try {
    const membres = await EquipeMembre.findAll({
      order: [['ordre', 'ASC'], ['nom', 'ASC']]
    });
    return succes(res, membres);
  } catch (err) {
    return erreur(res, 'Erreur récupération équipe');
  }
};

// ── POST /equipe — ajouter un membre ────────────────────────────────
const ajouterMembre = async (req, res) => {
  try {
    const { prenom, nom, titre, ordre } = req.body;
    if (!prenom || !nom || !titre)
      return erreur(res, 'Prénom, nom et titre sont requis', 400);

    let photo = null;
    if (req.file) {
      const chemins = await traiterPhoto(req.file);
      photo = JSON.stringify(chemins);
    }

    const membre = await EquipeMembre.create({
      prenom, nom, titre,
      photo,
      ordre: ordre ? parseInt(ordre) : 0,
      actif: true
    });

    return cree(res, membre, 'Membre ajouté');
  } catch (err) {
    console.error('Erreur ajouterMembre :', err);
    return erreur(res, 'Erreur lors de l\'ajout');
  }
};

// ── PUT /equipe/:id — modifier un membre ─────────────────────────────
const modifierMembre = async (req, res) => {
  try {
    const membre = await EquipeMembre.findByPk(req.params.id);
    if (!membre) return erreur(res, 'Membre non trouvé', 404);

    const { prenom, nom, titre, ordre, actif } = req.body;

    let photo = membre.photo;
    if (req.file) {
      supprimerFichiers(membre); // Supprimer l'ancienne photo
      const chemins = await traiterPhoto(req.file);
      photo = JSON.stringify(chemins);
    }

    await membre.update({
      prenom: prenom ?? membre.prenom,
      nom:    nom    ?? membre.nom,
      titre:  titre  ?? membre.titre,
      photo,
      ordre:  ordre !== undefined ? parseInt(ordre) : membre.ordre,
      actif:  actif !== undefined ? actif === 'true' || actif === true : membre.actif
    });

    return succes(res, membre, 'Membre mis à jour');
  } catch (err) {
    console.error('Erreur modifierMembre :', err);
    return erreur(res, 'Erreur lors de la modification');
  }
};

// ── DELETE /equipe/:id — supprimer un membre ─────────────────────────
const supprimerMembre = async (req, res) => {
  try {
    const membre = await EquipeMembre.findByPk(req.params.id);
    if (!membre) return erreur(res, 'Membre non trouvé', 404);
    supprimerFichiers(membre);
    await membre.destroy();
    return succes(res, null, 'Membre supprimé');
  } catch (err) {
    return erreur(res, 'Erreur lors de la suppression');
  }
};

module.exports = { listerMembres, listerTous, ajouterMembre, modifierMembre, supprimerMembre };
