-- ============================================================
-- MIGRATION : 008_presentation_contenus.sql
-- RÔLE      : 3 nouvelles sections de la page Présentation, gérées
--             par le super admin depuis le back office :
--             - documents_publics : documentation téléchargeable par tous
--             - fermetures        : calendrier des fermetures de la crèche
--             - partenaires       : partenaires (nom, catégorie, logo, lien)
--             Les fichiers (PDF, logos) sont rangés dans les dossiers
--             publics uploads/documentation et uploads/partenaires.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

-- ── documents_publics : documentation de la crèche ──────────
CREATE TABLE IF NOT EXISTS documents_publics (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  titre         VARCHAR(150) NOT NULL,                  -- Ex : « Règlement de fonctionnement »
  description   VARCHAR(255),                           -- Courte phrase facultative
  fichier       VARCHAR(500) NOT NULL,                  -- Chemin : /uploads/documentation/<nom>.pdf
  nom_original  VARCHAR(255),                           -- Nom du fichier envoyé (affiché à l'admin)
  taille        INT,                                    -- Taille en octets
  ordre         INT NOT NULL DEFAULT 0,                 -- Ordre d'affichage
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── fermetures : calendrier des fermetures ──────────────────
CREATE TABLE IF NOT EXISTS fermetures (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  date_debut  DATE NOT NULL,                            -- Premier jour de fermeture
  date_fin    DATE NOT NULL,                            -- Dernier jour (= date_debut pour 1 jour)
  motif       VARCHAR(150) NOT NULL,                    -- Ex : « Vacances de Noël », « Pont de l'Ascension »
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fermetures_fin (date_fin)                   -- Liste publique : fermetures à venir
);

-- ── partenaires : partenaires de la crèche ──────────────────
CREATE TABLE IF NOT EXISTS partenaires (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(150) NOT NULL,                    -- Ex : « CAF de la Charente-Maritime »
  categorie   VARCHAR(100),                             -- Ex : « Culture », « Petite enfance » (facultatif)
  logo        VARCHAR(500),                             -- Chemin : /uploads/partenaires/<nom>.png (facultatif)
  lien        VARCHAR(500),                             -- Site web du partenaire (facultatif)
  ordre       INT NOT NULL DEFAULT 0,                   -- Ordre d'affichage
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
