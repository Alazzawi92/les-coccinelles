// ============================================================
// FICHIER  : Emargement.jsx (admin)
// ROUTE    : /admin/emargement
// RÔLE     : Pointage journalier des enfants.
//            L'admin sélectionne la date (défaut = aujourd'hui).
//            Chaque enfant apparaît avec son statut :
//              - non_arrive  : bouton "Arrivée" → POST /emargements
//              - present     : heure arrivée + bouton "Départ" → PATCH
//              - parti       : heure arrivée → heure départ + durée
//            Les heures sont éditables inline (correction possible).
//            Calcul automatique de la durée de présence.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Emargement.css';

// Date du jour au format YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Heure courante au format HH:MM
const heureActuelle = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Calculer la durée entre deux horaires "HH:MM" et retourner "Xh Ym"
const calcDuree = (debut, fin) => {
  if (!debut || !fin) return null;
  const [dh, dm] = debut.split(':').map(Number);
  const [fh, fm] = fin.split(':').map(Number);
  const diff = (fh * 60 + fm) - (dh * 60 + dm);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

// Statut d'un enfant selon son émargement
const getStatut = (emargement) => {
  if (!emargement)                  return 'non_arrive';
  if (!emargement.heure_depart)     return 'present';
  return 'parti';
};

const EmargementAdmin = () => {
  // Date sélectionnée pour le pointage
  const [date,       setDate]       = useState(today);
  // Liste { enfant, emargement|null } pour la date courante
  const [donnees,    setDonnees]    = useState([]);
  // Chargement de la liste
  const [chargement, setChargement] = useState(true);
  // { [enfant_id]: true } — bouton désactivé pendant la requête
  const [enCours,    setEnCours]    = useState({});
  // { [enfant_id]: { arrivee: 'HH:MM', depart: 'HH:MM' } } — valeurs des inputs de correction
  const [corrections, setCorrections] = useState({});

  // ── Charger les pointages du jour ────────────────────────
  const charger = useCallback(async (d) => {
    setChargement(true);
    try {
      const r = await api.get(`/emargements/${d}`);
      setDonnees(r.data.data || []);
    } catch { toast.error('Erreur chargement des pointages'); }
    setChargement(false);
  }, []);

  // Recharger quand la date change
  useEffect(() => { charger(date); }, [date, charger]);

  // ── Initialiser les inputs de correction à partir des données ──
  // Pré-remplit les champs heure avec les valeurs actuelles
  useEffect(() => {
    const initCorrections = {};
    donnees.forEach(({ enfant, emargement }) => {
      initCorrections[enfant.id] = {
        arrivee: emargement?.heure_arrivee?.slice(0, 5) || '',
        depart:  emargement?.heure_depart?.slice(0, 5)  || ''
      };
    });
    setCorrections(initCorrections);
  }, [donnees]);

  // ── Mettre à jour localement l'émargement d'un enfant ────
  const majLocale = (enfantId, nouvelEmargement) => {
    setDonnees(prev =>
      prev.map(d => d.enfant.id === enfantId ? { ...d, emargement: nouvelEmargement } : d)
    );
  };

  // ── Enregistrer l'arrivée (POST) ─────────────────────────
  const enregistrerArrivee = async (enfantId, heureArrivee) => {
    setEnCours(prev => ({ ...prev, [enfantId]: true }));
    try {
      const r = await api.post('/emargements', {
        enfant_id:    enfantId,
        date_presence: date,
        heure_arrivee: heureArrivee || heureActuelle()
      });
      majLocale(enfantId, r.data.data);
      toast.success('Arrivée enregistrée');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement arrivée');
    }
    setEnCours(prev => ({ ...prev, [enfantId]: false }));
  };

  // ── Enregistrer le départ (PATCH) ────────────────────────
  const enregistrerDepart = async (emargementId, enfantId, heureDepart) => {
    setEnCours(prev => ({ ...prev, [enfantId]: true }));
    try {
      const r = await api.patch(`/emargements/${emargementId}`, {
        heure_depart: heureDepart || heureActuelle()
      });
      majLocale(enfantId, r.data.data);
      toast.success('Départ enregistré');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement départ');
    }
    setEnCours(prev => ({ ...prev, [enfantId]: false }));
  };

  // ── Corriger une heure déjà saisie (PATCH) ───────────────
  const corrigerHeure = async (emargementId, enfantId, champ, valeur) => {
    if (!valeur) return;
    setEnCours(prev => ({ ...prev, [enfantId]: true }));
    try {
      const r = await api.patch(`/emargements/${emargementId}`, { [champ]: valeur });
      majLocale(enfantId, r.data.data);
      toast.success('Heure corrigée');
    } catch { toast.error('Erreur correction heure'); }
    setEnCours(prev => ({ ...prev, [enfantId]: false }));
  };

  // ── Supprimer un pointage (correction d'erreur) ──────────
  const supprimerPointage = async (emargementId, enfantId) => {
    if (!window.confirm('Supprimer ce pointage ?')) return;
    setEnCours(prev => ({ ...prev, [enfantId]: true }));
    try {
      await api.delete(`/emargements/${emargementId}`);
      majLocale(enfantId, null);
      toast.success('Pointage supprimé');
    } catch { toast.error('Erreur suppression'); }
    setEnCours(prev => ({ ...prev, [enfantId]: false }));
  };

  // ── Compteurs pour le résumé ──────────────────────────────
  const nbPresents   = donnees.filter(d => getStatut(d.emargement) === 'present').length;
  const nbPartis     = donnees.filter(d => getStatut(d.emargement) === 'parti').length;
  const nbNonArrive  = donnees.filter(d => getStatut(d.emargement) === 'non_arrive').length;

  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Émargement <span>journalier</span></h1>
        {/* Sélecteur de date — max = aujourd'hui */}
        <input
          type="date"
          className="a-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
          style={{ width: 'auto' }}
        />
      </div>

      {/* ── RÉSUMÉ DU JOUR ───────────────────────────────── */}
      <div className="ema-resume">
        <div className="ema-resume-tuile ema-resume-tuile--present">
          <span className="ema-resume-nb">{nbPresents}</span>
          <span className="ema-resume-label">Présent{nbPresents !== 1 ? 's' : ''}</span>
        </div>
        <div className="ema-resume-tuile ema-resume-tuile--parti">
          <span className="ema-resume-nb">{nbPartis}</span>
          <span className="ema-resume-label">Reparti{nbPartis !== 1 ? 's' : ''}</span>
        </div>
        <div className="ema-resume-tuile ema-resume-tuile--attente">
          <span className="ema-resume-nb">{nbNonArrive}</span>
          <span className="ema-resume-label">En attente</span>
        </div>
      </div>

      {/* ── LISTE DES ENFANTS ────────────────────────────── */}
      <div className="a-card">
        {donnees.length === 0 ? (
          <div className="a-vide">
            <span className="a-vide__icone">👶</span>
            <p>Aucun enfant inscrit.</p>
          </div>
        ) : (
          <table className="a-table ema-table">
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donnees.map(({ enfant, emargement }) => {
                const statut  = getStatut(emargement);
                const corr    = corrections[enfant.id] || { arrivee: '', depart: '' };
                const duree   = calcDuree(
                  emargement?.heure_arrivee?.slice(0, 5),
                  emargement?.heure_depart?.slice(0, 5)
                );
                const enAttente = enCours[enfant.id];

                return (
                  <tr key={enfant.id} className={`ema-ligne ema-ligne--${statut}`}>

                    {/* Nom de l'enfant */}
                    <td>
                      <div className="ema-enfant">
                        <span className="ema-avatar">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                        <div>
                          <strong>{enfant.prenom} {enfant.nom}</strong>
                          {enfant.groupe && <span className="ema-groupe">{enfant.groupe}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Heure d'arrivée — input éditable si pointage existant */}
                    <td>
                      {emargement ? (
                        <div className="ema-heure-bloc">
                          {/* Input de correction : pré-rempli avec l'heure enregistrée */}
                          <input
                            type="time"
                            className="a-input ema-input-heure"
                            value={corr.arrivee}
                            onChange={e => setCorrections(prev => ({
                              ...prev,
                              [enfant.id]: { ...prev[enfant.id], arrivee: e.target.value }
                            }))}
                            onBlur={() => {
                              // Sauvegarder si la valeur a changé
                              const actuelle = emargement.heure_arrivee?.slice(0, 5);
                              if (corr.arrivee && corr.arrivee !== actuelle) {
                                corrigerHeure(emargement.id, enfant.id, 'heure_arrivee', corr.arrivee);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span className="ema-non-pointe">—</span>
                      )}
                    </td>

                    {/* Heure de départ — input éditable si départ enregistré */}
                    <td>
                      {emargement?.heure_depart ? (
                        <div className="ema-heure-bloc">
                          <input
                            type="time"
                            className="a-input ema-input-heure"
                            value={corr.depart}
                            onChange={e => setCorrections(prev => ({
                              ...prev,
                              [enfant.id]: { ...prev[enfant.id], depart: e.target.value }
                            }))}
                            onBlur={() => {
                              const actuelle = emargement.heure_depart?.slice(0, 5);
                              if (corr.depart && corr.depart !== actuelle) {
                                corrigerHeure(emargement.id, enfant.id, 'heure_depart', corr.depart);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span className="ema-non-pointe">—</span>
                      )}
                    </td>

                    {/* Durée calculée */}
                    <td>
                      {duree ? (
                        <span className="ema-duree">{duree}</span>
                      ) : (
                        <span className="ema-non-pointe">—</span>
                      )}
                    </td>

                    {/* Badge statut */}
                    <td>
                      <span className={`ema-badge ema-badge--${statut}`}>
                        {{ non_arrive: 'En attente', present: 'Présent', parti: 'Reparti' }[statut]}
                      </span>
                    </td>

                    {/* Boutons d'action */}
                    <td>
                      <div className="a-actions">
                        {/* Pas encore arrivé : bouton Arrivée */}
                        {statut === 'non_arrive' && (
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => enregistrerArrivee(enfant.id)}
                            disabled={enAttente}
                          >
                            ▶ Arrivée
                          </button>
                        )}

                        {/* Présent : bouton Départ */}
                        {statut === 'present' && (
                          <button
                            className="btn btn--sm ema-btn-depart"
                            onClick={() => enregistrerDepart(emargement.id, enfant.id)}
                            disabled={enAttente}
                          >
                            ⏹ Départ
                          </button>
                        )}

                        {/* Reparti : bouton Annuler le départ */}
                        {statut === 'parti' && (
                          <button
                            className="btn btn--sm ema-btn-annuler"
                            onClick={() => corrigerHeure(emargement.id, enfant.id, 'heure_depart', null)}
                            disabled={enAttente}
                            title="Annuler le départ"
                          >
                            ↩ Annuler départ
                          </button>
                        )}

                        {/* Supprimer le pointage entier si erreur de saisie */}
                        {emargement && (
                          <button
                            className="btn btn--sm ema-btn-supprimer"
                            onClick={() => supprimerPointage(emargement.id, enfant.id)}
                            disabled={enAttente}
                            title="Supprimer ce pointage"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default EmargementAdmin;
