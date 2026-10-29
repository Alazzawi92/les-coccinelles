// ============================================================
// FICHIER  : MonProfil.jsx (parent)
// ROUTE    : /parent/mon-profil
// RÔLE     : Page de gestion du profil personnel du parent.
//            2 onglets : "Informations" (PUT /users/me)
//            et "Mot de passe" (PUT /users/me/password).
//            Validation locale du mdp (correspondance + longueur ≥ 8).
//            majUser(data) met à jour le contexte Auth après sauvegarde.
// ============================================================

import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api, { urlFichier } from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './MonProfil.css';
import { nomPersonneValide } from '../../../utils/validation'; // Format prénom / nom

const MonProfil = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Utilisateur connecté + fonction de mise à jour du contexte
  const { user, majUser } = useAuth();

  // Onglet actif : 'infos' (informations personnelles) ou 'password' (changement de mdp)
  const [onglet, setOnglet] = useState('infos');

  // ── Formulaire infos personnelles ─────────────────────────
  // Initialisé avec les valeurs actuelles de l'utilisateur
  const [form,       setForm]       = useState({ prenom: user?.prenom || '', nom: user?.nom || '', telephone: user?.telephone || '', adresse: user?.adresse || '' });
  // Indicateur d'envoi pendant la requête PUT /users/me
  const [sauveProfil, setSauveProfil] = useState(false);

  // ── Formulaire mot de passe ───────────────────────────────
  const [mdp,       setMdp]       = useState({ ancienPassword: '', nouveauPassword: '', confirmPassword: '' });
  // Indicateur d'envoi pendant la requête PUT /users/me/password
  const [sauveMdp,  setSauveMdp]  = useState(false);
  // Message d'erreur local (validation côté client ou réponse API)
  const [erreurMdp, setErreurMdp] = useState('');

  // ── Sauvegarder les infos personnelles ───────────────────
  // PUT /users/me → met à jour l'utilisateur dans le contexte Auth
  const handleProfilSubmit = async (e) => {
    e.preventDefault();
    // Même règle que le serveur pour le prénom et le nom
    if (!nomPersonneValide(form.prenom) || !nomPersonneValide(form.nom)) {
      toast.error(t('parent.monProfil.nomInvalide'));
      return;
    }
    setSauveProfil(true);
    try {
      const res = await api.put('/users/me', form);
      majUser(res.data.data); // Propagation au contexte pour mise à jour du header
      toast.success(t('parent.monProfil.toastProfil'));
    } catch (err) {
      // Message précis du serveur (ex : champ invalide) si disponible
      toast.error(err.response?.data?.message || t('common.erreurMaj'));
    }
    setSauveProfil(false);
  };

  // ── Changer le mot de passe ───────────────────────────────
  // Validation locale avant l'appel API
  const handleMdpSubmit = async (e) => {
    e.preventDefault();
    setErreurMdp('');
    // Vérification correspondance des deux mots de passe
    if (mdp.nouveauPassword !== mdp.confirmPassword) { setErreurMdp(t('parent.monProfil.mdpDifferents')); return; }
    // Longueur minimale requise
    if (mdp.nouveauPassword.length < 8) { setErreurMdp(t('parent.monProfil.mdpCourt')); return; }

    setSauveMdp(true);
    try {
      await api.put('/users/me/password', { ancienPassword: mdp.ancienPassword, nouveauPassword: mdp.nouveauPassword });
      toast.success(t('parent.monProfil.toastMdp'));
      // Réinitialise les champs après succès
      setMdp({ ancienPassword: '', nouveauPassword: '', confirmPassword: '' });
    } catch (err) {
      // L'API retourne un message d'erreur si l'ancien mdp est incorrect
      setErreurMdp(err.response?.data?.message || t('parent.monProfil.erreurMdp'));
    }
    setSauveMdp(false);
  };

  return (
    <div className="mon-profil">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.monProfil.titre" components={{ s: <span /> }} /></h1>
      </div>

      {/* ── CARTE IDENTITÉ ────────────────────────────────────── */}
      {/* Avatar (image ou initiales) + nom + email + badge email vérifié */}
      <div className="profil-identite">
        <div className="profil-avatar">
          {user?.avatar
            ? <img src={urlFichier(user.avatar)} alt={t('parent.monProfil.avatar')} />
            : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
          }
        </div>
        <div className="profil-identite__infos">
          <h2>{user?.prenom} {user?.nom}</h2>
          <p>{user?.email}</p>
          {/* Badge : vert si email vérifié, orange sinon */}
          <span className={`statut-badge statut-badge--${user?.email_verifie ? 'accepte' : 'en_attente'}`}>
            {user?.email_verifie ? t('parent.monProfil.emailVerifie') : t('parent.monProfil.emailNonVerifie')}
          </span>
        </div>
      </div>

      {/* ── ONGLETS ───────────────────────────────────────────── */}
      <div className="profil-onglets">
        <button className={`onglet ${onglet === 'infos'    ? 'onglet--actif' : ''}`} onClick={() => setOnglet('infos')}>{t('parent.monProfil.ongletInfos')}</button>
        <button className={`onglet ${onglet === 'password' ? 'onglet--actif' : ''}`} onClick={() => setOnglet('password')}>{t('parent.monProfil.ongletMdp')}</button>
      </div>

      {/* ── FORMULAIRE INFOS PERSONNELLES ─────────────────────── */}
      {onglet === 'infos' && (
        <div className="p-card">
          <h2 className="p-card__titre">{t('parent.monProfil.infosTitre')}</h2>
          <form className="p-form" onSubmit={handleProfilSubmit}>
            <div className="p-form-row">
              <div className="p-form-groupe">
                <label className="p-label">{t('parent.monProfil.prenom')}</label>
                <input className="p-input" value={form.prenom} onChange={e => setForm(p => ({...p, prenom: e.target.value}))} />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">{t('parent.monProfil.nom')}</label>
                <input className="p-input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
              </div>
            </div>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.monProfil.telephone')}</label>
              <input className="p-input" type="tel" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} placeholder={t('parent.monProfil.telephonePlaceholder')} />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.monProfil.adresse')}</label>
              <textarea className="p-input p-textarea" value={form.adresse} onChange={e => setForm(p => ({...p, adresse: e.target.value}))} rows={3} placeholder={t('parent.monProfil.adressePlaceholder')} />
            </div>
            <div>
              <button type="submit" className="btn btn--primary" disabled={sauveProfil}>
                {sauveProfil ? t('common.enregistrement') : t('parent.monProfil.enregistrer')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── FORMULAIRE MOT DE PASSE ───────────────────────────── */}
      {onglet === 'password' && (
        <div className="p-card">
          <h2 className="p-card__titre">{t('parent.monProfil.mdpTitre')}</h2>
          {/* Message d'erreur si validation locale ou réponse API */}
          {erreurMdp && <div className="auth-alerte" style={{ marginBottom: 'var(--space-md)', display:'flex', gap:'var(--space-sm)' }}><span>⚠️</span><span>{erreurMdp}</span></div>}
          <form className="p-form" onSubmit={handleMdpSubmit} style={{ maxWidth: '400px' }}>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.monProfil.mdpActuel')} <span className="requis">*</span></label>
              {/* autocomplete="current-password" pour les gestionnaires de mdp */}
              <input className="p-input" type="password" value={mdp.ancienPassword} onChange={e => setMdp(p => ({...p, ancienPassword: e.target.value}))} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.monProfil.mdpNouveau')} <span className="requis">*</span></label>
              <input className="p-input" type="password" value={mdp.nouveauPassword} onChange={e => setMdp(p => ({...p, nouveauPassword: e.target.value}))} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">{t('parent.monProfil.confirmer')} <span className="requis">*</span></label>
              <input className="p-input" type="password" value={mdp.confirmPassword} onChange={e => setMdp(p => ({...p, confirmPassword: e.target.value}))} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div>
              <button type="submit" className="btn btn--primary" disabled={sauveMdp}>
                {sauveMdp ? t('common.miseAJour') : t('parent.monProfil.changer')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default MonProfil;
