-- ============================================================
-- MIGRATION : 009_appareils_confiance.sql
-- RÔLE      : « Faire confiance à cet appareil » (double authentification).
--             Après un code valide, la personne peut cocher la case : ce
--             navigateur ne redemande plus le code reçu par email pendant
--             30 jours (parents) ou 24 heures (équipe : admin, super admin).
--             Le mot de passe reste toujours demandé.
--             Seule l'EMPREINTE de la clé est enregistrée (jamais la clé),
--             comme pour le code de connexion (table deux_facteurs).
--             Toutes les confiances d'un compte sont supprimées quand son
--             mot de passe change.
-- À exécuter une seule fois sur une base existante (locale et AlwaysData).
-- ============================================================

CREATE TABLE IF NOT EXISTS appareils_confiance (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,                        -- Compte concerné
  cle_empreinte    CHAR(64) NOT NULL,                   -- Empreinte HMAC de la clé gardée par le navigateur
  expire_le        DATETIME NOT NULL,                   -- Fin de la confiance (30 jours ou 24 heures)
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Date de la confiance (sert à recalculer la durée selon le rôle)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cle (cle_empreinte),
  INDEX idx_appareils_user (user_id)
);
