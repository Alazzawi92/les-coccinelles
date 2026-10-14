// ============================================================
// FICHIER  : Familles.jsx (admin)
// ROUTE    : /admin/familles
// RÔLE     : Gestion des comptes utilisateurs (parents et admins).
//            Onglets : En attente / Parents actifs / Admins / Super Admins.
//            Actions : voir détail, activer/désactiver, supprimer.
//            Suppression avec modal de confirmation (action irréversible).
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { getLocale } from '../../../i18n';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Familles.css';

const Familles = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
      .catch(() => toast.error(t('admin.familles.erreurChargement')))
      .finally(() => setChargement(false));
  }, []);

  // ── Activer / désactiver ─────────────────────────────────
  const toggleActif = async (user) => {
    try {
      await api.put(`/users/${user.id}/activer`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, actif: !u.actif } : u));
      toast.success(user.actif ? t('admin.familles.toastDesactive') : t('admin.familles.toastActive'));
    } catch { toast.error(t('common.erreur')); }
  };

  // ── Supprimer un compte ──────────────────────────────────
  const confirmerSuppression = async () => {
    if (!userASupprimer) return;
    setSuppression(true);
    try {
      await api.delete(`/users/${userASupprimer.id}`);
      setUsers(prev => prev.filter(u => u.id !== userASupprimer.id));
      toast.success(t('admin.familles.toastSupprime', { nom: `${userASupprimer.prenom} ${userASupprimer.nom}` }));
      setUserASupprimer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.erreurSuppression'));
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

  if (chargement) return <div className="a-chargement">{t('common.chargement')}</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.familles.titre" components={{ s: <span /> }} /></h1>
        <span className="admin-compteur">{t('admin.familles.resultats', { count: filtres.length })}</span>
      </div>

      {/* ── ONGLETS ───────────────────────────────────────────── */}
      <div className="familles-onglets">
        <button
          className={`familles-onglet ${roleFiltre === 'attente' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('attente')}
        >
          {t('admin.familles.onglets.attente')}
          {enAttente.length > 0 && (
            <span className="familles-badge-attente">{enAttente.length}</span>
          )}
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'parent' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('parent')}
        >
          {t('admin.familles.onglets.parent')}
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'admin' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('admin')}
        >
          {t('admin.familles.onglets.admin')}
        </button>
        <button
          className={`familles-onglet ${roleFiltre === 'super_admin' ? 'familles-onglet--actif' : ''}`}
          onClick={() => setRoleFiltre('super_admin')}
        >
          {t('admin.familles.onglets.super_admin')}
        </button>
      </div>

      {/* ── RECHERCHE ─────────────────────────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input
            placeholder={t('admin.familles.recherche')}
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
          />
        </div>
      </div>

      {/* ── TABLEAU ───────────────────────────────────────────── */}
      <div className="a-card">
        {filtres.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">👥</span><p>{t('admin.familles.aucun')}</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>{t('admin.familles.colUtilisateur')}</th>
                <th>{t('admin.familles.colEmail')}</th>
                <th>{t('admin.familles.colTelephone')}</th>
                <th>{t('admin.familles.colRole')}</th>
                <th>{t('admin.commun.colStatut')}</th>
                <th>{t('admin.familles.colInscrit')}</th>
                <th>{t('admin.commun.colActions')}</th>
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
                  <td><span className={`s-badge s-badge--${u.role}`}>{t(`common.roles.${u.role}`, { defaultValue: u.role.replace('_', ' ') })}</span></td>
                  <td>
                    <span className={`s-badge ${u.actif ? 's-badge--accepte' : 's-badge--refuse'}`}>
                      {u.actif ? t('admin.familles.actif') : t('admin.familles.inactif')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                    {new Date(u.created_at).toLocaleDateString(getLocale())}
                  </td>
                  <td>
                    <div className="a-actions">
                      <button className="btn-voir" onClick={() => setUserDetail(u)}>
                        {t('admin.familles.voir')}
                      </button>
                      <button
                        className={`btn-toggle ${u.actif ? 'btn-toggle--desactiver' : 'btn-toggle--activer'}`}
                        onClick={() => toggleActif(u)}
                      >
                        {u.actif ? t('admin.familles.desactiver') : t('admin.familles.activer')}
                      </button>
                      {/* Bouton supprimer : visible uniquement si l'admin a le droit */}
                      {peutSupprimer(u) && (
                        <button
                          className="btn btn--sm btn-supprimer"
                          onClick={() => setUserASupprimer(u)}
                          title={t('admin.familles.supprimerTitre')}
                        >
                          {t('admin.familles.supprimer')}
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
              <button className="modal__fermer" onClick={() => setUserDetail(null)} aria-label={t('common.fermer')}>✕</button>
            </div>
            <div className="user-detail-grille">
              {[
                { label: t('admin.familles.detail.email'),        valeur: userDetail.email },
                { label: t('admin.familles.detail.telephone'),    valeur: userDetail.telephone || '—' },
                { label: t('admin.familles.detail.role'),         valeur: t(`common.roles.${userDetail.role}`, { defaultValue: userDetail.role }) },
                { label: t('admin.familles.detail.statut'),       valeur: userDetail.actif ? t('admin.familles.statutActif') : t('admin.familles.statutInactif') },
                { label: t('admin.familles.detail.emailVerifie'), valeur: userDetail.email_verifie ? t('common.oui') : t('common.non') },
                { label: t('admin.familles.detail.inscrit'),      valeur: new Date(userDetail.created_at).toLocaleDateString(getLocale()) }
              ].map(({ label, valeur }) => (
                <div key={label} className="detail-item">
                  <span className="detail-label">{label}</span>
                  <span className="detail-valeur">{valeur}</span>
                </div>
              ))}
              {userDetail.adresse && (
                <div className="detail-item detail-item--full">
                  <span className="detail-label">{t('admin.familles.detail.adresse')}</span>
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

            <h2 className="suppr-titre">{t('admin.familles.suppr.titre')}</h2>

            <p className="suppr-message">
              <Trans
                i18nKey="admin.familles.suppr.message"
                values={{ nom: `${userASupprimer.prenom} ${userASupprimer.nom}`, email: userASupprimer.email }}
                components={{ email: <span className="suppr-email" /> }}
              />
            </p>

            <div className="suppr-avertissements">
              <p>{t('admin.familles.suppr.vaFaire')}</p>
              <ul>
                {t('admin.familles.suppr.points', { returnObjects: true }).map((_, i) => (
                  <li key={i}><Trans i18nKey={`admin.familles.suppr.points.${i}`} /></li>
                ))}
              </ul>
            </div>

            <div className="suppr-actions">
              <button
                className="btn btn--ghost"
                onClick={() => setUserASupprimer(null)}
                disabled={suppression}
              >
                {t('common.annuler')}
              </button>
              <button
                className="btn btn-supprimer-confirmer"
                onClick={confirmerSuppression}
                disabled={suppression}
              >
                {suppression ? t('admin.familles.suppr.enCours') : t('admin.familles.suppr.confirmer')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Familles;
