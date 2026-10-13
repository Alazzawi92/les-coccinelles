-- ============================================================
-- MIGRATION : 001_connexion_google.sql
-- RÔLE      : Permet la connexion "Se connecter avec Google".
--             - password devient facultatif : un parent inscrit
--               via Google n'a pas de mot de passe local (il peut
--               en définir un plus tard via "Mot de passe oublié").
--             - google_id stocke l'identifiant Google ("sub") qui
--               relie le compte local au compte Google.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE users
  MODIFY password VARCHAR(255) NULL,                          -- NULL = compte Google sans mot de passe local
  ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password; -- Identifiant Google (unique)
