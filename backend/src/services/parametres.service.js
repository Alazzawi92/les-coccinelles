// Service des réglages du site — Les Coccinelles
// Deux interrupteurs gérés par le super admin (Admin → Paramètres) :
//  - espace_parents_ouvert    : les parents peuvent se connecter
//  - creation_comptes_ouverte : nouveaux comptes parents et nouvelles
//    demandes d'inscription (seulement si l'espace parents est ouvert)
// Les réglages sont lus à chaque requête d'un parent : on les garde en
// mémoire et on vide cette copie dès qu'un super admin les modifie.
const { Parametre } = require('../models');

// Clés des interrupteurs (noms des lignes de la table parametres)
const CLES = ['espace_parents_ouvert', 'creation_comptes_ouverte'];

// Messages renvoyés aux parents quand c'est fermé
const MESSAGE_ESPACE_FERME    = "L'espace parents est actuellement fermé. Pour toute question, contactez la crèche.";
const MESSAGE_CREATION_FERMEE = 'Les inscriptions sont actuellement fermées. Pour toute question, contactez la crèche.';

let cache = null; // Copie en mémoire { cle: valeur }, null = à relire en base

const charger = async () => {
  if (!cache) {
    const lignes = await Parametre.findAll({ where: { cle: CLES } });
    cache = Object.fromEntries(lignes.map(l => [l.cle, l.valeur]));
  }
  return cache;
};

// Lit un interrupteur. Erreur de lecture (table absente...) : fermé par
// sécurité, sans garder en mémoire pour réessayer à la requête suivante.
const lireInterrupteur = async (cle) => {
  try {
    return (await charger())[cle] === '1';
  } catch (err) {
    console.error('Erreur lecture paramètres :', err.message);
    return false;
  }
};

const espaceParentsOuvert = () => lireInterrupteur('espace_parents_ouvert');

// La création de comptes n'a d'effet que si l'espace parents est ouvert
const creationComptesOuverte = async () =>
  (await espaceParentsOuvert()) && lireInterrupteur('creation_comptes_ouverte');

// État effectif des deux interrupteurs (site public)
const etatPublic = async () => ({
  espace_parents_ouvert:    await espaceParentsOuvert(),
  creation_comptes_ouverte: await creationComptesOuverte()
});

// Enregistre les interrupteurs reçus ({ cle: booléen }) et vide le cache
const modifierInterrupteurs = async (valeurs, userId) => {
  for (const cle of CLES) {
    if (typeof valeurs[cle] !== 'boolean') continue; // Réglage non envoyé : inchangé
    await Parametre.upsert({ cle, valeur: valeurs[cle] ? '1' : '0', modifie_par: userId });
  }
  cache = null;
};

module.exports = {
  CLES,
  MESSAGE_ESPACE_FERME,
  MESSAGE_CREATION_FERMEE,
  espaceParentsOuvert,
  creationComptesOuverte,
  etatPublic,
  modifierInterrupteurs
};
