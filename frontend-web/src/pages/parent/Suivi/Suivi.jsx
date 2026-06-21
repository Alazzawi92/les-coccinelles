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
import api from '../../../services/api';
import '../../../styles/parent.css';
import './Suivi.css';

// Mappage des valeurs de repas vers emoji + libellé + classe CSS de couleur
const EMOJI_REPAS  = {
  tout:   { e: '😋', l: 'Tout mangé',  c: 'vert'   },
  peu:    { e: '😐', l: 'Un peu',      c: 'orange' },
  rien:   { e: '😕', l: 'Rien mangé',  c: 'rouge'  },
  absent: { e: '—',  l: 'Absent',      c: 'gris'   }
};

// Mappage des valeurs d'humeur vers emoji
const EMOJI_HUMEUR = { joyeux: '😄', calme: '😊', fatigue: '😴', pleureur: '😢', autre: '😐' };

const Suivi = () => {
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
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="suivi-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <div>
          {/* Lien retour vers la liste des enfants */}
          <Link to="/parent/mes-enfants" className="retour-lien-parent">← Mes enfants</Link>
          <h1 className="parent-page-titre">Suivi de <span>{enfant?.prenom}</span></h1>
        </div>
      </div>

      {suivis.length === 0 ? (
        // État vide : l'équipe n'a pas encore saisi de suivi
        <div className="p-vide">
          <span className="p-vide__icone">📋</span>
          <p>Pas encore de suivi disponible pour {enfant?.prenom}.</p>
          <p style={{ fontSize: '0.85rem' }}>Les suivis sont renseignés par l'équipe de la crèche chaque jour.</p>
        </div>
      ) : (
        <div className="suivi-layout">

          {/* ── LISTE DES JOURS (CALENDRIER) ──────────────────── */}
          <div className="suivi-calendrier">
            <h2 className="suivi-calendrier__titre">Historique</h2>
            {suivis.map(s => (
              <button
                key={s.id}
                className={`suivi-jour-btn ${selectionne?.id === s.id ? 'suivi-jour-btn--actif' : ''}`}
                onClick={() => setSelectionne(s)}
              >
                {/* Date courte : dim. 01 jan. */}
                <span className="suivi-jour-date">
                  {new Date(s.date_suivi).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
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
                📅 {new Date(selectionne.date_suivi).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>

              {/* ── REPAS ──────────────────────────────────────── */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">🍽️ Repas</h3>
                <div className="repas-grille">
                  {[
                    { label: 'Matin',  valeur: selectionne.repas_matin   },
                    { label: 'Midi',   valeur: selectionne.repas_midi    },
                    { label: 'Goûter', valeur: selectionne.repas_gouter  }
                  ].map(({ label, valeur }) => {
                    // Fallback sur 'absent' si valeur inconnue
                    const r = EMOJI_REPAS[valeur] || EMOJI_REPAS.absent;
                    return (
                      <div key={label} className={`repas-bloc repas-bloc--${r.c}`}>
                        <span className="repas-emoji">{r.e}</span>
                        <span className="repas-moment">{label}</span>
                        <span className="repas-libelle">{r.l}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Note repas optionnelle */}
                {selectionne.repas_note && <p className="suivi-note-texte">💬 {selectionne.repas_note}</p>}
              </div>

              {/* ── SIESTE ─────────────────────────────────────── */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">😴 Sieste</h3>
                {selectionne.sieste_debut ? (
                  <div className="sieste-info">
                    {/* Plage horaire : HH:mm → HH:mm */}
                    <span className="sieste-heure">{selectionne.sieste_debut} → {selectionne.sieste_fin}</span>
                    {selectionne.sieste_note && <p className="suivi-note-texte">💬 {selectionne.sieste_note}</p>}
                  </div>
                ) : (
                  <p className="suivi-info-vide">Pas de sieste renseignée</p>
                )}
              </div>

              {/* ── JOURNÉE : humeur + activités + température ─── */}
              <div className="p-card suivi-section">
                <h3 className="suivi-section__titre">🎨 Journée</h3>
                {selectionne.humeur && (
                  <div className="humeur-bloc">
                    <span className="humeur-emoji">{EMOJI_HUMEUR[selectionne.humeur]}</span>
                    <span className="humeur-label">{selectionne.humeur}</span>
                  </div>
                )}
                {selectionne.activites && (
                  <div className="activites-bloc">
                    <p className="activites-titre">Activités du jour :</p>
                    <p>{selectionne.activites}</p>
                  </div>
                )}
                {selectionne.temperature && (
                  <div className="temperature-bloc">
                    🌡️ Température relevée : <strong>{selectionne.temperature}°C</strong>
                  </div>
                )}
              </div>

              {/* ── MESSAGE DE L'ÉQUIPE ─────────────────────────── */}
              {/* Note générale : visible uniquement par le parent */}
              {selectionne.note_generale && (
                <div className="suivi-message-equipe">
                  <h3>💌 Message de l'équipe</h3>
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
