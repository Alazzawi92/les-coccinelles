-- ============================================================
-- SCHÉMA BASE DE DONNÉES — LES COCCINELLES
-- Plateforme web pour crèche | 15 tables
-- ============================================================

CREATE DATABASE IF NOT EXISTS coccinelles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coccinelles_db;

-- ── TABLE 1 : users ─────────────────────────────────────────
-- Contient tous les utilisateurs : parents, admins, super admins
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,            -- Email de connexion (unique)
  password       VARCHAR(255) NOT NULL,                   -- Mot de passe hashé (bcrypt)
  role           ENUM('parent','admin','super_admin') DEFAULT 'parent', -- Rôle utilisateur
  prenom         VARCHAR(100) NOT NULL,                   -- Prénom
  nom            VARCHAR(100) NOT NULL,                   -- Nom de famille
  telephone      VARCHAR(20),                             -- Numéro de téléphone
  adresse        TEXT,                                    -- Adresse postale complète
  avatar         VARCHAR(255),                            -- Chemin vers la photo de profil
  actif          BOOLEAN DEFAULT TRUE,                    -- Compte actif ou désactivé
  email_verifie  BOOLEAN DEFAULT FALSE,                   -- Email confirmé ou non
  token_reset    VARCHAR(255),                            -- Token de réinitialisation mot de passe
  token_expire   DATETIME,                                -- Expiration du token reset
  refresh_token  VARCHAR(500),                            -- JWT refresh token stocké
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
);

-- ── TABLE 2 : enfants ────────────────────────────────────────
-- Enfants inscrits ou en liste d'attente à la crèche
CREATE TABLE IF NOT EXISTS enfants (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,                            -- Parent lié (clé étrangère)
  prenom         VARCHAR(100) NOT NULL,                   -- Prénom de l'enfant
  nom            VARCHAR(100) NOT NULL,                   -- Nom de l'enfant
  date_naissance DATE NOT NULL,                           -- Date de naissance
  sexe           ENUM('M','F') NOT NULL,                  -- Masculin ou Féminin
  groupe         VARCHAR(50),                             -- Groupe à la crèche (bébés, moyens...)
  allergies      TEXT,                                    -- Allergies connues (données santé)
  medicaments    TEXT,                                    -- Traitements médicaux en cours
  medecin_nom    VARCHAR(200),                            -- Nom du médecin traitant
  medecin_tel    VARCHAR(20),                             -- Téléphone du médecin
  photo          VARCHAR(255),                            -- Photo de l'enfant (chemin)
  actif          BOOLEAN DEFAULT TRUE,                    -- Enfant actuellement inscrit
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_enfants_user (user_id)
);

-- ── TABLE 3 : inscriptions ───────────────────────────────────
-- Dossiers d'inscription des enfants à la crèche
CREATE TABLE IF NOT EXISTS inscriptions (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id             INT NOT NULL,                     -- Enfant concerné par l'inscription
  user_id               INT NOT NULL,                     -- Parent demandeur
  statut                ENUM(
                          'en_attente',                   -- Dossier soumis, non traité
                          'en_cours',                     -- Dossier en cours de traitement
                          'incomplet',                    -- Documents manquants
                          'accepte',                      -- Inscription acceptée
                          'refuse',                       -- Inscription refusée
                          'liste_attente'                 -- En liste d'attente
                        ) DEFAULT 'en_attente',
  date_debut_souhaitee  DATE,                             -- Date souhaitée de début
  jours_souhaites       VARCHAR(100),                     -- Jours souhaités (lundi, mardi...)
  temps_accueil         ENUM('temps_plein','temps_partiel','occasionnel'),
  commentaire_parent    TEXT,                             -- Message du parent
  preinscription        JSON,                             -- Fiche pré-inscription complète (parents, contacts, employeurs)
  commentaire_admin     TEXT,                             -- Note interne de l'admin
  traite_par            INT,                              -- Admin ayant traité le dossier
  date_traitement       DATETIME,                         -- Date de traitement
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id)  REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (traite_par) REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_inscriptions_statut (statut),
  INDEX idx_inscriptions_user   (user_id)
);

-- ── TABLE 4 : absences ───────────────────────────────────────
-- Déclarations d'absences des enfants
CREATE TABLE IF NOT EXISTS absences (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id        INT NOT NULL,                          -- Enfant absent
  user_id          INT NOT NULL,                          -- Parent déclarant
  date_debut       DATE NOT NULL,                         -- Premier jour d'absence
  date_fin         DATE NOT NULL,                         -- Dernier jour d'absence
  motif            ENUM('maladie','vacances','rendez_vous','autre') NOT NULL,
  description      TEXT,                                  -- Détail optionnel du motif
  justificatif     VARCHAR(255),                          -- Chemin vers le justificatif joint
  statut           ENUM('en_attente','validee','refusee') DEFAULT 'en_attente',
  valide_par       INT,                                   -- Admin ayant validé l'absence
  date_validation  DATETIME,                              -- Date de validation
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id)  REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_absences_enfant (enfant_id),
  INDEX idx_absences_statut (statut)
);

-- ── TABLE 5 : suivi_quotidien ────────────────────────────────
-- Suivi journalier des enfants (repas, sieste, activités)
CREATE TABLE IF NOT EXISTS suivi_quotidien (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id      INT NOT NULL,                            -- Enfant concerné
  date_suivi     DATE NOT NULL,                           -- Date du suivi
  repas_matin    ENUM('tout','peu','rien','absent') DEFAULT 'absent', -- Petit déjeuner
  repas_midi     ENUM('tout','peu','rien','absent') DEFAULT 'absent', -- Déjeuner
  repas_gouter   ENUM('tout','peu','rien','absent') DEFAULT 'absent', -- Goûter
  repas_note     TEXT,                                    -- Remarque sur les repas
  sieste_debut   TIME,                                    -- Heure de début de sieste (legacy)
  sieste_fin     TIME,                                    -- Heure de fin de sieste (legacy)
  sieste_note    TEXT,                                    -- Remarque sur la sieste
  siestes        JSON,                                    -- Tableau de siestes [{debut, fin}] (multiple)
  activites      TEXT,                                    -- Description des activités du jour
  humeur         ENUM('joyeux','calme','fatigue','pleureur','autre'), -- Humeur générale
  biberon_nb     TINYINT UNSIGNED DEFAULT 0,              -- Nombre de biberons donnés
  biberon_ml     SMALLINT UNSIGNED,                       -- Quantité en ml par biberon (optionnel)
  selles         BOOLEAN DEFAULT FALSE,                   -- A eu des selles oui/non (hygiène)
  selles_nb      TINYINT UNSIGNED DEFAULT 0,              -- Nombre de selles dans la journée
  temperature    DECIMAL(4,1),                            -- Température si fièvre (ex: 38.5)
  note_generale  TEXT,                                    -- Message général pour les parents
  redige_par     INT NOT NULL,                            -- Puéricultrice / admin auteur
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id)  REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (redige_par) REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY unique_suivi (enfant_id, date_suivi),        -- 1 suivi par enfant par jour
  INDEX idx_suivi_date (date_suivi)
);

-- ── TABLE 6 : emargements ───────────────────────────────────
-- Pointages journaliers des enfants (heure d'arrivée et de départ)
CREATE TABLE IF NOT EXISTS emargements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id       INT NOT NULL,                            -- Enfant concerné
  date_presence   DATE NOT NULL,                           -- Date de présence
  heure_arrivee   TIME,                                    -- Heure d'arrivée à la crèche
  heure_depart    TIME,                                    -- Heure de départ de la crèche
  signe_par       INT NOT NULL,                            -- Admin / puéricultrice qui a pointé
  note            TEXT,                                    -- Remarque optionnelle
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (signe_par) REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY unique_emargement (enfant_id, date_presence), -- 1 pointage par enfant par jour
  INDEX idx_emargements_date (date_presence)
);

-- ── TABLE 7 : documents ─────────────────────────────────────
-- Documents uploadés par les parents ou l'admin
CREATE TABLE IF NOT EXISTS documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,                           -- Utilisateur qui a uploadé
  enfant_id       INT,                                    -- Lié à un enfant (optionnel)
  inscription_id  INT,                                    -- Lié à une inscription (optionnel)
  nom_fichier     VARCHAR(255) NOT NULL,                  -- Nom original du fichier
  chemin_fichier  VARCHAR(500) NOT NULL,                  -- Chemin de stockage sécurisé
  type_mime       VARCHAR(100) NOT NULL,                  -- Type MIME (application/pdf...)
  taille          INT NOT NULL,                           -- Taille du fichier en octets
  categorie       ENUM(
                    'identite',                           -- Carte d'identité
                    'medical',                            -- Carnet de santé, vaccins
                    'caf',                                -- Attestation CAF
                    'autre'                               -- Autre document
                  ) DEFAULT 'autre',
  description     VARCHAR(255),                           -- Description optionnelle
  visible_parent  BOOLEAN DEFAULT TRUE,                   -- Visible par le parent
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (enfant_id)      REFERENCES enfants(id)      ON DELETE SET NULL,
  FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE SET NULL,
  INDEX idx_documents_user   (user_id),
  INDEX idx_documents_enfant (enfant_id)
);

-- ── TABLE 8 : inscription_documents ────────────────────────
-- Pièces justificatives uploadées pour un dossier d'inscription
CREATE TABLE IF NOT EXISTS inscription_documents (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  inscription_id INT NOT NULL,                             -- Dossier d'inscription concerné
  label          VARCHAR(255),                             -- Libellé de la pièce (ex: Carnet de santé)
  fichier_path   VARCHAR(500),                             -- Chemin relatif /uploads/justificatifs/xxx.pdf
  fichier_nom    VARCHAR(255),                             -- Nom original du fichier
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
  INDEX idx_insc_doc_inscription (inscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TABLE 9 : messages ──────────────────────────────────────
-- Messagerie interne entre parents et équipe crèche
CREATE TABLE IF NOT EXISTS messages (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  expediteur_id    INT NOT NULL,                          -- Qui envoie le message
  destinataire_id  INT NOT NULL,                          -- Qui reçoit le message
  sujet            VARCHAR(255) NOT NULL,                 -- Sujet du message
  contenu          TEXT NOT NULL,                         -- Corps du message
  lu               BOOLEAN DEFAULT FALSE,                 -- Message lu par le destinataire
  date_lecture     DATETIME,                              -- Date et heure de lecture
  parent_id        INT,                                   -- ID du message parent (fil de discussion)
  piece_jointe     VARCHAR(500),                          -- Chemin vers la pièce jointe (optionnel)
  piece_jointe_nom VARCHAR(255),                          -- Nom original de la pièce jointe
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expediteur_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id)       REFERENCES messages(id) ON DELETE SET NULL,
  INDEX idx_messages_destinataire (destinataire_id),
  INDEX idx_messages_expediteur   (expediteur_id)
);

-- ── TABLE 8 : actualites ────────────────────────────────────
-- Actualités publiées sur le site public
CREATE TABLE IF NOT EXISTS actualites (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titre             VARCHAR(255) NOT NULL,                -- Titre de l'actualité
  contenu           TEXT NOT NULL,                        -- Contenu complet
  extrait           TEXT,                                 -- Résumé court pour la liste
  image             VARCHAR(255),                         -- Chemin vers l'image principale
  publie            BOOLEAN DEFAULT FALSE,                -- Visible sur le site public
  date_publication  DATETIME,                             -- Date de publication souhaitée
  auteur_id         INT NOT NULL,                         -- Admin auteur
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_actualites_publie (publie)
);

-- ── TABLE 9 : menus ─────────────────────────────────────────
-- Menus de la semaine publiés sur le site
CREATE TABLE IF NOT EXISTS menus (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  semaine_debut    DATE NOT NULL,                         -- Lundi de la semaine concernée
  lundi_midi       TEXT,                                  -- Menu du lundi midi
  lundi_gouter     TEXT,                                  -- Goûter du lundi
  mardi_midi       TEXT,
  mardi_gouter     TEXT,
  mercredi_midi    TEXT,
  mercredi_gouter  TEXT,
  jeudi_midi       TEXT,
  jeudi_gouter     TEXT,
  vendredi_midi    TEXT,
  vendredi_gouter  TEXT,
  publie           BOOLEAN DEFAULT FALSE,                 -- Visible sur le site
  redige_par       INT NOT NULL,                          -- Admin auteur
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (redige_par) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_semaine (semaine_debut),              -- 1 menu par semaine
  INDEX idx_menus_publie (publie)
);

-- ── TABLE 10 : notifications ────────────────────────────────
-- Notifications système envoyées aux utilisateurs
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,                               -- Destinataire de la notification
  titre       VARCHAR(255) NOT NULL,                      -- Titre court
  message     TEXT NOT NULL,                              -- Contenu complet
  type        ENUM(
                'info',                                   -- Information générale
                'inscription',                            -- Changement statut inscription
                'message',                                -- Nouveau message reçu
                'absence',                                -- Absence validée ou refusée
                'document',                               -- Nouveau document disponible
                'alerte'                                  -- Alerte importante
              ) DEFAULT 'info',
  lue         BOOLEAN DEFAULT FALSE,                      -- Notification lue ou non
  lien        VARCHAR(255),                               -- Lien vers la page concernée
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_lue  (lue)
);

-- ── TABLE 11 : galerie_albums ───────────────────────────────
-- Albums photos de la crèche
CREATE TABLE IF NOT EXISTS galerie_albums (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  titre            VARCHAR(255) NOT NULL,                 -- Titre de l'album
  description      TEXT,                                  -- Description de l'album
  couverture       VARCHAR(255),                          -- Photo de couverture (chemin)
  visible_parents  BOOLEAN DEFAULT TRUE,                  -- Visible dans l'espace parents
  visible_public   BOOLEAN DEFAULT FALSE,                 -- Visible sur le site public
  cree_par         INT NOT NULL,                          -- Admin créateur
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cree_par) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE 12 : galerie_photos ───────────────────────────────
-- Photos dans les albums
CREATE TABLE IF NOT EXISTS galerie_photos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  album_id          INT NOT NULL,                         -- Album d'appartenance
  chemin_original   VARCHAR(500) NOT NULL,                -- Photo originale (haute résolution)
  chemin_web        VARCHAR(500) NOT NULL,                -- Version optimisée pour le web
  chemin_miniature  VARCHAR(500) NOT NULL,                -- Miniature (thumbnail)
  legende           TEXT,                                 -- Légende optionnelle
  cree_par          INT NOT NULL,                         -- Admin qui a uploadé la photo
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES galerie_albums(id) ON DELETE CASCADE,
  FOREIGN KEY (cree_par) REFERENCES users(id)          ON DELETE CASCADE,
  INDEX idx_photos_album (album_id)
);

-- ── TABLE 13 : photo_enfants (table pivot) ──────────────────
-- Associe les enfants aux photos (qui est sur quelle photo)
CREATE TABLE IF NOT EXISTS photo_enfants (
  photo_id   INT NOT NULL,                                -- Référence à la photo
  enfant_id  INT NOT NULL,                                -- Référence à l'enfant
  PRIMARY KEY (photo_id, enfant_id),                      -- Clé composite unique
  FOREIGN KEY (photo_id)  REFERENCES galerie_photos(id) ON DELETE CASCADE,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id)        ON DELETE CASCADE
);

-- ── TABLE 14 : consentements_photo ──────────────────────────
-- Consentements RGPD pour la publication des photos des enfants
CREATE TABLE IF NOT EXISTS consentements_photo (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  enfant_id           INT NOT NULL UNIQUE,                -- 1 consentement par enfant
  user_id             INT NOT NULL,                       -- Parent qui a donné le consentement
  consenti            BOOLEAN DEFAULT FALSE,              -- Oui ou Non
  date_consentement   DATETIME,                           -- Date du consentement
  ip_adresse          VARCHAR(45),                        -- Adresse IP pour traçabilité RGPD
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enfant_id) REFERENCES enfants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
);

-- ── TABLE 15 : cms_pages ────────────────────────────────────
-- Pages dynamiques gérées par l'admin (CMS simple)
CREATE TABLE IF NOT EXISTS cms_pages (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  slug             VARCHAR(100) NOT NULL UNIQUE,          -- Identifiant URL (ex: 'accueil')
  titre            VARCHAR(255) NOT NULL,                 -- Titre de la page
  contenu          LONGTEXT,                              -- Contenu JSON ou HTML
  meta_description VARCHAR(255),                          -- Description SEO
  publie           BOOLEAN DEFAULT TRUE,                  -- Page active ou non
  modifie_par      INT,                                   -- Dernier admin à avoir modifié
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (modifie_par) REFERENCES users(id) ON DELETE SET NULL
);

-- ── TABLE 15 : equipe_membres ────────────────────────────────
-- Membres de l'équipe affichés sur le site public
CREATE TABLE IF NOT EXISTS equipe_membres (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  prenom      VARCHAR(100) NOT NULL,
  nom         VARCHAR(100) NOT NULL,
  titre       VARCHAR(200) NOT NULL,                    -- Fonction (ex: Directrice, Éducatrice)
  photo       VARCHAR(500),                             -- JSON {web, miniature} des chemins d'image
  ordre       INT DEFAULT 0,                             -- Ordre d'affichage
  actif       BOOLEAN DEFAULT TRUE,                      -- Visible sur le site public
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equipe_actif (actif)
);

-- ── DONNÉES INITIALES ────────────────────────────────────────
-- Pages CMS de base (contenu modifiable via l'admin)
INSERT INTO cms_pages (slug, titre, meta_description) VALUES
('accueil',           'Accueil',                      'Bienvenue à la crèche Les Coccinelles de Puilboreau'),
('presentation',      'Présentation de la crèche',    'Découvrez notre crèche Les Coccinelles à Puilboreau'),
('equipe',            'Notre équipe',                 'L''équipe éducative de la crèche Les Coccinelles'),
('projet-pedagogique','Projet pédagogique',            'Notre projet pédagogique axé sur l''éveil et la nature'),
('horaires',          'Horaires d''accueil',           'Horaires d''ouverture de la crèche Les Coccinelles'),
('tarifs',            'Tarifs',                       'Grille tarifaire calculée selon le quotient familial'),
('conditions-inscription', 'Conditions d''inscription', 'Comment inscrire votre enfant à la crèche');
