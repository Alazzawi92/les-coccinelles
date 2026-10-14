// ============================================================
// FICHIER  : Actualites.jsx
// ROUTES   : /actualites (liste) | /actualites/:id (détail)
// RÔLE     : Page des actualités de la crèche.
//            Le composant racine choisit entre la liste paginée
//            et le détail d'une actualité selon la présence de :id.
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import './Actualites.css';

// ── Composant liste des actualités ────────────────────────────
// Affiche une grille paginée (6 par page) avec squelette de chargement
const ListeActualites = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [actualites, setActualites] = useState([]);
  const [chargement, setChargement] = useState(true);  // Affiche les skeletons
  const [page,       setPage]       = useState(1);      // Page courante (commence à 1)
  const [totalPages, setTotalPages] = useState(1);      // Nombre total de pages

  // Recharge les actualités à chaque changement de page
  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const res = await api.get(`/actualites?page=${page}&limite=6`);
        setActualites(res.data.data?.actualites || []);
        setTotalPages(res.data.data?.pages || 1);
      } catch { /* API non disponible : liste vide */ }
      setChargement(false);
    };
    charger();
  }, [page]); // Se déclenche à chaque changement de numéro de page

  return (
    <div className="actualites-page">

      {/* Hero */}
      <section className="page-hero page-hero--orange">
        <div className="container">
          <p className="page-hero__tag">📰 {t('public.actualites.tag')}</p>
          <h1 className="page-hero__titre"><Trans i18nKey="public.actualites.titre" components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t('public.actualites.sousTitre')}</p>
        </div>
      </section>

      <section className="section-blanche">
        <div className="container">

          {/* ── État de chargement : cartes squelettes ──────── */}
          {chargement ? (
            <div className="chargement-grille">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" />)}
            </div>

          /* ── Aucune actualité en base ───────────────────── */
          ) : actualites.length === 0 ? (
            <div className="liste-vide">
              <span>📰</span>
              <p>{t('public.actualites.aucune')}</p>
            </div>

          /* ── Liste + pagination ──────────────────────────── */
          ) : (
            <>
              <div className="actualites-grille">
                {actualites.map((actu) => (
                  <Link key={actu.id} to={`/actualites/${actu.id}`} className="actu-carte">
                    {/* Vignette : image de l'actualité, sinon fond dégradé avec icône */}
                    <div className="actu-carte__vignette">
                      {actu.image
                        ? <img src={actu.image} alt={actu.titre} />
                        : <span className="actu-carte__icone">📰</span>}
                    </div>

                    <div className="actu-carte__corps">
                      {/* Date formatée dans la langue active, en badge */}
                      <span className="actu-date">
                        {new Date(actu.date_publication).toLocaleDateString(getLocale(), {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                      <h2 className="actu-titre-liste">{actu.titre}</h2>
                      <p className="actu-extrait">{actu.extrait}</p>
                      <span className="actu-carte__lire">{t('public.actualites.lireSuite')} <span>→</span></span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination : affichée seulement s'il y a plusieurs pages */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}  // Désactivé sur la première page
                  >{t('public.actualites.precedent')}</button>
                  <span className="pagination__info">{t('public.actualites.page', { page, total: totalPages })}</span>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}  // Désactivé sur la dernière page
                  >{t('public.actualites.suivant')}</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

// ── Composant détail d'une actualité ──────────────────────────
// Chargé quand l'URL contient un :id
const DetailActualite = ({ id }) => {
  const [actu,       setActu]       = useState(null);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get(`/actualites/${id}`);
        setActu(res.data.data);
      } catch {
        navigate('/actualites'); // Actualité introuvable → retour à la liste
      }
      setChargement(false);
    };
    charger();
  }, [id, navigate]); // Se déclenche si l'id change dans l'URL

  if (chargement) return <div className="page-loader">{t('common.chargement')}</div>;
  if (!actu)      return null; // Composant démonté après navigate()

  return (
    <div className="actualite-detail">
      <div className="container">

        {/* Fil d'Ariane : retour à la liste */}
        <Link to="/actualites" className="retour-lien">{t('public.actualites.retour')}</Link>

        {/* Image principale de l'article */}
        {actu.image && <img src={actu.image} alt={actu.titre} className="detail-image" />}

        <article className="detail-article">
          {/* Date longue : "mardi 15 janvier 2025" / "Tuesday 15 January 2025" */}
          <p className="actu-date">
            {new Date(actu.date_publication).toLocaleDateString(getLocale(), {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <h1 className="detail-titre">{actu.titre}</h1>

          {/* Auteur (optionnel) */}
          {actu.auteur && (
            <p className="detail-auteur">{t('public.actualites.par', { prenom: actu.auteur.prenom, nom: actu.auteur.nom })}</p>
          )}

          {/* Contenu HTML riche (wysiwyg ou markdown converti) */}
          <div className="detail-contenu" dangerouslySetInnerHTML={{ __html: actu.contenu }} />
        </article>
      </div>
    </div>
  );
};

// ── Composant principal : choix liste ou détail ───────────────
const Actualites = () => {
  const { id } = useParams(); // :id présent → vue détail, sinon → vue liste
  return id ? <DetailActualite id={id} /> : <ListeActualites />;
};

export default Actualites;
