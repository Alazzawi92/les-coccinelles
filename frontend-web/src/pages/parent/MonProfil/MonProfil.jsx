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
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './MonProfil.css';

const MonProfil = () => {
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
    setSauveProfil(true);
    try {
      const res = await api.put('/users/me', form);
      majUser(res.data.data); // Propagation au contexte pour mise à jour du header
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setSauveProfil(false);
  };

  // ── Changer le mot de passe ───────────────────────────────
  // Validation locale avant l'appel API
  const handleMdpSubmit = async (e) => {
    e.preventDefault();
    setErreurMdp('');
    // Vérification correspondance des deux mots de passe
    if (mdp.nouveauPassword !== mdp.confirmPassword) { setErreurMdp('Les mots de passe ne correspondent pas'); return; }
    // Longueur minimale requise
    if (mdp.nouveauPassword.length < 8) { setErreurMdp('8 caractères minimum'); return; }

    setSauveMdp(true);
    try {
      await api.put('/users/me/password', { ancienPassword: mdp.ancienPassword, nouveauPassword: mdp.nouveauPassword });
      toast.success('Mot de passe modifié');
      // Réinitialise les champs après succès
      setMdp({ ancienPassword: '', nouveauPassword: '', confirmPassword: '' });
    } catch (err) {
      // L'API retourne un message d'erreur si l'ancien mdp est incorrect
      setErreurMdp(err.response?.data?.message || 'Erreur lors du changement');
    }
    setSauveMdp(false);
  };

  return (
    <div className="mon-profil">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Mon <span>profil</span></h1>
      </div>

      {/* ── CARTE IDENTITÉ ────────────────────────────────────── */}
      {/* Avatar (image ou initiales) + nom + email + badge email vérifié */}
      <div className="profil-identite">
        <div className="profil-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt="Avatar" />
            : <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
          }
        </div>
        <div className="profil-identite__infos">
          <h2>{user?.prenom} {user?.nom}</h2>
          <p>{user?.email}</p>
          {/* Badge : vert si email vérifié, orange sinon */}
          <span className={`statut-badge statut-badge--${user?.email_verifie ? 'accepte' : 'en_attente'}`}>
            {user?.email_verifie ? '✓ Email vérifié' : '⚠ Email non vérifié'}
          </span>
        </div>
      </div>

      {/* ── ONGLETS ───────────────────────────────────────────── */}
      <div className="profil-onglets">
        <button className={`onglet ${onglet === 'infos'    ? 'onglet--actif' : ''}`} onClick={() => setOnglet('infos')}>👤 Informations</button>
        <button className={`onglet ${onglet === 'password' ? 'onglet--actif' : ''}`} onClick={() => setOnglet('password')}>🔒 Mot de passe</button>
      </div>

      {/* ── FORMULAIRE INFOS PERSONNELLES ─────────────────────── */}
      {onglet === 'infos' && (
        <div className="p-card">
          <h2 className="p-card__titre">Informations personnelles</h2>
          <form className="p-form" onSubmit={handleProfilSubmit}>
            <div className="p-form-row">
              <div className="p-form-groupe">
                <label className="p-label">Prénom</label>
                <input className="p-input" value={form.prenom} onChange={e => setForm(p => ({...p, prenom: e.target.value}))} />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Nom</label>
                <input className="p-input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
              </div>
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Téléphone</label>
              <input className="p-input" type="tel" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))} placeholder="06 XX XX XX XX" />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Adresse</label>
              <textarea className="p-input p-textarea" value={form.adresse} onChange={e => setForm(p => ({...p, adresse: e.target.value}))} rows={3} placeholder="Votre adresse postale" />
            </div>
            <div>
              <button type="submit" className="btn btn--primary" disabled={sauveProfil}>
                {sauveProfil ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── FORMULAIRE MOT DE PASSE ───────────────────────────── */}
      {onglet === 'password' && (
        <div className="p-card">
          <h2 className="p-card__titre">Changer le mot de passe</h2>
          {/* Message d'erreur si validation locale ou réponse API */}
          {erreurMdp && <div className="auth-alerte" style={{ marginBottom: 'var(--space-md)', display:'flex', gap:'var(--space-sm)' }}><span>⚠️</span><span>{erreurMdp}</span></div>}
          <form className="p-form" onSubmit={handleMdpSubmit} style={{ maxWidth: '400px' }}>
            <div className="p-form-groupe">
              <label className="p-label">Mot de passe actuel <span className="requis">*</span></label>
              {/* autocomplete="current-password" pour les gestionnaires de mdp */}
              <input className="p-input" type="password" value={mdp.ancienPassword} onChange={e => setMdp(p => ({...p, ancienPassword: e.target.value}))} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Nouveau mot de passe <span className="requis">*</span></label>
              <input className="p-input" type="password" value={mdp.nouveauPassword} onChange={e => setMdp(p => ({...p, nouveauPassword: e.target.value}))} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className="p-form-groupe">
              <label className="p-label">Confirmer <span className="requis">*</span></label>
              <input className="p-input" type="password" value={mdp.confirmPassword} onChange={e => setMdp(p => ({...p, confirmPassword: e.target.value}))} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div>
              <button type="submit" className="btn btn--primary" disabled={sauveMdp}>
                {sauveMdp ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default MonProfil;
