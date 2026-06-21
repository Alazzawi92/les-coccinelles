// Script de données de test — Les Coccinelles
// Exécuter depuis le dossier backend : node seeds.js
require('dotenv').config(); // Charge backend/.env

const bcrypt   = require('bcryptjs');
const { sequelize, User, Enfant, Inscription, Actualite, Menu, CmsPage, Consentement } = require('./src/models');

// ── DONNÉES ──────────────────────────────────────────────────────────

const COMPTES = [
  {
    email: 'super@lescoccinelles.fr',
    password: 'Admin1234!',
    role: 'super_admin',
    prenom: 'Sabah',
    nom: 'Al-Azzawi',
    telephone: '05 46 12 34 56',
    email_verifie: true
  },
  {
    email: 'admin@lescoccinelles.fr',
    password: 'Admin1234!',
    role: 'admin',
    prenom: 'Marie',
    nom: 'Dupont',
    telephone: '05 46 12 34 57',
    email_verifie: true
  },
  {
    email: 'parent1@test.fr',
    password: 'Parent1234!',
    role: 'parent',
    prenom: 'Sophie',
    nom: 'Martin',
    telephone: '06 12 34 56 78',
    adresse: '12 rue des Lilas, 17138 Puilboreau',
    email_verifie: true
  },
  {
    email: 'parent2@test.fr',
    password: 'Parent1234!',
    role: 'parent',
    prenom: 'Thomas',
    nom: 'Bernard',
    telephone: '06 23 45 67 89',
    adresse: '5 allée des Roses, 17138 Puilboreau',
    email_verifie: true
  }
];

const ACTUALITES = [
  {
    titre: 'Fête de fin d\'année 2026',
    extrait: 'Venez fêter avec nous la fin de l\'année à la crèche ! Au programme : spectacle des enfants, goûter partagé et remise des souvenirs.',
    contenu: '<p>Venez fêter avec nous la fin de l\'année à la crèche ! Au programme : spectacle des enfants, goûter partagé et remise des souvenirs.</p><p>Rendez-vous le vendredi 27 juin à partir de 16h30. Les parents sont invités à apporter un plat sucré à partager.</p>',
    publie: true,
    date_publication: new Date('2026-05-15')
  },
  {
    titre: 'Fermeture exceptionnelle — 2 juin',
    extrait: 'La crèche sera fermée le lundi 2 juin pour une journée pédagogique de l\'équipe.',
    contenu: '<p>La crèche sera fermée le lundi 2 juin pour une journée pédagogique de l\'équipe.</p><p>Cette journée nous permettra de travailler sur notre projet pédagogique pour l\'année 2026-2027. Merci de votre compréhension.</p>',
    publie: true,
    date_publication: new Date('2026-05-10')
  },
  {
    titre: 'Nouveau menu de printemps',
    extrait: 'Notre cuisinière a concocté un tout nouveau menu de saison pour juin avec des légumes frais du marché local.',
    contenu: '<p>Notre cuisinière a concocté un tout nouveau menu de saison pour le mois de juin avec des légumes frais du marché local.</p><p>Au programme : tomates cerises du jardin, fraises du Périgord et bien d\'autres gourmandises printanières !</p>',
    publie: true,
    date_publication: new Date('2026-05-05')
  }
];

// Lundi de la semaine courante
const lundi = new Date();
lundi.setDate(lundi.getDate() - lundi.getDay() + (lundi.getDay() === 0 ? -6 : 1));

const MENU = {
  semaine_debut: lundi.toISOString().split('T')[0],
  lundi_midi:    'Poulet rôti, haricots verts, purée de pommes de terre',
  lundi_gouter:  'Compote de pommes',
  mardi_midi:    'Gratin de courgettes, riz complet',
  mardi_gouter:  'Yaourt nature, biscuit',
  mercredi_midi: 'Filet de poisson, carottes vichy, semoule',
  mercredi_gouter: 'Banane',
  jeudi_midi:    'Boulettes de bœuf, pâtes, sauce tomate',
  jeudi_gouter:  'Pain de mie, fromage frais',
  vendredi_midi: 'Quiche lorraine, salade verte, pomme de terre vapeur',
  vendredi_gouter: 'Gateau maison',
  publie: true
};

const CMS_PAGES = [
  { slug: 'presentation',         titre: 'Présentation de la crèche',   contenu: '<p>La crèche Les Coccinelles est une structure d\'accueil associative implantée à Puilboreau (17). Nous accueillons les enfants de 0 à 3 ans dans un cadre bienveillant et sécurisant.</p>', meta_description: 'Découvrez la crèche associative Les Coccinelles à Puilboreau.', publie: true },
  { slug: 'equipe',               titre: 'Notre équipe',                 contenu: '<p>Notre équipe de professionnels diplômés (EJE, auxiliaires de puériculture, CAP Petite Enfance) accueille vos enfants avec bienveillance et professionnalisme.</p>', meta_description: 'Rencontrez l\'équipe de la crèche Les Coccinelles.', publie: true },
  { slug: 'horaires',             titre: 'Horaires d\'accueil',           contenu: '<p>La crèche est ouverte du lundi au vendredi de 8h30 à 18h00. Elle est fermée les week-ends et jours fériés.</p>', meta_description: 'Horaires d\'ouverture de la crèche Les Coccinelles.', publie: true },
  { slug: 'tarifs',               titre: 'Tarifs et financement',         contenu: '<p>Le tarif est calculé par la CAF selon le quotient familial. La participation familiale varie de 0,06€ à 0,60€ par heure selon les revenus.</p>', meta_description: 'Tarifs et financement de la crèche Les Coccinelles.', publie: true },
  { slug: 'projet-pedagogique',   titre: 'Projet pédagogique',           contenu: '<p>Notre projet pédagogique est centré sur trois axes : l\'éveil sensoriel, le lien avec la nature et le respect du rythme de chaque enfant.</p>', meta_description: 'Le projet pédagogique de la crèche Les Coccinelles.', publie: true },
  { slug: 'conditions-inscription', titre: 'Conditions d\'inscription',  contenu: '<p>Pour inscrire votre enfant, constituez un dossier comprenant : carnet de santé, certificat médical, jugement de garde si nécessaire, et justificatifs de revenus.</p>', meta_description: 'Conditions d\'inscription à la crèche Les Coccinelles.', publie: true },
  { slug: 'mentions-legales',     titre: 'Mentions légales & RGPD',      contenu: '<h2>Éditeur du site</h2><p>Association Les Coccinelles — Puilboreau (17138).</p><h2>Données personnelles (RGPD)</h2><p>Les données collectées sont utilisées uniquement dans le cadre de la gestion de la crèche.</p>', meta_description: 'Mentions légales et politique de confidentialité RGPD.', publie: true }
];

// ── SCRIPT PRINCIPAL ──────────────────────────────────────────────────

async function seeder() {
  console.log('\n🌱 Démarrage du seed Les Coccinelles...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion BDD OK\n');

    // ── 1. UTILISATEURS ──────────────────────────────────────────
    console.log('👤 Création des utilisateurs...');
    const usersCreés = [];

    for (const compte of COMPTES) {
      const existant = await User.findOne({ where: { email: compte.email } });
      if (existant) {
        console.log(`   ⏭️  ${compte.email} existe déjà`);
        usersCreés.push(existant);
        continue;
      }
      const passwordHash = await bcrypt.hash(compte.password, 12);
      const user = await User.create({ ...compte, password: passwordHash });
      usersCreés.push(user);
      console.log(`   ✅ ${compte.role} : ${compte.email} / ${compte.password}`);
    }

    const [superAdmin, adminUser, parent1, parent2] = usersCreés;

    // ── 2. ENFANTS ───────────────────────────────────────────────
    console.log('\n👶 Création des enfants...');
    const enfantsData = [
      { user_id: parent1.id, prenom: 'Lucas',  nom: 'Martin',  date_naissance: '2024-11-15', sexe: 'M', groupe: 'bébés',  allergies: null,        medecin_nom: 'Dr. Leblanc', medecin_tel: '05 46 00 00 01' },
      { user_id: parent1.id, prenom: 'Emma',   nom: 'Martin',  date_naissance: '2023-03-20', sexe: 'F', groupe: 'moyens', allergies: 'Arachides', medecin_nom: 'Dr. Leblanc', medecin_tel: '05 46 00 00 01' },
      { user_id: parent2.id, prenom: 'Noah',   nom: 'Bernard', date_naissance: '2024-01-08', sexe: 'M', groupe: 'bébés',  allergies: null,        medecin_nom: 'Dr. Moreau',  medecin_tel: '05 46 00 00 02' }
    ];

    const enfantsCreés = [];
    for (const e of enfantsData) {
      const existant = await Enfant.findOne({ where: { prenom: e.prenom, nom: e.nom, user_id: e.user_id } });
      if (existant) {
        console.log(`   ⏭️  ${e.prenom} ${e.nom} existe déjà`);
        enfantsCreés.push(existant);
        continue;
      }
      const enfant = await Enfant.create(e);
      enfantsCreés.push(enfant);
      console.log(`   ✅ ${e.prenom} ${e.nom}`);
    }

    // ── 3. CONSENTEMENTS RGPD ────────────────────────────────────
    console.log('\n🔒 Consentements RGPD...');
    for (const enfant of enfantsCreés) {
      const existant = await Consentement.findOne({ where: { enfant_id: enfant.id } });
      if (!existant) {
        await Consentement.create({ enfant_id: enfant.id, user_id: enfant.user_id, consenti: true, date_consentement: new Date(), ip_adresse: '127.0.0.1' });
        console.log(`   ✅ Consentement ${enfant.prenom}`);
      }
    }

    // ── 4. INSCRIPTION TEST ──────────────────────────────────────
    console.log('\n📝 Dossier d\'inscription...');
    const premierEnfant = enfantsCreés[0];
    if (premierEnfant) {
      const existant = await Inscription.findOne({ where: { enfant_id: premierEnfant.id } });
      if (!existant) {
        await Inscription.create({
          enfant_id: premierEnfant.id, user_id: parent1.id, statut: 'accepte',
          date_debut_souhaitee: '2025-09-01', jours_souhaites: 'lundi,mardi,mercredi,jeudi,vendredi',
          temps_accueil: 'temps_plein', commentaire_parent: 'Accueil temps plein souhaité.',
          commentaire_admin: 'Dossier complet.', traite_par: adminUser.id, date_traitement: new Date()
        });
        console.log('   ✅ Inscription Lucas Martin (accepte)');
      }
    }

    // ── 5. ACTUALITÉS ────────────────────────────────────────────
    console.log('\n📰 Actualités...');
    for (const actu of ACTUALITES) {
      const existant = await Actualite.findOne({ where: { titre: actu.titre } });
      if (!existant) {
        await Actualite.create({ ...actu, auteur_id: adminUser.id });
        console.log(`   ✅ ${actu.titre}`);
      } else {
        console.log(`   ⏭️  "${actu.titre}" existe déjà`);
      }
    }

    // ── 6. MENU ──────────────────────────────────────────────────
    console.log('\n🍽️  Menu semaine...');
    const menuExistant = await Menu.findOne({ where: { semaine_debut: MENU.semaine_debut } });
    if (!menuExistant) {
      await Menu.create({ ...MENU, redige_par: adminUser.id });
      console.log(`   ✅ Menu du ${MENU.semaine_debut}`);
    } else {
      console.log(`   ⏭️  Menu du ${MENU.semaine_debut} existe déjà`);
    }

    // ── 7. PAGES CMS ─────────────────────────────────────────────
    console.log('\n🌐 Pages CMS...');
    for (const page of CMS_PAGES) {
      const existant = await CmsPage.findOne({ where: { slug: page.slug } });
      if (!existant) {
        await CmsPage.create({ ...page, modifie_par: superAdmin.id });
        console.log(`   ✅ /${page.slug}`);
      } else {
        console.log(`   ⏭️  /${page.slug} existe déjà`);
      }
    }

    // ── RÉSUMÉ ───────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('🎉 Seed terminé avec succès !\n');
    console.log('Comptes de test :');
    console.log('  🔑 Super Admin : super@lescoccinelles.fr   / Admin1234!');
    console.log('  🔑 Admin       : admin@lescoccinelles.fr   / Admin1234!');
    console.log('  🔑 Parent 1    : parent1@test.fr           / Parent1234!');
    console.log('  🔑 Parent 2    : parent2@test.fr           / Parent1234!');
    console.log('\nSite   → http://localhost:3000');
    console.log('API    → http://localhost:3001');
    console.log('═'.repeat(55) + '\n');

  } catch (err) {
    console.error('\n❌ Erreur seed :', err.message);
    if (err.original) console.error('SQL :', err.original.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seeder();
