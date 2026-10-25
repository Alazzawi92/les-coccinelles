-- ============================================================
-- MIGRATION : 003_selles_detail.sql
-- RÔLE      : Détail de chaque selle dans le suivi quotidien.
--             Avant : oui/non (selles) + un compteur (selles_nb).
--             Après : un tableau JSON
--               [{ "heure": "10:15", "type": "normale" }]
--             type ∈ normale | molle | liquide (utile aux parents
--             en cas de maladie). Même principe que "biberons".
--             selles et selles_nb sont conservés (recalculés par le
--             serveur à chaque enregistrement).
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

ALTER TABLE suivi_quotidien
  ADD COLUMN selles_details JSON NULL AFTER selles_nb;  -- Tableau [{heure, type}] : un élément par selle

-- Reprise des données existantes : N selles → N lignes "normale" sans heure
-- (au moins 1 si selles = oui avec un compteur à 0). La table "nombres" génère 0..19.
UPDATE suivi_quotidien s
SET s.selles_details = (
  SELECT JSON_ARRAYAGG(JSON_OBJECT('heure', NULL, 'type', 'normale'))
  FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
    UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
  ) AS nombres
  WHERE nombres.n < GREATEST(s.selles_nb, 1)
)
WHERE s.selles = 1 AND s.selles_details IS NULL;
