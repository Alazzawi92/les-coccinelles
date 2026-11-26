-- ============================================================
-- DONNÉES : fermetures_2026_2027.sql
-- RÔLE    : Dates de fermeture de la crèche pour l'année 2026/2027
--           (affichées dans « Le calendrier des fermetures » de la
--           page Présentation, modifiables ensuite dans Admin → Fermetures).
-- RÈGLES  : - Fermeture « au soir » : la crèche est ouverte ce jour-là,
--             la fermeture commence donc le lendemain (précisé dans le motif).
--           - Relançable sans risque : une fermeture déjà présente
--             (même premier jour et même motif) n'est pas ajoutée deux fois.
-- À exécuter dans phpMyAdmin (onglet SQL) après la migration 008.
-- ============================================================

INSERT INTO fermetures (date_debut, date_fin, motif)
SELECT f.date_debut, f.date_fin, f.motif
FROM (
  SELECT DATE('2026-12-24') AS date_debut, DATE('2027-01-03') AS date_fin, 'Vacances de Noël (fermeture le mercredi 23 décembre au soir, reprise le lundi 4 janvier)' AS motif
  UNION ALL SELECT '2027-03-04', '2027-03-05', 'Formation de l''équipe'
  UNION ALL SELECT '2027-03-29', '2027-03-29', 'Lundi de Pâques'
  UNION ALL SELECT '2027-04-17', '2027-04-25', 'Vacances de printemps (fermeture le vendredi 16 avril au soir, reprise le lundi 26 avril)'
  UNION ALL SELECT '2027-05-06', '2027-05-07', 'Pont de l''Ascension (reprise le lundi 10 mai)'
  UNION ALL SELECT '2027-05-17', '2027-05-17', 'Lundi de Pentecôte'
  UNION ALL SELECT '2027-06-25', '2027-06-25', 'Fête de fin d''année et assemblée générale'
  UNION ALL SELECT '2027-07-14', '2027-07-14', 'Fête nationale'
  UNION ALL SELECT '2027-07-31', '2027-08-23', 'Vacances d''été (fermeture le vendredi 30 juillet au soir, reprise le mardi 24 août pour les enfants)'
) AS f
WHERE NOT EXISTS (
  SELECT 1 FROM fermetures x WHERE x.date_debut = f.date_debut AND x.motif = f.motif
);
