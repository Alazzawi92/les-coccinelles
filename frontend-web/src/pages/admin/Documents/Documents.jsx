// ============================================================
// FICHIER  : Documents.jsx (admin)
// ROUTE    : /admin/documents
// RÔLE     : Vue administrateur de tous les documents uploadés
//            par les familles. Tableau filtrable par nom/description.
//            Actions : télécharger (via Blob URL temporaire)
//            et supprimer (avec confirm).
//            Lecture seule pour l'admin (upload côté parent).
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';

const DocumentsAdmin = () => {
  // Liste complète des documents chargés depuis l'API
  const [documents,  setDocuments]  = useState([]);
  // Valeur du champ de recherche (filtre sur nom_fichier et description)
  const [filtre,     setFiltre]     = useState('');
  // Masque le tableau pendant le chargement initial
  const [chargement, setChargement] = useState(true);

  // ── Chargement de tous les documents au montage ──────────
  useEffect(() => {
    api.get('/documents')
      .then(r => setDocuments(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Supprimer un document ─────────────────────────────────
  // DELETE /documents/:id — supprime le fichier côté serveur
  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document supprimé');
    } catch { toast.error('Erreur'); }
  };

  // ── Télécharger un document ───────────────────────────────
  // GET /documents/:id en responseType:'blob' puis URL.createObjectURL
  // Crée un lien <a> temporaire pour déclencher le téléchargement
  const telecharger = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      Object.assign(document.createElement('a'), { href: url, download: doc.nom_fichier }).click();
      URL.revokeObjectURL(url); // Libère la mémoire après le téléchargement
    } catch { toast.error('Erreur téléchargement'); }
  };

  // ── Filtrage en temps réel ────────────────────────────────
  const filtres = documents.filter(d =>
    d.nom_fichier.toLowerCase().includes(filtre.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(filtre.toLowerCase())
  );

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>documents</span></h1>
        {/* Compteur avec fond gris discret */}
        <span style={{ fontSize:'0.85rem', color:'var(--text-gray)', background:'var(--bg-gray)', padding:'var(--space-sm) var(--space-md)', borderRadius:'var(--radius-pill)' }}>
          {filtres.length} document(s)
        </span>
      </div>

      {/* ── BARRE DE RECHERCHE ──────────────────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input placeholder="Rechercher par nom de fichier..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        </div>
      </div>

      {/* ── TABLEAU DES DOCUMENTS ─────────────────────────────── */}
      <div className="a-card">
        {filtres.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📂</span><p>Aucun document.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr><th>Fichier</th><th>Catégorie</th><th>Taille</th><th>Uploader le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtres.map(d => (
                <tr key={d.id}>
                  <td>
                    <p style={{ fontWeight:700 }}>{d.nom_fichier}</p>
                    {/* Description optionnelle affichée en sous-titre */}
                    {d.description && <p style={{ fontSize:'0.78rem', color:'var(--text-gray)' }}>{d.description}</p>}
                  </td>
                  {/* Badge catégorie : identite/medical/caf/autre */}
                  <td><span className="s-badge s-badge--en_cours">{d.categorie}</span></td>
                  {/* Taille : en Mo si > 1 Mo, sinon en Ko */}
                  <td style={{ fontSize:'0.85rem', color:'var(--text-gray)' }}>
                    {d.taille > 1048576 ? `${(d.taille / 1048576).toFixed(1)} Mo` : `${Math.round(d.taille / 1024)} Ko`}
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-gray)' }}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="a-actions">
                      {/* Télécharger */}
                      <button className="btn btn--ghost btn--sm" onClick={() => telecharger(d)}>⬇️</button>
                      {/* Supprimer : icône rouge sans bordure */}
                      <button className="btn btn--sm" style={{ color:'var(--error)', background:'none', border:'none' }} onClick={() => supprimer(d.id)}>🗑️</button>
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

export default DocumentsAdmin;
