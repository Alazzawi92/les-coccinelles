// ============================================================
// FICHIER  : Comptes.jsx (admin)
// ROUTE    : /admin/comptes (super admin uniquement)
// RÔLE     : Comptes de l'équipe de la crèche.
//             1. Formulaire pour créer un compte admin ou super admin
//             2. Liste des comptes de l'équipe existants
//            Le super admin ne choisit pas le mot de passe : la
//            personne reçoit un email et choisit elle-même le sien.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import Chargement from '../../../components/ui/Chargement/Chargement';
import '../../../styles/admin.css';
import './Comptes.css';

// Préfixe des clés de traduction de la page
const P = 'admin.comptes';

// Formulaire vide (rôle admin par défaut : le moins de droits)
const FORMULAIRE_VIDE = { prenom: '', nom: '', email: '', role: 'admin' };

const Comptes = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  const [membres,    setMembres]    = useState(null);            // Comptes de l'équipe ; null = chargement
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE); // Champs du formulaire de création
  const [envoi,      setEnvoi]      = useState(false);           // Création en cours

  // Charge la liste des comptes admin et super admin
  const charger = useCallback(() => {
    api.get('/users/equipe')
      .then(res => setMembres(res.data.data || []))
      .catch(() => { setMembres([]); toast.error(t(`${P}.erreurChargement`)); });
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  // Met à jour un champ du formulaire
  const modifierChamp = (e) => setFormulaire({ ...formulaire, [e.target.name]: e.target.value });

  // Crée le compte puis envoie l'invitation (fait par le backend)
  const creer = async (e) => {
    e.preventDefault();

    // Un super admin a tous les droits : on demande confirmation
    if (formulaire.role === 'super_admin'
      && !window.confirm(t(`${P}.confirmerSuperAdmin`, { email: formulaire.email }))) return;

    setEnvoi(true);
    try {
      const res = await api.post('/users/equipe', formulaire);
      toast.success(res.data.message || t(`${P}.cree`));
      setFormulaire(FORMULAIRE_VIDE); // Formulaire prêt pour un autre compte
      charger();                      // Le nouveau compte apparaît dans la liste
    } catch (err) {
      toast.error(err.response?.data?.message || t(`${P}.erreur`));
    }
    setEnvoi(false);
  };

  // Statut affiché : invitation pas encore acceptée, actif ou désactivé
  const statut = (membre) => {
    if (!membre.actif)                return { cle: 'desactive',  badge: 's-badge--refuse' };
    if (membre.invitation_en_attente) return { cle: 'invitation', badge: 's-badge--en_attente' };
    return { cle: 'actif', badge: 's-badge--accepte' };
  };

  if (!membres) return <Chargement />;

  return (
    <div>
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
      </div>
      <p className="comptes-intro">{t(`${P}.intro`)}</p>

      <div className="comptes-grille">

        {/* ── Formulaire de création ── */}
        <form className="a-card a-form comptes-formulaire" onSubmit={creer}>
          <h2 className="a-card__titre">➕ {t(`${P}.nouveau`)}</h2>

          <div className="a-form-row">
            <div className="a-form-groupe">
              <label htmlFor="compte-prenom" className="a-label">{t(`${P}.prenom`)} <span className="requis">*</span></label>
              <input id="compte-prenom" name="prenom" className="a-input" value={formulaire.prenom}
                onChange={modifierChamp} required minLength={2} maxLength={80} autoComplete="off" />
            </div>
            <div className="a-form-groupe">
              <label htmlFor="compte-nom" className="a-label">{t(`${P}.nom`)} <span className="requis">*</span></label>
              <input id="compte-nom" name="nom" className="a-input" value={formulaire.nom}
                onChange={modifierChamp} required minLength={2} maxLength={80} autoComplete="off" />
            </div>
          </div>

          <div className="a-form-groupe">
            <label htmlFor="compte-email" className="a-label">{t(`${P}.email`)} <span className="requis">*</span></label>
            <input id="compte-email" name="email" type="email" className="a-input" value={formulaire.email}
              onChange={modifierChamp} required autoComplete="off" />
          </div>

          {/* Choix du rôle : chaque option explique ce qu'elle permet */}
          <fieldset className="comptes-roles">
            <legend className="a-label">{t(`${P}.role`)} <span className="requis">*</span></legend>
            {['admin', 'super_admin'].map(role => (
              <label key={role} className={`comptes-role${formulaire.role === role ? ' comptes-role--choisi' : ''}`}>
                <input type="radio" name="role" value={role} checked={formulaire.role === role} onChange={modifierChamp} />
                <span>
                  <strong className="comptes-role__nom">{t(`common.roles.${role}`)}</strong>
                  <span className="comptes-role__aide">{t(`${P}.aide.${role}`)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="comptes-note">✉️ {t(`${P}.note`)}</p>

          <button type="submit" className="btn btn--primary" disabled={envoi}>
            {envoi ? t('common.enregistrement') : t(`${P}.creer`)}
          </button>
        </form>

        {/* ── Liste des comptes de l'équipe ── */}
        <div className="a-card">
          <h2 className="a-card__titre">👥 {t(`${P}.liste`, { count: membres.length })}</h2>
          <table className="a-table">
            <thead>
              <tr>
                <th>{t(`${P}.colonnes.nom`)}</th>
                <th>{t(`${P}.colonnes.email`)}</th>
                <th>{t(`${P}.colonnes.role`)}</th>
                <th>{t(`${P}.colonnes.statut`)}</th>
                <th>{t(`${P}.colonnes.creeLe`)}</th>
              </tr>
            </thead>
            <tbody>
              {membres.map(membre => {
                const { cle, badge } = statut(membre);
                return (
                  <tr key={membre.id}>
                    <td>{membre.prenom} {membre.nom}</td>
                    <td>{membre.email}</td>
                    <td><span className={`s-badge s-badge--${membre.role}`}>{t(`common.roles.${membre.role}`)}</span></td>
                    <td><span className={`s-badge ${badge}`}>{t(`${P}.statuts.${cle}`)}</span></td>
                    <td>{new Date(membre.created_at).toLocaleDateString(getLocale())}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Comptes;
