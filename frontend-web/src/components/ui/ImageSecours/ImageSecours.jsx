// ============================================================
// FICHIER  : ImageSecours.jsx
// RÔLE     : <img> qui affiche un visuel de remplacement si l'image ne
//            se charge pas (fichier supprimé, lien expiré, erreur réseau),
//            au lieu d'une icône d'image cassée.
//            Props : src, alt, icone (emoji du visuel de secours, 📷 par
//            défaut) + toutes les autres props d'un <img> (loading...).
// ============================================================

import { useState, useEffect } from 'react';
import './ImageSecours.css';

const ImageSecours = ({ src, alt = '', icone = '📷', className = '', ...autres }) => {
  // true = l'image a échoué (ou pas d'adresse) → visuel de secours
  const [echec, setEchec] = useState(!src);

  // Nouvelle adresse (autre photo, lien re-signé) : on réessaie
  useEffect(() => { setEchec(!src); }, [src]);

  if (echec) {
    return (
      <span className={`image-secours ${className}`} role="img" aria-label={alt}>
        <span aria-hidden="true">{icone}</span>
      </span>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setEchec(true)} {...autres} />;
};

export default ImageSecours;
