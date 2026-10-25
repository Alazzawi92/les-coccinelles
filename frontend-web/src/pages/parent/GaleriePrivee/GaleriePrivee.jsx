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
import { useTranslation, Trans } from 'react-i18next';
import api, { urlFichier } from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './GaleriePrivee.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

const GaleriePrivee = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
      toast.error(err.response?.data?.message || t('parent.galerie.erreurTelechargement'));
    }
  };

  // Nombre d'enfants sans consentement → déclenche la bannière d'alerte
  const sanConsentement = consentements.filter(e => !e.consentement?.consenti).length;

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="p-chargement" />;

  return (
    <div className="galerie-privee">

      {/* ── EN-TÊTE CONTEXTUEL ────────────────────────────────── */}
      {/* Album ouvert : bouton "← Tous les albums" + titre album */}
      {/* Vue liste : titre standard */}
      <div className="parent-page-header">
        {albumOuvert ? (
          <div>
            <button className="retour-lien-parent" onClick={() => { setAlbumOuvert(null); setPhotos([]); }}>
              {t('parent.galerie.tousAlbums')}
            </button>
            <h1 className="parent-page-titre">{albumOuvert.titre}</h1>
          </div>
        ) : (
          <h1 className="parent-page-titre"><Trans i18nKey="parent.galerie.titre" components={{ s: <span /> }} /></h1>
        )}
      </div>

      {/* ── BANNIÈRE D'ALERTE RGPD ────────────────────────────── */}
      {/* Affichée uniquement sur la vue liste si un enfant sans consentement */}
      {!albumOuvert && sanConsentement > 0 && (
        <div className="rgpd-alerte">
          <span>🔒</span>
          <div>
            {/* Pluriel géré par i18next (alerte_one / alerte_other) */}
            <p>
              <Trans i18nKey="parent.galerie.alerte" count={sanConsentement} />
            </p>
            <Link to="/parent/consentement" className="rgpd-alerte__lien">
              {t('parent.galerie.gererConsentement')}
            </Link>
          </div>
        </div>
      )}

      {/* ── VUE LISTE DES ALBUMS ──────────────────────────────── */}
      {!albumOuvert && (
        albums.length === 0 ? (
          <div className="p-vide">
            <span className="p-vide__icone">🖼️</span>
            <p>{t('parent.galerie.aucunAlbum')}</p>
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
                    {new Date(album.created_at).toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' })}
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
            <div className="p-chargement">{t('parent.galerie.chargementPhotos')}</div>
          ) : photos.length === 0 ? (
            <div className="p-vide">
              <span className="p-vide__icone">📷</span>
              <p>{t('parent.galerie.albumVide')}</p>
            </div>
          ) : (
            <>
              <p className="photos-compteur">{t('parent.galerie.photos', { count: photos.length })}</p>
              <div className="photos-grille-parent">
                {photos.map(photo => (
                  // Classe --floue si photo.floue=true (enfant sans consentement)
                  <div key={photo.id} className={`photo-item-parent ${photo.floue ? 'photo-item-parent--floue' : ''}`}>
                    <div
                      className="photo-img-wrapper"
                      // Clic désactivé sur les photos floutées
                      onClick={() => !photo.floue && setPhotoZoom(photo)}
                    >
                      <img src={urlFichier(photo.chemin_miniature)} alt={photo.legende || t('parent.galerie.photo')} loading="lazy" />
                      {/* Overlay sur les photos floutées : lien vers la page de consentement */}
                      {photo.floue && (
                        <div className="photo-floue-overlay">
                          <span>🔒</span>
                          <p>{t('parent.galerie.consentementRequis')}</p>
                          <Link to="/parent/consentement" className="btn btn--primary btn--sm" onClick={e => e.stopPropagation()}>
                            {t('parent.galerie.gerer')}
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action : uniquement si photo non floutée */}
                    {!photo.floue && (
                      <div className="photo-actions">
                        <button className="photo-action-btn" onClick={() => setPhotoZoom(photo)} title={t('parent.galerie.agrandir')}>🔍</button>
                        <button className="photo-action-btn" onClick={() => telecharger(photo)} title={t('common.telecharger')}>⬇️</button>
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
            <img src={urlFichier(photoZoom.chemin_web)} alt={photoZoom.legende || t('parent.galerie.photo')} />
            {photoZoom.legende && <p className="lightbox-parent__legende">{photoZoom.legende}</p>}
            <button className="btn btn--primary btn--sm lightbox-parent__dl" onClick={() => telecharger(photoZoom)}>
              {t('parent.galerie.telechargerBtn')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GaleriePrivee;
