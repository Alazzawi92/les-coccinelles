# 🗄️ 01 — BASE DE DONNÉES (MySQL / MariaDB)
# Fichier : 01-BASE-DE-DONNEES.md
# Description : Modèle de données réel du projet — 23 tables, relations,
# migrations, configuration Sequelize
# Source de vérité : database/schema.sql (copié intégralement en fin de document)

---

## 📋 LES 23 TABLES

| # | Table | Rôle | Liée à |
|---|---|---|---|
| 1 | `users` | Tous les comptes : parents, admins, super admins (mot de passe bcrypt ou compte Google) | — |
| 2 | `enfants` | Enfants d'un parent : identité, groupe, santé (allergies, médicaments, médecin), jours de présence | users |
| 3 | `inscriptions` | Demande d'inscription d'un enfant et son statut (en attente → accepté / refusé / liste d'attente…) | enfants, users |
| 4 | `inscription_documents` | Pièces justificatives jointes à une demande d'inscription | inscriptions |
| 5 | `absences` | Absences déclarées par les parents (motif, justificatif, validation par l'équipe) | enfants, users |
| 6 | `suivi_quotidien` | Journal du jour d'un enfant : repas, siestes, biberons, selles, humeur, activités, température | enfants, users |
| 7 | `emargements` | Pointage arrivée / départ de chaque enfant (sert aux rapports de présence) | enfants, users |
| 8 | `documents` | Documents échangés avec les familles (catégorie, visibilité parent) | users, enfants, inscriptions |
| 9 | `messages` | Messagerie interne parent ↔ équipe, avec fil de réponses et pièce jointe | users, messages |
| 10 | `notifications` | Notifications dans l'application, traduisibles (code + paramètres) | users |
| 11 | `actualites` | Articles publiés sur le site public | users |
| 12 | `menus` | Menus (déjeuner + goûter du lundi au vendredi) — cycle de 4 semaines | users |
| 13 | `galerie_albums` | Albums photos (visibles parents et/ou public) | users |
| 14 | `galerie_photos` | Photos : 3 fichiers par photo (original, web, miniature) | galerie_albums, users |
| 15 | `photo_enfants` | Table pivot : quels enfants apparaissent sur quelle photo | galerie_photos, enfants |
| 16 | `consentements_photo` | Consentement RGPD photo par enfant (date + IP de preuve) | enfants, users |
| 17 | `cms_pages` | Contenu modifiable des pages du site (présentation, tarifs, mentions…) | users |
| 18 | `equipe_membres` | Membres de l'équipe affichés sur le site (photo, fonction, ordre) | — |
| 19 | `deux_facteurs` | Code de connexion à 6 chiffres (empreinte seulement), compteur d'erreurs, blocage | users |
| 20 | `parametres` | Interrupteurs du super admin (espace parents, création de comptes) | users |
| 21 | `documents_publics` | Documentation PDF téléchargeable par tous (page Présentation) | — |
| 22 | `fermetures` | Calendrier des fermetures de la crèche (page Présentation) | — |
| 23 | `partenaires` | Partenaires de la crèche : nom, catégorie, logo, lien (page Présentation) | — |

> Le plan initial prévoyait 15 tables. Se sont ajoutées en cours de projet :
> `inscription_documents`, `emargements`, `equipe_membres`, `deux_facteurs`, `parametres`,
> puis `documents_publics`, `fermetures`, `partenaires` (sections de la page Présentation).

---

## 🔗 RELATIONS PRINCIPALES

```
users (1) ────< (N) enfants (1) ────< (N) inscriptions ────< (N) inscription_documents
  │                   │                        │
  │                   ├────< absences          └────< documents
  │                   ├────< suivi_quotidien
  │                   ├────< emargements
  │                   ├────< consentements_photo
  │                   └────< photo_enfants >──── galerie_photos >──── galerie_albums
  │
  ├────< messages (expéditeur / destinataire ; réponse → messages.parent_id)
  ├────< notifications
  ├────< documents
  ├──── (1) deux_facteurs
  └──── auteur / rédacteur de : actualites, menus, galerie_albums, cms_pages, parametres
```

### Règles de suppression (clés étrangères)
| Cas | Règle | Pourquoi |
|---|---|---|
| Suppression d'un compte parent | `CASCADE` vers enfants, messages, notifications, deux_facteurs | Droit à l'effacement (RGPD) : aucune donnée orpheline |
| Suppression d'un enfant | `CASCADE` vers émargements, consentements | Idem |
| Suppression d'un album | `CASCADE` vers ses photos | Pas de photo sans album |
| Auteur d'une page CMS ou d'un réglage supprimé | `SET NULL` | Le contenu reste, seul l'auteur disparaît |
| Document lié à une inscription supprimée | `SET NULL` | Le document reste consultable |

---

## 🧠 CHOIX DE CONCEPTION À EXPLIQUER

1. **Une seule table `users` avec un champ `role`** (`parent`, `admin`, `super_admin`) :
   les trois profils partagent la connexion, seuls les droits changent.
2. **`deux_facteurs` est une table séparée** de `users` : aucune requête sur les
   utilisateurs ne peut exposer un code ou un compteur ; on ne stocke qu'une
   **empreinte HMAC** du code, jamais le code lui-même.
3. **`consentements_photo` garde la date et l'IP** du consentement : preuve en cas
   de contrôle (RGPD). Sans consentement, la photo est servie **floutée**.
4. **`galerie_photos` stocke 3 chemins** (original, web, miniature) générés par
   Sharp : la galerie charge les miniatures, le téléchargement l'original.
5. **`notifications.code` + `params`** : le texte est retrouvé dans la langue du
   lecteur (FR / EN) au lieu d'être figé en français.
6. **`menus` en cycle de 4 semaines** : 4 menus à saisir pour toute l'année ; la
   semaine affichée est calculée à partir de la date.
7. **`users.refresh_token`** : le jeton de rafraîchissement est stocké pour
   pouvoir **révoquer** une session (déconnexion, changement de mot de passe).
8. **`parametres` (clé / valeur)** : réglages modifiables sans redéployer
   (lancement en deux temps : site vitrine, puis inscriptions en mars 2027).

---

## 🔄 MIGRATIONS (database/migrations/)

`schema.sql` crée une base neuve. Pour une base **déjà en service** (locale ou
Alwaysdata), chaque évolution est livrée sous forme de migration à exécuter une
seule fois, dans l'ordre :

| Migration | Contenu |
|---|---|
| `001_connexion_google.sql` | `users.google_id`, mot de passe facultatif (comptes Google) |
| `002_biberons_detail.sql` | Détail des biberons dans le suivi quotidien |
| `003_selles_detail.sql` | Détail des selles dans le suivi quotidien |
| `004_notifications_code.sql` | `notifications.code` + `params` (notifications traduites) |
| `005_parametres.sql` | Table `parametres` (interrupteurs du super admin) — `INSERT IGNORE`, relançable |
| `006_deux_facteurs.sql` | Table `deux_facteurs` + déconnexion de toutes les sessions |
| `007_menus_allergenes.sql` | `menus.lundi_allergenes` … `vendredi_allergenes` : allergènes présents chaque jour |
| `008_presentation_contenus.sql` | Tables `documents_publics`, `fermetures`, `partenaires` (page Présentation, gérées par le super admin) |

`schema.alwaysdata.sql` : même schéma, adapté à l'hébergeur (MariaDB, sans
`CREATE DATABASE`).

---

## ⚙️ CONFIGURATION SEQUELIZE (backend/src/config/database.js)

```javascript
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host, port,
  dialect: 'mysql',                         // MySQL 8 en local, MariaDB sur Alwaysdata
  logging: NODE_ENV === 'development' ? console.log : false,
  pool:   { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { underscored: true, timestamps: true,
            createdAt: 'created_at', updatedAt: 'updated_at' }
});
```
- 19 modèles dans `backend/src/models/` (la table pivot `photo_enfants` n'a pas
  de modèle propre) ; associations déclarées dans `models/index.js`.
- **Requêtes paramétrées** par Sequelize : protection contre l'injection SQL.
- **Transactions** avec verrou de ligne là où deux requêtes simultanées
  pourraient tricher (ex. vérification du code 2FA).

---

## 📌 RÈGLES IMPORTANTES BDD

1. Clés étrangères avec `ON DELETE CASCADE` ou `SET NULL` (jamais de données orphelines).
2. Jamais de mot de passe en clair : **bcrypt (coût 12)** ; jamais de code 2FA en clair : **HMAC-SHA256**.
3. Index sur les colonnes souvent filtrées (`user_id`, `enfant_id`, `statut`, dates).
4. `created_at` / `updated_at` sur toutes les tables.
5. Désactivation (`actif = FALSE`) plutôt que suppression quand l'historique compte.
6. RGPD : un compte supprimé emporte ses données ; les comptes non confirmés
   sont supprimés automatiquement au bout de 24 h.
7. Toute évolution du schéma = mise à jour de `schema.sql` **et**
   `schema.alwaysdata.sql` **et** une nouvelle migration numérotée.

---

## 📜 SCHÉMA SQL COMPLET (copie de database/schema.sql)

```sql
-- ============================================================
-- SCHÉMA BASE DE DONNÉES — LES COCCINELLES
-- Plateforme web pour crèche | 23 tables
-- ============================================================

CREATE DATABASE IF NOT EXISTS coccinelles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coccinelles_db;

-- ── TABLE 1 : users ─────────────────────────────────────────
-- Contient tous les utilisateurs : parents, admins, super admins
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,            -- Email de connexion (unique)
  password       VARCHAR(255) NULL,                       -- Mot de passe hashé (bcrypt), NULL si compte Google
  google_id      VARCHAR(255) NULL UNIQUE,                -- Identifiant Google (connexion avec Google)
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
  jours_presence JSON,                                    -- Jours habituels de garde (ex: ["lundi","mercredi"]) ; NULL = tous les jours ouvrés
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
  biberons       JSON,                                    -- Tableau [{heure, ml}] : un élément par biberon
  selles         BOOLEAN DEFAULT FALSE,                   -- A eu des selles oui/non (hygiène)
  selles_nb      TINYINT UNSIGNED DEFAULT 0,              -- Nombre de selles dans la journée
  selles_details JSON,                                    -- Tableau [{heure, type}] : normale | molle | liquide
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
  code           VARCHAR(60),                             -- Clé de traduction (notifications.<code>)
  params         JSON,                                    -- Valeurs du texte traduit
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

-- ── TABLE 18 : deux_facteurs ─────────────────────────────────
-- Code de connexion envoyé par email, à part de users pour ne jamais être exposé
CREATE TABLE IF NOT EXISTS deux_facteurs (
  user_id        INT PRIMARY KEY,                       -- Compte concerné
  code_empreinte CHAR(64),                              -- Empreinte du code en cours (jamais le code lui-même)
  expire_le      DATETIME,                              -- Fin de validité du code
  envoye_le      DATETIME,                              -- Dernier envoi (limite les renvois)
  tentatives     INT NOT NULL DEFAULT 0,                -- Codes faux sur le compte depuis la dernière réussite ou le dernier blocage
  bloque_jusqu   DATETIME,                              -- Blocage temporaire après trop d'erreurs
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TABLE 17 : parametres ───────────────────────────────────
-- Réglages du site modifiables par le super admin (Admin → Paramètres) :
-- ouverture de l'espace parents et de la création de comptes ('1' / '0')
CREATE TABLE IF NOT EXISTS parametres (
  cle         VARCHAR(50)  PRIMARY KEY,                 -- Nom du réglage
  valeur      VARCHAR(255) NOT NULL,                    -- Valeur ('1' / '0' pour un interrupteur)
  modifie_par INT,                                      -- Dernier super admin à l'avoir changé
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (modifie_par) REFERENCES users(id) ON DELETE SET NULL
);

-- INSERT IGNORE : relancer la migration ne réinitialise pas les réglages
INSERT IGNORE INTO parametres (cle, valeur) VALUES
('espace_parents_ouvert',    '0'),
('creation_comptes_ouverte', '0');

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
```
