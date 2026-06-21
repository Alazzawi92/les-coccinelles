// ============================================================
// FICHIER  : CMS.jsx (admin)
// ROUTE    : /admin/cms
// RÔLE     : Éditeur de contenu des pages statiques du site.
//            Layout 2 colonnes : liste des pages | éditeur.
//            Chaque page est identifiée par son slug.
//            Champs modifiables : titre, meta_description (SEO,
//            160 caractères max avec compteur), contenu HTML.
//            Sauvegarde via PUT /cms/pages/:slug.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './CMS.css';

const CMS = () => {
  // Liste des pages CMS gérables (chargées au montage)
  const [pages,      setPages]      = useState([]);
  // Page actuellement en édition (null = aucune sélectionnée)
  const [editing,    setEditing]    = useState(null);
  // Valeurs du formulaire d'édition
  const [form,       setForm]       = useState({ titre:'', contenu:'', meta_description:'' });
  // Masque le composant pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // Indicateur d'envoi pendant la requête PUT
  const [envoi,      setEnvoi]      = useState(false);

  // ── Chargement de toutes les pages CMS au montage ────────
  useEffect(() => {
    api.get('/cms/pages')
      .then(r => setPages(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Sélectionner une page pour l'éditer ──────────────────
  // Pré-remplit le formulaire avec les valeurs actuelles de la page
  const editer = (page) => {
    setEditing(page);
    setForm({
      titre:            page.titre,
      contenu:          page.contenu           || '',
      meta_description: page.meta_description  || ''
    });
  };

  // ── Sauvegarder les modifications ────────────────────────
  // PUT /cms/pages/:slug avec le formulaire
  const sauvegarder = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.put(`/cms/pages/${editing.slug}`, form);
      // Mise à jour optimiste dans la liste des pages
      setPages(prev => prev.map(p => p.slug === editing.slug ? res.data.data : p));
      setEditing(null);
      toast.success('Page mise à jour');
    } catch { toast.error('Erreur'); }
    setEnvoi(false);
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion du <span>contenu</span> (CMS)</h1>
      </div>

      {/* ── LAYOUT 2 COLONNES ─────────────────────────────────── */}
      <div className="cms-layout">

        {/* ── LISTE DES PAGES ─────────────────────────────────── */}
        <div className="cms-pages-liste">
          <h2 className="a-card__titre" style={{ marginBottom:'var(--space-md)' }}>Pages du site</h2>
          {pages.map(page => (
            <button
              key={page.slug}
              // Classe actif si cette page est en cours d'édition
              className={`cms-page-item ${editing?.slug === page.slug ? 'cms-page-item--actif' : ''}`}
              onClick={() => editer(page)}
            >
              {/* Slug affiché comme chemin URL (/accueil, /presentation...) */}
              <p className="cms-page-slug">/{page.slug}</p>
              <p className="cms-page-titre-court">{page.titre}</p>
              {/* Indicateur "En édition" si c'est la page active */}
              {editing?.slug === page.slug && <span style={{ color:'var(--primary)', fontSize:'0.75rem' }}>→ En édition</span>}
            </button>
          ))}
        </div>

        {/* ── ÉDITEUR ─────────────────────────────────────────── */}
        <div className="cms-editeur">
          {!editing ? (
            // État initial : aucune page sélectionnée
            <div className="a-vide">
              <span className="a-vide__icone">🌐</span>
              <p>Sélectionnez une page à modifier</p>
            </div>
          ) : (
            <div className="a-card">
              <h2 className="a-card__titre">✏️ Édition : {editing.titre}</h2>
              <form className="a-form" onSubmit={sauvegarder}>

                {/* Titre de la page */}
                <div className="a-form-groupe">
                  <label className="a-label">Titre de la page</label>
                  <input className="a-input" value={form.titre} onChange={e => setForm(p => ({...p,titre:e.target.value}))} />
                </div>

                {/* Meta description SEO avec compteur de caractères */}
                <div className="a-form-groupe">
                  <label className="a-label">Description SEO</label>
                  <input
                    className="a-input"
                    value={form.meta_description}
                    onChange={e => setForm(p => ({...p,meta_description:e.target.value}))}
                    placeholder="Description pour les moteurs de recherche (160 car. max)"
                    maxLength={160}
                  />
                  {/* Compteur : affiche le nombre de caractères saisis sur 160 */}
                  <small style={{ color:'var(--text-light)', fontSize:'0.75rem' }}>{form.meta_description.length}/160</small>
                </div>

                {/* Contenu HTML : textarea grande hauteur pour édition confortable */}
                <div className="a-form-groupe">
                  <label className="a-label">Contenu (HTML)</label>
                  <textarea
                    className="a-input a-textarea cms-editeur-textarea"
                    rows={16}
                    value={form.contenu}
                    onChange={e => setForm(p => ({...p,contenu:e.target.value}))}
                    placeholder="Contenu HTML de la page..."
                  />
                </div>

                <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                  {/* Annuler : désélectionne la page sans sauvegarder */}
                  <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Annuler</button>
                  <button type="submit" className="btn btn--primary" disabled={envoi}>
                    {envoi ? 'Enregistrement...' : '💾 Sauvegarder'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CMS;
