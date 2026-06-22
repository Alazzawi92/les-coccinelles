// ============================================================
// FICHIER  : Familles.jsx (admin)
// ROUTE    : /admin/familles
// RÔLE     : Gestion des comptes utilisateurs (parents et admins).
//            Onglets : En attente / Parents actifs / Admins / Super Admins.
//            Actions : voir détail, activer/désactiver, supprimer.
//            Suppression avec modal de confirmation (action irréversible).
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Familles.css';

const Familles = () => {
  const { user: moi } = useAuth();

  const [users,          setUsers]          = useState([]);
  const [filtre,         setFiltre]         = useState('');
  const [roleFiltre,     setRoleFiltre]     = useState('attente');
  const [chargement,     setChargement]     = useState(true);
  const [userDetail,     setUserDetail]     = useState(null);
  // Utilisateur ciblé par la modal de suppression (null = modal fermée)
  const [userASupprimer, setUserASupprimer] = useState(null);
  const [suppression,    setSuppression]    = useState(false);

  // ── Chargement initial ───────────────────────────────────
  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data.data || []))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setChargement(false));
  }, []);

  // ── Activer / désactiver ─────────────────────────────────
  const toggleActif = async (user) => {
    try {
      await api.put(`/users/${user.id}/activer`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, actif: !u.actif } : u));
      toast.success(`Compte ${user.actif ? 'désactivé' : 'activé'}`);
    } catch { toast.error('Erreur'); }
  };

  // ── Supprimer un compte ──────────────────────────────────
  const confirmerSuppression = async () => {
    if (!userASupprimer) return;
    setSuppression(true);
    try {
      await api.delete(`/users/${userASupprimer.id}`);
      setUsers(prev => prev.filter(u => u.id !== userASupprimer.id));
      toast.success(`Compte de ${userASupprimer.prenom} ${userASupprimer.nom} supprimé`);
      setUserASupprimer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
    setSuppression(false);
  };

  // ── Droits de suppression ────────────────────────────────
  // super_admin : supprime tout le monde sauf lui-même
  // admin       : supprime uniquement les parents
  const peutSupprimer = (cible) => {
    if (!moi) return false;
    if (cible.id === moi.id) return false;
    if (moi.role === 'super_admin') return true;
    if (moi.role === 'admin') return cible.role === 'parent';
    return false;
  };

  const enAttente = users.filter(u => u.role === 'parent' && !u.actif);

  const filtres = users.filter(u => {
    const texte = u.nom.toLowerCase().includes(filtre.toLowerCase()) ||
                  u.prenom.toLowerCase().includes(filtre.toLowerCase()) ||
                  u.email.toLowerCase().includes(filtre.toLowerCase());
    if (roleFiltre === 'attente') return u.role === 'parent' && !u.actif && texte;
    if (roleFiltre === 'parent')  return u.role === 'parent' && u.actif && texte;
    return u.role === roleFiltre && texte;
  });

  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>familles</span></h1>
        <span className="admin-compteur">{filtres.length} résultat(s)</span>
      </div>

      {/* ── ONGLETS ───────────────────────────────────────────── */}
      <div className="familles-onglets">
        <button
          className={`familles-onglet ${roleFiltre === 'attente' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('attente')}
        >
          ⏳ En attente
          {enAttente.length > 0 && (
            <span className="familles-badge-attente">{enAttente.length}</span>
          )}
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'parent' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('parent')}
        >
          👨‍👩‍👧 Parents actifs
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'admin' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('admin')}
        >
          🛡️ Admins
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'super_admin' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('super_admin')}
        >
          ⭐ Super Admins
        </button>
      </div>

      {/* ── RECHERCHE ─────────────────────────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input
            placeholder="Rechercher par nom, prénom, email..."
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
          />
        </div>
      </div>

      {/* ── TABLEAU ───────────────────────────────────────────── */}
      <div className="a-card">
        {filtres.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">👥</span><p>Aucun résultat.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-identite">
                      <div className="user-avatar">{u.prenom?.[0]}{u.nom?.[0]}</div>
                      <div><p className="user-nom">{u.prenom} {u.nom}</p></div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.telephone || '—'}</td>
                  <td><span className={`s-badge s-badge--${u.role}`}>{u.role.replace('_', ' ')}</span></td>
                  <td>
                    <span className={`s-badge ${u.actif ? 's-badge--accepte' : 's-badge--refuse'}`}>
                      {u.actif ? '✓ Actif' : '✗ Inactif'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="a-actions">
                      <button className="btn btn--ghost btn--sm" onClick={() => setUserDetail(u)}>
                        voir
                      </button>
                      <button
                        className={`btn btn--sm ${u.actif ? 'btn--outline' : 'btn--primary'}`}
                        style={u.actif ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}
                        onClick={() => toggleActif(u)}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      {/* Bouton supprimer : visible uniquement si l'admin a le droit */}
                      {peutSupprimer(u) && (
                        <button
                          className="btn btn--sm btn-supprimer"
                          onClick={() => setUserASupprimer(u)}
                          title="Supprimer ce compte"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL DÉTAIL ──────────────────────────────────────── */}
      {userDetail && (
        <div className="modal-overlay" onClick={() => setUserDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">👤 {userDetail.prenom} {userDetail.nom}</h2>
              <button className="modal__fermer" onClick={() => setUserDetail(null)}>✕</button>
            </div>
            <div className="user-detail-grille">
              {[
                { label: 'Email',         valeur: userDetail.email },
                { label: 'Téléphone',     valeur: userDetail.telephone || '—' },
                { label: 'Rôle',          valeur: userDetail.role },
                { label: 'Statut',        valeur: userDetail.actif ? 'Actif' : 'Inactif' },
                { label: 'Email vérifié', valeur: userDetail.email_verifie ? 'Oui' : 'Non' },
                { label: 'Inscrit le',    valeur: new Date(userDetail.created_at).toLocaleDateString('fr-FR') }
              ].map(({ label, valeur }) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}</span>
                  <span className="detail-valeur">{valeur}</span>
                </div>
              ))}
              {userDetail.adresse && (
                <div className="detail-item detail-item--full">
                  <span className="detail-label">Adresse</span>
                  <span className="detail-valeur">{userDetail.adresse}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ──────────────── */}
      {userASupprimer && (
        <div className="modal-overlay" onClick={() => !suppression && setUserASupprimer(null)}>
          <div className="modal modal--danger" onClick={e => e.stopPropagation()}>

            {/* Icône d'avertissement */}
            <div className="suppr-icone">⚠️</div>

            <h2 className="suppr-titre">Attention — Action irréversible</h2>

            <p className="suppr-message">
              Vous êtes sur le point de supprimer définitivement le compte de{' '}
              <strong>{userASupprimer.prenom} {userASupprimer.nom}</strong>{' '}
              (<span className="suppr-email">{userASupprimer.email}</span>).
            </p>

            <div className="suppr-avertissements">
              <p>Cette action va :</p>
              <ul>
                <li>Supprimer le compte et toutes ses données personnelles</li>
                <li>Supprimer les enfants, inscriptions et documents associés</li>
                <li>Cette suppression est <strong>définitive et irréversible</strong></li>
              </ul>
            </div>

            <div className="suppr-actions">
              <button
                className="btn btn--ghost"
                onClick={() => setUserASupprimer(null)}
                disabled={suppression}
              >
                Annuler
              </button>
              <button
                className="btn btn-supprimer-confirmer"
                onClick={confirmerSuppression}
                disabled={suppression}
              >
                {suppression ? '⏳ Suppression...' : '🗑️ Oui, supprimer définitivement'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Familles;
