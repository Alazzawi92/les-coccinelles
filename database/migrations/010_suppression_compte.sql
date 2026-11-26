-- ============================================================
-- MIGRATION : 010_suppression_compte.sql
-- RÔLE      : « Supprimer mon compte » dans l'espace parents (RGPD).
--             - Aucun enfant accepté à la crèche : suppression immédiate
--               du compte et de toutes ses données (fichiers compris).
--             - Enfant accepté : la demande est enregistrée ici et
--               l'équipe est prévenue ; un super admin supprime ensuite
--               le compte depuis Admin → Familles (départ de l'enfant,
--               données éventuellement à conserver).
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE users
  ADD COLUMN suppression_demandee_le DATETIME NULL AFTER actif; -- Date de la demande de suppression (NULL = aucune)
