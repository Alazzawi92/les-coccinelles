// ============================================================
// FICHIER  : Register.jsx
// ROUTE    : /creer-un-compte
// RÔLE     : Formulaire de création de compte parent.
//            Validation en temps réel des critères du mot de passe.
//            Après inscription, l'utilisateur est redirigé vers
//            la connexion avec un message de vérification email.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerService } from '../../../services/auth.service';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './Register.css';

// ── Vérification des critères du mot de passe ─────────────────
// Renvoie un objet indiquant si chaque critère est respecté
const verifierPassword = (pwd) => ({
  longueur:  pwd.length >= 8,      // Au moins 8 caractères
  chiffre:   /\d/.test(pwd),       // Au moins un chiffre
  majuscule: /[A-Z]/.test(pwd)     // Au moins une majuscule
});

const Register = () => {

  // ── État du formulaire ────────────────────────────────────
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '', confirmPassword: '', telephone: ''
  });
  const [envoi,       setEnvoi]       = useState(false);  // En cours d'envoi
  const [erreur,      setErreur]      = useState('');      // Erreur globale (API)
  const [erreurs,     setErreurs]     = useState({});      // Erreurs par champ
  const [voirMdp,     setVoirMdp]     = useState(false);  // Afficher mot de passe
  const [voirConfirm, setVoirConfirm] = useState(false);  // Afficher confirmation

  const { connecter } = useAuth();
  const navigate      = useNavigate();

  // Critères de force du mot de passe, recalculés à chaque frappe
  const criteres = verifierPassword(form.password);

  // ── Gestion des changements de champ ─────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Efface l'erreur du champ modifié
    if (erreurs[name]) setErreurs(prev => ({ ...prev, [name]: '' }));
  };

  // ── Validation côté client ────────────────────────────────
  const valider = () => {
    const e = {};
    if (!form.prenom.trim())   e.prenom  = 'Prénom requis';
    if (!form.nom.trim())      e.nom     = 'Nom requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email invalide';
    if (!criteres.longueur || !criteres.chiffre || !criteres.majuscule)
      e.password = 'Le mot de passe ne respecte pas les critères';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  };

  // ── Soumission du formulaire ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    // Valider avant d'appeler l'API
    const e_val = valider();
    if (Object.keys(e_val).length > 0) { setErreurs(e_val); return; }

    setEnvoi(true);
    try {
      await registerService({
        prenom:    form.prenom,
        nom:       form.nom,
        email:     form.email,
        password:  form.password,
        telephone: form.telephone
      });

      toast.success('Compte créé ! En attente de validation par l\'administrateur.');
      navigate('/connexion', {
        state: { message: 'Votre compte a été créé. Un administrateur doit valider votre accès avant que vous puissiez vous connecter.' }
      });
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création du compte');
    }
    setEnvoi(false);
  };

  return (
    <div className="auth-page">
      {/* auth-card--large : formulaire plus large pour les 2 colonnes */}
      <div className="auth-card auth-card--large">

        <div className="auth-logo">
          <span className="auth-logo__icone">🐞</span>
          <span className="auth-logo__nom">Les Coccinelles</span>
          <span className="auth-logo__sous">Création de votre espace parent</span>
        </div>

        <h1 className="auth-titre">Créer un compte</h1>
        <p className="auth-sous-titre">Remplissez ce formulaire pour accéder à l'espace parents</p>

        {/* Erreur globale (email déjà utilisé, serveur indisponible...) */}
        {erreur && <div className="auth-alerte" role="alert"><span>⚠️</span><span>{erreur}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Ligne Prénom + Nom côte à côte */}
          <div className="form-row-double">
            <div className="form-groupe">
              <label htmlFor="prenom" className="form-label">Prénom <span className="requis">*</span></label>
              <input id="prenom" name="prenom" type="text"
                className={`form-input ${erreurs.prenom ? 'form-input--erreur' : ''}`}
                placeholder="Marie" value={form.prenom} onChange={handleChange} autoFocus />
              {erreurs.prenom && <p className="form-erreur">{erreurs.prenom}</p>}
            </div>
            <div className="form-groupe">
              <label htmlFor="nom" className="form-label">Nom <span className="requis">*</span></label>
              <input id="nom" name="nom" type="text"
                className={`form-input ${erreurs.nom ? 'form-input--erreur' : ''}`}
                placeholder="Dupont" value={form.nom} onChange={handleChange} />
              {erreurs.nom && <p className="form-erreur">{erreurs.nom}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="form-groupe">
            <label htmlFor="email" className="form-label">Email <span className="requis">*</span></label>
            <input id="email" name="email" type="email"
              className={`form-input ${erreurs.email ? 'form-input--erreur' : ''}`}
              placeholder="marie@exemple.fr" value={form.email} onChange={handleChange} />
            {erreurs.email && <p className="form-erreur">{erreurs.email}</p>}
          </div>

          {/* Téléphone : optionnel */}
          <div className="form-groupe">
            <label htmlFor="telephone" className="form-label">Téléphone</label>
            <input id="telephone" name="telephone" type="tel" className="form-input"
              placeholder="06 XX XX XX XX" value={form.telephone} onChange={handleChange} />
          </div>

          {/* Mot de passe + indicateur de critères */}
          <div className="form-groupe">
            <label htmlFor="password" className="form-label">Mot de passe <span className="requis">*</span></label>
            <div className="password-wrapper">
              <input id="password" name="password" type={voirMdp ? 'text' : 'password'}
                className={`form-input ${erreurs.password ? 'form-input--erreur' : ''}`}
                placeholder="••••••••" value={form.password} onChange={handleChange}
                autoComplete="new-password" />
              <button type="button" className="password-toggle"
                onClick={() => setVoirMdp(v => !v)}
                aria-label={voirMdp ? 'Masquer' : 'Afficher'}>
                {voirMdp ? 'Masquer' : 'Voir'}
              </button>
            </div>

            {/* Indicateur de critères (visible dès qu'on tape) */}
            {form.password && (
              <div className="password-criteres">
                <span className={`critere ${criteres.longueur  ? 'critere--ok' : ''}`}>{criteres.longueur  ? '✅' : '○'} 8 caractères minimum</span>
                <span className={`critere ${criteres.chiffre   ? 'critere--ok' : ''}`}>{criteres.chiffre   ? '✅' : '○'} Au moins un chiffre</span>
                <span className={`critere ${criteres.majuscule ? 'critere--ok' : ''}`}>{criteres.majuscule ? '✅' : '○'} Au moins une majuscule</span>
              </div>
            )}
            {erreurs.password && <p className="form-erreur">{erreurs.password}</p>}
          </div>

          {/* Confirmation du mot de passe */}
          <div className="form-groupe">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le mot de passe <span className="requis">*</span>
            </label>
            <div className="password-wrapper">
              <input id="confirmPassword" name="confirmPassword"
                type={voirConfirm ? 'text' : 'password'}
                className={`form-input ${erreurs.confirmPassword ? 'form-input--erreur' : ''}`}
                placeholder="••••••••" value={form.confirmPassword} onChange={handleChange}
                autoComplete="new-password" />
              <button type="button" className="password-toggle"
                onClick={() => setVoirConfirm(v => !v)}
                aria-label={voirConfirm ? 'Masquer' : 'Afficher'}>
                {voirConfirm ? 'Masquer' : 'Voir'}
              </button>
            </div>
            {erreurs.confirmPassword && <p className="form-erreur">{erreurs.confirmPassword}</p>}
          </div>

          <button type="submit" className="btn-auth" disabled={envoi}>
            {envoi ? '⏳ Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-pied">
          Déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
        <p className="auth-pied"><Link to="/">← Retour au site</Link></p>

      </div>
    </div>
  );
};

export default Register;
