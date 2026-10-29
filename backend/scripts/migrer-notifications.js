// Migration des anciennes notifications — Les Coccinelles
//
// Les notifications créées avant la migration 004 n'ont qu'un texte français
// (titre + message) : elles restaient en français en mode anglais.
// Ce script retrouve, pour chacune, le code de traduction et les paramètres
// (noms, nombres...) en analysant la phrase française, puis les enregistre.
//  - Enfant : prénom seul dans l'ancien texte → nom complet retrouvé parmi
//    les enfants de la famille (si un seul enfant correspond).
//  - Adultes : nom actuel du compte (prénom/nom corrigés depuis).
//  - Phrase non reconnue : notification laissée telle quelle (en français).
//
// Utilisation (depuis le dossier backend) :
//   node scripts/migrer-notifications.js              → simulation (aucune modification)
//   node scripts/migrer-notifications.js --appliquer  → enregistre
// Sous Docker : docker exec coccinelles-backend node scripts/migrer-notifications.js --appliquer

require('dotenv').config();
const sequelize = require('../src/config/database');
const { Notification, User, Enfant } = require('../src/models');

const appliquer = process.argv.includes('--appliquer');

// Comparaison sans casse ni espaces superflus
const norm = (t) => String(t || '').trim().toLowerCase().replace(/\s+/g, ' ');

const executer = async () => {
  await sequelize.authenticate();
  const users   = await User.findAll({ attributes: ['id', 'prenom', 'nom', 'email'] });
  const enfants = await Enfant.findAll({ attributes: ['id', 'user_id', 'prenom', 'nom'] });

  // Nom actuel d'un adulte à partir d'un nom écrit dans l'ancien texte
  // (accepte l'ordre "prénom nom" ou "nom prénom", sans tenir compte de la casse)
  const nomActuel = (texte, email = null) => {
    const u = (email && users.find(x => norm(x.email) === norm(email)))
      || users.find(x => [`${x.prenom} ${x.nom}`, `${x.nom} ${x.prenom}`].map(norm).includes(norm(texte)));
    return u ? `${u.prenom} ${u.nom}` : texte;
  };

  // Nom complet d'un enfant à partir de son prénom : d'abord parmi les enfants
  // de la famille indiquée, sinon parmi tous (seulement si un seul correspond)
  const nomEnfant = (prenom, parentId = null) => {
    const candidats = (liste) => liste.filter(e => norm(e.prenom) === norm(prenom) || norm(`${e.prenom} ${e.nom}`) === norm(prenom));
    let trouves = parentId ? candidats(enfants.filter(e => e.user_id === parentId)) : [];
    if (trouves.length !== 1) trouves = candidats(enfants);
    return trouves.length === 1 ? `${trouves[0].prenom} ${trouves[0].nom}` : prenom;
  };
  // Id d'un parent d'après son nom (pour chercher ses enfants)
  const idParent = (texte) => users.find(x => [`${x.prenom} ${x.nom}`, `${x.nom} ${x.prenom}`].map(norm).includes(norm(texte)))?.id || null;

  // Règles : titre + expression régulière sur le message → { code, params }
  const REGLES = [
    { titre: 'Mise à jour inscription', re: /^La demande d'inscription de (.+) a été acceptée\.$/,
      f: (m, n) => ({ code: 'statutInscription', params: { statut: 'accepte', enfant: nomEnfant(m[1], n.user_id) } }) },
    { titre: 'Mise à jour inscription', re: /^La demande d'inscription de (.+) a été refusée\.$/,
      f: (m, n) => ({ code: 'statutInscription', params: { statut: 'refuse', enfant: nomEnfant(m[1], n.user_id) } }) },
    { titre: 'Mise à jour inscription', re: /^Des documents manquent pour le dossier de (.+)\.$/,
      f: (m, n) => ({ code: 'statutInscription', params: { statut: 'incomplet', enfant: nomEnfant(m[1], n.user_id) } }) },
    { titre: 'Mise à jour inscription', re: /^(.+) est en liste d'attente\.$/,
      f: (m, n) => ({ code: 'statutInscription', params: { statut: 'liste_attente', enfant: nomEnfant(m[1], n.user_id) } }) },
    { titre: 'Mise à jour inscription', re: /^Statut de l'inscription de (.+) mis à jour\.$/,
      f: (m, n) => ({ code: 'statutInscription', params: { enfant: nomEnfant(m[1], n.user_id) } }) },
    { titre: "Nouvelle demande d'inscription", re: /^(.+) a envoyé une demande d'inscription pour (.+)$/,
      f: (m) => ({ code: 'nouvelleDemande', params: { parent: nomActuel(m[1]), enfant: nomEnfant(m[2], idParent(m[1])) } }) },
    { titre: 'Dossier complété', re: /^(.+) a ajouté (\d+) document\(s\) au dossier de (.*)$/,
      f: (m) => ({ code: 'dossierComplete', params: { parent: nomActuel(m[1]), count: Number(m[2]), enfant: nomEnfant(m[3], idParent(m[1])) } }) },
    { titre: 'Nouveau document', re: /^(.+) a déposé un document \((.+)\)$/,
      f: (m) => ({ code: 'nouveauDocument', params: { parent: nomActuel(m[1]), fichier: m[2] } }) },
    { titre: 'Nouveau compte à valider', re: /^(.+) \((.+)\) a créé un compte et confirmé son email$/,
      f: (m) => ({ code: 'compteAValider', params: { parent: nomActuel(m[1], m[2]), email: m[2] } }) },
    { titre: 'Nouveau message', re: /^(.+) a envoyé une pièce jointe \((.+)\)$/,
      f: (m) => ({ code: 'nouvellePieceJointe', params: { auteur: nomActuel(m[1]), fichier: m[2] } }) },
    { titre: 'Nouveau message', re: /^Message de (.+)$/,
      f: (m) => ({ code: 'nouveauMessage', params: { auteur: nomActuel(m[1]) } }) },
    { titre: 'Absence validee', re: /.*/, f: () => ({ code: 'absenceValidee', params: {} }) },
    { titre: 'Absence refusee', re: /.*/, f: () => ({ code: 'absenceRefusee', params: {} }) },
    { titre: '📷 Nouvelles photos disponibles', re: /^(\d+) nouvelle\(s\) photo\(s\) ajoutée\(s\) dans l'album "(.+)"$/,
      f: (m) => ({ code: 'nouvellesPhotos', params: { count: Number(m[1]), album: m[2] } }) }
  ];

  const anciennes = await Notification.findAll({ where: { code: null } });
  let migrees = 0;
  const nonReconnues = [];

  for (const n of anciennes) {
    const regle = REGLES.find(r => r.titre === n.titre && r.re.test(n.message));
    if (!regle) { nonReconnues.push(`#${n.id} "${n.titre}" — ${n.message}`); continue; }
    const { code, params } = regle.f(n.message.match(regle.re), n);
    console.log(`${appliquer ? '✅' : '🔎'} #${n.id} ${code} ${JSON.stringify(params)}`);
    if (appliquer) await n.update({ code, params });
    migrees += 1;
  }

  console.log(`\n${migrees} notification(s) ${appliquer ? 'migrée(s)' : 'à migrer'} sur ${anciennes.length}.`);
  if (nonReconnues.length) {
    console.log(`${nonReconnues.length} non reconnue(s), laissée(s) en français :`);
    nonReconnues.forEach(l => console.log('  ' + l));
  }
  if (!appliquer) console.log('Simulation uniquement. Ajoutez --appliquer pour enregistrer.');
};

executer()
  .catch(err => { console.error('Erreur :', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
