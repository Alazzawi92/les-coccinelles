// Hook : charge le contenu CMS d'une page par son slug.
// Retourne { contenu, chargement } — contenu est du HTML Quill ou null.
import { useState, useEffect } from 'react';
import api from '../services/api';

const usePageCMS = (slug) => {
  const [contenu,    setContenu]    = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get(`/cms/pages/${slug}`)
      .then(r => setContenu(r.data.data?.contenu || null))
      .catch(() => setContenu(null))
      .finally(() => setChargement(false));
  }, [slug]);

  return { contenu, chargement };
};

export default usePageCMS;
