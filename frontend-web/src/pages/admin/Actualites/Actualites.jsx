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
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Actualites.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

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
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
    if (contenuVide) { toast.error(t('admin.actualites.contenuObligatoire')); return; }
    setEnvoi(true);
    try {
      if (editing) {
        // Mode édition : PUT /actualites/:id
        const res = await api.put(`/actualites/${editing.id}`, form);
        setActualites(prev => prev.map(a => a.id === editing.id ? res.data.data : a));
        toast.success(t('admin.actualites.toastMaj'));
      } else {
        // Mode création : POST /actualites
        const res = await api.post('/actualites', form);
        setActualites(prev => [res.data.data, ...prev]); // Ajoute en tête de liste
        toast.success(t('admin.actualites.toastCreee'));
      }
      setModeForm(false);
    } catch { toast.error(t('common.erreur')); }
    setEnvoi(false);
  };

  // ── Publier / dépublier une actualité ────────────────────
  // PATCH /actualites/:id/publier — toggle côté API
  const togglePublier = async (actu) => {
    try {
      await api.patch(`/actualites/${actu.id}/publier`);
      // Mise à jour optimiste du tableau
      setActualites(prev => prev.map(a => a.id === actu.id ? { ...a, publie: !a.publie } : a));
      toast.success(actu.publie ? t('admin.actualites.toastDepubliee') : t('admin.actualites.toastPubliee'));
    } catch { toast.error(t('common.erreur')); }
  };

  // ── Supprimer une actualité après confirmation ────────────
  const supprimer = async (id) => {
    if (!window.confirm(t('admin.actualites.confirmerSuppression'))) return;
    try {
      await api.delete(`/actualites/${id}`);
      setActualites(prev => prev.filter(a => a.id !== id));
      toast.success(t('admin.actualites.toastSupprimee'));
    } catch { toast.error(t('common.erreur')); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="a-chargement" />;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.actualites.titre" components={{ s: <span /> }} /></h1>
        <button className="btn btn--primary" onClick={() => ouvrir()}>{t('admin.actualites.nouvelle')}</button>
      </div>

      {/* ── MODAL CRÉATION / ÉDITION ──────────────────────────── */}
      {/* Clic sur l'overlay ferme la modal sans sauvegarder */}
      {modeForm && (
        <div className="modal-overlay" onClick={() => setModeForm(false)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">{editing ? t('admin.actualites.modalModifier') : t('admin.actualites.modalNouvelle')}</h2>
              <button className="modal__fermer" onClick={() => setModeForm(false)} aria-label={t('common.fermer')}>✕</button>
            </div>
            <form className="a-form" onSubmit={handleSubmit}>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.actualites.champTitre')} <span className="requis">*</span></label>
                <input className="a-input" value={form.titre} onChange={e => setForm(p => ({...p, titre:e.target.value}))} placeholder={t('admin.actualites.titrePlaceholder')} required />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.actualites.extrait')}</label>
                {/* Extrait : court résumé affiché sur la page liste */}
                <textarea className="a-input a-textarea" rows={2} value={form.extrait} onChange={e => setForm(p => ({...p, extrait:e.target.value}))} placeholder={t('admin.actualites.extraitPlaceholder')} />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.actualites.contenu')} <span className="requis">*</span></label>
                <div className="quill-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={form.contenu}
                    onChange={val => setForm(p => ({ ...p, contenu: val }))}
                    modules={QUILL_MODULES}
                    placeholder={t('admin.actualites.contenuPlaceholder')}
                  />
                </div>
              </div>
              {/* Checkbox : publier immédiatement ou enregistrer en brouillon */}
              <label className="publie-toggle">
                <input type="checkbox" checked={form.publie} onChange={e => setForm(p => ({...p, publie:e.target.checked}))} />
                <span>{t('admin.actualites.publierImmediatement')}</span>
              </label>
              <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModeForm(false)}>{t('common.annuler')}</button>
                <button type="submit" className="btn btn--primary" disabled={envoi}>
                  {envoi ? t('common.enregistrement') : editing ? t('admin.actualites.mettreAJour') : t('admin.actualites.creer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TABLEAU DES ACTUALITÉS ────────────────────────────── */}
      <div className="a-card">
        {actualites.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📰</span><p>{t('admin.actualites.aucune')}</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr><th>{t('admin.actualites.colTitre')}</th><th>{t('admin.actualites.colExtrait')}</th><th>{t('admin.commun.colStatut')}</th><th>{t('admin.actualites.colCree')}</th><th>{t('admin.commun.colActions')}</th></tr>
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
                      {a.publie ? t('admin.actualites.publie') : t('admin.actualites.brouillon')}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-gray)' }}>
                    {new Date(a.created_at).toLocaleDateString(getLocale())}
                  </td>
                  <td>
                    <div className="a-actions">
                      {/* Modifier : ouvre la modal en mode édition */}
                      <button className="btn btn--ghost btn--sm" onClick={() => ouvrir(a)}>✏️</button>
                      {/* Publier/Dépublier : bascule entre les deux états */}
                      <button className={`btn btn--sm ${a.publie ? 'btn--outline' : 'btn--primary'}`} onClick={() => togglePublier(a)}>
                        {a.publie ? t('admin.actualites.depublier') : t('admin.actualites.publier')}
                      </button>
                      {/* Supprimer : bouton discret en rouge */}
                      <button className="btn btn--sm" style={{ color:'var(--error)', background:'none', border:'none' }} onClick={() => supprimer(a.id)} title={t('common.supprimer')} aria-label={t('common.supprimer')}>🗑️</button>
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
