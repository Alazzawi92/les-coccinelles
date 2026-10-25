// ============================================================
// FICHIER  : AccesReserve.jsx
// RÔLE     : Enveloppe une page parent réservée aux familles dont
//            l'inscription est acceptée (galerie, suivi, absences,
//            consentement). Sans inscription acceptée : écran
//            explicatif avec un lien vers les demandes d'inscription.
//            Le serveur bloque aussi ces routes (403) : ce composant
//            évite seulement d'afficher une page vide ou en erreur.
// ============================================================

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAccesFamille from '../../../hooks/useAccesFamille';
import Chargement from '../Chargement/Chargement';
import './AccesReserve.css';

const AccesReserve = ({ children }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { acces, chargement } = useAccesFamille();

  if (chargement) return <Chargement className="p-chargement" />;
  if (acces) return children;

  return (
    <div className="acces-reserve">
      <span className="acces-reserve__icone" aria-hidden="true">🔒</span>
      <h1 className="acces-reserve__titre">{t('common.accesReserve.titre')}</h1>
      <p className="acces-reserve__texte">{t('common.accesReserve.texte')}</p>
      <div className="acces-reserve__actions">
        <Link to="/parent/mes-enfants" className="btn btn--primary">{t('common.accesReserve.voirDemandes')}</Link>
        <Link to="/parent/inscription" className="btn btn--ghost">{t('common.accesReserve.inscrire')}</Link>
      </div>
    </div>
  );
};

export default AccesReserve;
