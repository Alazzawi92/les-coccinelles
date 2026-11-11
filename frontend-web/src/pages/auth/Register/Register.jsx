// ============================================================
// FICHIER  : Register.jsx
// ROUTE    : /creer-un-compte
// RÔLE     : Formulaire de création de compte parent.
//            Validation en temps réel des critères du mot de passe.
//            Après inscription, l'utilisateur est redirigé vers
//            la connexion avec un message de vérification email.
// ============================================================

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register as registerService } from '../../../services/auth.service';
import GoogleButton from '../../../components/ui/GoogleButton/GoogleButton';
import Turnstile, { TURNSTILE_ACTIF } from '../../../components/ui/Turnstile/Turnstile';
import LanguageSwitcher from '../../../components/ui/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../../../components/ui/ThemeToggle/ThemeToggle';
import toast from 'react-hot-toast';
import '../../../styles/auth.css';
import './Register.css';
import { nomPersonneValide } from '../../../utils/validation'; // Format prénom / nom

// ── Vérification des critères du mot de passe ─────────────────
// Renvoie un objet indiquant si chaque critère est respecté
const verifierPassword = (pwd) => ({
  longueur:  pwd.length >= 8,      // Au moins 8 caractères
  chiffre:   /\d/.test(pwd),       // Au moins un chiffre
  majuscule: /[A-Z]/.test(pwd)     // Au moins une majuscule
});

const Register = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // ── État du formulaire ────────────────────────────────────
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '', confirmPassword: '', telephone: ''
  });
  const [envoi,       setEnvoi]       = useState(false);  // En cours d'envoi
  const [erreur,      setErreur]      = useState('');      // Erreur globale (API)
  const [erreurs,     setErreurs]     = useState({});      // Erreurs par champ (clés de traduction)
  const [touches,     setTouches]     = useState({});      // Champs déjà visités (erreur affichable)
  const [voirMdp,    setVoirMdp]     = useState(false);  // Afficher mot de passe
  const [voirConfirm, setVoirConfirm] = useState(false);  // Afficher confirmation
  const [jeton,       setJeton]       = useState('');      // Jeton de la case anti-robot
  const turnstileRef = useRef(null);                       // Pour redemander une vérification

  const navigate      = useNavigate();

  // Critères de force du mot de passe, recalculés à chaque frappe
  const criteres = verifierPassword(form.password);

  // ── Validation côté client ────────────────────────────────
  // Reçoit les valeurs à vérifier (pas forcément l'état courant : utile
  // pendant la frappe, avant que React ait mis à jour "form")
  const valider = (f) => {
    const e = {};
    const c = verifierPassword(f.password);
    // On stocke des clés de traduction : le message suit la langue choisie
    if (!f.prenom.trim())                e.prenom = 'prenomRequis';
    else if (!nomPersonneValide(f.prenom)) e.prenom = 'prenomInvalide';  // Même règle que le serveur
    if (!f.nom.trim())                   e.nom    = 'nomRequis';
    else if (!nomPersonneValide(f.nom))  e.nom    = 'nomInvalide';
    if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      e.email = 'emailInvalide';
    if (!c.longueur || !c.chiffre || !c.majuscule)
      e.password = 'mdpCriteres';
    if (f.password !== f.confirmPassword)
      e.confirmPassword = 'mdpDifferents';
    // Téléphone optionnel, mais s'il est rempli il doit être valide
    // (même règle que le serveur : 8 à 20 caractères, chiffres + espaces . - ( ) +)
    if (f.telephone.trim() && !/^\+?[0-9 .\-()]{8,20}$/.test(f.telephone.trim()))
      e.telephone = 'telInvalide';
    return e;
  };

  // N'affiche que les erreurs des champs déjà visités : un champ
  // pas encore rempli ne doit pas être rouge dès l'ouverture de la page
  const rafraichirErreurs = (f, vus) => {
    const toutes = valider(f);
    setErreurs(Object.fromEntries(Object.entries(toutes).filter(([champ]) => vus[champ])));
  };

  // ── Gestion des changements de champ ─────────────────────
  // Revalide à chaque frappe : le rouge disparaît dès que le champ est corrigé
  const handleChange = (e) => {
    const { name, value } = e.target;
    const f = { ...form, [name]: value };
    let vus = touches;
    // Confirmation : rouge dès qu'elle est aussi longue que le mot de passe,
    // sans attendre que le parent quitte le champ
    if (name === 'confirmPassword' && value.length >= f.password.length && !vus.confirmPassword) {
      vus = { ...vus, confirmPassword: true };
      setTouches(vus);
    }
    setForm(f);
    rafraichirErreurs(f, vus);
  };

  // ── Sortie d'un champ : il devient "visité" et son erreur s'affiche ──
  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Champ optionnel laissé vide : rien à signaler
    if (!value && name === 'telephone') return;
    const vus = { ...touches, [name]: true };
    setTouches(vus);
    rafraichirErreurs(form, vus);
  };

  // ── Soumission du formulaire ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    // Valider avant d'appeler l'API : tous les champs deviennent "visités"
    const e_val = valider(form);
    if (Object.keys(e_val).length > 0) {
      setTouches(Object.fromEntries(Object.keys(form).map(champ => [champ, true])));
      setErreurs(e_val);
      return;
    }

    setEnvoi(true);
    try {
      await registerService({
        prenom:    form.prenom,
        nom:       form.nom,
        email:     form.email,
        password:  form.password,
        telephone: form.telephone,
        turnstileToken: jeton
      });

      toast.success(t('auth.register.toastCree'));
      navigate('/connexion', {
        state: { messageCle: 'auth.register.compteCreeInfo' } // Clé traduite par la page de connexion
      });
    } catch (err) {
      // Erreur de validation serveur : on affiche le message précis du 1er champ
      const data = err.response?.data;
      setErreur(data?.erreurs?.[0]?.msg || data?.message || t('auth.register.erreur'));
      turnstileRef.current?.reset(); // Le jeton a été consommé : nouvelle vérification
    }
    setEnvoi(false);
  };

  return (
    <div className="auth-page">
      {/* auth-card--large : formulaire plus large pour les 2 colonnes */}
      <div className="auth-card auth-card--large">

        {/* Sélecteur de langue (pas de layout sur les pages auth) */}
        <div className="auth-langue">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="auth-logo">
          <img src="/images/logo.png" alt={t('auth.logoAlt')} className="auth-logo__img" />
          <span className="auth-logo__sous">{t('auth.register.logoSous')}</span>
        </div>

        <h1 className="auth-titre">{t('auth.register.titre')}</h1>
        <p className="auth-sous-titre">{t('auth.register.sousTitre')}</p>

        {/* Erreur globale (email déjà utilisé, serveur indisponible...) */}
        {erreur && <div className="auth-alerte" role="alert"><span>⚠️</span><span>{erreur}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Prénom puis Nom, l'un sous l'autre (même largeur que les autres champs) */}
          <div className="form-groupe">
            <label htmlFor="prenom" className="form-label">{t('auth.register.prenom')} <span className="requis">*</span></label>
            <input id="prenom" name="prenom" type="text" autoComplete="given-name"
              className={`form-input ${erreurs.prenom ? 'form-input--erreur' : ''}`}
              placeholder={t('auth.register.prenomPlaceholder')} value={form.prenom} onChange={handleChange} onBlur={handleBlur} autoFocus />
            {erreurs.prenom && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.prenom}`)}</p>}
          </div>
          <div className="form-groupe">
            <label htmlFor="nom" className="form-label">{t('auth.register.nom')} <span className="requis">*</span></label>
            <input id="nom" name="nom" type="text" autoComplete="family-name"
              className={`form-input ${erreurs.nom ? 'form-input--erreur' : ''}`}
              placeholder={t('auth.register.nomPlaceholder')} value={form.nom} onChange={handleChange} onBlur={handleBlur} />
            {erreurs.nom && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.nom}`)}</p>}
          </div>

          {/* Email */}
          <div className="form-groupe">
            <label htmlFor="email" className="form-label">{t('auth.emailCourt')} <span className="requis">*</span></label>
            <input id="email" name="email" type="email" autoComplete="email"
              className={`form-input ${erreurs.email ? 'form-input--erreur' : ''}`}
              placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={handleChange} onBlur={handleBlur} />
            {erreurs.email && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.email}`)}</p>}
          </div>

          {/* Téléphone : optionnel */}
          <div className="form-groupe">
            <label htmlFor="telephone" className="form-label">{t('auth.register.telephone')}</label>
            <input id="telephone" name="telephone" type="tel" autoComplete="tel"
              className={`form-input ${erreurs.telephone ? 'form-input--erreur' : ''}`}
              placeholder={t('auth.register.telephonePlaceholder')} value={form.telephone} onChange={handleChange} onBlur={handleBlur} />
            {erreurs.telephone && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.telephone}`)}</p>}
          </div>

          {/* Mot de passe + indicateur de critères */}
          <div className="form-groupe">
            <label htmlFor="password" className="form-label">{t('auth.motDePasse')} <span className="requis">*</span></label>
            <div className="password-wrapper">
              <input id="password" name="password" type={voirMdp ? 'text' : 'password'}
                className={`form-input ${erreurs.password ? 'form-input--erreur' : ''}`}
                placeholder="••••••••" value={form.password} onChange={handleChange} onBlur={handleBlur}
                autoComplete="new-password" />
              <button type="button" className="password-toggle"
                onClick={() => setVoirMdp(v => !v)}
                aria-label={voirMdp ? t('auth.masquer') : t('auth.afficher')}>
                {voirMdp ? t('auth.masquer') : t('auth.voir')}
              </button>
            </div>

            {/* Indicateur de critères (visible dès qu'on tape) */}
            {form.password && (
              <div className="password-criteres">
                <span className={`critere ${criteres.longueur  ? 'critere--ok' : ''}`}>{criteres.longueur  ? '✅' : '○'} {t('auth.register.critereLongueur')}</span>
                <span className={`critere ${criteres.chiffre   ? 'critere--ok' : ''}`}>{criteres.chiffre   ? '✅' : '○'} {t('auth.register.critereChiffre')}</span>
                <span className={`critere ${criteres.majuscule ? 'critere--ok' : ''}`}>{criteres.majuscule ? '✅' : '○'} {t('auth.register.critereMajuscule')}</span>
              </div>
            )}
            {erreurs.password && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.password}`)}</p>}
          </div>

          {/* Confirmation du mot de passe */}
          <div className="form-groupe">
            <label htmlFor="confirmPassword" className="form-label">
              {t('auth.register.confirmer')} <span className="requis">*</span>
            </label>
            <div className="password-wrapper">
              <input id="confirmPassword" name="confirmPassword"
                type={voirConfirm ? 'text' : 'password'}
                className={`form-input ${erreurs.confirmPassword ? 'form-input--erreur' : ''}`}
                placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                autoComplete="new-password" />
              <button type="button" className="password-toggle"
                onClick={() => setVoirConfirm(v => !v)}
                aria-label={voirConfirm ? t('auth.masquer') : t('auth.afficher')}>
                {voirConfirm ? t('auth.masquer') : t('auth.voir')}
              </button>
            </div>
            {erreurs.confirmPassword && <p className="form-erreur">{t(`auth.register.erreurs.${erreurs.confirmPassword}`)}</p>}
          </div>

          {/* Case anti-robot : le bouton reste grisé tant qu'elle n'est pas validée */}
          <Turnstile ref={turnstileRef} onJeton={setJeton} />

          <button type="submit" className="btn-auth" disabled={envoi || (TURNSTILE_ACTIF && !jeton)}>
            {envoi ? t('auth.register.creation') : t('auth.register.creer')}
          </button>
        </form>

        <div className="auth-divider">{t('auth.ou')}</div>

        {/* Inscription avec Google : le compte est créé puis validé par un admin */}
        <GoogleButton
          texte="signup_with"
          onConnexion={(data) => {
            // Compte Google déjà existant et validé : saisie du code reçu par email
            navigate('/connexion/verification', {
              state: { jeton: data.jeton_2fa, emailMasque: data.email_masque, emailEnvoye: data.email_envoye }
            });
          }}
          onCompteCree={(message) => navigate('/connexion', { state: { message } })}
          onErreur={setErreur}
        />

        <p className="auth-pied">
          {t('auth.register.dejaCompte')} <Link to="/connexion">{t('auth.register.seConnecter')}</Link>
        </p>
        <p className="auth-pied"><Link to="/">{t('auth.retourSite')}</Link></p>

      </div>
    </div>
  );
};

export default Register;
