-- ============================================================
-- MIGRATION : 005_parametres.sql
-- RÔLE      : Réglages du site modifiables par le super admin
--             (page Admin → Paramètres), sans redéploiement.
--             - espace_parents_ouvert    : connexion des parents
--             - creation_comptes_ouverte : nouveaux comptes parents et
--               nouvelles demandes d'inscription (n'a d'effet que si
--               l'espace parents est ouvert)
--             Valeurs : '1' = ouvert, '0' = fermé. Les deux démarrent
--             fermés (site vitrine seul jusqu'en mars 2027).
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

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
