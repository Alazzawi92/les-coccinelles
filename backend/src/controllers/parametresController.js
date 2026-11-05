// Contrôleur des paramètres du site — Les Coccinelles
const { Parametre, User } = require('../models');
const { CLES, etatPublic, modifierInterrupteurs } = require('../services/parametres.service');
const { succes, erreur } = require('../utils/response');

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

module.exports = { getPublic, getTout, modifier };
