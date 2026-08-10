// ============================================================
// FICHIER  : Rapports.jsx (admin)
// ROUTE    : /admin/rapports
// RÔLE     : Rapport de présence (temps passé à la crèche, pour
//            la facturation) et d'activités (repas, sieste) par
//            enfant, filtrable par période et par groupe.
//            Source : GET /rapports?debut=&fin=&groupe=&enfant_id=
//            qui agrège les émargements + suivis quotidiens
//            existants côté backend.
//            2 vues : tableau global par groupe, et détail
//            jour par jour d'un enfant sélectionné.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import '../../../styles/admin.css';
import './Rapports.css';

// Date du jour au format YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Premier jour du mois courant
const premierJourMois = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

// Formater des minutes en "Xh Ym"
const formatDuree = (minutes) => {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

// Formater une date "YYYY-MM-DD" en "lun. 3 juil."
const formatDateCourte = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

// Libellé lisible pour les valeurs de repas
const LABEL_REPAS = { tout: '🟢 Bien mangé', peu: '🟡 Un peu', rien: '🔴 Rien', absent: '—' };

const Rapports = () => {
  // Période sélectionnée (par défaut : depuis le 1er du mois jusqu'à aujourd'hui)
  const [debut,      setDebut]      = useState(premierJourMois());
  const [fin,        setFin]        = useState(today);
  // Liste des enfants (pour peupler le filtre groupe + le filtre enfant)
  const [enfants,    setEnfants]    = useState([]);
  const [groupe,     setGroupe]     = useState('');
  // Résultat du rapport agrégé (un objet par enfant)
  const [rapport,    setRapport]    = useState([]);
  const [chargement, setChargement] = useState(true);
  // Enfant sélectionné pour la vue détail (null = vue tableau global)
  const [detailId,   setDetailId]   = useState(null);

  // ── Chargement de la liste des enfants (une seule fois, pour le filtre groupe) ─
  useEffect(() => {
    api.get('/enfants').then(r => setEnfants(r.data.data || [])).catch(() => {});
  }, []);

  // ── Chargement du rapport à chaque changement de filtre ──
  useEffect(() => {
    setChargement(true);
    const params = new URLSearchParams({ debut, fin });
    if (groupe) params.append('groupe', groupe);
    api.get(`/rapports?${params}`)
      .then(r => setRapport(r.data.data || []))
      .catch(() => setRapport([]))
      .finally(() => setChargement(false));
  }, [debut, fin, groupe]);

  // Liste des groupes distincts présents parmi les enfants (pour le select)
  const groupes = [...new Set(enfants.map(e => e.groupe).filter(Boolean))].sort();

  // Raccourcis de période
  const appliquerPeriode = (type) => {
    const d = new Date();
    if (type === 'semaine') {
      const jour = d.getDay() || 7; // dimanche = 0 → 7
      const lundi = new Date(d); lundi.setDate(d.getDate() - jour + 1);
      setDebut(lundi.toISOString().split('T')[0]);
      setFin(today);
    } else if (type === 'mois') {
      setDebut(premierJourMois());
      setFin(today);
    }
  };

  // Ligne du rapport correspondant à l'enfant en vue détail
  const detail = rapport.find(r => r.enfant.id === detailId);

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Rapport <span>présence &amp; activités</span></h1>
      </div>

      {/* ── FILTRES ───────────────────────────────────────────── */}
      <div className="a-card rapport-filtres">
        <div className="rapport-filtre-champ">
          <label className="form-label-admin">Du</label>
          <input type="date" className="a-input" value={debut} max={fin} onChange={e => setDebut(e.target.value)} />
        </div>
        <div className="rapport-filtre-champ">
          <label className="form-label-admin">Au</label>
          <input type="date" className="a-input" value={fin} min={debut} max={today} onChange={e => setFin(e.target.value)} />
        </div>
        <div className="rapport-filtre-raccourcis">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => appliquerPeriode('semaine')}>Cette semaine</button>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => appliquerPeriode('mois')}>Ce mois</button>
        </div>
        <div className="rapport-filtre-champ">
          <label className="form-label-admin">Groupe</label>
          <select className="a-input" value={groupe} onChange={e => { setGroupe(e.target.value); setDetailId(null); }}>
            <option value="">Tous les groupes</option>
            {groupes.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {chargement ? (
        <div className="a-chargement">Chargement...</div>
      ) : rapport.length === 0 ? (
        <div className="a-vide"><span className="a-vide__icone">📊</span><p>Aucune donnée pour cette période.</p></div>
      ) : detail ? (

        /* ── VUE DÉTAIL : jour par jour pour un enfant ────────── */
        <div className="a-card">
          <div className="rapport-detail-entete">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDetailId(null)}>← Retour au tableau</button>
            <h2 className="a-card__titre" style={{ border: 'none', margin: 0 }}>
              {detail.enfant.prenom} {detail.enfant.nom} {detail.enfant.groupe && <span className="rapport-badge-groupe">{detail.enfant.groupe}</span>}
            </h2>
          </div>

          {/* KPIs de la période pour cet enfant */}
          <div className="rapport-kpis">
            <div className="rapport-kpi"><p className="rapport-kpi__valeur">{formatDuree(detail.presence.total_minutes)}</p><p className="rapport-kpi__label">Temps de présence (facturation)</p></div>
            <div className="rapport-kpi"><p className="rapport-kpi__valeur">{detail.presence.nb_jours}</p><p className="rapport-kpi__label">Jours présents</p></div>
            <div className="rapport-kpi"><p className="rapport-kpi__valeur">{detail.repas.complets}/{detail.repas.total_renseignes}</p><p className="rapport-kpi__label">Repas bien mangés</p></div>
            <div className="rapport-kpi"><p className="rapport-kpi__valeur">{detail.sieste.nb_siestes}</p><p className="rapport-kpi__label">Siestes</p></div>
          </div>

          {/* Détail jour par jour : présence + repas/sieste/activités */}
          <div style={{ overflowX: 'auto' }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Arrivée</th>
                  <th>Départ</th>
                  <th>Durée</th>
                  <th>Repas (M/J/G)</th>
                  <th>Sieste</th>
                  <th>Activités</th>
                </tr>
              </thead>
              <tbody>
                {detail.presence.jours.map(jourPresence => {
                  const jourSuivi = detail.activites.jours.find(j => j.date === jourPresence.date);
                  return (
                    <tr key={jourPresence.date}>
                      <td>{formatDateCourte(jourPresence.date)}</td>
                      <td>{jourPresence.heure_arrivee?.slice(0, 5) || '—'}</td>
                      <td>{jourPresence.heure_depart?.slice(0, 5) || '—'}</td>
                      <td>{formatDuree(jourPresence.duree_minutes)}</td>
                      <td>
                        {jourSuivi
                          ? `${LABEL_REPAS[jourSuivi.repas_matin] || '—'} / ${LABEL_REPAS[jourSuivi.repas_midi] || '—'} / ${LABEL_REPAS[jourSuivi.repas_gouter] || '—'}`
                          : '—'}
                      </td>
                      <td>
                        {jourSuivi?.siestes?.length > 0
                          ? jourSuivi.siestes.map((sv, i) => `${sv.debut?.slice(0, 5)}-${sv.fin?.slice(0, 5)}`).join(', ')
                          : jourSuivi?.sieste_debut
                            ? `${jourSuivi.sieste_debut.slice(0, 5)} - ${jourSuivi.sieste_fin?.slice(0, 5) || '?'}`
                            : '—'}
                      </td>
                      <td>{jourSuivi?.activites || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* ── VUE TABLEAU GLOBAL ───────────────────────────────── */
        <div className="a-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Enfant</th>
                  <th>Groupe</th>
                  <th>Jours présents</th>
                  <th>Heures totales</th>
                  <th>Repas bien mangés</th>
                  <th>Siestes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rapport.map(r => (
                  <tr key={r.enfant.id}>
                    <td>{r.enfant.prenom} {r.enfant.nom}</td>
                    <td>{r.enfant.groupe || '—'}</td>
                    <td>{r.presence.nb_jours}</td>
                    <td>{formatDuree(r.presence.total_minutes)}</td>
                    <td>{r.repas.complets}/{r.repas.total_renseignes}</td>
                    <td>{r.sieste.nb_siestes}</td>
                    <td>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => setDetailId(r.enfant.id)}>
                        Voir le détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapports;
