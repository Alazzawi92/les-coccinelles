-- ============================================================
-- MIGRATION : 002_biberons_detail.sql
-- RÔLE      : Détail de chaque biberon dans le suivi quotidien.
--             Avant : un compteur (biberon_nb) + UNE quantité pour
--             tous les biberons (biberon_ml).
--             Après : un tableau JSON [{ "heure": "08:30", "ml": 120 }]
--             (même principe que la colonne "siestes").
--             biberon_nb est conservé (calculé par le serveur à chaque
--             enregistrement) ; biberon_ml devient un ancien champ.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE suivi_quotidien
  ADD COLUMN biberons JSON NULL AFTER biberon_ml;  -- Tableau [{heure, ml}] : un élément par biberon

-- Reprise des données existantes : N biberons de X ml → N lignes de X ml
-- (heure inconnue → null). La table "nombres" génère 0..19.
UPDATE suivi_quotidien s
SET s.biberons = (
  SELECT JSON_ARRAYAGG(JSON_OBJECT('heure', NULL, 'ml', s.biberon_ml))
  FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
    UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
  ) AS nombres
  WHERE nombres.n < s.biberon_nb
)
WHERE s.biberon_nb > 0 AND s.biberons IS NULL;
