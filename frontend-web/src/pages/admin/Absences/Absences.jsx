// ============================================================
// FICHIER  : Absences.jsx (admin)
// ROUTE    : /admin/absences
// RÔLE     : Gestion et validation des absences déclarées par
//            les parents. Tableau filtrable par statut.
//            Actions : valider (PATCH statut='validee') ou
//            refuser (PATCH statut='refusee').
//            traitement{} : objet pour désactiver le bouton
//            pendant la requête en cours par absence individuelle.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Absences.css';

// Labels affichés en tableau pour chaque motif d'absence
const MOTIFS = {
  maladie:     '🤒 Maladie',
  vacances:    '🏖️ Vacances',
  rendez_vous: '🏥 RDV médical',
  autre:       '📝 Autre'
};

const AbsencesAdmin = () => {
  // Liste complète des absences chargées depuis l'API
  const [absences,   setAbsences]   = useState([]);
  // Filtre par statut : 'tous' | 'en_attente' | 'validee' | 'refusee'
  const [statutFil,  setStatutFil]  = useState('en_attente'); // Défaut sur "en attente"
  // Masque le tableau pendant le premier chargement
  const [chargement, setChargement] = useState(true);
  // Objet { [absence.id]: true/false } pour désactiver les boutons par ligne
  const [traitement, setTraitement] = useState({});

  // ── Chargement de toutes les absences au montage ─────────
  useEffect(() => {
    api.get('/absences')
      .then(r => setAbsences(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

  // ── Valider ou refuser une absence ───────────────────────
  // PATCH /absences/:id/valider avec { statut: 'validee' | 'refusee' }
  const valider = async (absence, statut) => {
    // Désactive le bouton pour cette absence pendant l'appel
    setTraitement(prev => ({ ...prev, [absence.id]: true }));
    try {
      await api.patch(`/absences/${absence.id}/valider`, { statut });
      // Mise à jour optimiste : change le statut dans la liste locale
      setAbsences(prev => prev.map(a => a.id === absence.id ? { ...a, statut } : a));
      toast.success(`Absence ${statut === 'validee' ? 'validée' : 'refusée'}`);
    } catch { toast.error('Erreur'); }
    setTraitement(prev => ({ ...prev, [absence.id]: false }));
  };

  // ── Filtrage par statut ───────────────────────────────────
  const filtrees = absences.filter(a => statutFil === 'tous' || a.statut === statutFil);

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>absences</span></h1>
        <span className="admin-compteur">{filtrees.length} absence(s)</span>
      </div>

      {/* ── FILTRE PAR STATUT ─────────────────────────────────── */}
      <div className="a-filtres">
        <select className="a-select" value={statutFil} onChange={e => setStatutFil(e.target.value)}>
          <option value="tous">Toutes</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validées</option>
          <option value="refusee">Refusées</option>
        </select>
      </div>

      {/* ── TABLEAU DES ABSENCES ──────────────────────────────── */}
      <div className="a-card">
        {filtrees.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📅</span><p>Aucune absence trouvée.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr><th>Enfant</th><th>Parent</th><th>Période</th><th>Motif</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtrees.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.enfant?.prenom} {a.enfant?.nom}</strong></td>
                  <td>{a.parent?.prenom} {a.parent?.nom}</td>
                  {/* Période : date_debut → date_fin au format court */}
                  <td style={{ fontSize:'0.85rem' }}>
                    {new Date(a.date_debut).toLocaleDateString('fr-FR')} → {new Date(a.date_fin).toLocaleDateString('fr-FR')}
                  </td>
                  {/* Motif : traduit via MOTIFS ou valeur brute si inconnu */}
                  <td>{MOTIFS[a.motif] || a.motif}</td>
                  {/* Badge statut : couleur définie par s-badge--{statut} */}
                  <td><span className={`s-badge s-badge--${a.statut}`}>{{ en_attente:'En attente', validee:'Validée', refusee:'Refusée' }[a.statut]}</span></td>
                  <td>
                    {/* Actions uniquement pour les absences en attente */}
                    {a.statut === 'en_attente' ? (
                      <div className="a-actions">
                        {/* Valider : bouton primaire vert */}
                        <button className="btn btn--primary btn--sm" onClick={() => valider(a, 'validee')} disabled={traitement[a.id]}>✅ Valider</button>
                        {/* Refuser : bouton rouge */}
                        <button className="btn btn--sm" style={{ background:'var(--error)', color:'var(--white)' }} onClick={() => valider(a, 'refusee')} disabled={traitement[a.id]}>❌ Refuser</button>
                      </div>
                    ) : (
                      // Absence déjà traitée : pas d'action disponible
                      <span style={{ fontSize:'0.8rem', color:'var(--text-light)' }}>Traité</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AbsencesAdmin;
