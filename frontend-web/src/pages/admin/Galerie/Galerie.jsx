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
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Galerie.css';

const GalerieAdmin = () => {
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
      toast.success('Album créé');
    } catch { toast.error('Erreur création album'); }
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
      toast.success(`${nouvelles.length} photo(s) ajoutée(s) + parents notifiés`);
    } catch { toast.error('Erreur upload'); }
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
      toast.success('Tags mis à jour');
      setPhotoTag(null);
    } catch { toast.error('Erreur tagging'); }
  };

  // ── Supprimer une photo ───────────────────────────────────
  const supprimerPhoto = async (photoId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await api.delete(`/galerie/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo supprimée');
    } catch { toast.error('Erreur'); }
  };

  // ── Supprimer un album (et toutes ses photos) ────────────
  const supprimerAlbum = async (albumId) => {
    if (!window.confirm('Supprimer cet album et toutes ses photos ?')) return;
    try {
      await api.delete(`/galerie/albums/${albumId}`);
      setAlbums(prev => prev.filter(a => a.id !== albumId));
      toast.success('Album supprimé');
    } catch { toast.error('Erreur'); }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Galerie <span>photos</span></h1>
        {/* Bouton contextuel : "Nouvel album" ou "← Albums" selon la vue */}
        {!albumOuvert
          ? <button className="btn btn--primary" onClick={() => setModeAlbum(true)}>+ Nouvel album</button>
          : <button className="btn btn--ghost" onClick={() => { setAlbumOuvert(null); setPhotos([]); }}>← Albums</button>
        }
      </div>

      {/* ── MODAL CRÉATION D'ALBUM ────────────────────────────── */}
      {modeAlbum && (
        <div className="modal-overlay" onClick={() => setModeAlbum(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">📁 Nouvel album</h2>
              <button className="modal__fermer" onClick={() => setModeAlbum(false)}>✕</button>
            </div>
            <form className="a-form" onSubmit={creerAlbum}>
              <div className="a-form-groupe">
                <label className="a-label">Titre <span className="requis">*</span></label>
                <input className="a-input" value={formAlbum.titre} onChange={e => setFormAlbum(p=>({...p,titre:e.target.value}))} required />
              </div>
              <div className="a-form-groupe">
                <label className="a-label">Description</label>
                <textarea className="a-input a-textarea" rows={2} value={formAlbum.description} onChange={e => setFormAlbum(p=>({...p,description:e.target.value}))} />
              </div>
              {/* Options de visibilité : parents et/ou public */}
              <div style={{display:'flex',gap:'var(--space-xl)'}}>
                <label style={{display:'flex',gap:'var(--space-sm)',alignItems:'center',cursor:'pointer',fontWeight:600}}>
                  <input type="checkbox" checked={formAlbum.visible_parents} onChange={e => setFormAlbum(p=>({...p,visible_parents:e.target.checked}))} />
                  Visible parents
                </label>
                <label style={{display:'flex',gap:'var(--space-sm)',alignItems:'center',cursor:'pointer',fontWeight:600}}>
                  <input type="checkbox" checked={formAlbum.visible_public} onChange={e => setFormAlbum(p=>({...p,visible_public:e.target.checked}))} />
                  Visible public
                </label>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'var(--space-md)'}}>
                <button type="button" className="btn btn--ghost" onClick={() => setModeAlbum(false)}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? 'Création...' : 'Créer'}</button>
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
              <h2 className="modal__titre">👶 Taguer des enfants sur cette photo</h2>
              <button className="modal__fermer" onClick={() => setPhotoTag(null)}>✕</button>
            </div>
            {/* Aperçu de la miniature de la photo à taguer */}
            <img src={photoTag.photo.chemin_miniature} alt="Photo" style={{width:'100%',borderRadius:'var(--radius-lg)',marginBottom:'var(--space-lg)'}} />
            <p style={{fontSize:'0.85rem',color:'var(--text-gray)',marginBottom:'var(--space-md)'}}>
              Sélectionnez les enfants présents sur cette photo. Seules les photos d'enfants avec consentement seront visibles.
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
              <button className="btn btn--ghost" onClick={() => setPhotoTag(null)}>Annuler</button>
              <button className="btn btn--primary" onClick={sauvegarderTags}>💾 Sauvegarder les tags</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VUE LISTE DES ALBUMS ──────────────────────────────── */}
      {!albumOuvert ? (
        albums.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📷</span><p>Aucun album.</p></div>
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
                  <p>{new Date(album.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</p>
                  {/* Badges de visibilité */}
                  <div style={{display:'flex',gap:'var(--space-sm)',marginTop:4}}>
                    {album.visible_parents && <span className="s-badge s-badge--accepte">Parents</span>}
                    {album.visible_public  && <span className="s-badge s-badge--en_cours">Public</span>}
                  </div>
                </div>
                <div className="album-admin-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => ouvrirAlbum(album)}>📷 Ouvrir</button>
                  <button className="btn btn--sm" style={{color:'var(--error)',background:'none',border:'none'}} onClick={() => supprimerAlbum(album.id)}>🗑️</button>
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
            <h2 className="a-card__titre">📤 Ajouter des photos à « {albumOuvert.titre} »</h2>

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
                📁 Sélectionner ({fichiers.length} fichier(s))
              </button>
              <button className="btn btn--primary" onClick={uploadPhotos} disabled={envoi || fichiers.length === 0}>
                {envoi ? '⏳ Upload + compression...' : '📤 Envoyer (Sharp × 3 tailles)'}
              </button>
            </div>

            {/* Aperçu et tagging global : affiché seulement si des fichiers sont sélectionnés */}
            {fichiers.length > 0 && (
              <div className="upload-preview">
                <p style={{fontSize:'0.85rem',color:'var(--text-gray)',marginBottom:'var(--space-sm)'}}>
                  Fichiers sélectionnés : {fichiers.map(f=>f.name).join(', ')}
                </p>
                {/* Tagging optionnel : s'applique à toutes les photos de cet upload */}
                {enfants.length > 0 && (
                  <div>
                    <p className="a-label" style={{marginBottom:'var(--space-sm)'}}>👶 Taguer des enfants sur ces photos (optionnel)</p>
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
              ℹ️ Les parents des enfants non consentis verront leurs photos <strong>floutées</strong>. Compression automatique en 3 tailles (original, web 1200px, miniature 300px).
            </p>
          </div>

          {/* Grille des photos existantes avec boutons tag et suppression */}
          {photos.length === 0 ? (
            <div className="a-vide"><span className="a-vide__icone">🖼️</span><p>Aucune photo dans cet album.</p></div>
          ) : (
            <div className="photos-admin-grille">
              {photos.map(photo => (
                <div key={photo.id} className="photo-admin-item">
                  <img src={photo.chemin_miniature} alt={photo.legende || 'Photo'} loading="lazy" />
                  {/* Overlay avec boutons : taguer enfants | supprimer */}
                  <div className="photo-admin-overlay">
                    {/* Ouvre la modal de tagging pour cette photo spécifique */}
                    <button
                      className="photo-overlay-btn"
                      onClick={() => setPhotoTag({ photo, enfants: photo.enfants?.map(e=>e.id) || [] })}
                      title="Taguer des enfants"
                    >
                      👶
                    </button>
                    <button
                      className="photo-overlay-btn photo-overlay-btn--suppr"
                      onClick={() => supprimerPhoto(photo.id)}
                      title="Supprimer"
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
