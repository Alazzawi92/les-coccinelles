// Hook : charge les membres actifs de l'équipe.
// Visiteur → /equipe : prénom, nom et fonction uniquement (pas de photo).
// Connecté (parent ou équipe) → /equipe/avec-photos : mêmes membres + photos
// (liens signés temporaires, le dossier des photos n'est pas public).
// Si la liste avec photos est refusée (ex : espace parents fermé), on
// retombe sur la liste publique sans photos.
// Retourne { membres, chargement, avecPhotos } — avecPhotos : true si la
// liste avec photos a été obtenue (sinon affichage en simple liste).
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const useMembresEquipe = () => {
  const { user, loading } = useAuth();
  const [membres,    setMembres]    = useState([]);
  const [chargement, setChargement] = useState(true);
  const [avecPhotos, setAvecPhotos] = useState(false);

  useEffect(() => {
    if (loading) return; // Attendre la vérification de la session

    // photos : true si la réponse vient de la liste avec photos
    const listePublique = () => api.get('/equipe').then(r => ({ r, photos: false }));
    const requete = user
      ? api.get('/equipe/avec-photos').then(r => ({ r, photos: true })).catch(listePublique)
      : listePublique();

    requete
      .then(({ r, photos }) => { setMembres(r.data.data || []); setAvecPhotos(photos); })
      .catch(() => { setMembres([]); setAvecPhotos(false); })
      .finally(() => setChargement(false));
  }, [user, loading]);

  return { membres, chargement, avecPhotos };
};

export default useMembresEquipe;

// Adresse d'une photo de membre ({ web, miniature } en JSON) ou null
// si le membre n'a pas de photo ou si elle n'a pas été envoyée (visiteur)
export const photoMembre = (membre, taille, backendUrl) => {
  if (!membre.photo) return null;
  try {
    const chemin = JSON.parse(membre.photo)[taille];
    return chemin ? `${backendUrl}${chemin}` : null;
  } catch { return null; }
};
