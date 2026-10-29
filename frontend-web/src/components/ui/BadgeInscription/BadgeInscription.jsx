// ============================================================
// FICHIER  : BadgeInscription.jsx
// RÔLE     : Badge du statut d'inscription d'un enfant, avec un libellé
//            adapté : Inscrit(e), Demande en attente, Dossier incomplet,
//            Liste d'attente, Demande refusée...
//            Utilisé sur "Mes enfants" et à l'étape 2 de l'inscription.
// ============================================================

import { useTranslation } from 'react-i18next';
import './BadgeInscription.css';

const BadgeInscription = ({ statut }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  if (!statut) return null;
  return (
    <span className={`badge-inscription badge-inscription--${statut}`}>
      {t(`common.badgeInscription.${statut}`, { defaultValue: t(`common.statutInscription.${statut}`, { defaultValue: statut }) })}
    </span>
  );
};

export default BadgeInscription;
