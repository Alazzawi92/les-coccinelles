// ============================================================
// FICHIER  : Suivi.jsx (parent)
// ROUTE    : /parent/suivi/:id
// RÔLE     : Consultation du suivi quotidien d'un enfant.
//            Layout 2 colonnes : calendrier des jours | détail.
//            Charge en parallèle : données enfant + liste des suivis.
//            Le suivi le plus récent est sélectionné par défaut.
//            EMOJI_REPAS : objet avec emoji + libellé + couleur CSS.
//            EMOJI_HUMEUR : objet emoji par valeur.
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import '../../../styles/parent.css';
import './Suivi.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

// Mappage des valeurs de repas vers emoji + classe CSS de couleur
// (le libellé est traduit via common.repasValeur.<valeur>)
const EMOJI_REPAS  = {
  tout:   { e: '😋', c: 'vert'   },
  peu:    { e: '😐', c: 'orange' },
  rien:   { e: '😕', c: 'rouge'  },
  absent: { e: '—',  c: 'gris'   }
};

// Mappage des valeurs d'humeur vers emoji
const EMOJI_HUMEUR = { joyeux: '😄', calme: '😊', fatigue: '😴', pleureur: '😢', autre: '😐' };

const Suivi = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // :id = identifiant de l'enfant passé dans l'URL
  const { id }               = useParams();
  // Liste de tous les suivis de cet enfant (triés par date desc côté API)
  const [suivis,      setSuivis]      = useState([]);
  // Données de l'enfant (pour afficher son prénom)
  const [enfant,      setEnfant]      = useState(null);
  // Suivi sélectionné dans le calendrier (détail affiché à droite)
  const [selectionne, setSelectionne] = useState(null);
  // Masque le contenu pendant le chargement
  const [chargement,  setChargement]  = useState(true);

  // ── Chargement parallèle : enfant + liste des suivis ─────
  useEffect(() => {
    const charger = async () => {
      try {
        const [resEnfant, resSuivis] = await Promise.all([
          api.get(`/enfants/${id}`),
          api.get(`/suivi/${id}`)
        ]);
        setEnfant(resEnfant.data.data);
        const s = resSuivis.data.data || [];
        setSuivis(s);
        // Affiche le suivi le plus récent par défaut (premier de la liste triée par date desc)
        if (s.length > 0) setSelectionne(s[0]);
      } catch { /* Erreur ou pas de suivi disponible */ }
      setChargement(false);
    };
    charger();
  }, [id]); // Se relance si l'id dans l'URL change

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="p-chargement" />;

  return (
    <div className="suivi-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <div>
          {/* Lien retour vers la liste des enfants */}
          <Link to="/parent/mes-enfants" className="retour-lien-parent">{t('parent.suivi.retour')}</Link>
          <h1 className="parent-page-titre"><Trans i18nKey="parent.suivi.titre" values={{ prenom: enfant?.prenom }} components={{ s: <span /> }} /></h1>
        </div>
      </div>

      {suivis.length === 0 ? (
        // État vide : l'équipe n'a pas encore saisi de suivi
        <div className="p-vide">
          <span className="p-vide__icone">📋</span>
          <p>{t('parent.suivi.pasEncore', { prenom: enfant?.prenom })}</p>
          <p style={{ fontSize: '0.85rem' }}>{t('parent.suivi.renseigne')}</p>
        </div>
      ) : (
        <div className="suivi-layout">

          {/* ── LISTE DES JOURS (CALENDRIER) ──────────────────── */}
          <div className="suivi-calendrier">
            <h2 className="suivi-calendrier__titre">{t('parent.suivi.historique')}</h2>
            {suivis.map(s => (
              <button
                key={s.id}
                className={`suivi-jour-btn ${selectionne?.id === s.id ? 'suivi-jour-btn--actif' : ''}`}
                onClick={() => setSelectionne(s)}
              >
                {/* Date courte : dim. 01 jan. */}
                <span className="suivi-jour-date">
                  {new Date(s.date_suivi).toLocaleDateString(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                {/* Emoji humeur ou 😊 par défaut si non renseigné */}
                <span className="suivi-jour-humeur">{EMOJI_HUMEUR[s.humeur] || '😊'}</span>
              </button>
            ))}
          </div>

          {/* ── DÉTAIL DU SUIVI SÉLECTIONNÉ ───────────────────── */}
          {selectionne && (
            <div className="suivi-detail">
              {/* Date complète du suivi sélectionné */}
              <h2 className="suivi-detail__date">
                📅 {new Date(selectionne.date_suivi).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>

              {/* ── REPAS ──────────────────────────────────────── */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">🍽️ {t('parent.suivi.repas')}</h3>
                <div className="repas-grille">
                  {[
                    { cle: 'matin',  valeur: selectionne.repas_matin   },
                    { cle: 'midi',   valeur: selectionne.repas_midi    },
                    { cle: 'gouter', valeur: selectionne.repas_gouter  }
                  ].map(({ cle, valeur }) => {
                    // Fallback sur 'absent' si valeur inconnue
                    const v = EMOJI_REPAS[valeur] ? valeur : 'absent';
                    const r = EMOJI_REPAS[v];
                    return (
                      <div key={cle} className={`repas-bloc repas-bloc--${r.c}`}>
                        <span className="repas-emoji">{r.e}</span>
                        <span className="repas-moment">{t(`parent.suivi.moments.${cle}`)}</span>
                        <span className="repas-libelle">{t(`common.repasValeur.${v}`)}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Note repas optionnelle */}
                {selectionne.repas_note && <p className="suivi-note-texte">💬 {selectionne.repas_note}</p>}
              </div>

              {/* ── SIESTE ─────────────────────────────────────── */}
              {/* L'équipe saisit les siestes dans le tableau "siestes" (siestes multiples
                  possibles) ; sieste_debut/sieste_fin sont d'anciens champs conservés
                  en repli si jamais renseignés directement. */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">😴 {t('parent.suivi.sieste')}</h3>
                {selectionne.siestes?.length > 0 ? (
                  <div className="sieste-info">
                    {selectionne.siestes.map((sv, idx) => (
                      <span key={idx} className="sieste-heure">{sv.debut} → {sv.fin}</span>
                    ))}
                    {selectionne.sieste_note && <p className="suivi-note-texte">💬 {selectionne.sieste_note}</p>}
                  </div>
                ) : selectionne.sieste_debut ? (
                  <div className="sieste-info">
                    {/* Plage horaire : HH:mm → HH:mm */}
                    <span className="sieste-heure">{selectionne.sieste_debut} → {selectionne.sieste_fin}</span>
                    {selectionne.sieste_note && <p className="suivi-note-texte">💬 {selectionne.sieste_note}</p>}
                  </div>
                ) : (
                  <p className="suivi-info-vide">{t('parent.suivi.pasDeSieste')}</p>
                )}
              </div>

              {/* ── JOURNÉE : humeur + activités + température ─── */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">🎨 {t('parent.suivi.journee')}</h3>
                {selectionne.humeur && (
                  <div className="humeur-bloc">
                    <span className="humeur-emoji">{EMOJI_HUMEUR[selectionne.humeur]}</span>
                    <span className="humeur-label">{t(`common.humeur.${selectionne.humeur}`, { defaultValue: selectionne.humeur })}</span>
                  </div>
                )}
                {selectionne.activites && (
                  <div className="activites-bloc">
                    <p className="activites-titre">{t('parent.suivi.activites')}</p>
                    <p>{selectionne.activites}</p>
                  </div>
                )}
                {selectionne.temperature && (
                  <div className="temperature-bloc">
                    🌡️ {t('parent.suivi.temperature')} <strong>{selectionne.temperature}°C</strong>
                  </div>
                )}
              </div>

              {/* ── MESSAGE DE L'ÉQUIPE ─────────────────────────── */}
              {/* Note générale : visible uniquement par le parent */}
              {selectionne.note_generale && (
                <div className="suivi-message-equipe">
                  <h3>💌 {t('parent.suivi.messageEquipe')}</h3>
                  <p>{selectionne.note_generale}</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Suivi;
