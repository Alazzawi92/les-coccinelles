// ============================================================
// FICHIER  : SuiviIndex.jsx (parent)
// ROUTE    : /parent/suivi  (sans :id)
// RÔLE     : Point d'entrée du lien "Suivi quotidien" de la sidebar.
//            La page Suivi.jsx a besoin d'un enfant précis (:id),
//            donc ce composant charge la liste des enfants et :
//              - 1 seul enfant  → redirige automatiquement vers son suivi
//              - plusieurs      → affiche un sélecteur
//              - aucun          → invite à ajouter un enfant
// ============================================================

import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import '../../../styles/parent.css';
import './Suivi.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

const SuiviIndex = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [enfants,    setEnfants]    = useState(null); // null = pas encore chargé
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get('/enfants')
      .then(r => setEnfants(r.data.data || []))
      .catch(() => setEnfants([]))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <Chargement className="p-chargement" />;

  // Un seul enfant : on va directement à son suivi, pas besoin de choisir
  if (enfants.length === 1) return <Navigate to={`/parent/suivi/${enfants[0].id}`} replace />;

  return (
    <div className="suivi-page">
      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.suiviIndex.titre" components={{ s: <span /> }} /></h1>
      </div>

      {enfants.length === 0 ? (
        <div className="p-vide">
          <span className="p-vide__icone">👶</span>
          <p>{t('parent.commun.aucunEnfant')}</p>
          <Link to="/parent/mes-enfants" className="btn btn--primary">{t('parent.commun.ajouterEnfant')}</Link>
        </div>
      ) : (
        <div className="suivi-selecteur">
          <p style={{ color: 'var(--text-gray)', marginBottom: 'var(--space-lg)' }}>{t('parent.suiviIndex.choisir')}</p>
          {enfants.map(e => (
            <Link key={e.id} to={`/parent/suivi/${e.id}`} className="suivi-jour-btn">
              <span className="suivi-jour-date">{e.prenom} {e.nom}</span>
              <span className="suivi-jour-humeur">{e.sexe === 'F' ? '👧' : '👦'}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuiviIndex;
