// ============================================================
// FICHIER  : Equipe.jsx
// ROUTE    : /equipe
// RÔLE     : Page de présentation de l'équipe éducative.
//            Membres chargés via useMembresEquipe (table equipe_membres) :
//            visiteurs → simple liste prénom, nom, fonction (ListeEquipe) ;
//            parents et équipe connectés → cartes avec photos.
// ============================================================

import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { BACKEND_URL } from '../../../services/api';
import useMembresEquipe, { photoMembre } from '../../../hooks/useMembresEquipe';
import ListeEquipe from '../../../components/ui/ListeEquipe/ListeEquipe';
import './Equipe.css';

const Equipe = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { membres, chargement, avecPhotos } = useMembresEquipe();

  return (
    <div className="equipe">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--bleu">
        <div className="container">
          <p className="page-hero__tag">👥 {t('public.equipe.tag')}</p>
          <h1 className="page-hero__titre"><Trans i18nKey="public.equipe.titre" components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t('public.equipe.sousTitre')}</p>
        </div>
      </section>

      {/* ── INTRO ─────────────────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">{t('public.equipe.introTitre')}</h2>
            {t('public.equipe.intro', { returnObjects: true }).map((texte) => <p key={texte}>{texte}</p>)}
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">👩‍👧‍👦</div>
            {membres.length > 0 && (
              <div className="info-bulle">
                <strong>{membres.length}</strong>
                {/* Pluriel géré par i18next (clés membres_one / membres_other) */}
                <span>{t('public.equipe.membres', { count: membres.length })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── GRILLE DES MEMBRES ───────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">{t('public.equipe.membresTitre')}</h2>

          {chargement ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-gray)' }}>
              {t('common.chargement')}
            </div>
          ) : membres.length === 0 ? (
            <div className="liste-vide">
              <span>👥</span>
              <p>{t('public.equipe.bientot')}</p>
            </div>
          ) : !avecPhotos ? (
            // Visiteur : simple liste, sans photo
            <ListeEquipe membres={membres} />
          ) : (
            // Connecté : cartes avec photos
            <div className="equipe-grille">
              {membres.map(m => {
                // Photo envoyée seulement aux utilisateurs connectés, sinon initiales
                const photo = photoMembre(m, 'web', BACKEND_URL);
                return (
                  <div key={m.id} className="membre-carte">
                    <div className="membre-carte__avatar">
                      {photo
                        ? <img src={photo} alt={`${m.prenom} ${m.nom}`} />
                        : <span>{m.prenom[0]}{m.nom[0]}</span>
                      }
                    </div>
                    <h3 className="membre-carte__nom">{m.prenom} {m.nom}</h3>
                    <p className="membre-carte__poste">{m.titre}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>{t('public.equipe.ctaTexte')}</p>
          <Link to="/contact" className="btn btn--primary btn--lg">{t('public.equipe.ctaBouton')}</Link>
        </div>
      </section>

    </div>
  );
};

export default Equipe;
