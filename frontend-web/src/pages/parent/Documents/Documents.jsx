// ============================================================
// FICHIER  : Documents.jsx (parent)
// ROUTE    : /parent/documents
// RÔLE     : Upload et gestion des documents personnels.
//            Zone drag-and-drop + input file masqué.
//            FormData multipart : fichier + catégorie + enfant_id optionnel.
//            Téléchargement via Blob URL temporaire.
//            Catégories : identite, medical, caf, autre.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Documents.css';

// Métadonnées d'affichage pour chaque catégorie de document
const CATEGORIES = {
  identite: { label: '🪪 Identité',  color: 'bleu'  },
  medical:  { label: '🏥 Médical',   color: 'rouge' },
  caf:      { label: '💳 CAF',       color: 'vert'  },
  autre:    { label: '📄 Autre',     color: 'gris'  }
};

// Formatage de la taille : en Mo si > 1 Mo, sinon en Ko
const formatTaille = (o) => o > 1048576 ? `${(o/1048576).toFixed(1)} Mo` : `${Math.round(o/1024)} Ko`;

const Documents = () => {
  // Liste des documents uploadés par ce parent
  const [documents,  setDocuments]  = useState([]);
  // Liste des enfants du parent (pour sélectionner l'enfant concerné)
  const [enfants,    setEnfants]    = useState([]);
  // Masque la liste pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // Indicateur d'upload en cours (désactive le bouton "Envoyer")
  const [upload,     setUpload]     = useState(false);
  // Valeurs du formulaire d'upload
  const [formUpload, setFormUpload] = useState({ enfant_id: '', categorie: 'autre', description: '' });
  // Fichier sélectionné par l'input ou le drag-and-drop
  const [fichier,    setFichier]    = useState(null);
  // Ref sur l'input file masqué (déclenché par clic sur la drop-zone)
  const inputRef = useRef(null);

  // ── Chargement initial : documents + enfants en parallèle ─
  useEffect(() => {
    const charger = async () => {
      try {
        const [rd, re] = await Promise.all([api.get('/documents'), api.get('/enfants')]);
        setDocuments(rd.data.data || []);
        setEnfants(re.data.data || []);
      } catch {}
      setChargement(false);
    };
    charger();
  }, []);

  // ── Uploader un document ──────────────────────────────────
  // POST /documents avec FormData (multipart)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fichier) { toast.error('Sélectionnez un fichier'); return; }

    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('categorie', formUpload.categorie);
    // enfant_id et description sont optionnels
    if (formUpload.enfant_id)   formData.append('enfant_id', formUpload.enfant_id);
    if (formUpload.description) formData.append('description', formUpload.description);

    setUpload(true);
    try {
      const res = await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Ajoute en tête de liste (plus récent en premier)
      setDocuments(prev => [res.data.data, ...prev]);
      setFichier(null);
      setFormUpload({ enfant_id: '', categorie: 'autre', description: '' });
      if (inputRef.current) inputRef.current.value = '';
      toast.success('Document uploadé !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload');
    }
    setUpload(false);
  };

  // ── Télécharger un document ───────────────────────────────
  // GET /documents/:id en responseType:'blob' + URL.createObjectURL
  const handleTelechargement = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = Object.assign(document.createElement('a'), { href: url, download: doc.nom_fichier });
      a.click();
      URL.revokeObjectURL(url); // Libère la mémoire immédiatement
    } catch { toast.error('Erreur lors du téléchargement'); }
  };

  // ── Supprimer un document ─────────────────────────────────
  const handleSuppression = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="documents-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Mes <span>documents</span></h1>
      </div>

      {/* ── ZONE D'UPLOAD ─────────────────────────────────────── */}
      <div className="p-card upload-zone">
        <h2 className="p-card__titre">📤 Envoyer un document</h2>
        <form className="p-form upload-form" onSubmit={handleUpload}>

          {/* Drop-zone cliquable et glisser-déposer */}
          <div
            className={`drop-zone ${fichier ? 'drop-zone--fichier' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()} // Nécessaire pour autoriser le drop
            onDrop={e => { e.preventDefault(); setFichier(e.dataTransfer.files[0]); }}
          >
            {/* Input masqué — déclenché par le clic sur la drop-zone */}
            <input type="file" ref={inputRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFichier(e.target.files[0])} />
            {fichier ? (
              // Aperçu du fichier sélectionné
              <>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <p className="drop-zone__nom">{fichier.name}</p>
                <p className="drop-zone__taille">{formatTaille(fichier.size)}</p>
              </>
            ) : (
              // État vide : instructions
              <>
                <span style={{ fontSize: '2.5rem' }}>📁</span>
                <p>Glisser-déposer ou cliquer pour sélectionner</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>PDF, JPG, PNG — max 5 Mo</p>
              </>
            )}
          </div>

          {/* Sélecteurs catégorie + enfant côte à côte */}
          <div className="p-form-row">
            <div className="p-form-groupe">
              <label className="p-label">Catégorie</label>
              <select className="p-input" value={formUpload.categorie} onChange={e => setFormUpload(p => ({...p, categorie: e.target.value}))}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Enfant concerné</label>
              <select className="p-input" value={formUpload.enfant_id} onChange={e => setFormUpload(p => ({...p, enfant_id: e.target.value}))}>
                <option value="">Non spécifié</option>
                {enfants.map(e => <option key={e.id} value={e.id}>{e.prenom}</option>)}
              </select>
            </div>
          </div>

          {/* Description facultative */}
          <div className="p-form-groupe">
            <label className="p-label">Description (optionnel)</label>
            <input className="p-input" value={formUpload.description} onChange={e => setFormUpload(p => ({...p, description: e.target.value}))} placeholder="Ex : Carnet de santé, certificat vaccinal..." />
          </div>

          <button type="submit" className="btn btn--primary" disabled={upload || !fichier}>
            {upload ? 'Upload en cours...' : '📤 Envoyer'}
          </button>
        </form>
      </div>

      {/* ── LISTE DES DOCUMENTS ───────────────────────────────── */}
      {documents.length === 0 ? (
        <div className="p-vide">
          <span className="p-vide__icone">📂</span>
          <p>Vous n'avez pas encore uploadé de document.</p>
        </div>
      ) : (
        <div className="p-card">
          <h2 className="p-card__titre">📂 Mes documents ({documents.length})</h2>
          <div className="documents-liste">
            {documents.map(doc => {
              // Fallback sur 'autre' si catégorie inconnue
              const cat = CATEGORIES[doc.categorie] || CATEGORIES.autre;
              return (
                <div key={doc.id} className="document-ligne">
                  <span className="doc-icone">📄</span>
                  <div className="doc-infos">
                    <p className="doc-nom">{doc.nom_fichier}</p>
                    {/* Métadonnées : catégorie + description + taille + date */}
                    <div className="doc-meta">
                      <span className={`doc-categorie doc-categorie--${cat.color}`}>{cat.label}</span>
                      {doc.description && <span className="doc-description">{doc.description}</span>}
                      <span className="doc-taille">{formatTaille(doc.taille)}</span>
                      <span className="doc-date">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="doc-actions">
                    {/* Télécharger */}
                    <button className="btn btn--ghost btn--sm" onClick={() => handleTelechargement(doc)}>⬇️</button>
                    {/* Supprimer : bordure rouge pour marquer l'action destructive */}
                    <button className="btn btn--outline btn--sm" onClick={() => handleSuppression(doc.id)} style={{ color:'var(--error)', borderColor:'var(--error)' }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Documents;
