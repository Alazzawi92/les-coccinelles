// ============================================================
// FICHIER  : CMS.jsx (admin)
// ROUTE    : /admin/cms (super admin uniquement)
// RÔLE     : Gestion de « Notre équipe » : les membres affichés
//            sur la page publique Équipe et sur l'accueil
//            (photo, prénom, nom, fonction, ordre d'affichage).
//            Les textes des autres pages publiques ne sont plus
//            modifiables ici : ils gardent leur contenu actuel.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import api, { BACKEND_URL } from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './CMS.css';

// ── Gestionnaire de l'équipe ─────────────────────────────────────────
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
// ── Page : titre + gestionnaire de l'équipe ──────────────────────────
const CMS = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  return (
    <div>
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.cms.titre" components={{ s: <span /> }} /></h1>
      </div>
      <p className="cms-intro">{t('admin.cms.equipeAide')}</p>

      <div className="a-card">
        <GestionnaireEquipe />
      </div>
    </div>
  );
};

export default CMS;
