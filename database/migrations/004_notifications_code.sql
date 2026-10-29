-- ============================================================
-- MIGRATION : 004_notifications_code.sql
-- RÔLE      : Notifications traduisibles (FR / EN).
--             Avant : titre + message enregistrés en français uniquement.
--             Après : un code (ex : "nouvelleDemande") + des paramètres JSON
--             (ex : {"parent": "Sabah Al azzawi", "enfant": "Lina Martin"}).
--             Le site traduit à l'affichage dans la langue choisie.
--             titre / message restent enregistrés en français (repli pour
--             les anciennes notifications, qui n'ont pas de code).
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE notifications
  ADD COLUMN code   VARCHAR(60) NULL AFTER type,   -- Clé de traduction (notifications.<code>)
  ADD COLUMN params JSON        NULL AFTER code;   -- Valeurs insérées dans le texte traduit
