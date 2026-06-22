// ============================================================
// FICHIER  : Actualites.jsx (admin)
// ROUTE    : /admin/actualites
// RÔLE     : Gestion des articles d'actualité de la crèche.
//            Tableau avec statut Publié/Brouillon.
//            Modal création/édition : titre, extrait, contenu
//            via éditeur WYSIWYG (React Quill), checkbox publier.
//            Actions : modifier (PUT), toggle publier (PATCH),
//            supprimer (DELETE avec confirm).
// ============================================================

import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Actualites.css';

// Barre d'outils Quill adaptée à un usage non-technique
const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const ActualitesAdmin = () => {
  // Liste des actualités chargées depuis l'API (admin : toutes, publiées + brouillons)
  const [actualites, setActualites] = useState([]);
  // Masque le tableau pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // true = modal de formulaire ouverte (création ou édition)
  const [modeForm,   setModeForm]   = useState(false);
  // Actualité en cours d'édition (null = mode création)
  const [editing,    setEditing]    = useState(null);
  // Valeurs du formulaire modal
  const [form,       setForm]       = useState({ titre:'', extrait:'', contenu:'', publie:false });
  // Indicateur d'envoi pendant la requête POST/PUT
  const [envoi,      setEnvoi]      = useState(false);

  // ── Chargement de toutes les actualités au montage ───────
  // limite=50 : l'admin voit tous les articles y compris les brouillons
  useEffect(() => {
    api.get('/actualites?limite=50')
      .then(r => setActualites(r.data.data?.actualites || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Ouvrir la modal en mode création ou édition ──────────
  // Si actu est null → création (formulaire vide)
  // Si actu est un objet → édition (formulaire pré-rempli)
  const ouvrir = (actu = null) => {
    setEditing(actu);
    setForm(actu
      ? { titre: actu.titre, extrait: actu.extrait || '', contenu: actu.contenu, publie: actu.publie }
      : { titre: '', extrait: '', contenu: '', publie: false }
    );
    setModeForm(true);
  };

  // ── Soumission du formulaire (création ou mise à jour) ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Quill renvoie "<p><br></p>" quand le champ est visuellement vide
    const contenuVide = !form.contenu || form.contenu.replace(/<[^>]*>/g, '').trim() === '';
    if (contenuVide) { toast.error('Le contenu est obligatoire'); return; }
    setEnvoi(true);
    try {
      if (editing) {
        // Mode édition : PUT /actualites/:id
        const res = await api.put(`/actualites/${editing.id}`, form);
        setActualites(prev => prev.map(a => a.id === editing.id ? res.data.data : a));
        toast.success('Actualité mise à jour');
      } else {
        // Mode création : POST /actualites
        const res = await api.post('/actualites', form);
        setActualites(prev => [res.data.data, ...prev]); // Ajoute en tête de liste
        toast.success('Actualité créée');
      }
      setModeForm(false);
    } catch { toast.error('Erreur'); }
    setEnvoi(false);
  };

  // ── Publier / dépublier une actualité ────────────────────
  // PATCH /actualites/:id/publier — toggle côté API
  const togglePublier = async (actu) => {
    try {
      await api.patch(`/actualites/${actu.id}/publier`);
      // Mise à jour optimiste du tableau
      setActualites(prev => prev.map(a => a.id === actu.id ? { ...a, publie: !a.publie } : a));
      toast.success(actu.publie ? 'Dépubliée' : 'Publiée');
    } catch { toast.error('Erreur'); }
  };

  // ── Supprimer une actualité après confirmation ────────────
  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette actualité ?')) return;
    try {
      await api.delete(`/actualites/${id}`);
      setActualites(prev => prev.filter(a => a.id !== id));
      toast.success('Actualité supprimée');
    } catch { toast.error('Erreur'); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>actualités</span></h1>
        <button className="btn btn--primary" onClick={() => ouvrir()}>+ Nouvelle actualité</button>
      </div>

      {/* ── MODAL CRÉATION / ÉDITION ──────────────────────────── */}
      {/* Clic sur l'overlay ferme la modal sans sauvegarder */}
      {modeForm && (
        <div className="modal-overlay" onClick={() => setModeForm(false)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">{editing ? '✏️ Modifier' : '✍️ Nouvelle actualité'}</h2>
              <button className="modal__fermer" onClick={() => setModeForm(false)}>✕</button>
            </div>
            <form className="a-form" onSubmit={handleSubmit}>
              <div className="a-form-groupe">
                <label className="a-label">Titre <span className="requis">*</span></label>
                <input className="a-input" value={form.titre} onChange={e => setForm(p => ({...p, titre:e.target.value}))} placeholder="Titre de l'actualité" required />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">Extrait (résumé)</label>
                {/* Extrait : court résumé affiché sur la page liste */}
                <textarea className="a-input a-textarea" rows={2} value={form.extrait} onChange={e => setForm(p => ({...p, extrait:e.target.value}))} placeholder="Court résumé affiché sur la liste..." />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">Contenu complet <span className="requis">*</span></label>
                <div className="quill-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={form.contenu}
                    onChange={val => setForm(p => ({ ...p, contenu: val }))}
                    modules={QUILL_MODULES}
                    placeholder="Rédigez le contenu de l'actualité..."
                  />
                </div>
              </div>
              {/* Checkbox : publier immédiatement ou enregistrer en brouillon */}
              <label className="publie-toggle">
                <input type="checkbox" checked={form.publie} onChange={e => setForm(p => ({...p, publie:e.target.checked}))} />
                <span>Publier immédiatement</span>
              </label>
              <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModeForm(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={envoi}>
                  {envoi ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TABLEAU DES ACTUALITÉS ────────────────────────────── */}
      <div className="a-card">
        {actualites.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📰</span><p>Aucune actualité.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr><th>Titre</th><th>Extrait</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {actualites.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.titre}</strong></td>
                  {/* Extrait tronqué sur 2 lignes via -webkit-line-clamp */}
                  <td style={{ fontSize:'0.85rem', color:'var(--text-gray)', maxWidth:'250px' }}>
                    <span style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {a.extrait || '—'}
                    </span>
                  </td>
                  {/* Badge statut : vert=publié, gris=brouillon */}
                  <td>
                    <span className={`s-badge ${a.publie ? 's-badge--accepte' : 's-badge--en_attente'}`}>
                      {a.publie ? '🟢 Publié' : '⚫ Brouillon'}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-gray)' }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="a-actions">
                      {/* Modifier : ouvre la modal en mode édition */}
                      <button className="btn btn--ghost btn--sm" onClick={() => ouvrir(a)}>✏️</button>
                      {/* Publier/Dépublier : bascule entre les deux états */}
                      <button className={`btn btn--sm ${a.publie ? 'btn--outline' : 'btn--primary'}`} onClick={() => togglePublier(a)}>
                        {a.publie ? 'Dépublier' : 'Publier'}
                      </button>
                      {/* Supprimer : bouton discret en rouge */}
                      <button className="btn btn--sm" style={{ color:'var(--error)', background:'none', border:'none' }} onClick={() => supprimer(a.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default ActualitesAdmin;
