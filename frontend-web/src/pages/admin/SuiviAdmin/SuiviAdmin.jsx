// ============================================================
// FICHIER  : SuiviAdmin.jsx (admin)
// ROUTE    : /admin/suivi
// RÔLE     : Saisie du suivi quotidien pour chaque enfant.
//            Sélection de la date (max = aujourd'hui).
//            Charge en parallèle le suivi existant de chaque
//            enfant pour la date sélectionnée.
//            Pour chaque enfant : formulaire repas (3 selects),
//            sieste (heures début/fin), humeur (5 boutons emoji),
//            activités et note générale (textareas).
//            POST si nouveau (_nouveau flag), PUT si existant.
//            envoi{} : objet pour désactiver le bouton par enfant.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './SuiviAdmin.css';

// Date du jour au format YYYY-MM-DD (constante, ne change pas au rendu)
const today = new Date().toISOString().split('T')[0];

const SuiviAdmin = () => {
  // Liste des enfants inscrits chargée une seule fois au montage
  const [enfants,    setEnfants]    = useState([]);
  // Date sélectionnée pour le suivi (défaut = aujourd'hui)
  const [date,       setDate]       = useState(today);
  // Objet { [enfant_id]: suivi_data } — un suivi par enfant pour la date
  const [suivis,     setSuivis]     = useState({});
  // Masque le composant pendant le chargement des enfants
  const [chargement, setChargement] = useState(true);
  // Objet { [enfant_id]: true/false } pour désactiver le bouton Enregistrer
  const [envoi,      setEnvoi]      = useState({});

  // Options disponibles pour les selects repas
  const REPAS_OPTIONS   = ['absent', 'tout', 'peu', 'rien'];
  // Options disponibles pour les boutons d'humeur
  const HUMEUR_OPTIONS  = ['joyeux', 'calme', 'fatigue', 'pleureur', 'autre'];

  // ── Chargement de la liste des enfants (une seule fois) ──
  useEffect(() => {
    api.get('/enfants')
      .then(r => setEnfants(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Chargement des suivis quand la date ou les enfants changent ─
  // Appels parallèles : un GET /suivi/:id/:date par enfant
  useEffect(() => {
    if (enfants.length === 0) return;
    const chargerSuivis = async () => {
      const nouveauxSuivis = {};
      await Promise.all(enfants.map(async e => {
        try {
          const r = await api.get(`/suivi/${e.id}/${date}`);
          nouveauxSuivis[e.id] = r.data.data;
        } catch {
          // Pas de suivi pour ce jour → initialiser un objet vide marqué _nouveau
          // _nouveau : flag interne, jamais envoyé à l'API
          nouveauxSuivis[e.id] = {
            enfant_id:     e.id,
            date_suivi:    date,
            repas_matin:   'absent',
            repas_midi:    'absent',
            repas_gouter:  'absent',
            repas_note:    '',
            sieste_debut:  '',
            sieste_fin:    '',
            sieste_note:   '',
            activites:     '',
            humeur:        '',
            selles:        false,
            temperature:   '',
            note_generale: '',
            _nouveau:      true  // Indique qu'il faut faire un POST et non PUT
          };
        }
      }));
      setSuivis(nouveauxSuivis);
    };
    chargerSuivis();
  }, [date, enfants]); // Se relance à chaque changement de date

  // ── Mise à jour d'un champ d'un suivi spécifique ─────────
  // Merge immutable sur l'objet suivis pour un seul enfant
  const majSuivi = (enfantId, champ, valeur) =>
    setSuivis(prev => ({ ...prev, [enfantId]: { ...prev[enfantId], [champ]: valeur } }));

  // ── Sauvegarde du suivi d'un enfant ──────────────────────
  // POST si _nouveau ou pas d'id, PUT sinon
  const sauvegarder = async (enfantId) => {
    const s = suivis[enfantId];
    if (!s) return;
    setEnvoi(prev => ({ ...prev, [enfantId]: true }));
    try {
      // Nettoyer le payload : supprimer les champs internes et convertir les vides en null
      const { _nouveau, id, created_at, updated_at, ...payload } = s;
      const propre = {
        ...payload,
        enfant_id:    enfantId,
        date_suivi:   date,
        humeur:       payload.humeur       || null,
        sieste_debut: payload.sieste_debut || null,
        sieste_fin:   payload.sieste_fin   || null,
        temperature:  payload.temperature  || null,
      };
      if (_nouveau || !id) {
        // Création : POST /suivi
        const res = await api.post('/suivi', propre);
        setSuivis(prev => ({ ...prev, [enfantId]: res.data.data }));
      } else {
        // Mise à jour : PUT /suivi/:id
        const res = await api.put(`/suivi/${id}`, propre);
        setSuivis(prev => ({ ...prev, [enfantId]: res.data.data }));
      }
      const enfant = enfants.find(e => e.id === enfantId);
      toast.success(`Suivi de ${enfant?.prenom} enregistré`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement');
    }
    setEnvoi(prev => ({ ...prev, [enfantId]: false }));
  };

  // Garde : spinner si chargement des enfants en cours
  if (chargement) return <div className="a-chargement">Chargement...</div>;
  // Garde : aucun enfant inscrit
  if (enfants.length === 0) return <div className="a-vide"><span className="a-vide__icone">👶</span><p>Aucun enfant inscrit.</p></div>;

  return (
    <div>

      {/* ── EN-TÊTE AVEC SÉLECTEUR DE DATE ───────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Suivi <span>quotidien</span></h1>
        {/* max=today empêche de saisir un suivi dans le futur */}
        <input
          type="date"
          className="a-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
          style={{ width:'auto' }}
        />
      </div>

      <p style={{ color:'var(--text-gray)', fontSize:'0.9rem', marginBottom:'var(--space-xl)' }}>
        Renseignez le suivi pour chaque enfant présent le {new Date(date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}.
      </p>

      {/* ── GRILLE DES CARTES ENFANT ──────────────────────────── */}
      {/* Une carte par enfant avec tous les champs du suivi */}
      <div className="suivi-admin-grille">
        {enfants.map(enfant => {
          const s = suivis[enfant.id];
          if (!s) return null; // Suivi non encore chargé pour cet enfant

          return (
            <div key={enfant.id} className="suivi-admin-carte">

              {/* En-tête de la carte : emoji sexe + nom */}
              <div className="suivi-admin-entete">
                <span className="suivi-admin-avatar">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                <h3>{enfant.prenom} {enfant.nom}</h3>
                {/* Badge "Nouveau" si pas encore de suivi enregistré ce jour */}
                {!s._nouveau && !s.id && <span className="suivi-nouveau-badge">Nouveau</span>}
              </div>

              {/* ── REPAS ─────────────────────────────────────── */}
              {/* 3 selects côte à côte : matin, midi, gouter */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">🍽️ Repas</p>
                <div className="repas-row">
                  {['matin', 'midi', 'gouter'].map(r => (
                    <div key={r} className="repas-col">
                      <p className="repas-mini-label">{r.charAt(0).toUpperCase() + r.slice(1)}</p>
                      {/* Clé dynamique : repas_matin / repas_midi / repas_gouter */}
                      <select
                        className="repas-select"
                        value={s[`repas_${r}`]}
                        onChange={e => majSuivi(enfant.id, `repas_${r}`, e.target.value)}
                      >
                        {REPAS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SIESTE ────────────────────────────────────── */}
              {/* 2 inputs time : début → fin */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">😴 Sieste</p>
                <div className="sieste-row">
                  <input type="time" className="a-input" value={s.sieste_debut || ''} onChange={e => majSuivi(enfant.id, 'sieste_debut', e.target.value)} placeholder="Début" />
                  <span style={{ color:'var(--text-gray)' }}>→</span>
                  <input type="time" className="a-input" value={s.sieste_fin || ''} onChange={e => majSuivi(enfant.id, 'sieste_fin', e.target.value)} placeholder="Fin" />
                </div>
              </div>

              {/* ── HUMEUR ────────────────────────────────────── */}
              {/* 5 boutons emoji cliquables, actif = fond coloré */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">😊 Humeur</p>
                <div className="humeur-row">
                  {HUMEUR_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`humeur-btn ${s.humeur === h ? 'humeur-btn--actif' : ''}`}
                      onClick={() => majSuivi(enfant.id, 'humeur', h)}
                    >
                      {/* Emoji correspondant à chaque valeur d'humeur */}
                      {{'joyeux':'😄','calme':'😊','fatigue':'😴','pleureur':'😢','autre':'😐'}[h]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── ACTIVITÉS & NOTE GÉNÉRALE ─────────────────── */}
              {/* Activités : visible par l'admin, note_generale : visible par le parent */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">🎨 Activités & note</p>
                <textarea
                  className="a-input a-textarea"
                  rows={2}
                  value={s.activites || ''}
                  onChange={e => majSuivi(enfant.id, 'activites', e.target.value)}
                  placeholder="Activités du jour..."
                />
                {/* Note générale : message transmis aux parents dans leur espace */}
                <textarea
                  className="a-input a-textarea"
                  rows={2}
                  value={s.note_generale || ''}
                  onChange={e => majSuivi(enfant.id, 'note_generale', e.target.value)}
                  placeholder="Message pour les parents..."
                  style={{ marginTop:'var(--space-sm)' }}
                />
              </div>

              {/* Bouton d'enregistrement individuel par enfant */}
              <button
                className="btn btn--primary"
                style={{ width:'100%' }}
                onClick={() => sauvegarder(enfant.id)}
                disabled={envoi[enfant.id]}
              >
                {envoi[enfant.id] ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SuiviAdmin;
