// ============================================================
// FICHIER  : ApercuEquipe.jsx
// RÔLE     : Aperçu "Notre équipe" : les premiers membres de
//            l'équipe (photo, nom, fonction) + lien vers /equipe.
//            Sorti de la page d'accueil pour pouvoir être placé
//            sur n'importe quelle page. Charge ses propres données.
//            Rien n'est affiché tant qu'aucun membre n'existe.
// PROPS    : limite (nombre, défaut 4) — membres affichés au maximum
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api, { BACKEND_URL } from '../../../services/api';
import './ApercuEquipe.css';

const ApercuEquipe = ({ limite = 4 }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [membres, setMembres] = useState([]);

  // Chargement des membres au montage (erreur ignorée : section masquée)
  useEffect(() => {
    api.get('/equipe')
      .then(res => setMembres((res.data.data || []).slice(0, limite)))
      .catch(() => setMembres([]));
  }, [limite]);

  if (membres.length === 0) return null;

  return (
    <section className="apercu-equipe">
      <div className="container">
        <div className="apercu-equipe__entete">
          <h2 className="section-titre"><Trans i18nKey="public.accueil.equipeTitre" components={{ s: <span /> }} /></h2>
          <Link to="/equipe" className="btn btn--ghost btn--sm">{t('public.accueil.toutEquipe')}</Link>
        </div>
        <div className="apercu-equipe__grille">
          {membres.map(m => {
            // Photo stockée en JSON ({ miniature, ... }) : initiales si absente ou illisible
            let imgUrl = null;
            try { imgUrl = `${BACKEND_URL}${JSON.parse(m.photo).miniature}`; } catch {}
            return (
              <div key={m.id} className="apercu-equipe__carte">
                <div className="apercu-equipe__photo">
                  {imgUrl
                    ? <img src={imgUrl} alt={`${m.prenom} ${m.nom}`} />
                    : <span>{m.prenom[0]}{m.nom[0]}</span>
                  }
                </div>
                <p className="apercu-equipe__nom">{m.prenom} {m.nom}</p>
                <p className="apercu-equipe__titre">{m.titre}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ApercuEquipe;
