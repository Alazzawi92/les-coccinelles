// ============================================================
// FICHIER  : Enfants.jsx (admin)
// ROUTE    : /admin/enfants
// RÔLE     : Vue admin de tous les enfants inscrits.
//            Tableau filtrable par nom/prénom/parent avec
//            affichage de l'âge calculé, du groupe, des allergies
//            (en rouge avec ⚠️) et du statut actif/inactif.
//            Lecture seule — la modification se fait depuis le
//            compte parent (MesEnfants).
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import '../../../styles/admin.css';
import './Enfants.css';

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

  // ── Chargement de tous les enfants au montage ────────────
  useEffect(() => {
    api.get('/enfants')
      .then(r => setEnfants(r.data.data || []))
      .finally(() => setChargement(false));
  }, []);

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

    </div>
  );
};

export default EnfantsAdmin;
