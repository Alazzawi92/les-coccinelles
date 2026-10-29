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
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import i18n, { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Documents.css';
import Chargement from '../../../components/ui/Chargement/Chargement';
import { TAILLE_MAX_DOCUMENT_MO, documentTropLourd } from '../../../config/limites'; // Taille max partagée

// Métadonnées d'affichage pour chaque catégorie de document
// (libellé traduit via common.categorieDoc.<clé>)
const CATEGORIES = {
  identite: { icone: '🪪', color: 'bleu'  },
  medical:  { icone: '🏥', color: 'rouge' },
  caf:      { icone: '💳', color: 'vert'  },
  autre:    { icone: '📄', color: 'gris'  }
};

// Formatage de la taille : en Mo si > 1 Mo, sinon en Ko (unités traduites)
const formatTaille = (o) => o > 1048576
  ? i18n.t('common.taille.mo', { n: (o/1048576).toFixed(1) })
  : i18n.t('common.taille.ko', { n: Math.round(o/1024) });

const Documents = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Libellé traduit d'une catégorie, précédé de son icône
  const libelleCategorie = (cle) => `${CATEGORIES[cle].icone} ${t(`common.categorieDoc.${cle}`)}`;
  // Liste des documents uploadés par ce parent
  const [documents,  setDocuments]  = useState([]);
  // Pièces envoyées avec les demandes d'inscription (lecture seule)
  const [piecesInscription, setPiecesInscription] = useState([]);
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

  // Choix d'un fichier (clic ou glisser-déposer) : refusé tout de suite s'il est trop lourd
  const choisirFichier = (f) => {
    if (!f) return;
    if (documentTropLourd(f)) {
      toast.error(t('common.fichierTropLourd', { nom: f.name, max: TAILLE_MAX_DOCUMENT_MO }));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFichier(f);
  };

  // ── Chargement initial : documents + enfants en parallèle ─
  useEffect(() => {
    const charger = async () => {
      try {
        const [rd, re, rp] = await Promise.all([
          api.get('/documents'),
          api.get('/enfants'),
          api.get('/inscriptions/mes-documents').catch(() => ({ data: { data: [] } })) // Section facultative
        ]);
        setDocuments(rd.data.data || []);
        setEnfants(re.data.data || []);
        setPiecesInscription(rp.data.data || []);
      } catch {}
      setChargement(false);
    };
    charger();
  }, []);

  // ── Uploader un document ──────────────────────────────────
  // POST /documents avec FormData (multipart)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fichier) { toast.error(t('parent.documents.selectionnez')); return; }

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
      toast.success(t('parent.documents.toastUpload'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('parent.documents.erreurUpload'));
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
    } catch { toast.error(t('common.erreurTelechargement')); }
  };

  // ── Ouvrir une pièce d'inscription (stockage privé) ───────
  // Téléchargée avec le jeton de connexion puis affichée dans un nouvel onglet.
  // Type re-choisi dans une liste autorisée (jamais ouvert comme une page web).
  const ouvrirPieceInscription = async (piece) => {
    const onglet = window.open('', '_blank');               // Ouvert au clic (anti pop-up)
    try {
      const res = await api.get(`/inscriptions/${piece.inscription_id}/documents/${piece.id}/fichier`, { responseType: 'blob' });
      const TYPES_SURS = ['application/pdf', 'image/jpeg', 'image/png'];
      const type = TYPES_SURS.includes(res.data.type) ? res.data.type : 'application/octet-stream';
      const url  = URL.createObjectURL(new Blob([res.data], { type }));
      if (onglet) onglet.location.href = url; else window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch {
      onglet?.close();
      toast.error(t('common.erreurTelechargement'));
    }
  };

  // ── Supprimer un document ─────────────────────────────────
  const handleSuppression = async (id) => {
    if (!window.confirm(t('parent.documents.confirmerSuppression'))) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success(t('parent.documents.toastSupprime'));
    } catch { toast.error(t('common.erreurSuppression')); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="p-chargement" />;

  return (
    <div className="documents-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.documents.titre" components={{ s: <span /> }} /></h1>
      </div>

      {/* ── ZONE D'UPLOAD ─────────────────────────────────────── */}
      <div className="p-card upload-zone">
        <h2 className="p-card__titre">📤 {t('parent.documents.envoyerTitre')}</h2>
        <form className="p-form upload-form" onSubmit={handleUpload}>

          {/* Drop-zone cliquable et glisser-déposer */}
          <div
            className={`drop-zone ${fichier ? 'drop-zone--fichier' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()} // Nécessaire pour autoriser le drop
            onDrop={e => { e.preventDefault(); choisirFichier(e.dataTransfer.files[0]); }}
          >
            {/* Input masqué — déclenché par le clic sur la drop-zone */}
            <input type="file" ref={inputRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => choisirFichier(e.target.files[0])} />
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
                <p>{t('parent.documents.dropZone')}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{t('parent.documents.formats', { max: TAILLE_MAX_DOCUMENT_MO })}</p>
              </>
            )}
          </div>

          {/* Sélecteurs catégorie + enfant côte à côte */}
          <div className="p-form-row">
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.documents.categorie')}</label>
              <select className="p-input" value={formUpload.categorie} onChange={e => setFormUpload(p => ({...p, categorie: e.target.value}))}>
                {Object.keys(CATEGORIES).map(k => <option key={k} value={k}>{libelleCategorie(k)}</option>)}
              </select>
            </div>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.documents.enfant')}</label>
              <select className="p-input" value={formUpload.enfant_id} onChange={e => setFormUpload(p => ({...p, enfant_id: e.target.value}))}>
                <option value="">{t('parent.documents.nonSpecifie')}</option>
                {enfants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
          </div>

          {/* Description facultative */}
          <div className="p-form-groupe">
            <label className="p-label">{t('parent.documents.description')}</label>
            <input className="p-input" value={formUpload.description} onChange={e => setFormUpload(p => ({...p, description: e.target.value}))} placeholder={t('parent.documents.descriptionPlaceholder')} />
          </div>

          <button type="submit" className="btn btn--primary" disabled={upload || !fichier}>
            {upload ? t('parent.documents.upload') : t('parent.documents.envoyer')}
          </button>
        </form>
      </div>

      {/* ── LISTE DES DOCUMENTS ───────────────────────────────── */}
      {documents.length === 0 ? (
        <div className="p-vide">
          <span className="p-vide__icone">📂</span>
          <p>{t('parent.documents.aucun')}</p>
        </div>
      ) : (
        <div className="p-card">
          <h2 className="p-card__titre">📂 {t('parent.documents.mesDocuments', { n: documents.length })}</h2>
          <div className="documents-liste">
            {documents.map(doc => {
              // Fallback sur 'autre' si catégorie inconnue
              const cleCat = CATEGORIES[doc.categorie] ? doc.categorie : 'autre';
              const cat    = CATEGORIES[cleCat];
              return (
                <div key={doc.id} className="document-ligne">
                  <span className="doc-icone">📄</span>
                  <div className="doc-infos">
                    <p className="doc-nom">{doc.nom_fichier}</p>
                    {/* Métadonnées : catégorie + description + taille + date */}
                    <div className="doc-meta">
                      <span className={`doc-categorie doc-categorie--${cat.color}`}>{libelleCategorie(cleCat)}</span>
                      {doc.description && <span className="doc-description">{doc.description}</span>}
                      <span className="doc-taille">{formatTaille(doc.taille)}</span>
                      <span className="doc-date">{new Date(doc.created_at).toLocaleDateString(getLocale())}</span>
                    </div>
                  </div>
                  <div className="doc-actions">
                    {/* Télécharger */}
                    <button className="btn btn--ghost btn--sm" onClick={() => handleTelechargement(doc)} title={t('common.telecharger')} aria-label={t('common.telecharger')}>⬇️</button>
                    {/* Supprimer : bordure rouge pour marquer l'action destructive */}
                    <button className="btn btn--outline btn--sm" onClick={() => handleSuppression(doc.id)} style={{ color:'var(--error)', borderColor:'var(--error)' }} title={t('common.supprimer')} aria-label={t('common.supprimer')}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PIÈCES DES DEMANDES D'INSCRIPTION ─────────────────── */}
      {/* Envoyées avec le formulaire d'inscription : consultables ici, non
          supprimables (elles font partie du dossier de la crèche) */}
      {piecesInscription.length > 0 && (
        <div className="p-card" style={{ marginTop: 'var(--space-xl)' }}>
          <h2 className="p-card__titre">📝 {t('parent.documents.piecesInscription', { n: piecesInscription.length })}</h2>
          <div className="documents-liste">
            {piecesInscription.map(piece => (
              <div key={piece.id} className="document-ligne">
                <span className="doc-icone">📎</span>
                <div className="doc-infos">
                  <p className="doc-nom">{piece.label}</p>
                  <div className="doc-meta">
                    {piece.enfant && <span className="doc-categorie doc-categorie--bleu">{piece.enfant.prenom} {piece.enfant.nom}</span>}
                    <span className="doc-description">{piece.fichier_nom}</span>
                    <span className="doc-date">{new Date(piece.created_at).toLocaleDateString(getLocale())}</span>
                  </div>
                </div>
                <div className="doc-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => ouvrirPieceInscription(piece)}
                    title={t('parent.documents.voirPiece')} aria-label={`${t('parent.documents.voirPiece')} : ${piece.label}`}>👁</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Documents;
