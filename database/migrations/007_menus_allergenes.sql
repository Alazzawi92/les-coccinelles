-- ============================================================
-- MIGRATION : 007_menus_allergenes.sql
-- RÔLE      : Allergènes du menu, jour par jour (déjeuner + goûter).
--             Une colonne par jour : liste des allergènes PRÉSENTS,
--             clés séparées par des virgules (ex : "lait,gluten,oeufs").
--             Clés possibles (14 allergènes réglementaires) :
--             sulfites, lait, gluten, arachide, fruits_a_coque,
--             fruits_de_mer, oeufs, poisson, crustaces, soja,
--             moutarde, sesame, lupin, celeri.
--             NULL / vide = aucun allergène coché par l'admin.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE menus
  ADD COLUMN lundi_allergenes    VARCHAR(255) NULL AFTER vendredi_gouter,
  ADD COLUMN mardi_allergenes    VARCHAR(255) NULL AFTER lundi_allergenes,
  ADD COLUMN mercredi_allergenes VARCHAR(255) NULL AFTER mardi_allergenes,
  ADD COLUMN jeudi_allergenes    VARCHAR(255) NULL AFTER mercredi_allergenes,
  ADD COLUMN vendredi_allergenes VARCHAR(255) NULL AFTER jeudi_allergenes;
