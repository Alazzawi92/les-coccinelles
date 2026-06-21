// ============================================================
// FICHIER  : Familles.jsx (admin)
// ROUTE    : /admin/familles
// RÔLE     : Gestion des comptes utilisateurs (parents et admins).
//            Tableau filtrable par nom/email + select par rôle.
//            Actions : voir le détail (modal), activer/désactiver.
//            toggleActif : PUT /users/:id/activer côté API.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Familles.css';

const Familles = () => {
  // Liste complète des utilisateurs chargés depuis l'API
  const [users,      setUsers]      = useState([]);
  // Valeur du champ de recherche textuelle (nom, prénom, email)
  const [filtre,     setFiltre]     = useState('');
  // Filtre par rôle : 'parent' | 'admin' | 'super_admin'
  const [roleFiltre, setRoleFiltre] = useState('parent');
  // Masque le tableau pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // Utilisateur affiché dans la modal de détail (null = modal fermée)
  const [userDetail, setUserDetail] = useState(null);

  // ── Chargement de tous les utilisateurs au montage ───────
  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data.data || []))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setChargement(false));
  }, []);

  // ── Activer / désactiver un compte ───────────────────────
  // PUT /users/:id/activer — l'API fait le toggle côté serveur
  const toggleActif = async (user) => {
    try {
      await api.put(`/users/${user.id}/activer`);
      // Mise à jour optimiste : inverse le booléen actif sans recharger
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, actif: !u.actif } : u));
      toast.success(`Compte ${user.actif ? 'désactivé' : 'activé'}`);
    } catch { toast.error('Erreur'); }
  };

  // ── Filtrage combiné (texte + rôle) ──────────────────────
  // Appliqué sur le rendu sans état supplémentaire
  const filtres = users.filter(u =>
    u.role === roleFiltre &&
    (u.nom.toLowerCase().includes(filtre.toLowerCase()) ||
     u.prenom.toLowerCase().includes(filtre.toLowerCase()) ||
     u.email.toLowerCase().includes(filtre.toLowerCase()))
  );

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>familles</span></h1>
        {/* Compteur du nombre de résultats filtrés */}
        <span className="admin-compteur">{filtres.length} résultat(s)</span>
      </div>

      {/* ── FILTRES : RECHERCHE + SÉLECTION DE RÔLE ──────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input placeholder="Rechercher par nom, prénom, email..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        </div>
        {/* Select rôle : filtre sur parent / admin / super_admin */}
        <select className="a-select" value={roleFiltre} onChange={e => setRoleFiltre(e.target.value)}>
          <option value="parent">Parents</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      {/* ── TABLEAU DES UTILISATEURS ──────────────────────────── */}
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
                  {/* Avatar avec initiales + nom complet */}
                  <td>
                    <div className="user-identite">
                      <div className="user-avatar">{u.prenom?.[0]}{u.nom?.[0]}</div>
                      <div>
                        <p className="user-nom">{u.prenom} {u.nom}</p>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.telephone || '—'}</td>
                  {/* Badge rôle : couleur selon la classe s-badge--{role} */}
                  <td><span className={`s-badge s-badge--${u.role}`}>{u.role.replace('_', ' ')}</span></td>
                  {/* Badge statut : vert=actif, rouge=inactif */}
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
                      {/* Voir : ouvre la modal de détail */}
                      <button className="btn btn--ghost btn--sm" onClick={() => setUserDetail(u)}>voir</button>
                      {/* Activer/Désactiver : rouge si actif (action destructive), bleu sinon */}
                      <button
                        className={`btn btn--sm ${u.actif ? 'btn--outline' : 'btn--primary'}`}
                        style={u.actif ? { borderColor:'var(--error)', color:'var(--error)' } : {}}
                        onClick={() => toggleActif(u)}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL DÉTAIL UTILISATEUR ──────────────────────────── */}
      {/* Clic sur l'overlay ferme la modal */}
      {userDetail && (
        <div className="modal-overlay" onClick={() => setUserDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">👤 {userDetail.prenom} {userDetail.nom}</h2>
              <button className="modal__fermer" onClick={() => setUserDetail(null)}>✕</button>
            </div>
            {/* Grille de détails : label + valeur pour chaque champ */}
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
              {/* Adresse : affiché uniquement si renseignée, en pleine largeur */}
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

    </div>
  );
};

export default Familles;
