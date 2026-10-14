// ============================================================
// FICHIER  : Galerie.jsx (admin)
// ROUTE    : /admin/galerie
// RÔLE     : Gestion de la galerie photos de la crèche (Phase 5).
//            Vue albums : liste + création (modal).
//            Vue photos : grille photos de l'album ouvert,
//            upload multiple (FormData multipart) avec tagging
//            enfants optionnel, compression Sharp 3 tailles côté serveur.
//            Modal tagging : associer des enfants à une photo
//            (RGPD : les photos d'enfants sans consentement seront floutées).
//            Suppressions : album (cascade photos) ou photo individuelle.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Galerie.css';

const GalerieAdmin = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Liste des albums chargée au montage
  const [albums,        setAlbums]        = useState([]);
  // Album actuellement ouvert (null = vue liste des albums)
  const [albumOuvert,   setAlbumOuvert]   = useState(null);
  // Photos de l'album ouvert
  const [photos,        setPhotos]        = useState([]);
  // Liste des enfants inscrits (pour le tagging)
  const [enfants,       setEnfants]       = useState([]);
  // Masque la grille pendant le chargement initial
  const [chargement,    setChargement]    = useState(true);
  // true = modal création d'album ouverte
  const [modeAlbum,     setModeAlbum]     = useState(false);
  // Valeurs du formulaire de création d'album
  const [formAlbum,     setFormAlbum]     = useState({ titre:'', description:'', visible_parents:true, visible_public:false });
  // Fichiers sélectionnés pour l'upload (tableau de File objects)
  const [fichiers,      setFichiers]      = useState([]);
  // Enfants à taguer sur toutes les photos de cet upload
  const [enfantsUpload, setEnfantsUpload] = useState([]);
  // Photo en cours de tagging dans la modal (null = modal fermée)
  const [photoTag,      setPhotoTag]      = useState(null);
  // Indicateur d'envoi pendant les requêtes POST
  const [envoi,         setEnvoi]         = useState(false);
  // Ref sur l'input file masqué (déclenché par le bouton "Sélectionner")
  const inputRef = useRef(null);

  // ── Chargement initial : albums + enfants en parallèle ───
  useEffect(() => {
    Promise.all([
      api.get('/galerie/albums'),
      api.get('/enfants')
    ]).then(([ra, re]) => {
      setAlbums(ra.data.data || []);
      setEnfants(re.data.data || []);
    }).finally(() => setChargement(false));
  }, []);

  // ── Ouvrir un album et charger ses photos ────────────────
  const ouvrirAlbum = async (album) => {
    setAlbumOuvert(album);
    try {
      const r = await api.get(`/galerie/albums/${album.id}`);
      setPhotos(r.data.data?.photos || []);
    } catch { setPhotos([]); }
  };

  // ── Créer un nouvel album ─────────────────────────────────
  // POST /galerie/albums avec titre, description, visibilités
  const creerAlbum = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.post('/galerie/albums', formAlbum);
      setAlbums(prev => [res.data.data, ...prev]);
      setModeAlbum(false);
      // Réinitialise le formulaire avec les valeurs par défaut
      setFormAlbum({ titre:'', description:'', visible_parents:true, visible_public:false });
      toast.success(t('admin.galerie.toastAlbumCree'));
    } catch { toast.error(t('admin.galerie.erreurAlbum')); }
    setEnvoi(false);
  };

  // ── Uploader des photos dans l'album ouvert ──────────────
  // POST /galerie/albums/:id/photos avec FormData (multipart)
  // Sharp compresse en 3 tailles côté serveur : original, web (1200px), miniature (300px)
  const uploadPhotos = async () => {
    if (fichiers.length === 0 || !albumOuvert) return;
    setEnvoi(true);
    try {
      const fd = new FormData();
      // Plusieurs fichiers sous la clé 'photos'
      fichiers.forEach(f => fd.append('photos', f));
      // Tagging global optionnel : ids des enfants présents sur toutes ces photos
      if (enfantsUpload.length > 0) {
        fd.append('enfant_ids', JSON.stringify(enfantsUpload));
      }
      const res = await api.post(`/galerie/albums/${albumOuvert.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const nouvelles = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      setPhotos(prev => [...prev, ...nouvelles]);
      // Réinitialise les fichiers et tags après upload
      setFichiers([]);
      setEnfantsUpload([]);
      if (inputRef.current) inputRef.current.value = '';
      toast.success(t('admin.galerie.toastUpload', { count: nouvelles.length }));
    } catch { toast.error(t('admin.galerie.erreurUpload')); }
    setEnvoi(false);
  };

  // ── Sauvegarder les tags enfants sur une photo ────────────
  // PUT /galerie/photos/:id/enfants avec { enfant_ids: [] }
  const sauvegarderTags = async () => {
    if (!photoTag) return;
    try {
      await api.put(`/galerie/photos/${photoTag.photo.id}/enfants`, {
        enfant_ids: photoTag.enfants
      });
      toast.success(t('admin.galerie.toastTags'));
      setPhotoTag(null);
    } catch { toast.error(t('admin.galerie.erreurTags')); }
  };

  // ── Supprimer une photo ───────────────────────────────────
  const supprimerPhoto = async (photoId) => {
    if (!window.confirm(t('admin.galerie.confirmerPhoto'))) return;
    try {
      await api.delete(`/galerie/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success(t('admin.galerie.toastPhotoSupprimee'));
    } catch { toast.error(t('common.erreur')); }
  };

  // ── Supprimer un album (et toutes ses photos) ────────────
  const supprimerAlbum = async (albumId) => {
    if (!window.confirm(t('admin.galerie.confirmerAlbum'))) return;
    try {
      await api.delete(`/galerie/albums/${albumId}`);
      setAlbums(prev => prev.filter(a => a.id !== albumId));
      toast.success(t('admin.galerie.toastAlbumSupprime'));
    } catch { toast.error(t('common.erreur')); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">{t('common.chargement')}</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.galerie.titre" components={{ s: <span /> }} /></h1>
        {/* Bouton contextuel : "Nouvel album" ou "← Albums" selon la vue */}
        {!albumOuvert
          ? <button className="btn btn--primary" onClick={() => setModeAlbum(true)}>{t('admin.galerie.nouvelAlbum')}</button>
          : <button className="btn btn--ghost" onClick={() => { setAlbumOuvert(null); setPhotos([]); }}>{t('admin.galerie.retourAlbums')}</button>
        }
      </div>

      {/* ── MODAL CRÉATION D'ALBUM ────────────────────────────── */}
      {modeAlbum && (
        <div className="modal-overlay" onClick={() => setModeAlbum(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">{t('admin.galerie.modalAlbum')}</h2>
              <button className="modal__fermer" onClick={() => setModeAlbum(false)} aria-label={t('common.fermer')}>✕</button>
            </div>
            <form className="a-form" onSubmit={creerAlbum}>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.galerie.champTitre')} <span className="requis">*</span></label>
                <input className="a-input" value={formAlbum.titre} onChange={e => setFormAlbum(p=>({...p,titre:e.target.value}))} required />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.galerie.description')}</label>
                <textarea className="a-input a-textarea" rows={2} value={formAlbum.description} onChange={e => setFormAlbum(p=>({...p,description:e.target.value}))} />
              </div>
              {/* Options de visibilité : parents et/ou public */}
              <div style={{display:'flex',gap:'var(--space-xl)'}}>
                <label style={{display:'flex',gap:'var(--space-sm)',alignItems:'center',cursor:'pointer',fontWeight:600}}>
                  <input type="checkbox" checked={formAlbum.visible_parents} onChange={e => setFormAlbum(p=>({...p,visible_parents:e.target.checked}))} />
                  {t('admin.galerie.visibleParents')}
                </label>
                <label style={{display:'flex',gap:'var(--space-sm)',alignItems:'center',cursor:'pointer',fontWeight:600}}>
                  <input type="checkbox" checked={formAlbum.visible_public} onChange={e => setFormAlbum(p=>({...p,visible_public:e.target.checked}))} />
                  {t('admin.galerie.visiblePublic')}
                </label>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'var(--space-md)'}}>
                <button type="button" className="btn btn--ghost" onClick={() => setModeAlbum(false)}>{t('common.annuler')}</button>
                <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? t('admin.galerie.creation') : t('admin.galerie.creer')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAGGING ENFANTS SUR UNE PHOTO ──────────────── */}
      {/* Sélection des enfants présents → sauvegarde via PUT */}
      {photoTag && (
        <div className="modal-overlay" onClick={() => setPhotoTag(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">{t('admin.galerie.modalTag')}</h2>
              <button className="modal__fermer" onClick={() => setPhotoTag(null)} aria-label={t('common.fermer')}>✕</button>
            </div>
            {/* Aperçu de la miniature de la photo à taguer */}
            <img src={photoTag.photo.chemin_miniature} alt={t('admin.galerie.photo')} style={{width:'100%',borderRadius:'var(--radius-lg)',marginBottom:'var(--space-lg)'}} />
            <p style={{fontSize:'0.85rem',color:'var(--text-gray)',marginBottom:'var(--space-md)'}}>
              {t('admin.galerie.tagAide')}
            </p>
            {/* Liste de cases à cocher pour chaque enfant */}
            <div className="tags-enfants-liste">
              {enfants.map(e => {
                const selectionne = photoTag.enfants.includes(e.id);
                return (
                  <label key={e.id} className={`tag-enfant-option ${selectionne ? 'tag-enfant-option--actif' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectionne}
                      onChange={() => setPhotoTag(prev => ({
                        ...prev,
                        // Toggle : ajoute ou retire l'id de l'enfant du tableau
                        enfants: selectionne
                          ? prev.enfants.filter(id => id !== e.id)
                          : [...prev.enfants, e.id]
                      }))}
                    />
                    <span>{e.sexe === 'F' ? '👧' : '👦'}</span>
                    <span>{e.prenom} {e.nom}</span>
                  </label>
                );
              })}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'var(--space-md)',marginTop:'var(--space-xl)'}}>
              <button className="btn btn--ghost" onClick={() => setPhotoTag(null)}>{t('common.annuler')}</button>
              <button className="btn btn--primary" onClick={sauvegarderTags}>{t('admin.galerie.sauverTags')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VUE LISTE DES ALBUMS ──────────────────────────────── */}
      {!albumOuvert ? (
        albums.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📷</span><p>{t('admin.galerie.aucunAlbum')}</p></div>
        ) : (
          <div className="albums-admin-grille">
            {albums.map(album => (
              <div key={album.id} className="album-admin-carte">
                {/* Couverture de l'album : image ou emoji par défaut */}
                <div className="album-admin-couverture" onClick={() => ouvrirAlbum(album)}>
                  {album.couverture ? <img src={album.couverture} alt={album.titre} /> : <span>📷</span>}
                </div>
                <div className="album-admin-infos">
                  <h3>{album.titre}</h3>
                  <p>{new Date(album.created_at).toLocaleDateString(getLocale(),{month:'long',year:'numeric'})}</p>
                  {/* Badges de visibilité */}
                  <div style={{display:'flex',gap:'var(--space-sm)',marginTop:4}}>
                    {album.visible_parents && <span className="s-badge s-badge--accepte">{t('admin.galerie.badgeParents')}</span>}
                    {album.visible_public  && <span className="s-badge s-badge--en_cours">{t('admin.galerie.badgePublic')}</span>}
                  </div>
                </div>
                <div className="album-admin-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => ouvrirAlbum(album)}>{t('admin.galerie.ouvrir')}</button>
                  <button className="btn btn--sm" style={{color:'var(--error)',background:'none',border:'none'}} onClick={() => supprimerAlbum(album.id)} title={t('common.supprimer')} aria-label={t('common.supprimer')}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {/* ── VUE PHOTOS DE L'ALBUM OUVERT ────────────────── */}

          {/* Zone d'upload avec sélection et tagging global */}
          <div className="a-card upload-zone-admin">
            <h2 className="a-card__titre">{t('admin.galerie.ajouterPhotos', { titre: albumOuvert.titre })}</h2>

            <div className="upload-photos-actions">
              {/* Input file masqué — déclenché par le bouton "Sélectionner" */}
              <input
                type="file"
                ref={inputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{display:'none'}}
                onChange={e => setFichiers(Array.from(e.target.files))}
              />
              <button className="btn btn--outline" onClick={() => inputRef.current?.click()}>
                {t('admin.galerie.selectionner', { count: fichiers.length })}
              </button>
              <button className="btn btn--primary" onClick={uploadPhotos} disabled={envoi || fichiers.length === 0}>
                {envoi ? t('admin.galerie.upload') : t('admin.galerie.envoyer')}
              </button>
            </div>

            {/* Aperçu et tagging global : affiché seulement si des fichiers sont sélectionnés */}
            {fichiers.length > 0 && (
              <div className="upload-preview">
                <p style={{fontSize:'0.85rem',color:'var(--text-gray)',marginBottom:'var(--space-sm)'}}>
                  {t('admin.galerie.fichiersSelectionnes', { liste: fichiers.map(f=>f.name).join(', ') })}
                </p>
                {/* Tagging optionnel : s'applique à toutes les photos de cet upload */}
                {enfants.length > 0 && (
                  <div>
                    <p className="a-label" style={{marginBottom:'var(--space-sm)'}}>{t('admin.galerie.tagUpload')}</p>
                    <div className="tags-enfants-liste">
                      {enfants.map(e => {
                        const sel = enfantsUpload.includes(e.id);
                        return (
                          <label key={e.id} className={`tag-enfant-option ${sel ? 'tag-enfant-option--actif' : ''}`}>
                            <input type="checkbox" checked={sel} onChange={() =>
                              setEnfantsUpload(prev => sel ? prev.filter(id => id !== e.id) : [...prev, e.id])
                            }/>
                            <span>{e.sexe === 'F' ? '👧' : '👦'}</span>
                            <span>{e.prenom}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note RGPD : rappel du comportement de floutage */}
            <p className="upload-info-rgpd">
              <Trans i18nKey="admin.galerie.infoRgpd" />
            </p>
          </div>

          {/* Grille des photos existantes avec boutons tag et suppression */}
          {photos.length === 0 ? (
            <div className="a-vide"><span className="a-vide__icone">🖼️</span><p>{t('admin.galerie.aucunePhoto')}</p></div>
          ) : (
            <div className="photos-admin-grille">
              {photos.map(photo => (
                <div key={photo.id} className="photo-admin-item">
                  <img src={photo.chemin_miniature} alt={photo.legende || t('admin.galerie.photo')} loading="lazy" />
                  {/* Overlay avec boutons : taguer enfants | supprimer */}
                  <div className="photo-admin-overlay">
                    {/* Ouvre la modal de tagging pour cette photo spécifique */}
                    <button
                      className="photo-overlay-btn"
                      onClick={() => setPhotoTag({ photo, enfants: photo.enfants?.map(e=>e.id) || [] })}
                      title={t('admin.galerie.taguer')}
                    >
                      👶
                    </button>
                    <button
                      className="photo-overlay-btn photo-overlay-btn--suppr"
                      onClick={() => supprimerPhoto(photo.id)}
                      title={t('common.supprimer')}
                    >
                      🗑️
                    </button>
                  </div>
                  {/* Tags enfants : prénoms affichés sous la photo si renseignés */}
                  {photo.enfants?.length > 0 && (
                    <div className="photo-enfants-tags">
                      {photo.enfants.map(e => (
                        <span key={e.id} className="photo-enfant-tag">{e.prenom}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default GalerieAdmin;
