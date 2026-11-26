// ============================================================
// FICHIER  : SuppressionCompte.jsx (parent)
// RÔLE     : Onglet « Supprimer mon compte » de Mon profil (RGPD).
//             - Aucun enfant accepté : suppression immédiate de tout
//               (compte, enfants, documents, fichiers) → retour à l'accueil
//             - Enfant accepté : la demande est transmise à la crèche,
//               qui supprime le compte ensuite (Admin → Familles)
//            Confirmation : mot de passe (si le compte en a un) + mot
//            « SUPPRIMER » tapé en toutes lettres.
//            API : GET /users/me (a_mot_de_passe, suppression_demandee_le),
//                  DELETE /users/me
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import { useAuth } from '../../../context/AuthContext';

// Préfixe des clés de traduction
const P = 'parent.monProfil.suppression';

// Mot à taper pour confirmer (identique au serveur, quelle que soit la langue)
const MOT_CONFIRMATION = 'SUPPRIMER';

const SuppressionCompte = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { oublierSession } = useAuth();
  const navigate = useNavigate();

  const [profil,       setProfil]       = useState(null);  // { a_mot_de_passe, suppression_demandee_le } ; null = chargement
  const [password,     setPassword]     = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [envoi,        setEnvoi]        = useState(false);
  const [erreur,       setErreur]       = useState('');

  // Profil à jour : mot de passe existant ? demande déjà envoyée ?
  useEffect(() => {
    api.get('/users/me')
      .then(res => setProfil(res.data.data))
      .catch(() => setProfil({ a_mot_de_passe: true, suppression_demandee_le: null }));
  }, []);

  const confirme = confirmation.trim() === MOT_CONFIRMATION && (!profil?.a_mot_de_passe || password);

  const supprimer = async (e) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      // axios : le corps d'une requête DELETE se passe dans « data »
      const res = await api.delete('/users/me', { data: { password, confirmation: confirmation.trim() } });
      const { statut, suppression_demandee_le } = res.data.data;

      if (statut === 'supprime') {
        // Compte et données supprimés : session vidée, retour à l'accueil
        oublierSession();
        toast.success(t(`${P}.toastSupprime`));
        navigate('/', { replace: true });
        return;
      }
      // Enfant accepté : demande transmise à la crèche
      setProfil(p => ({ ...p, suppression_demandee_le }));
      setPassword('');
      setConfirmation('');
      toast.success(t(`${P}.toastDemande`));
    } catch (err) {
      setErreur(err.response?.data?.message || t('common.erreur'));
    }
    setEnvoi(false);
  };

  if (!profil) return <div className="p-card"><p>{t('common.chargement')}</p></div>;

  return (
    <div className="p-card suppression-compte">
      <h2 className="p-card__titre">🗑️ {t(`${P}.titre`)}</h2>

      {/* Demande déjà transmise : la crèche s'en occupe */}
      {profil.suppression_demandee_le ? (
        <div className="suppression-compte__demande" role="status">
          <strong>{t(`${P}.demandeEnvoyee`, { date: new Date(profil.suppression_demandee_le).toLocaleDateString(getLocale()) })}</strong>
          <p>{t(`${P}.demandeExplication`)}</p>
        </div>
      ) : (
        <>
          <p>{t(`${P}.intro`)}</p>
          <ul className="suppression-compte__liste">
            {t(`${P}.donnees`, { returnObjects: true }).map(ligne => <li key={ligne}>{ligne}</li>)}
          </ul>
          <p className="suppression-compte__note">ℹ️ {t(`${P}.enfantAccepte`)}</p>

          {erreur && (
            <div className="auth-alerte" role="alert" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <span>⚠️</span><span>{erreur}</span>
            </div>
          )}

          <form className="p-form suppression-compte__form" onSubmit={supprimer}>
            {/* Mot de passe : seulement si le compte en a un (sinon compte Google) */}
            {profil.a_mot_de_passe && (
              <div className="p-form-groupe">
                <label htmlFor="suppression-mdp" className="p-label">{t(`${P}.motDePasse`)} <span className="requis">*</span></label>
                <input id="suppression-mdp" className="p-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
            )}
            <div className="p-form-groupe">
              <label htmlFor="suppression-mot" className="p-label">
                {t(`${P}.tapez`, { mot: MOT_CONFIRMATION })} <span className="requis">*</span>
              </label>
              <input id="suppression-mot" className="p-input" value={confirmation} autoComplete="off"
                onChange={e => setConfirmation(e.target.value)} placeholder={MOT_CONFIRMATION} />
            </div>
            <div>
              <button type="submit" className="btn suppression-compte__bouton" disabled={!confirme || envoi}>
                {envoi ? t('common.envoi') : t(`${P}.bouton`)}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default SuppressionCompte;
