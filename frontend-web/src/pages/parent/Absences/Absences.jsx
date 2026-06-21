// ============================================================
// FICHIER  : Absences.jsx (parent)
// ROUTE    : /parent/absences
// RÔLE     : Déclaration et consultation des absences.
//            2 vues : Liste (tableau) et Calendrier (grille mois).
//            construireCalendrier : génère les jours du mois avec
//            padding (null) pour aligner le premier jour sur lundi.
//            dateEstAbsente : vérifie si une date tombe dans une absence.
//            couleurAbsence : fond coloré par statut en CSS inline.
//            naviguerMois : gère le wrapping décembre→janvier et inverse.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Absences.css';

// Options de motif d'absence pour le formulaire
const MOTIFS = [
  { value: 'maladie',     label: '🤒 Maladie' },
  { value: 'vacances',    label: '🏖️ Vacances' },
  { value: 'rendez_vous', label: '🏥 RDV médical' },
  { value: 'autre',       label: '📝 Autre' }
];

// En-têtes des colonnes du calendrier (lundi en premier)
const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
// Noms des mois en français pour l'affichage
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ── Construction du tableau de jours d'un mois ───────────────
// Retourne un tableau avec null pour les cases vides du début
// et des objets Date pour chaque jour du mois
const construireCalendrier = (annee, mois) => {
  const premier          = new Date(annee, mois, 1);
  const dernierJour      = new Date(annee, mois + 1, 0).getDate();
  // (getDay() + 6) % 7 : convertit 0=dim en 6, 1=lun en 0, ... pour aligner sur lundi
  const premierJourSemaine = (premier.getDay() + 6) % 7;
  const jours = [];
  for (let i = 0; i < premierJourSemaine; i++) jours.push(null); // Padding début
  for (let d = 1; d <= dernierJour; d++) jours.push(new Date(annee, mois, d));
  return jours;
};

// ── Vérifier si une date est couverte par une absence ─────────
// Retourne l'objet absence correspondant ou null
const dateEstAbsente = (date, absences) => {
  if (!date) return null;
  const d = date.toISOString().split('T')[0];
  return absences.find(a => d >= a.date_debut && d <= a.date_fin);
};

const Absences = () => {
  // Liste des absences de ce parent
  const [absences,    setAbsences]    = useState([]);
  // Liste des enfants pour le formulaire
  const [enfants,     setEnfants]     = useState([]);
  // Masque les vues pendant le chargement initial
  const [chargement,  setChargement]  = useState(true);
  // true = formulaire de déclaration affiché
  const [modeForm,    setModeForm]    = useState(false);
  // Vue active : 'liste' (tableau) ou 'calendrier' (grille mois)
  const [vue,         setVue]         = useState('liste');
  // Mois affiché dans le calendrier (0-11)
  const [moisCalend,  setMoisCalend]  = useState(new Date().getMonth());
  // Année affichée dans le calendrier
  const [anneeCalend, setAnneeCalend] = useState(new Date().getFullYear());
  // Valeurs du formulaire de déclaration
  const [form,        setForm]        = useState({ enfant_id:'', date_debut:'', date_fin:'', motif:'', description:'' });
  // Indicateur d'envoi pendant la requête POST
  const [envoi,       setEnvoi]       = useState(false);

  // ── Chargement initial : absences + enfants en parallèle ─
  useEffect(() => {
    const charger = async () => {
      try {
        const [ra, re] = await Promise.all([api.get('/absences'), api.get('/enfants')]);
        setAbsences(ra.data.data || []);
        setEnfants(re.data.data || []);
      } catch {}
      setChargement(false);
    };
    charger();
  }, []);

  // ── Déclarer une absence ──────────────────────────────────
  // POST /absences → ajoute en tête de liste
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.post('/absences', form);
      setAbsences(prev => [res.data.data, ...prev]);
      setModeForm(false);
      // Réinitialise le formulaire
      setForm({ enfant_id:'', date_debut:'', date_fin:'', motif:'', description:'' });
      toast.success('Absence déclarée !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la déclaration');
    }
    setEnvoi(false);
  };

  // ── Libellé + classe CSS selon le statut ─────────────────
  const statutInfo = (s) => ({
    en_attente: { label:'En attente',  class:'en_attente' },
    validee:    { label:'Validée',     class:'validee'    },
    refusee:    { label:'Refusée',     class:'refusee'    }
  }[s] || { label: s, class: 'en_attente' });

  // ── Couleur de fond pour le calendrier par statut ─────────
  const couleurAbsence = (statut) => ({
    en_attente: '#fff3e0',
    validee:    '#e8f5e9',
    refusee:    '#ffebee'
  }[statut] || '#f5f5f5');

  // Tableau des jours du mois affiché dans le calendrier
  const joursCalendrier = construireCalendrier(anneeCalend, moisCalend);
  const today = new Date().toISOString().split('T')[0];

  // ── Navigation mois précédent / suivant ──────────────────
  // Gère le wrapping : décembre (11) → janvier (0) et inversement
  const naviguerMois = (sens) => {
    let nouveauMois   = moisCalend + sens;
    let nouvelleAnnee = anneeCalend;
    if (nouveauMois > 11) { nouveauMois = 0;  nouvelleAnnee++; }
    if (nouveauMois < 0)  { nouveauMois = 11; nouvelleAnnee--; }
    setMoisCalend(nouveauMois);
    setAnneeCalend(nouvelleAnnee);
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="absences-page">

      {/* ── EN-TÊTE AVEC BOUTONS VUE ──────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Mes <span>absences</span></h1>
        <div style={{ display:'flex', gap:'var(--space-sm)' }}>
          {/* Basculer entre vue liste et vue calendrier */}
          <button className={`btn btn--sm ${vue === 'liste' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setVue('liste')}>☰ Liste</button>
          <button className={`btn btn--sm ${vue === 'calendrier' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setVue('calendrier')}>📅 Calendrier</button>
          {/* Bouton "+ Déclarer" caché quand le formulaire est ouvert */}
          {!modeForm && (
            <button className="btn btn--primary btn--sm" onClick={() => setModeForm(true)}>+ Déclarer</button>
          )}
        </div>
      </div>

      {/* ── FORMULAIRE DE DÉCLARATION ─────────────────────────── */}
      {modeForm && (
        <div className="p-card" style={{ marginBottom:'var(--space-xl)' }}>
          <h2 className="p-card__titre">📅 Déclarer une absence</h2>
          <form className="p-form" onSubmit={handleSubmit}>
            <div className="p-form-groupe">
              <label className="p-label">Enfant concerné <span className="requis">*</span></label>
              <select className="p-input" value={form.enfant_id} onChange={e => setForm(p=>({...p,enfant_id:e.target.value}))} required>
                <option value="">Choisir...</option>
                {enfants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            {/* Plage de dates : min sur date_debut = aujourd'hui, min sur date_fin = date_debut */}
            <div className="p-form-row">
              <div className="p-form-groupe">
                <label className="p-label">Du <span className="requis">*</span></label>
                <input type="date" className="p-input" value={form.date_debut} min={today}
                  onChange={e => setForm(p=>({...p,date_debut:e.target.value}))} required />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Au <span className="requis">*</span></label>
                <input type="date" className="p-input" value={form.date_fin} min={form.date_debut || today}
                  onChange={e => setForm(p=>({...p,date_fin:e.target.value}))} required />
              </div>
            </div>
            {/* Motif : boutons radio en pills */}
            <div className="p-form-groupe">
              <label className="p-label">Motif <span className="requis">*</span></label>
              <div className="motifs-choix">
                {MOTIFS.map(m => (
                  <label key={m.value} className={`motif-option ${form.motif === m.value ? 'motif-option--actif' : ''}`}>
                    <input type="radio" name="motif" value={m.value} checked={form.motif === m.value}
                      onChange={e => setForm(p=>({...p,motif:e.target.value}))} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Précisions (optionnel)</label>
              <textarea className="p-input p-textarea" rows={2} value={form.description}
                onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Informations complémentaires..." />
            </div>
            <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setModeForm(false)}>Annuler</button>
              {/* Désactivé si aucun motif sélectionné */}
              <button type="submit" className="btn btn--primary" disabled={envoi || !form.motif}>
                {envoi ? 'Envoi...' : 'Déclarer l\'absence'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── VUE LISTE ─────────────────────────────────────────── */}
      {vue === 'liste' && (
        absences.length === 0 ? (
          <div className="p-vide">
            <span className="p-vide__icone">📅</span>
            <p>Vous n'avez pas encore déclaré d'absence.</p>
          </div>
        ) : (
          <div className="p-card">
            <table className="p-table">
              <thead>
                <tr><th>Enfant</th><th>Période</th><th>Durée</th><th>Motif</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {absences.map(a => {
                  const debut = new Date(a.date_debut);
                  const fin   = new Date(a.date_fin);
                  // Durée en jours : +1 car la fin est inclusive
                  const duree = Math.ceil((fin - debut) / 86400000) + 1;
                  const s     = statutInfo(a.statut);
                  const motif = MOTIFS.find(m => m.value === a.motif);
                  return (
                    <tr key={a.id}>
                      <td><strong>{a.enfant?.prenom || '—'}</strong></td>
                      <td>
                        {debut.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                        {' → '}
                        {fin.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td style={{ fontSize:'0.85rem', color:'var(--text-gray)' }}>
                        {duree} jour{duree > 1 ? 's' : ''}
                      </td>
                      <td style={{ fontSize:'0.9rem' }}>{motif?.label || a.motif}</td>
                      <td>
                        <span className={`statut-badge statut-badge--${s.class}`}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── VUE CALENDRIER ────────────────────────────────────── */}
      {vue === 'calendrier' && (
        <div className="p-card calendrier-wrapper">

          {/* Navigation mois : ← {Mois Année} → */}
          <div className="calendrier-nav">
            <button className="btn btn--ghost btn--sm" onClick={() => naviguerMois(-1)}>←</button>
            <h2 className="calendrier-mois-titre">{MOIS_FR[moisCalend]} {anneeCalend}</h2>
            <button className="btn btn--ghost btn--sm" onClick={() => naviguerMois(1)}>→</button>
          </div>

          {/* Grille 7 colonnes (Lun–Dim) */}
          <div className="calendrier-grille">
            {/* En-têtes des jours */}
            {JOURS_SEMAINE.map(j => (
              <div key={j} className="calendrier-jour-label">{j}</div>
            ))}

            {/* Cases du mois */}
            {joursCalendrier.map((date, i) => {
              // Case vide (padding début de mois)
              if (!date) return <div key={`empty-${i}`} className="calendrier-case calendrier-case--vide" />;

              const absenceJour = dateEstAbsente(date, absences);
              const estAujourd  = date.toISOString().split('T')[0] === today;
              const estPasse    = date < new Date(today);

              return (
                <div
                  key={date.toISOString()}
                  className={`calendrier-case
                    ${estAujourd  ? 'calendrier-case--aujourd-hui' : ''}
                    ${estPasse    ? 'calendrier-case--passe'       : ''}
                    ${absenceJour ? 'calendrier-case--absence'     : ''}
                  `}
                  // Fond coloré en inline pour refléter le statut de l'absence
                  style={absenceJour ? { background: couleurAbsence(absenceJour.statut) } : {}}
                  title={absenceJour ? `Absence : ${MOTIFS.find(m=>m.value===absenceJour.motif)?.label || absenceJour.motif}` : ''}
                >
                  <span className="calendrier-numero">{date.getDate()}</span>
                  {/* Emoji statut sur les jours d'absence */}
                  {absenceJour && (
                    <span className="calendrier-absence-point">
                      {{'en_attente':'⏳','validee':'✅','refusee':'❌'}[absenceJour.statut]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Légende des statuts */}
          <div className="calendrier-legende">
            <span className="legende-item legende-item--attente">⏳ En attente</span>
            <span className="legende-item legende-item--validee">✅ Validée</span>
            <span className="legende-item legende-item--refusee">❌ Refusée</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default Absences;
