// ============================================================
// FICHIER  : ListeEquipe.jsx
// RÔLE     : Affichage de l'équipe pour les VISITEURS (non connectés) :
//            simple liste « Prénom Nom — Fonction », sans photo ni
//            initiales. Les photos sont réservées aux parents et à
//            l'équipe connectés (cartes de Equipe / ApercuEquipe).
// PROPS    : membres (tableau { id, prenom, nom, titre })
// ============================================================

import './ListeEquipe.css';

const ListeEquipe = ({ membres }) => (
  <ul className="liste-equipe">
    {membres.map(m => (
      <li key={m.id} className="liste-equipe__ligne">
        <span className="liste-equipe__nom">{m.prenom} {m.nom}</span>
        {m.titre && <span className="liste-equipe__fonction">{m.titre}</span>}
      </li>
    ))}
  </ul>
);

export default ListeEquipe;
