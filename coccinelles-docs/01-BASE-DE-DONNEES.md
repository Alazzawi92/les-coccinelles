# 🗄️ 01 — BASE DE DONNÉES
# Fichier : 01-BASE-DE-DONNEES.md
# Description : Schéma complet de la base de données MySQL
# 15 tables avec relations, index et exemples

---

## 📋 LISTE DES TABLES

| # | Table | Description |
|---|-------|-------------|
| 1 | `users` | Tous les utilisateurs (parents, admin) |
| 2 | `enfants` | Enfants inscrits à la crèche |
| 3 | `inscriptions` | Dossiers d'inscription |
| 4 | `absences` | Déclarations d'absences |
| 5 | `suivi_quotidien` | Repas, sieste, activités du jour |
| 6 | `documents` | Documents uploadés |
| 7 | `messages` | Messagerie crèche ↔ parents |
| 8 | `actualites` | Actualités publiées sur le site |
| 9 | `menus` | Menus de la semaine |
| 10 | `notifications` | Notifications système |
| 11 | `galerie_albums` | Albums photos |
| 12 | `galerie_photos` | Photos dans les albums |
| 13 | `photo_enfants` | Table pivot photo ↔ enfant |
| 14 | `consentements_photo` | Consentements RGPD photos |
| 15 | `cms_pages` | Pages du CMS (contenu dynamique) |

---

## 🏗️ SCHÉMA SQL COMPLET

### Table 1 — users
```sql
-- Table principale des utilisateurs
-- Contient parents, admins et super admins
CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,  -- Identifiant unique
  email        VARCHAR(255) NOT NULL UNIQUE,     -- Email de connexion
  password     VARCHAR(255) NOT NULL,            -- Mot de passe hashé (bcrypt)
  role         ENUM('parent','admin','super_admin') DEFAULT 'parent', -- Rôle
  prenom       VARCHAR(100) NOT NULL,            -- Prénom
  nom          VARCHAR(100) NOT NULL,            -- Nom de famille
  telephone    VARCHAR(20),                      -- Téléphone
  adresse      TEXT,                             -- Adresse postale
  avatar       VARCHAR(255),                     -- Photo de profil (chemin)
  actif        BOOLEAN DEFAULT TRUE,             -- Compte actif ou désactivé
  email_verifie BOOLEAN DEFAULT FALSE,           -- Email confirmé
  token_reset  VARCHAR(255),                     -- Token réinitialisation mot de passe
  token_expire DATETIME,                         -- Expiration du token reset
  refresh_token VARCHAR(500),                    -- JWT refresh token
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Table 2 — enfants
```sql
-- Table des enfants inscrits ou en liste d'attente
CREATE TABLE enfants (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,                     -- Parent lié (clé étrangère)
  prenom       VARCHAR(100) NOT NULL,            -- Prénom de l'enfant
  nom          VARCHAR(100) NOT NULL,            -- Nom de l'enfant
  date_naissance DATE NOT NULL,                  -- Date de naissance
  sexe         ENUM('M','F') NOT NULL,           -- Masculin ou Féminin
  groupe       VARCHAR(50),                      -- Groupe à la crèche
  allergies    TEXT,                             -- Allergies connues
  medicaments  TEXT,                             -- Traitements en cours
  medecin_nom  VARCHAR(200),                     -- Nom du médecin traitant
  medecin_tel  VARCHAR(20),                      -- Téléphone médecin
  photo        VARCHAR(255),                     -- Photo de l'enfant
  actif        BOOLEAN DEFAULT TRUE,             -- Enfant actuellement inscrit
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 3 — inscriptions
```sql
-- Dossiers d'inscription des enfants
CREATE TABLE inscriptions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id       INT NOT NULL,                  -- Enfant concerné
  user_id         INT NOT NULL,                  -- Parent demandeur
  statut          ENUM(
                    'en_attente',                -- Dossier soumis, pas traité
                    'en_cours',                  -- Dossier en cours de traitement
                    'incomplet',                 -- Documents manquants
                    'accepte',                   -- Inscription acceptée
                    'refuse',                    -- Inscription refusée
                    'liste_attente'              -- En liste d'attente
                  ) DEFAULT 'en_attente',
  date_debut_souhaitee DATE,                     -- Quand l'enfant doit commencer
  jours_souhaites  VARCHAR(100),                 -- Lundi, mardi, etc.
  temps_accueil    ENUM('temps_plein','temps_partiel','occasionnel'),
  commentaire_parent TEXT,                       -- Message du parent
  commentaire_admin  TEXT,                       -- Note interne admin
  traite_par       INT,                          -- Admin qui a traité le dossier
  date_traitement  DATETIME,                     -- Date de traitement
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (traite_par) REFERENCES users(id)  ON DELETE SET NULL
);
```

### Table 4 — absences
```sql
-- Déclarations d'absences des enfants
CREATE TABLE absences (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id       INT NOT NULL,                  -- Enfant absent
  user_id         INT NOT NULL,                  -- Parent déclarant
  date_debut      DATE NOT NULL,                 -- Premier jour d'absence
  date_fin        DATE NOT NULL,                 -- Dernier jour d'absence
  motif           ENUM('maladie','vacances','rendez_vous','autre') NOT NULL,
  description     TEXT,                          -- Détail optionnel
  justificatif    VARCHAR(255),                  -- Fichier joint (chemin)
  statut          ENUM('en_attente','validee','refusee') DEFAULT 'en_attente',
  valide_par      INT,                           -- Admin qui a validé
  date_validation DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id)  REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id)   ON DELETE SET NULL
);
```

### Table 5 — suivi_quotidien
```sql
-- Suivi journalier des enfants (repas, sieste, activités)
CREATE TABLE suivi_quotidien (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id       INT NOT NULL,                  -- Enfant concerné
  date_suivi      DATE NOT NULL,                 -- Date du suivi
  -- Repas
  repas_matin     ENUM('tout','peu','rien','absent') DEFAULT 'absent',
  repas_midi      ENUM('tout','peu','rien','absent') DEFAULT 'absent',
  repas_gouter    ENUM('tout','peu','rien','absent') DEFAULT 'absent',
  repas_note      TEXT,                          -- Remarque sur les repas
  -- Sieste
  sieste_debut    TIME,                          -- Heure début sieste
  sieste_fin      TIME,                          -- Heure fin sieste
  sieste_note     TEXT,                          -- Remarque sur la sieste
  -- Activités
  activites       TEXT,                          -- Description des activités
  humeur          ENUM('joyeux','calme','fatigue','pleureur','autre'),
  selles          BOOLEAN DEFAULT FALSE,         -- A eu des selles
  temperature     DECIMAL(4,1),                  -- Température si fièvre
  note_generale   TEXT,                          -- Message général pour les parents
  redige_par      INT NOT NULL,                  -- Admin/puéricultrice
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id)  REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (redige_par) REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY unique_suivi (enfant_id, date_suivi) -- 1 suivi par enfant par jour
);
```

### Table 6 — documents
```sql
-- Documents uploadés par parents ou admin
CREATE TABLE documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,                  -- Qui a uploadé
  enfant_id       INT,                           -- Lié à un enfant (optionnel)
  inscription_id  INT,                           -- Lié à une inscription (optionnel)
  nom_fichier     VARCHAR(255) NOT NULL,         -- Nom original du fichier
  chemin_fichier  VARCHAR(500) NOT NULL,         -- Chemin de stockage sécurisé
  type_mime       VARCHAR(100) NOT NULL,         -- Type du fichier (application/pdf...)
  taille          INT NOT NULL,                  -- Taille en octets
  categorie       ENUM(
                    'identite',                  -- Carte d'identité
                    'medical',                   -- Carnet de santé, vaccins
                    'caf',                       -- Attestation CAF
                    'autre'                      -- Autre document
                  ) DEFAULT 'autre',
  description     VARCHAR(255),                  -- Description optionnelle
  visible_parent  BOOLEAN DEFAULT TRUE,          -- Le parent peut le voir
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (enfant_id)      REFERENCES enfants(id)      ON DELETE SET NULL,
  FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE SET NULL
);
```

### Table 7 — messages
```sql
-- Messagerie entre parents et crèche
CREATE TABLE messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  expediteur_id   INT NOT NULL,                  -- Qui envoie le message
  destinataire_id INT NOT NULL,                  -- Qui reçoit le message
  sujet           VARCHAR(255) NOT NULL,         -- Sujet du message
  contenu         TEXT NOT NULL,                 -- Corps du message
  lu              BOOLEAN DEFAULT FALSE,         -- Message lu par le destinataire
  date_lecture    DATETIME,                      -- Quand il a été lu
  parent_id       INT,                           -- ID message parent (fil de discussion)
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expediteur_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)       REFERENCES messages(id) ON DELETE SET NULL
);
```

### Table 8 — actualites
```sql
-- Actualités publiées sur le site public
CREATE TABLE actualites (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  titre           VARCHAR(255) NOT NULL,         -- Titre de l'actualité
  contenu         TEXT NOT NULL,                 -- Contenu complet
  extrait         TEXT,                          -- Résumé court (pour la liste)
  image           VARCHAR(255),                  -- Image principale
  publie          BOOLEAN DEFAULT FALSE,         -- Visible sur le site
  date_publication DATETIME,                     -- Date de publication
  auteur_id       INT NOT NULL,                  -- Admin qui a écrit
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 9 — menus
```sql
-- Menus de la semaine
CREATE TABLE menus (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  semaine_debut   DATE NOT NULL,                 -- Lundi de la semaine
  lundi_midi      TEXT,                          -- Menu lundi midi
  lundi_gouter    TEXT,                          -- Goûter lundi
  mardi_midi      TEXT,
  mardi_gouter    TEXT,
  mercredi_midi   TEXT,
  mercredi_gouter TEXT,
  jeudi_midi      TEXT,
  jeudi_gouter    TEXT,
  vendredi_midi   TEXT,
  vendredi_gouter TEXT,
  publie          BOOLEAN DEFAULT FALSE,         -- Visible sur le site
  redige_par      INT NOT NULL,                  -- Admin
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (redige_par) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 10 — notifications
```sql
-- Notifications envoyées aux utilisateurs
CREATE TABLE notifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,                  -- Destinataire
  titre           VARCHAR(255) NOT NULL,         -- Titre court
  message         TEXT NOT NULL,                 -- Message complet
  type            ENUM(
                    'info',                      -- Information générale
                    'inscription',               -- Changement statut inscription
                    'message',                   -- Nouveau message reçu
                    'absence',                   -- Absence validée/refusée
                    'document',                  -- Nouveau document disponible
                    'alerte'                     -- Alerte importante
                  ) DEFAULT 'info',
  lue             BOOLEAN DEFAULT FALSE,         -- Notification lue
  lien            VARCHAR(255),                  -- Lien vers la page concernée
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 11 — galerie_albums
```sql
-- Albums photos de la crèche
CREATE TABLE galerie_albums (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  titre           VARCHAR(255) NOT NULL,         -- Titre de l'album
  description     TEXT,                          -- Description
  couverture      VARCHAR(255),                  -- Photo de couverture
  visible_parents BOOLEAN DEFAULT TRUE,          -- Visible dans espace parents
  visible_public  BOOLEAN DEFAULT FALSE,         -- Visible sur site public
  cree_par        INT NOT NULL,                  -- Admin créateur
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cree_par) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 12 — galerie_photos
```sql
-- Photos dans les albums
CREATE TABLE galerie_photos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  album_id        INT NOT NULL,                  -- Album d'appartenance
  chemin_original VARCHAR(500) NOT NULL,         -- Photo originale
  chemin_web      VARCHAR(500) NOT NULL,         -- Version optimisée web
  chemin_miniature VARCHAR(500) NOT NULL,        -- Miniature (thumbnail)
  legende         TEXT,                          -- Légende de la photo
  cree_par        INT NOT NULL,                  -- Admin qui a uploadé
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES galerie_albums(id) ON DELETE CASCADE,
  FOREIGN KEY (cree_par) REFERENCES users(id)          ON DELETE CASCADE
);
```

### Table 13 — photo_enfants (pivot)
```sql
-- Table pivot : quels enfants sont sur quelle photo
CREATE TABLE photo_enfants (
  photo_id        INT NOT NULL,                  -- Clé étrangère photo
  enfant_id       INT NOT NULL,                  -- Clé étrangère enfant
  PRIMARY KEY (photo_id, enfant_id),             -- Clé composite (unique)
  FOREIGN KEY (photo_id)  REFERENCES galerie_photos(id) ON DELETE CASCADE,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id)        ON DELETE CASCADE
);
```

### Table 14 — consentements_photo
```sql
-- Consentements RGPD pour les photos des enfants
CREATE TABLE consentements_photo (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id       INT NOT NULL UNIQUE,           -- 1 consentement par enfant
  user_id         INT NOT NULL,                  -- Parent qui a donné le consentement
  consenti        BOOLEAN DEFAULT FALSE,         -- Oui ou Non
  date_consentement DATETIME,                    -- Quand le consentement a été donné
  ip_adresse      VARCHAR(45),                   -- IP pour traçabilité RGPD
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);
```

### Table 15 — cms_pages
```sql
-- Pages dynamiques gérées par l'admin (CMS simple)
CREATE TABLE cms_pages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(100) NOT NULL UNIQUE,  -- URL de la page (ex: 'accueil')
  titre           VARCHAR(255) NOT NULL,         -- Titre affiché
  contenu         LONGTEXT,                      -- Contenu JSON ou HTML
  meta_description VARCHAR(255),                -- SEO description
  publie          BOOLEAN DEFAULT TRUE,          -- Page active
  modifie_par     INT,                           -- Dernier admin à modifier
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (modifie_par) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🔗 DIAGRAMME DES RELATIONS

```
users ─────────────────────────────────────────────────┐
  │                                                     │
  ├─── enfants ──────────────────────────────────────┐  │
  │       │                                          │  │
  │       ├─── inscriptions ◄── users (traite_par)  │  │
  │       ├─── absences     ◄── users (valide_par)   │  │
  │       ├─── suivi_quotidien ◄── users (redige)   │  │
  │       ├─── photo_enfants ──► galerie_photos      │  │
  │       └─── consentements_photo                   │  │
  │                                                  │  │
  ├─── documents ◄─────────────────────────────────── │  │
  ├─── messages (expediteur + destinataire) ◄─────────┘  │
  ├─── notifications ◄────────────────────────────────────┘
  └─── actualites / menus / cms_pages (auteur_id)

galerie_albums ──► galerie_photos ──► photo_enfants
```

---

## 📝 REQUÊTES SQL UTILES

### Tous les enfants d'un parent
```sql
-- Récupérer tous les enfants d'un parent connecté
SELECT e.*, u.prenom AS parent_prenom
FROM enfants e
JOIN users u ON e.user_id = u.id
WHERE e.user_id = ? AND e.actif = TRUE;
```

### Dossiers en attente (pour l'admin)
```sql
-- Lister les inscriptions en attente de traitement
SELECT i.*, e.prenom AS enfant_prenom, u.nom AS parent_nom, u.email
FROM inscriptions i
JOIN enfants e ON i.enfant_id = e.id
JOIN users u   ON i.user_id   = u.id
WHERE i.statut = 'en_attente'
ORDER BY i.created_at ASC;
```

### Suivi quotidien d'un enfant (7 derniers jours)
```sql
-- Récupérer le suivi de la semaine pour un enfant
SELECT * FROM suivi_quotidien
WHERE enfant_id = ?
AND date_suivi >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY date_suivi DESC;
```

### Notifications non lues d'un utilisateur
```sql
-- Compter les notifs non lues
SELECT COUNT(*) AS non_lues
FROM notifications
WHERE user_id = ? AND lue = FALSE;
```

---

## ⚙️ CONFIGURATION SEQUELIZE

### config/database.js
```javascript
// Configuration de la connexion à la base de données
const { Sequelize } = require('sequelize');

// Création de l'instance Sequelize avec les variables d'environnement
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Nom de la base
  process.env.DB_USER,     // Utilisateur
  process.env.DB_PASSWORD, // Mot de passe
  {
    host:    process.env.DB_HOST, // Hôte (localhost ou container Docker)
    dialect: 'mysql',             // Type de base de données
    logging: false,               // Désactiver les logs SQL en prod
    pool: {
      max: 10,                    // Maximum 10 connexions simultanées
      min: 0,                     // Minimum 0 connexion
      acquire: 30000,             // Timeout d'acquisition (30s)
      idle: 10000                 // Fermer après 10s d'inactivité
    }
  }
);

module.exports = sequelize; // Exporter pour utiliser partout
```

---

## 📌 RÈGLES IMPORTANTES BDD

1. **Toujours** utiliser des clés étrangères avec `ON DELETE CASCADE` ou `ON DELETE SET NULL`
2. **Jamais** stocker les mots de passe en clair — toujours bcrypt
3. **Index** sur les colonnes souvent filtrées (user_id, enfant_id, statut)
4. **Timestamps** automatiques sur toutes les tables
5. **Soft delete** : utiliser `actif = FALSE` plutôt que supprimer physiquement
6. **RGPD** : les données personnelles doivent pouvoir être supprimées sur demande
