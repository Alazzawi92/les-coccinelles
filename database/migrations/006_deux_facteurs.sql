-- ============================================================
-- MIGRATION : 006_deux_facteurs.sql
-- RÔLE      : Double authentification obligatoire pour tous :
--             un code à 6 chiffres est envoyé par email à chaque connexion.
--             Table à part (et non des colonnes de users) : aucune
--             requête sur les utilisateurs ne peut exposer ces données.
--             Les sessions en cours sont fermées : chacun devra passer
--             par le code à sa prochaine connexion.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

CREATE TABLE IF NOT EXISTS deux_facteurs (
  user_id        INT PRIMARY KEY,                       -- Compte concerné
  code_empreinte CHAR(64),                              -- Empreinte du code en cours (jamais le code lui-même)
  expire_le      DATETIME,                              -- Fin de validité du code
  envoye_le      DATETIME,                              -- Dernier envoi (limite les renvois)
  tentatives     INT NOT NULL DEFAULT 0,                -- Codes faux pour le code en cours
  bloque_jusqu   DATETIME,                              -- Blocage temporaire après trop d'erreurs
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

UPDATE users SET refresh_token = NULL;
