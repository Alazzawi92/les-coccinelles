// ============================================================
// FICHIER  : GaleriePrivee.jsx (parent)
// ROUTE    : /parent/galerie
// RÔLE     : Galerie photos privée du parent (Phase 5).
//            Charge en parallèle albums + consentements RGPD.
//            Bannière d'alerte si un enfant sans consentement.
//            Photo avec photo.floue=true → classe CSS --floue + overlay 🔒.
//            Téléchargement via GET /galerie/photos/:id/download (Blob).
//            Lightbox sur clic (chemin_web = taille web 1200px).
//            sanConsentement : compte des enfants sans consentement accordé.
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './GaleriePrivee.css';

const GaleriePrivee = () => {
  // Liste de tous les albums visibles par ce parent
  const [albums,        setAlbums]        = useState([]);
  // Album actuellement ouvert (null = vue liste)
  const [albumOuvert,   setAlbumOuvert]   = useState(null);
  // Photos de l'album ouvert
  const [photos,        setPhotos]        = useState([]);
  // Photo sélectionnée pour la lightbox (null = fermée)
  const [photoZoom,     setPhotoZoom]     = useState(null);
  // Statuts de consentement par enfant (pour la bannière d'alerte)
  const [consentements, setConsentements] = useState([]);
  // Masque la vue pendant le chargement initial
  const [chargement,    setChargement]    = useState(true);
  // Indicateur de chargement des photos (distinct du chargement initial)
  const [chargAlbum,    setChargAlbum]    = useState(false);

  // ── Chargement initial : albums + consentements en parallèle ─
  useEffect(() => {
    const charger = async () => {
      try {
        const [rAlbums, rConsent] = await Promise.all([
          api.get('/galerie/albums'),
          api.get('/galerie/consentement')
        ]);
        setAlbums(rAlbums.data.data || []);
        setConsentements(rConsent.data.data || []);
      } catch {}
      setChargement(false);
    };
    charger();
  }, []);

  // ── Ouvrir un album et charger ses photos ────────────────
  const ouvrirAlbum = async (album) => {
    setAlbumOuvert(album);
    setChargAlbum(true);
    try {
      const r = await api.get(`/galerie/albums/${album.id}`);
      setPhotos(r.data.data?.photos || []);
    } catch { setPhotos([]); }
    setChargAlbum(false);
  };

  // ── Télécharger une photo ─────────────────────────────────
  // GET /galerie/photos/:id/download en Blob → URL temporaire
  const telecharger = async (photo) => {
    try {
      const res = await api.get(`/galerie/photos/${photo.id}/download`, { responseType: 'blob' });
      const url  = URL.createObjectURL(res.data);
      Object.assign(document.createElement('a'), { href: url, download: `photo_coccinelles_${photo.id}.jpg` }).click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de télécharger cette photo');
    }
  };

  // Nombre d'enfants sans consentement → déclenche la bannière d'alerte
  const sanConsentement = consentements.filter(e => !e.consentement?.consenti).length;

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="galerie-privee">

      {/* ── EN-TÊTE CONTEXTUEL ────────────────────────────────── */}
      {/* Album ouvert : bouton "← Tous les albums" + titre album */}
      {/* Vue liste : titre standard */}
      <div className="parent-page-header">
        {albumOuvert ? (
          <div>
            <button className="retour-lien-parent" onClick={() => { setAlbumOuvert(null); setPhotos([]); }}>
              ← Tous les albums
            </button>
            <h1 className="parent-page-titre">{albumOuvert.titre}</h1>
          </div>
        ) : (
          <h1 className="parent-page-titre">Galerie <span>photos</span></h1>
        )}
      </div>

      {/* ── BANNIÈRE D'ALERTE RGPD ────────────────────────────── */}
      {/* Affichée uniquement sur la vue liste si un enfant sans consentement */}
      {!albumOuvert && sanConsentement > 0 && (
        <div className="rgpd-alerte">
          <span>🔒</span>
          <div>
            <p>
              <strong>{sanConsentement} enfant(s)</strong> n'ont pas de consentement photo.
              Certaines photos seront floues.
            </p>
            <Link to="/parent/consentement" className="rgpd-alerte__lien">
              Gérer le consentement →
            </Link>
          </div>
        </div>
      )}

      {/* ── VUE LISTE DES ALBUMS ──────────────────────────────── */}
      {!albumOuvert && (
        albums.length === 0 ? (
          <div className="p-vide">
            <span className="p-vide__icone">🖼️</span>
            <p>Aucun album disponible pour le moment.</p>
          </div>
        ) : (
          <div className="albums-grille-parent">
            {albums.map(album => (
              <button key={album.id} className="album-carte-parent" onClick={() => ouvrirAlbum(album)}>
                {/* Couverture : image ou émoji par défaut */}
                <div className="album-couverture-parent">
                  {album.couverture ? <img src={album.couverture} alt={album.titre} /> : <span>📷</span>}
                </div>
                <div className="album-infos-parent">
                  <h3>{album.titre}</h3>
                  {album.description && <p>{album.description}</p>}
                  <p className="album-date-parent">
                    {new Date(album.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ── VUE PHOTOS DE L'ALBUM OUVERT ─────────────────────── */}
      {albumOuvert && (
        <>
          {chargAlbum ? (
            <div className="p-chargement">Chargement des photos...</div>
          ) : photos.length === 0 ? (
            <div className="p-vide">
              <span className="p-vide__icone">📷</span>
              <p>Cet album ne contient pas encore de photos.</p>
            </div>
          ) : (
            <>
              <p className="photos-compteur">{photos.length} photo(s)</p>
              <div className="photos-grille-parent">
                {photos.map(photo => (
                  // Classe --floue si photo.floue=true (enfant sans consentement)
                  <div key={photo.id} className={`photo-item-parent ${photo.floue ? 'photo-item-parent--floue' : ''}`}>
                    <div
                      className="photo-img-wrapper"
                      // Clic désactivé sur les photos floutées
                      onClick={() => !photo.floue && setPhotoZoom(photo)}
                    >
                      <img src={photo.chemin_miniature} alt={photo.legende || 'Photo'} loading="lazy" />
                      {/* Overlay sur les photos floutées : lien vers la page de consentement */}
                      {photo.floue && (
                        <div className="photo-floue-overlay">
                          <span>🔒</span>
                          <p>Consentement requis</p>
                          <Link to="/parent/consentement" className="btn btn--primary btn--sm" onClick={e => e.stopPropagation()}>
                            Gérer
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action : uniquement si photo non floutée */}
                    {!photo.floue && (
                      <div className="photo-actions">
                        <button className="photo-action-btn" onClick={() => setPhotoZoom(photo)} title="Agrandir">🔍</button>
                        <button className="photo-action-btn" onClick={() => telecharger(photo)} title="Télécharger">⬇️</button>
                      </div>
                    )}

                    {/* Légende : affichée uniquement si non floutée */}
                    {photo.legende && !photo.floue && (
                      <p className="photo-legende-parent">{photo.legende}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── LIGHTBOX ──────────────────────────────────────────── */}
      {/* Clic sur l'overlay ferme la lightbox */}
      {photoZoom && (
        <div className="lightbox-parent" onClick={() => setPhotoZoom(null)}>
          <div className="lightbox-parent__contenu" onClick={e => e.stopPropagation()}>
            <button className="lightbox-parent__fermer" onClick={() => setPhotoZoom(null)}>✕</button>
            {/* chemin_web = version 1200px compressée par Sharp */}
            <img src={photoZoom.chemin_web} alt={photoZoom.legende || 'Photo'} />
            {photoZoom.legende && <p className="lightbox-parent__legende">{photoZoom.legende}</p>}
            <button className="btn btn--primary btn--sm lightbox-parent__dl" onClick={() => telecharger(photoZoom)}>
              ⬇️ Télécharger
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GaleriePrivee;
