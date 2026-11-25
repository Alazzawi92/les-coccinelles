// ============================================================
// FICHIER  : ApercuEquipe.jsx
// RÔLE     : Aperçu "Notre équipe" : les premiers membres de
//            l'équipe (nom, fonction ; photo seulement pour les
//            utilisateurs connectés) + lien vers /equipe.
//            Sorti de la page d'accueil pour pouvoir être placé
//            sur n'importe quelle page. Charge ses propres données.
//            Rien n'est affiché tant qu'aucun membre n'existe.
// PROPS    : limite (nombre, défaut 4) — membres affichés au maximum
// ============================================================

import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { BACKEND_URL } from '../../../services/api';
import useMembresEquipe, { photoMembre } from '../../../hooks/useMembresEquipe';
import ListeEquipe from '../ListeEquipe/ListeEquipe';
import './ApercuEquipe.css';

const ApercuEquipe = ({ limite = 4 }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Erreur de chargement → liste vide → section masquée
  const { membres: tous, avecPhotos } = useMembresEquipe();
  const membres = tous.slice(0, limite);

  if (membres.length === 0) return null;

  return (
    <section className="apercu-equipe">
      <div className="container">
        <div className="apercu-equipe__entete">
          <h2 className="section-titre"><Trans i18nKey="public.accueil.equipeTitre" components={{ s: <span /> }} /></h2>
          <Link to="/equipe" className="btn btn--ghost btn--sm">{t('public.accueil.toutEquipe')}</Link>
        </div>
        {/* Visiteur : simple liste, sans photo — Connecté : cartes avec photos */}
        {!avecPhotos ? <ListeEquipe membres={membres} /> : (
        <div className="apercu-equipe__grille">
          {membres.map(m => {
            // Membre sans photo : initiales dans le cercle
            const imgUrl = photoMembre(m, 'miniature', BACKEND_URL);
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
        )}
      </div>
    </section>
  );
};

export default ApercuEquipe;
