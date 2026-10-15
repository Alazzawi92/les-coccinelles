// ============================================================
// FICHIER  : CMS.jsx (admin)
// ROUTE    : /admin/cms
// RÔLE     : Éditeur de contenu des pages statiques du site.
//            Quill WYSIWYG pour toutes les pages, sauf "equipe"
//            qui affiche un gestionnaire de cartes membres dédié.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation, Trans } from 'react-i18next';
import api, { BACKEND_URL } from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './CMS.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ]
};
const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list',
  'blockquote', 'code-block', 'link'
];

// ── Gestionnaire de l'équipe (affiché quand slug === 'equipe') ────────
const GestionnaireEquipe = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [membres,   setMembres]   = useState([]);
  const [form,      setForm]      = useState({ prenom: '', nom: '', titre: '', ordre: 0 });
  const [photo,     setPhoto]     = useState(null);     // fichier File
  const [apercu,    setApercu]    = useState(null);     // URL preview
  const [envoi,     setEnvoi]     = useState(false);
  const [modifId,   setModifId]   = useState(null);    // id membre en cours d'édition
  const [panneauOuvert, setPanneau] = useState(false); // formulaire visible
  const inputFichier = useRef(null);

  const charger = useCallback(() => {
    api.get('/equipe/tous')
      .then(r => setMembres(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirAjout = () => {
    setModifId(null);
    setForm({ prenom: '', nom: '', titre: '', ordre: membres.length });
    setPhoto(null);
    setApercu(null);
    setPanneau(true);
  };

  const ouvrirModif = (m) => {
    setModifId(m.id);
    setForm({ prenom: m.prenom, nom: m.nom, titre: m.titre, ordre: m.ordre });
    setPhoto(null);
    // Afficher la photo existante en aperçu
    try {
      const data = JSON.parse(m.photo);
      setApercu(`${BACKEND_URL}${data.miniature}`);
    } catch { setApercu(null); }
    setPanneau(true);
  };

  const annuler = () => {
    setPanneau(false);
    setModifId(null);
    setPhoto(null);
    setApercu(null);
  };

  const choisirFichier = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setApercu(URL.createObjectURL(f));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.titre)
      return toast.error(t('admin.cms.equipe.requis'));

    setEnvoi(true);
    try {
      const fd = new FormData();
      fd.append('prenom', form.prenom);
      fd.append('nom',    form.nom);
      fd.append('titre',  form.titre);
      fd.append('ordre',  form.ordre);
      if (photo) fd.append('photo', photo);

      if (modifId) {
        await api.put(`/equipe/${modifId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(t('admin.cms.equipe.toastMaj'));
      } else {
        await api.post('/equipe', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(t('admin.cms.equipe.toastAjoute'));
      }
      charger();
      annuler();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.erreur'));
    }
    setEnvoi(false);
  };

  const supprimer = async (m) => {
    if (!window.confirm(t('admin.cms.equipe.confirmerSuppression', { nom: `${m.prenom} ${m.nom}` }))) return;
    try {
      await api.delete(`/equipe/${m.id}`);
      toast.success(t('admin.cms.equipe.toastSupprime'));
      charger();
    } catch { toast.error(t('common.erreur')); }
  };

  const photoUrl = (membre) => {
    try {
      const data = JSON.parse(membre.photo);
      return `${BACKEND_URL}${data.miniature}`;
    } catch { return null; }
  };

  return (
    <div>
      {/* ── En-tête + bouton Ajouter ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
          {t('admin.cms.equipe.membres', { count: membres.length })}
        </p>
        <button className="btn btn--primary btn--sm" onClick={ouvrirAjout}>
          {t('admin.cms.equipe.ajouter')}
        </button>
      </div>

      {/* ── Formulaire ajout / modification ── */}
      {panneauOuvert && (
        <div className="equipe-form-panneau">
          <h3 className="equipe-form-titre">
            {modifId ? t('admin.cms.equipe.modifierTitre') : t('admin.cms.equipe.nouveauTitre')}
          </h3>
          <form onSubmit={soumettre} className="equipe-form">

            {/* Photo */}
            <div className="equipe-form-photo">
              <div
                className="equipe-photo-preview"
                onClick={() => inputFichier.current?.click()}
                style={{ backgroundImage: apercu ? `url(${apercu})` : 'none' }}
              >
                {!apercu && <span><Trans i18nKey="admin.cms.equipe.choisirPhoto" /></span>}
              </div>
              <input
                ref={inputFichier}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={choisirFichier}
              />
              <p className="equipe-form-hint">{t('admin.cms.equipe.formats')}</p>
            </div>

            {/* Champs texte */}
            <div className="equipe-form-champs">
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.cms.equipe.prenom')}</label>
                <input className="a-input" value={form.prenom}
                  onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                  placeholder={t('admin.cms.equipe.prenomPlaceholder')} />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.cms.equipe.nom')}</label>
                <input className="a-input" value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder={t('admin.cms.equipe.nomPlaceholder')} />
              </div>
              <div className="a-form-groupe" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">{t('admin.cms.equipe.poste')}</label>
                <input className="a-input" value={form.titre}
                  onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder={t('admin.cms.equipe.postePlaceholder')} />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.cms.equipe.ordre')}</label>
                <input className="a-input" type="number" min="0" value={form.ordre}
                  onChange={e => setForm(p => ({ ...p, ordre: e.target.value }))} />
              </div>
            </div>

            <div className="equipe-form-actions">
              <button type="button" className="btn btn--ghost" onClick={annuler}>{t('common.annuler')}</button>
              <button type="submit" className="btn btn--primary" disabled={envoi}>
                {envoi ? t('common.enregistrement') : modifId ? t('admin.cms.equipe.mettreAJour') : t('admin.cms.equipe.ajouterBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Grille des membres ── */}
      {membres.length === 0 ? (
        <div className="a-vide">
          <span className="a-vide__icone">👥</span>
          <p>{t('admin.cms.equipe.aucun')}</p>
        </div>
      ) : (
        <div className="equipe-admin-grille">
          {membres.map(m => (
            <div key={m.id} className={`equipe-admin-carte ${!m.actif ? 'equipe-admin-carte--inactif' : ''}`}>
              <div className="equipe-admin-photo">
                {photoUrl(m)
                  ? <img src={photoUrl(m)} alt={`${m.prenom} ${m.nom}`} />
                  : <span className="equipe-admin-initiales">
                      {m.prenom[0]}{m.nom[0]}
                    </span>
                }
              </div>
              <div className="equipe-admin-info">
                <p className="equipe-admin-nom">{m.prenom} {m.nom}</p>
                <p className="equipe-admin-titre">{m.titre}</p>
                <p className="equipe-admin-ordre">{t('admin.cms.equipe.ordreValeur', { n: m.ordre })}</p>
              </div>
              <div className="equipe-admin-actions">
                <button className="btn btn--sm btn--ghost" onClick={() => ouvrirModif(m)} title={t('admin.cms.equipe.modifierTitre')}>✏️</button>
                <button className="btn btn--sm btn--ghost" style={{ color: 'var(--error)' }}
                  onClick={() => supprimer(m)} title={t('common.supprimer')}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Composant principal CMS ───────────────────────────────────────────
const CMS = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [pages,      setPages]      = useState([]);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState({ titre: '', contenu: '', meta_description: '' });
  const [chargement, setChargement] = useState(true);
  const [envoi,      setEnvoi]      = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    api.get('/cms/pages')
      .then(r => setPages(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  const editer = (page) => {
    setEditing(page);
    setForm({
      titre:            page.titre,
      contenu:          page.contenu          || '',
      meta_description: page.meta_description || ''
    });
  };

  const sauvegarder = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.put(`/cms/pages/${editing.slug}`, form);
      setPages(prev => prev.map(p => p.slug === editing.slug ? res.data.data : p));
      setEditing(null);
      toast.success(t('admin.cms.toastPage'));
    } catch { toast.error(t('common.erreur')); }
    setEnvoi(false);
  };

  const estEquipe = editing?.slug === 'equipe';

  if (chargement) return <Chargement className="a-chargement" />;

  return (
    <div>
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.cms.titre" components={{ s: <span /> }} /></h1>
      </div>

      <div className="cms-layout">

        {/* ── LISTE DES PAGES ─────────────────────────────────── */}
        <div className="cms-pages-liste">
          <h2 className="a-card__titre" style={{ marginBottom: 'var(--space-md)' }}>{t('admin.cms.pagesSite')}</h2>
          {pages.map(page => (
            <button
              key={page.slug}
              className={`cms-page-item ${editing?.slug === page.slug ? 'cms-page-item--actif' : ''}`}
              onClick={() => editer(page)}
            >
              <p className="cms-page-slug">/{page.slug}</p>
              <p className="cms-page-titre-court">{page.titre}</p>
              {editing?.slug === page.slug && (
                <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>{t('admin.cms.enEdition')}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ÉDITEUR ou GESTIONNAIRE ÉQUIPE ──────────────────── */}
        <div className="cms-editeur">
          {!editing ? (
            <div className="a-vide">
              <span className="a-vide__icone">🌐</span>
              <p>{t('admin.cms.selectionnez')}</p>
            </div>

          ) : estEquipe ? (
            /* Page Équipe : gestionnaire de cartes membres */
            <div className="a-card">
              <h2 className="a-card__titre">{t('admin.cms.equipeTitre')}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: 'var(--space-lg)' }}>
                {t('admin.cms.equipeAide')}
              </p>
              <GestionnaireEquipe />
            </div>

          ) : (
            /* Toutes les autres pages : éditeur Quill */
            <div className="a-card">
              <h2 className="a-card__titre">{t('admin.cms.edition', { titre: editing.titre })}</h2>
              {/* Le CMS n'est pas multilingue : on le signale à l'admin */}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: 'var(--space-md)' }}>{t('admin.cms.noteLangue')}</p>
              <form className="a-form" onSubmit={sauvegarder}>

                <div className="a-form-groupe">
                  <label className="a-label">{t('admin.cms.titrePage')}</label>
                  <input
                    className="a-input"
                    value={form.titre}
                    onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  />
                </div>

                <div className="a-form-groupe">
                  <label className="a-label">{t('admin.cms.seo')}</label>
                  <input
                    className="a-input"
                    value={form.meta_description}
                    onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))}
                    placeholder={t('admin.cms.seoPlaceholder')}
                    maxLength={160}
                  />
                  <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                    {form.meta_description.length}/160
                  </small>
                </div>

                <div className="a-form-groupe">
                  <label className="a-label">{t('admin.cms.contenu')}</label>
                  <div className="cms-quill-wrapper">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={form.contenu}
                      onChange={val => setForm(p => ({ ...p, contenu: val }))}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      placeholder={t('admin.cms.contenuPlaceholder')}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                    {t('common.annuler')}
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={envoi}>
                    {envoi ? t('common.enregistrement') : t('admin.cms.sauvegarder')}
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
