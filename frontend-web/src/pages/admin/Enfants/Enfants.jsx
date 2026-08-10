// ============================================================
// FICHIER  : Enfants.jsx (admin)
// ROUTE    : /admin/enfants
// RÔLE     : Vue admin de tous les enfants inscrits.
//            Tableau filtrable par nom/prénom/parent avec
//            affichage de l'âge calculé, du groupe, des allergies
//            (en rouge avec ⚠️) et du statut actif/inactif.
//            Lecture seule pour les infos de l'enfant (la modification
//            se fait depuis le compte parent, MesEnfants) — SAUF les
//            "jours de présence habituels" (contrat de garde), gérés
//            ici côté admin car ils servent à l'organisation interne
//            (calendrier des présences prévisionnelles).
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Enfants.css';

// Jours de la semaine gérés (la crèche est fermée le week-end)
const JOURS = [
  { code: 'lundi',    label: 'L' },
  { code: 'mardi',    label: 'M' },
  { code: 'mercredi', label: 'M' },
  { code: 'jeudi',    label: 'J' },
  { code: 'vendredi', label: 'V' }
];

// ── Calcul de l'âge d'un enfant ──────────────────────────────
// Retourne "X mois" si < 24 mois, sinon "X ans"
// Division par 2 592 000 000 ms = 30 jours × 24h × 3600s × 1000ms
const calcAge = (d) => {
  const m = (new Date() - new Date(d)) / 2592000000;
  return m < 24 ? `${Math.floor(m)} mois` : `${Math.floor(m / 12)} ans`;
};

const EnfantsAdmin = () => {
  // Liste complète des enfants chargés depuis l'API
  const [enfants,    setEnfants]    = useState([]);
  // Valeur du champ de recherche textuelle
  const [filtre,     setFiltre]     = useState('');
  // Masque le tableau pendant le premier chargement
  const [chargement, setChargement] = useState(true);
  // Enfant en cours d'édition des jours habituels (null = modale fermée)
  const [enfantEdit, setEnfantEdit] = useState(null);
  // Jours cochés dans la modale d'édition (tableau de codes, ex: ['lundi','mercredi'])
  const [joursForm,  setJoursForm]  = useState([]);
  // Indicateur d'envoi pendant la sauvegarde
  const [envoi,      setEnvoi]      = useState(false);

  // ── Chargement de tous les enfants au montage ────────────
  useEffect(() => {
    api.get('/enfants')
      .then(r => setEnfants(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Ouvrir la modale d'édition des jours habituels ───────
  const ouvrirEditionJours = (enfant) => {
    setEnfantEdit(enfant);
    setJoursForm(enfant.jours_presence || []);
  };

  // ── Cocher/décocher un jour dans la modale ───────────────
  const toggleJour = (code) => {
    setJoursForm(prev => prev.includes(code) ? prev.filter(j => j !== code) : [...prev, code]);
  };

  // ── Sauvegarder les jours habituels de l'enfant ──────────
  const enregistrerJours = async () => {
    setEnvoi(true);
    try {
      const res = await api.patch(`/enfants/${enfantEdit.id}/jours-presence`, { jours_presence: joursForm });
      setEnfants(prev => prev.map(e => e.id === enfantEdit.id ? res.data.data : e));
      toast.success('Jours habituels mis à jour');
      setEnfantEdit(null);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setEnvoi(false);
  };

  // ── Filtrage en temps réel sur prénom + nom + nom du parent ──
  const filtres = enfants.filter(e =>
    `${e.prenom} ${e.nom} ${e.parent?.nom || ''}`.toLowerCase().includes(filtre.toLowerCase())
  );

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>enfants</span></h1>
        <span className="admin-compteur">{filtres.length} enfant(s)</span>
      </div>

      {/* ── BARRE DE RECHERCHE ──────────────────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input placeholder="Rechercher un enfant ou parent..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        </div>
      </div>

      {/* ── TABLEAU DES ENFANTS ───────────────────────────────── */}
      <div className="a-card">
        {filtres.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">👶</span><p>Aucun enfant trouvé.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Âge</th>
                <th>Groupe</th>
                <th>Jours habituels</th>
                <th>Parent</th>
                <th>Allergies</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(e => (
                <tr key={e.id}>
                  {/* Emoji 👧/👦 selon le sexe + nom complet en gras */}
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--space-md)' }}>
                      <span style={{ fontSize:'1.8rem' }}>{e.sexe === 'F' ? '👧' : '👦'}</span>
                      <strong>{e.prenom} {e.nom}</strong>
                    </div>
                  </td>
                  {/* Âge calculé dynamiquement (pas stocké en base) */}
                  <td>{calcAge(e.date_naissance)}</td>
                  {/* Groupe : section de la crèche (bébés, moyens, grands) */}
                  <td>{e.groupe || <span style={{ color:'var(--text-light)' }}>—</span>}</td>
                  {/* Jours de garde habituels (contrat) : cliquable pour modifier */}
                  <td>
                    <button type="button" className="jours-btn" onClick={() => ouvrirEditionJours(e)} title="Modifier les jours habituels">
                      {(e.jours_presence?.length > 0 ? JOURS.filter(j => e.jours_presence.includes(j.code)) : JOURS).map(j => (
                        <span key={j.code} className={`jours-pastille ${e.jours_presence?.length > 0 ? 'jours-pastille--actif' : 'jours-pastille--tous'}`}>{j.label}</span>
                      ))}
                      <span className="jours-btn__icone">✏️</span>
                    </button>
                  </td>
                  {/* Référence parent : prénom nom + email */}
                  <td>
                    <p>{e.parent?.prenom} {e.parent?.nom}</p>
                    <p style={{ fontSize:'0.78rem', color:'var(--text-gray)' }}>{e.parent?.email}</p>
                  </td>
                  {/* Allergies : en rouge avec ⚠️ si renseignées */}
                  <td>
                    {e.allergies
                      ? <span style={{ color:'var(--error)', fontSize:'0.8rem' }}>⚠️ {e.allergies}</span>
                      : <span style={{ color:'var(--text-light)' }}>—</span>
                    }
                  </td>
                  {/* Badge actif/inactif : vert si inscrit, rouge sinon */}
                  <td>
                    <span className={`s-badge ${e.actif ? 's-badge--accepte' : 's-badge--refuse'}`}>
                      {e.actif ? 'Inscrit' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODALE : JOURS DE GARDE HABITUELS ─────────────────── */}
      {enfantEdit && (
        <div className="modal-overlay" onClick={() => !envoi && setEnfantEdit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">📅 Jours habituels — {enfantEdit.prenom} {enfantEdit.nom}</h2>
              <button className="modal__fermer" onClick={() => setEnfantEdit(null)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
              Sélectionnez les jours où cet enfant vient habituellement à la crèche.
              Aucun jour coché = vient tous les jours ouvrés (par défaut).
            </p>

            <div className="jours-choix">
              {JOURS.map(j => (
                <button
                  type="button"
                  key={j.code}
                  className={`jours-choix-btn ${joursForm.includes(j.code) ? 'jours-choix-btn--actif' : ''}`}
                  onClick={() => toggleJour(j.code)}
                >
                  {j.code.charAt(0).toUpperCase() + j.code.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setEnfantEdit(null)} disabled={envoi}>Annuler</button>
              <button type="button" className="btn btn--primary" onClick={enregistrerJours} disabled={envoi}>
                {envoi ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EnfantsAdmin;
