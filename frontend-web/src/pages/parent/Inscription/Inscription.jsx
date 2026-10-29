// ============================================================
// FICHIER  : Inscription.jsx (parent)
// ROUTE    : /parent/inscription
// RÔLE     : Formulaire multi-étapes de demande d'inscription.
//            6 étapes : Pré-inscription → Enfant → Accueil
//                       → Documents → Commentaire → Récapitulatif.
//            Étape 1 : conditions + fiche de pré-inscription complète.
//            Toutes les règles sont AUSSI vérifiées par le serveur
//            (backend/src/validators/inscription.validator.js).
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import { FormulaireEnfant } from '../MesEnfants/MesEnfants';
import BadgeInscription from '../../../components/ui/BadgeInscription/BadgeInscription';
import { statutParEnfant, estDemandeActive } from '../../../utils/demandes';
import { TAILLE_MAX_DOCUMENT_MO, documentTropLourd } from '../../../config/limites'; // Taille max partagée
import '../../../styles/parent.css';
import './Inscription.css';

// Préfixe des clés de traduction de la page
const I = 'parent.inscription';

// Nombre d'étapes (libellés traduits dans parent.inscription.etapes)
const NB_ETAPES = 6;

// Valeurs de situation familiale envoyées à l'API (libellés : parent.inscription.situations.*)
const SITUATIONS = ['marie', 'pacse', 'concubinage', 'separe', 'divorce', 'celibataire', 'veuf'];

// Valeurs enregistrées en base (gardées en français pour l'équipe) ;
// le libellé affiché est traduit par position (parent.inscription.fratrie)
const FRATRIEOPT = ['1er enfant', '2ème enfant', '3ème enfant', '4ème enfant ou plus'];

// Jours enregistrés en base (gardés en français) ↔ clé de traduction common.jours.*
const JOURS_ACCUEIL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

// Types d'accueil (libellés : parent.inscription.e3.types.*)
const TYPES_ACCUEIL = ['temps_plein', 'temps_partiel', 'occasionnel'];


// Pièces à fournir : le libellé "doc" (français) est envoyé à l'API avec le fichier
// pour que l'équipe sache de quel document il s'agit ; l'affichage est traduit
// par position (parent.inscription.pieces)
const PIECES = [
  { icone: '🪪', doc: "Numéro d'assuré social dont dépend l'enfant + photocopie justificative" },
  { icone: '💳', doc: "Numéro d'Allocations Familiales (CAF PRO) + photocopie justificative" },
  { icone: '💉', doc: "Carnet de santé de l'enfant : vaccinations obligatoires et à jour" },
  { icone: '📋', doc: "Certificat d'aptitude à la vie en collectivité" },
  { icone: '🛡️', doc: "Attestation de responsabilité civile à jour" },
];

// Documents : mêmes règles que le serveur (PDF / JPG / PNG, taille : config/limites.js)
const TYPES_ACCEPTES = ['application/pdf', 'image/jpeg', 'image/png'];

const parentVide    = () => ({ nom: '', prenom: '', telephone: '', email: '', adresse: '', situation_familiale: '' });
const contactVide   = () => ({ nom: '', prenom: '', telephone: '', adresse: '', parente: '' });
const employeurVide = () => ({ profession: '', nom_employeur: '', sans_emploi: false });

// ── Règles de validation réutilisables ─────────────────────
const RE_TEL   = /^0[1-9]([ .-]?\d{2}){4}$/;     // 06 12 34 56 78
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_CAF   = /^\d{7}$/;                      // Numéro allocataire CAF : 7 chiffres

// Date du jour (fuseau du navigateur) au format AAAA-MM-JJ
const aujourdhui = () => new Date().toLocaleDateString('sv-SE');

// Numéro de sécurité sociale : 15 caractères (13 + clé de contrôle).
// Corse 2A / 2B → 19 / 18 pour le calcul. Clé = 97 - (13 chiffres mod 97).
// 13 chiffres tiennent sans perte dans un Number JavaScript.
const nirValide = (valeur) => {
  const nir = String(valeur || '').replace(/\s/g, '').toUpperCase();
  if (!/^[1-478]\d{4}(\d{2}|2A|2B)\d{6}\d{2}$/.test(nir)) return false;
  const corps = Number(nir.slice(0, 13).replace('2A', '19').replace('2B', '18'));
  return Number(nir.slice(13)) === 97 - (corps % 97);
};

// Validateurs par section : renvoient { champ: cléDErreur } (vide = valide).
// Les clés sont traduites via parent.inscription.erreurs.*
const validerParent = (p, obligatoire) => {
  const e = {};
  const vide = !Object.values(p).some(v => String(v).trim());
  if (!obligatoire && vide) return e;                         // Facultatif et vide : OK
  if (!p.nom.trim())                       e.nom = 'nomRequis';
  if (!p.prenom.trim())                    e.prenom = 'prenomRequis';
  if (!p.telephone.trim())                 e.telephone = 'telRequis';
  else if (!RE_TEL.test(p.telephone.trim())) e.telephone = 'telInvalide';
  if (!p.email.trim())                     e.email = 'emailRequis';
  else if (!RE_EMAIL.test(p.email.trim())) e.email = 'emailInvalide';
  if (!p.adresse.trim())                   e.adresse = 'adresseRequise';
  if (!p.situation_familiale)              e.situation_familiale = 'situationRequise';
  return e;
};

const validerContact = (c) => {
  const e = {};
  // Aucun champ obligatoire — on contrôle seulement les formats saisis
  if (c.telephone.trim() && !RE_TEL.test(c.telephone.trim())) e.telephone = 'telInvalide';
  return e;
};

const validerEmployeur = (emp, obligatoire) => {
  const e = {};
  if (!obligatoire && !emp.profession.trim() && !emp.nom_employeur.trim()) return e;
  if (!emp.profession.trim())                      e.profession = 'professionRequise';
  if (!emp.sans_emploi && !emp.nom_employeur.trim()) e.nom_employeur = 'employeurRequis';
  return e;
};

const validerNumeros = (pi) => {
  const e = {};
  if (!pi.numero_securite_sociale.trim())          e.numero_securite_sociale = 'nirRequis';
  else if (!nirValide(pi.numero_securite_sociale)) e.numero_securite_sociale = 'nirInvalide';
  const caf = pi.numero_caf.replace(/\s/g, '');
  if (!caf)                                        e.numero_caf = 'cafRequis';
  else if (!RE_CAF.test(caf))                      e.numero_caf = 'cafInvalide';
  return e;
};

// Étape "Accueil" : date (ni passée, ni avant la naissance), type, jours cohérents
const validerAccueil = (f, naissance) => {
  const e = {};
  const jours = f.jours_souhaites ? f.jours_souhaites.split(',') : [];
  if (!f.date_debut_souhaitee)                         e.date_debut_souhaitee = 'dateRequise';
  else if (f.date_debut_souhaitee < aujourdhui())      e.date_debut_souhaitee = 'datePassee';
  else if (naissance && f.date_debut_souhaitee < naissance) e.date_debut_souhaitee = 'dateAvantNaissance';
  if (!f.temps_accueil)                                e.temps_accueil = 'typeRequis';
  if (f.temps_accueil === 'temps_plein' && jours.length !== 5)                         e.jours_souhaites = 'joursTempsPlein';
  if (f.temps_accueil === 'temps_partiel' && (jours.length < 2 || jours.length > 3)) e.jours_souhaites = 'joursTempsPartiel';
  return e;
};

// Sections d'erreurs vérifiées à chaque étape (index de l'étape → sections)
const SECTIONS_ETAPE = {
  0: ['parent1', 'parent2', 'contact1', 'contact2', 'famille'],
  2: ['accueil'],
  3: ['employeur1', 'employeur2', 'numeros']
};

// ── Composants définis HORS du composant principal ──────────
// (sinon React les recrée à chaque frappe → perte de focus)

// cls() : ajoute la classe d'erreur si le champ correspondant est en erreur
const cls = (erreurs, champ) => `p-input ${erreurs?.[champ] ? 'p-input--erreur' : ''}`;

// Petit message d'erreur sous un champ (msg = clé de traduction de l'erreur)
const Err = ({ msg }) => {
  const { t } = useTranslation();
  return msg ? <p className="p-erreur" role="alert">{t(`${I}.erreurs.${msg}`)}</p> : null;
};

// Astérisque "obligatoire" (masquée quand le bloc devient facultatif)
const Requis = ({ si = true }) => (si ? <span className="requis">*</span> : null);

const ChampParent = ({ cle, label, pi, majPI, erreurs = {}, obligatoire = true }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <fieldset className="preinsc-section">
    <legend className="preinsc-section__titre">
      👤 {label} {!obligatoire && <span className="preinsc-facultatif">({t(`${I}.e1.facultatif`)})</span>}
    </legend>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-nom`}>{t(`${I}.champs.nom`)} <Requis si={obligatoire} /></label>
        <input id={`${cle}-nom`} type="text" autoComplete="family-name" className={cls(erreurs, 'nom')} value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder={t(`${I}.champs.nomPlaceholder`)} />
        <Err msg={erreurs.nom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-prenom`}>{t(`${I}.champs.prenom`)} <Requis si={obligatoire} /></label>
        <input id={`${cle}-prenom`} type="text" autoComplete="given-name" className={cls(erreurs, 'prenom')} value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder={t(`${I}.champs.prenomPlaceholder`)} />
        <Err msg={erreurs.prenom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-tel`}>{t(`${I}.champs.telephone`)} <Requis si={obligatoire} /></label>
        <input id={`${cle}-tel`} type="tel" autoComplete="tel" className={cls(erreurs, 'telephone')} value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder={t(`${I}.champs.telephonePlaceholder`)} />
        <Err msg={erreurs.telephone} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-email`}>{t(`${I}.champs.email`)} <Requis si={obligatoire} /></label>
        <input id={`${cle}-email`} type="email" autoComplete="email" className={cls(erreurs, 'email')} value={pi[cle].email}
          onChange={e => majPI(cle, 'email', e.target.value)} placeholder={t(`${I}.champs.emailPlaceholder`)} />
        <Err msg={erreurs.email} />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label" htmlFor={`${cle}-adresse`}>{t(`${I}.champs.adressePostale`)} <Requis si={obligatoire} /></label>
      <input id={`${cle}-adresse`} type="text" autoComplete="street-address" className={cls(erreurs, 'adresse')} value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder={t(`${I}.champs.adressePlaceholder`)} />
      <Err msg={erreurs.adresse} />
    </div>
    <div className="p-form-groupe">
      <label className="p-label" htmlFor={`${cle}-situation`}>{t(`${I}.champs.situation`)} <Requis si={obligatoire} /></label>
      <select id={`${cle}-situation`} className={cls(erreurs, 'situation_familiale')} value={pi[cle].situation_familiale}
        onChange={e => majPI(cle, 'situation_familiale', e.target.value)}>
        <option value="">{t('common.choisir')}</option>
        {SITUATIONS.map(s => <option key={s} value={s}>{t(`${I}.situations.${s}`)}</option>)}
      </select>
      <Err msg={erreurs.situation_familiale} />
    </div>
  </fieldset>
  );
};

const ChampContact = ({ cle, label, pi, majPI, erreurs = {} }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <fieldset className="preinsc-section preinsc-section--contact">
    <legend className="preinsc-section__titre">🚨 {label}</legend>
    <p className="preinsc-section__aide">{t(`${I}.contactAide`)}</p>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-nom`}>{t(`${I}.champs.nom`)}</label>
        <input id={`${cle}-nom`} type="text" className={cls(erreurs, 'nom')} value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder={t(`${I}.champs.nomPlaceholder`)} />
        <Err msg={erreurs.nom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-prenom`}>{t(`${I}.champs.prenom`)}</label>
        <input id={`${cle}-prenom`} type="text" className={cls(erreurs, 'prenom')} value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder={t(`${I}.champs.prenomPlaceholder`)} />
        <Err msg={erreurs.prenom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-tel`}>{t(`${I}.champs.telephone`)}</label>
        <input id={`${cle}-tel`} type="tel" className={cls(erreurs, 'telephone')} value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder={t(`${I}.champs.telephonePlaceholder`)} />
        <Err msg={erreurs.telephone} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label" htmlFor={`${cle}-parente`}>{t(`${I}.champs.parente`)}</label>
        <input id={`${cle}-parente`} type="text" className={cls(erreurs, 'parente')} value={pi[cle].parente}
          onChange={e => majPI(cle, 'parente', e.target.value)} placeholder={t(`${I}.champs.parentePlaceholder`)} />
        <Err msg={erreurs.parente} />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label" htmlFor={`${cle}-adresse`}>{t(`${I}.champs.adresse`)}</label>
      <input id={`${cle}-adresse`} type="text" className={cls(erreurs, 'adresse')} value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder={t(`${I}.champs.adressePlaceholder`)} />
      <Err msg={erreurs.adresse} />
    </div>
  </fieldset>
  );
};

// Bloc profession / employeur d'un parent (étape Documents)
const ChampEmployeur = ({ cle, label, pi, majPI, erreurs = {}, obligatoire = true, placeholders }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const emp = pi[cle];
  return (
    <fieldset className="docs-employeur">
      <legend className="docs-employeur__titre">
        💼 {t(`${I}.e4.employeurTitre`, { parent: label })} {!obligatoire && <span className="preinsc-facultatif">({t(`${I}.e1.facultatif`)})</span>}
      </legend>
      <div className="preinsc-grille">
        <div className="p-form-groupe">
          <label className="p-label" htmlFor={`${cle}-profession`}>{t(`${I}.e4.profession`)} <Requis si={obligatoire} /></label>
          <input id={`${cle}-profession`} type="text" className={cls(erreurs, 'profession')} value={emp.profession}
            onChange={e => majPI(cle, 'profession', e.target.value)} placeholder={placeholders.profession} />
          <Err msg={erreurs.profession} />
        </div>
        <div className="p-form-groupe">
          <label className="p-label" htmlFor={`${cle}-employeur`}>{t(`${I}.e4.employeur`)} <Requis si={obligatoire && !emp.sans_emploi} /></label>
          <input id={`${cle}-employeur`} type="text" className={cls(erreurs, 'nom_employeur')} value={emp.nom_employeur}
            onChange={e => majPI(cle, 'nom_employeur', e.target.value)} placeholder={placeholders.employeur}
            disabled={emp.sans_emploi} />
          <Err msg={erreurs.nom_employeur} />
        </div>
      </div>
      {/* Sans emploi / étudiant : l'employeur devient facultatif */}
      <label className="preinsc-case">
        <input type="checkbox" checked={emp.sans_emploi}
          onChange={e => majPI(cle, 'sans_emploi', e.target.checked)} />
        <span>{t(`${I}.e4.sansEmploi`)}</span>
      </label>
    </fieldset>
  );
};

// ── Composant principal ──────────────────────────────────────

const Inscription = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [etape,    setEtape]    = useState(0);
  const [enfants,  setEnfants]  = useState([]);
  // Demandes déjà faites par la famille (pour bloquer une 2e demande)
  const [demandes, setDemandes] = useState([]);
  const [envoi,    setEnvoi]    = useState(false);
  const [fichiers, setFichiers] = useState(PIECES.map(() => null));
  // Empreinte de chaque fichier choisi (détection d'un même fichier en double)
  const [empreintes, setEmpreintes] = useState(PIECES.map(() => null));
  // true après un clic sur "Continuer" avec des documents manquants :
  // les pièces non fournies sont alors surlignées en rouge
  const [docsManquants, setDocsManquants] = useState(false);

  // ── Aperçu des documents avant envoi ──────────────────────
  // Les fichiers sont encore sur l'ordinateur du parent : on les affiche
  // via une adresse locale temporaire (blob:), sans rien envoyer au serveur.
  const [apercus,   setApercus]   = useState(PIECES.map(() => null));
  // Image affichée en grand ({ url, titre }) ou null
  const [imageZoom, setImageZoom] = useState(null);

  // (Re)crée les adresses locales quand les fichiers changent, et libère
  // les anciennes pour ne pas garder les fichiers en mémoire
  useEffect(() => {
    const urls = fichiers.map(f => (f ? URL.createObjectURL(f) : null));
    setApercus(urls);
    return () => urls.forEach(u => u && URL.revokeObjectURL(u));
  }, [fichiers]);

  // Échap ferme l'aperçu d'image
  useEffect(() => {
    if (!imageZoom) return;
    const surTouche = (e) => { if (e.key === 'Escape') setImageZoom(null); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [imageZoom]);

  const [form, setForm] = useState({
    enfant_id: '', date_debut_souhaitee: '', jours_souhaites: '',
    temps_accueil: '', commentaire_parent: ''
  });

  const [pi, setPi] = useState({
    parent1: parentVide(), parent2: parentVide(),
    seul_responsable: false,                       // true : bloc Parent 2 facultatif
    autorisation_rpe: false, place_fratrie: '',
    contact1: contactVide(), contact2: contactVide(),
    employeur1: employeurVide(), employeur2: employeurVide(),
    numero_securite_sociale: '', numero_caf: ''    // Numéros des justificatifs
  });

  // Erreurs affichées, par section : { parent1: { nom: 'nomRequis' }, ... }
  const [erreurs, setErreurs] = useState({});
  // Incrémenté à chaque validation refusée : déclenche le focus sur la 1re erreur
  const [demandeFocus, setDemandeFocus] = useState(0);

  const navigate = useNavigate();

  // Enfants + demandes existantes (une seule fois au chargement)
  useEffect(() => {
    api.get('/enfants').then(r => setEnfants(r.data.data || [])).catch(() => {});
    api.get('/inscriptions').then(r => setDemandes(r.data.data || [])).catch(() => {});
  }, []);

  // Enfants qui ont déjà une demande active (désactivés à l'étape 2)
  const statuts = statutParEnfant(demandes);   // Statut de la dernière demande de chaque enfant

  const enfantSelectionne = enfants.find(e => e.id === parseInt(form.enfant_id));
  // Date de naissance (AAAA-MM-JJ) de l'enfant choisi
  const naissance = enfantSelectionne?.date_naissance?.slice(0, 10) || '';
  // Date minimale autorisée : aujourd'hui, ou la naissance si elle est plus tard
  const dateMin = naissance > aujourdhui() ? naissance : aujourdhui();

  // Toutes les erreurs possibles, recalculées à partir des données
  const calculerErreurs = (p, f) => ({
    parent1:    validerParent(p.parent1, true),
    parent2:    validerParent(p.parent2, !p.seul_responsable),
    contact1:   validerContact(p.contact1),
    contact2:   validerContact(p.contact2),
    famille:    p.place_fratrie ? {} : { place_fratrie: 'fratrieRequise' },
    accueil:    validerAccueil(f, naissance),
    employeur1: validerEmployeur(p.employeur1, true),
    employeur2: validerEmployeur(p.employeur2, !p.seul_responsable),
    numeros:    validerNumeros(p)
  });

  // Après chaque saisie : on retire les messages des champs devenus valides.
  // On n'ajoute PAS de nouvelle erreur pendant la frappe (seulement au
  // clic sur "Continuer"), pour ne pas gêner le parent.
  const rafraichirErreurs = (p, f) => {
    const toutes = calculerErreurs(p, f);
    setErreurs(prev => {
      const suivant = {};
      Object.entries(prev).forEach(([section, champs]) => {
        suivant[section] = {};
        Object.keys(champs || {}).forEach(c => { if (toutes[section]?.[c]) suivant[section][c] = toutes[section][c]; });
      });
      return suivant;
    });
  };

  // Mises à jour des données (avec effacement immédiat des erreurs corrigées)
  const majForm = (champs) => {
    const f = { ...form, ...champs };
    setForm(f);
    rafraichirErreurs(pi, f);
  };
  const majPI = (section, champ, valeur) => {
    const p = { ...pi, [section]: { ...pi[section], [champ]: valeur } };
    setPi(p);
    rafraichirErreurs(p, form);
  };
  const majPITop = (champ, valeur) => {
    const p = { ...pi, [champ]: valeur };
    setPi(p);
    rafraichirErreurs(p, form);
  };

  // Validation d'une étape : affiche ses erreurs, renvoie true si tout est bon
  const validerEtape = (n) => {
    const sections = SECTIONS_ETAPE[n] || [];
    const toutes   = calculerErreurs(pi, form);
    const ok = sections.every(s => !Object.keys(toutes[s]).length);
    setErreurs(prev => {
      const suivant = { ...prev };
      sections.forEach(s => { suivant[s] = toutes[s]; });
      return suivant;
    });
    if (!ok) {
      toast.error(t(`${I}.corriger`));
      setDemandeFocus(c => c + 1);
    }
    return ok;
  };

  // Défilement + focus sur le 1er champ en erreur (après l'affichage des erreurs)
  useEffect(() => {
    if (!demandeFocus) return;
    const champ = document.querySelector(
      '.inscription-contenu .p-input--erreur, .inscription-contenu .champ-en-erreur input, .inscription-contenu .piece-item--manquant input'
    );
    if (!champ) return;
    champ.scrollIntoView({ behavior: 'smooth', block: 'center' });
    champ.focus({ preventScroll: true });
  }, [demandeFocus]);

  // Étape "Enfant" : ajout d'un enfant directement dans le formulaire
  // (avant, il fallait quitter la page et on perdait toute la saisie)
  const [ajoutEnfant, setAjoutEnfant] = useState(false);
  const ajouterEnfant = async (donnees) => {
    try {
      const res = await api.post('/enfants', donnees);
      const nouvel = res.data.data;
      setEnfants(prev => [...prev, nouvel]);
      majForm({ enfant_id: String(nouvel.id) }); // Sélectionné automatiquement
      setAjoutEnfant(false);
      toast.success(t('parent.mesEnfants.toastAjoute'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('parent.mesEnfants.erreurAjout'));
    }
  };

  // Passage à l'étape suivante (avec validation selon l'étape courante)
  const etapeSuivante = () => {
    if (!validerEtape(etape)) return;
    // Étape documents : les 5 pièces justificatives sont obligatoires
    if (etape === 3 && !fichiers.every(f => f !== null)) {
      setDocsManquants(true);
      toast.error(t(`${I}.e4.docsManquants`));
      setDemandeFocus(c => c + 1);
      return;
    }
    setEtape(e => e + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lien "Modifier" du récapitulatif : retour à l'étape concernée
  const allerEtape = (n) => {
    setEtape(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Sécurité : on revérifie toutes les étapes avant l'envoi
    for (const n of [0, 2, 3]) {
      if (!validerEtape(n)) { setEtape(n); return; }
    }
    if (!fichiers.every(f => f !== null)) {
      setDocsManquants(true);
      setEtape(3);
      toast.error(t(`${I}.e4.docsManquants`));
      return;
    }
    setEnvoi(true);
    try {
      // Demande + pièces justificatives envoyées en UNE seule requête :
      // le serveur refuse la demande s'il manque un document
      const fd = new FormData();
      Object.entries(form).forEach(([cle, valeur]) => fd.append(cle, valeur ?? ''));
      fd.append('preinscription', JSON.stringify(pi));
      fichiers.forEach((f, i) => {
        if (f) { fd.append('fichiers', f); fd.append('labels', PIECES[i].doc); }
      });
      await api.post('/inscriptions', fd);
      toast.success(t(`${I}.toastEnvoyee`));
      navigate('/parent/mes-enfants');
    } catch (err) {
      toast.error(err.response?.data?.message || t(`${I}.erreurEnvoi`));
    }
    setEnvoi(false);
  };

  // Soumission du formulaire (bouton "Continuer" ou "Envoyer", touche Entrée)
  const soumettre = (e) => {
    e.preventDefault();
    if (etape < NB_ETAPES - 1) etapeSuivante();
    else handleSubmit();
  };

  // ── Documents : choix, contrôle, aperçu, retrait ──────────
  const estImage = (f) => Boolean(f?.type?.startsWith('image/'));

  // Taille lisible : "350 Ko" / "1,2 Mo" (séparateur selon la langue)
  const formaterTaille = (octets) => octets < 1024 * 1024
    ? `${Math.max(1, Math.round(octets / 1024))} Ko`
    : `${(octets / (1024 * 1024)).toLocaleString(getLocale(), { maximumFractionDigits: 1 })} Mo`;

  // Empreinte d'un fichier : SHA-256 si le navigateur le permet (connexion
  // sécurisée ou localhost), sinon nom + taille + date de modification
  const calculerEmpreinte = async (f) => {
    if (window.crypto?.subtle) {
      const hash = await window.crypto.subtle.digest('SHA-256', await f.arrayBuffer());
      return Array.from(new Uint8Array(hash)).map(o => o.toString(16).padStart(2, '0')).join('');
    }
    return `${f.name}|${f.size}|${f.lastModified}`;
  };

  // Contrôle immédiat du fichier choisi (sans attendre l'envoi final)
  const choisirFichier = async (i, e) => {
    const f = e.target.files[0];
    e.target.value = ''; // Permet de rechoisir le même fichier après un retrait
    if (!f) return;
    if (!TYPES_ACCEPTES.includes(f.type)) { toast.error(t(`${I}.e4.typeInvalide`, { nom: f.name })); return; }
    if (documentTropLourd(f))             { toast.error(t(`${I}.e4.tropLourd`,    { nom: f.name, max: TAILLE_MAX_DOCUMENT_MO })); return; }
    // Même fichier déjà utilisé pour un autre document ?
    const empreinte = await calculerEmpreinte(f);
    const autre = empreintes.findIndex((emp, j) => j !== i && emp === empreinte);
    if (autre !== -1) {
      toast.error(t(`${I}.e4.doublon`, { nom: f.name, doc: t(`${I}.pieces.${autre}`) }));
      return;
    }
    setFichiers(prev => prev.map((v, j) => (j === i ? f : v)));
    setEmpreintes(prev => prev.map((v, j) => (j === i ? empreinte : v)));
  };

  const retirerFichier = (i) => {
    setFichiers(prev => prev.map((v, j) => (j === i ? null : v)));
    setEmpreintes(prev => prev.map((v, j) => (j === i ? null : v)));
  };

  // Image → grande vue dans la page ; PDF → nouvel onglet (lecteur du navigateur)
  const voirFichier = (i) => {
    if (!apercus[i]) return;
    if (estImage(fichiers[i])) setImageZoom({ url: apercus[i], titre: t(`${I}.pieces.${i}`) });
    else window.open(apercus[i], '_blank', 'noopener');
  };

  // Libellés traduits des valeurs stockées
  const libelleFratrie   = (v) => { const i = FRATRIEOPT.indexOf(v); return i >= 0 ? t(`${I}.fratrie.${i}`) : v; };
  const libelleJour      = (v) => JOURS_ACCUEIL.includes(v) ? t(`common.jours.${v.toLowerCase()}`) : v;
  const libelleSituation = (v) => (v ? t(`${I}.situations.${v}`) : '');

  // Récapitulatif : "Non renseigné" à la place d'une valeur vide
  const NR = t(`${I}.e6.nonRenseigne`);
  const ou = (valeur) => (String(valeur ?? '').trim() ? valeur : NR);
  const nomComplet = (p) => [p.prenom, p.nom].filter(v => v.trim()).join(' ');
  // Contact d'urgence : "Prénom Nom — lien — téléphone", ou "Non renseigné"
  const resumeContact = (c) => {
    const morceaux = [nomComplet(c), c.parente, c.telephone, c.adresse].filter(v => String(v).trim());
    return morceaux.length ? morceaux.join(' — ') : NR;
  };

  // Aide contextuelle sous les jours (selon le type d'accueil)
  const aideJours = form.temps_accueil ? t(`${I}.e3.aideJours.${form.temps_accueil}`) : t(`${I}.e3.aideJours.choisirType`);

  // Formulaire enfant affiché à l'étape 2 (en dehors du <form> principal :
  // un formulaire ne peut pas en contenir un autre)
  const afficherAjoutEnfant = etape === 1 && (enfants.length === 0 || ajoutEnfant);

  const erreursAccueil = erreurs.accueil || {};
  const erreursNumeros = erreurs.numeros || {};

  return (
    <div className="inscription-page">

      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.inscription.titre" components={{ s: <span /> }} /></h1>
      </div>

      {/* ── BARRE DE PROGRESSION ──────────────────────────────── */}
      <div className="etapes-barre">
        {t(`${I}.etapes`, { returnObjects: true }).map((label, i) => (
          <div key={label} className={`etape-step ${i === etape ? 'etape-step--actif' : ''} ${i < etape ? 'etape-step--fait' : ''}`}
            aria-current={i === etape ? 'step' : undefined}>
            <div className="etape-step__cercle">{i < etape ? '✓' : i + 1}</div>
            <span className="etape-step__label">{label}</span>
          </div>
        ))}
        <div className="etapes-barre__ligne" style={{ width: `${(etape / (NB_ETAPES - 1)) * 100}%` }} />
      </div>

      <div className="p-card inscription-contenu">

        {/* ── ÉTAPE 2 (ajout d'un enfant) : formulaire séparé ───── */}
        {afficherAjoutEnfant && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e2.titre`)}</h2>
            <div className="p-card">
              <p className="etape-intro">👶 {t(enfants.length === 0 ? `${I}.e2.dAbord` : `${I}.e2.ajoutIntro`)}</p>
              <FormulaireEnfant
                onSave={ajouterEnfant}
                onAnnuler={() => (enfants.length === 0 ? setEtape(0) : setAjoutEnfant(false))}
              />
            </div>
          </div>
        )}

        {/* Formulaire principal : "Continuer" / "Envoyer" sont des boutons
            submit, la touche Entrée fait passer à l'étape suivante */}
        <form onSubmit={soumettre} noValidate>

        {/* ── ÉTAPE 1 : PRÉ-INSCRIPTION ─────────────────────────── */}
        {etape === 0 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e1.titre`)}</h2>
            <p className="etape-intro">
              <Trans i18nKey={`${I}.e1.intro`} components={{ requis: <span className="requis" /> }} />
            </p>

            {/* Conditions */}
            <div className="cond-paragraphes">
              {t(`${I}.e1.conditions`, { returnObjects: true }).map(c => <p key={c}>{c}</p>)}
            </div>

            <div className="cond-pirouette">
              <a href="https://www.mon-enfant.fr" target="_blank" rel="noopener noreferrer" className="btn-pirouette">
                {t(`${I}.e1.pirouette`)}
              </a>
            </div>

            <div className="cond-handicap">
              <span className="cond-handicap__icone">♿</span>
              <div>
                <h3 className="cond-handicap__titre">{t(`${I}.e1.handicapTitre`)}</h3>
                <p>{t(`${I}.e1.handicapTexte`)}</p>
              </div>
            </div>

            {/* ── Tarifs ──────────────────────────────────────── */}
            <div className="preinsc-separateur"><span>{t(`${I}.e1.tarifs`)}</span></div>

            {/* Adhésion annuelle */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">🏷️ {t(`${I}.e1.adhesionTitre`)}</h3>
              <p>{t(`${I}.e1.adhesionTexte`)}</p>
              <div className="tarif-pills">
                <span className="tarif-pill tarif-pill--regular"><Trans i18nKey={`${I}.e1.adhesionRegulier`} /></span>
                <span className="tarif-pill tarif-pill--occa"><Trans i18nKey={`${I}.e1.adhesionOccasionnel`} /></span>
              </div>
              <p className="tarif-note">{t(`${I}.e1.adhesionNote`)}</p>
            </div>

            {/* Tarif horaire */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">⏱️ {t(`${I}.e1.horaireTitre`)}</h3>
              <div className="tarif-formule">
                <div className="tarif-formule__fraction">
                  <span className="tarif-formule__num">{t(`${I}.e1.revenus`)}</span>
                  <span className="tarif-formule__trait" />
                  <span className="tarif-formule__den">12</span>
                </div>
                <span className="tarif-formule__op">×</span>
                <span className="tarif-formule__label">{t(`${I}.e1.tauxEffort`)}</span>
              </div>
              <p className="tarif-sous-titre">{t(`${I}.e1.tauxTitre`)}</p>
              <ul className="tarif-taux">
                {t(`${I}.e1.taux`, { returnObjects: true }).map((_, i) => (
                  <li key={i}><Trans i18nKey={`${I}.e1.taux.${i}`} /></li>
                ))}
              </ul>
              <div className="tarif-plancher">
                <div className="tarif-plancher__item">
                  <span className="tarif-plancher__lbl">{t(`${I}.e1.plancherLbl`)}</span>
                  <span className="tarif-plancher__val"><Trans i18nKey={`${I}.e1.plancherVal`} /></span>
                </div>
                <div className="tarif-plancher__item">
                  <span className="tarif-plancher__lbl">{t(`${I}.e1.plafondLbl`)}</span>
                  <span className="tarif-plancher__val"><Trans i18nKey={`${I}.e1.plafondVal`} /></span>
                </div>
              </div>
            </div>

            {/* Accueil régulier */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">📅 {t(`${I}.e1.regulierTitre`)}</h3>
              <p>{t(`${I}.e1.regulierTexte`)}</p>
              <div className="tarif-calcul">
                <span className="tarif-calcul__item">{t(`${I}.e1.calculTarif`)}</span>
                <span className="tarif-calcul__op">×</span>
                <span className="tarif-calcul__item">{t(`${I}.e1.calculHeures`)}</span>
                <span className="tarif-calcul__op">×</span>
                <span className="tarif-calcul__item">{t(`${I}.e1.calculJours`)}</span>
              </div>
            </div>

            {/* Accueil occasionnel */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">🔔 {t(`${I}.e1.occasionnelTitre`)}</h3>
              <p>{t(`${I}.e1.occasionnelTexte`)}</p>
            </div>

            <div className="preinsc-separateur"><span>{t(`${I}.e1.fiche`)}</span></div>

            <ChampParent cle="parent1" label={t(`${I}.e1.parent1`)} pi={pi} majPI={majPI} erreurs={erreurs.parent1} />

            {/* Parent seul (célibataire, veuf/veuve...) : le bloc Parent 2 devient facultatif */}
            <label className="preinsc-case preinsc-case--seul">
              <input type="checkbox" checked={pi.seul_responsable}
                onChange={e => majPITop('seul_responsable', e.target.checked)} />
              <span>
                <strong>{t(`${I}.e1.seulResponsable`)}</strong>
                <small>{t(`${I}.e1.seulResponsableAide`)}</small>
              </span>
            </label>

            <ChampParent cle="parent2" label={t(`${I}.e1.parent2`)} pi={pi} majPI={majPI} erreurs={erreurs.parent2}
              obligatoire={!pi.seul_responsable} />

            {/* Autorisation RPE */}
            <label className="preinsc-autorisation">
              <input type="checkbox" checked={pi.autorisation_rpe}
                onChange={e => majPITop('autorisation_rpe', e.target.checked)} />
              <span>{t(`${I}.e1.rpe`)}</span>
            </label>

            {/* Place dans la fratrie */}
            <fieldset className="preinsc-section">
              <legend className="preinsc-section__titre">👨‍👩‍👧‍👦 {t(`${I}.e1.fratrieTitre`)}</legend>
              <div className="p-form-groupe">
                <label className="p-label" htmlFor="place-fratrie">{t(`${I}.e1.fratrieLabel`)} <span className="requis">*</span></label>
                <select id="place-fratrie" className={cls(erreurs.famille, 'place_fratrie')} value={pi.place_fratrie}
                  onChange={e => majPITop('place_fratrie', e.target.value)}>
                  <option value="">{t('common.choisir')}</option>
                  {FRATRIEOPT.map(o => <option key={o} value={o}>{libelleFratrie(o)}</option>)}
                </select>
                <Err msg={erreurs.famille?.place_fratrie} />
              </div>
            </fieldset>

            {/* Personnes à contacter */}
            <div className="preinsc-intro-contacts">
              <p>{t(`${I}.e1.contactsIntro`)}</p>
            </div>
            <ChampContact cle="contact1" label={t(`${I}.e1.contact1`)} pi={pi} majPI={majPI} erreurs={erreurs.contact1} />
            <ChampContact cle="contact2" label={t(`${I}.e1.contact2`)} pi={pi} majPI={majPI} erreurs={erreurs.contact2} />
          </div>
        )}

        {/* ── ÉTAPE 2 : SÉLECTION DE L'ENFANT ──────────────────── */}
        {etape === 1 && !afficherAjoutEnfant && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e2.titre`)}</h2>
            <fieldset className="enfants-choix">
              <legend className="sr-only">{t(`${I}.e2.titre`)}</legend>
              {enfants.map(enfant => {
                // Enfant ayant déjà une demande active : non sélectionnable
                const bloque = estDemandeActive(statuts[enfant.id]);
                return (
                  <label key={enfant.id} className={`enfant-option ${form.enfant_id === String(enfant.id) ? 'enfant-option--selectionne' : ''} ${bloque ? 'enfant-option--bloque' : ''}`}>
                    <input type="radio" name="enfant_id" value={enfant.id} disabled={bloque}
                      checked={form.enfant_id === String(enfant.id)}
                      onChange={e => majForm({ enfant_id: e.target.value })} />
                    <span className="enfant-option__icone">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                    <span className="enfant-option__nom">{enfant.prenom} {enfant.nom}</span>
                    {/* Libellé selon le statut : Inscrit, En attente, Refusée... */}
                    {statuts[enfant.id] && <span className="enfant-option__badge-statut"><BadgeInscription statut={statuts[enfant.id]} /></span>}
                  </label>
                );
              })}
            </fieldset>
            <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setAjoutEnfant(true)}>
              {t(`${I}.e2.autreEnfant`)}
            </button>
          </div>
        )}

        {/* ── ÉTAPE 3 : MODALITÉS D'ACCUEIL ────────────────────── */}
        {etape === 2 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e3.titre`)}</h2>
            <div className="p-form">
              <div className="p-form-groupe">
                <label className="p-label" htmlFor="date-debut">{t(`${I}.e3.dateDebut`)} <span className="requis">*</span></label>
                {/* min : ni dans le passé, ni avant la naissance de l'enfant */}
                <input id="date-debut" type="date" className={cls(erreursAccueil, 'date_debut_souhaitee')}
                  value={form.date_debut_souhaitee} min={dateMin}
                  onChange={e => majForm({ date_debut_souhaitee: e.target.value })} />
                <p className="p-aide">{t(`${I}.e3.dateAide`, { date: new Date(`${dateMin}T00:00:00`).toLocaleDateString(getLocale()) })}</p>
                <Err msg={erreursAccueil.date_debut_souhaitee} />
              </div>
              <div className="p-form-groupe">
                <label className="p-label" htmlFor="type-accueil">{t(`${I}.e3.type`)} <span className="requis">*</span></label>
                <select id="type-accueil" className={cls(erreursAccueil, 'temps_accueil')} value={form.temps_accueil}
                  onChange={e => majForm({ temps_accueil: e.target.value })}>
                  <option value="">{t('common.choisir')}</option>
                  {TYPES_ACCUEIL.map(v => (
                    <option key={v} value={v}>{t(`${I}.e3.types.${v}`)}</option>
                  ))}
                </select>
                <Err msg={erreursAccueil.temps_accueil} />
              </div>
              <fieldset className={`p-form-groupe ${erreursAccueil.jours_souhaites ? 'champ-en-erreur' : ''}`}>
                <legend className="p-label">
                  {t(`${I}.e3.jours`)} {['temps_plein', 'temps_partiel'].includes(form.temps_accueil) && <span className="requis">*</span>}
                </legend>
                <div className="jours-checkboxes">
                  {JOURS_ACCUEIL.map(jour => {
                    const jours   = form.jours_souhaites ? form.jours_souhaites.split(',') : [];
                    const checked = jours.includes(jour);
                    return (
                      <label key={jour} className={`jour-checkbox ${checked ? 'jour-checkbox--actif' : ''}`}>
                        {/* Case visuellement masquée mais accessible au clavier */}
                        <input type="checkbox" className="sr-only" checked={checked}
                          aria-label={libelleJour(jour)} /* Nom lu par les lecteurs d'écran (sinon "on") */
                          onChange={() => {
                          // Ordre lundi → vendredi conservé, quel que soit l'ordre des clics
                          const newJours = JOURS_ACCUEIL.filter(j => (j === jour ? !checked : jours.includes(j)));
                          majForm({ jours_souhaites: newJours.join(',') });
                        }} />
                        {libelleJour(jour)}
                      </label>
                    );
                  })}
                </div>
                <p className="p-aide">{aideJours}</p>
                <Err msg={erreursAccueil.jours_souhaites} />
              </fieldset>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : PIÈCES À FOURNIR ───────────────────────── */}
        {etape === 3 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e4.titre`)}</h2>

            {/* Profession et employeur des parents */}
            <ChampEmployeur cle="employeur1" label={t(`${I}.e1.parent1`)} pi={pi} majPI={majPI} erreurs={erreurs.employeur1}
              placeholders={{ profession: t(`${I}.e4.profession1Placeholder`), employeur: t(`${I}.e4.employeur1Placeholder`) }} />
            <ChampEmployeur cle="employeur2" label={t(`${I}.e1.parent2`)} pi={pi} majPI={majPI} erreurs={erreurs.employeur2}
              obligatoire={!pi.seul_responsable}
              placeholders={{ profession: t(`${I}.e4.profession2Placeholder`), employeur: t(`${I}.e4.employeur2Placeholder`) }} />

            {/* Numéros demandés avec les justificatifs */}
            <fieldset className="docs-employeur">
              <legend className="docs-employeur__titre">🔢 {t(`${I}.e4.numerosTitre`)}</legend>
              <div className="preinsc-grille">
                <div className="p-form-groupe">
                  <label className="p-label" htmlFor="numero-secu">{t(`${I}.e4.nir`)} <span className="requis">*</span></label>
                  <input id="numero-secu" type="text" inputMode="numeric" autoComplete="off" maxLength={21}
                    className={cls(erreursNumeros, 'numero_securite_sociale')} value={pi.numero_securite_sociale}
                    onChange={e => majPITop('numero_securite_sociale', e.target.value)} placeholder={t(`${I}.e4.nirPlaceholder`)} />
                  <p className="p-aide">{t(`${I}.e4.nirAide`)}</p>
                  <Err msg={erreursNumeros.numero_securite_sociale} />
                </div>
                <div className="p-form-groupe">
                  <label className="p-label" htmlFor="numero-caf">{t(`${I}.e4.caf`)} <span className="requis">*</span></label>
                  <input id="numero-caf" type="text" inputMode="numeric" autoComplete="off" maxLength={9}
                    className={cls(erreursNumeros, 'numero_caf')} value={pi.numero_caf}
                    onChange={e => majPITop('numero_caf', e.target.value)} placeholder={t(`${I}.e4.cafPlaceholder`)} />
                  <p className="p-aide">{t(`${I}.e4.cafAide`)}</p>
                  <Err msg={erreursNumeros.numero_caf} />
                </div>
              </div>
            </fieldset>

            {/* Documents à fournir */}
            <h3 className="docs-titre-section">📎 {t(`${I}.e4.docsTitre`)}</h3>
            <p className="etape-intro">
              {t(`${I}.e4.docsIntro`, { max: TAILLE_MAX_DOCUMENT_MO })}
            </p>
            <div className="pieces-liste">
              {PIECES.map((p, i) => (
                <div key={p.doc} className={`piece-item ${fichiers[i] ? 'piece-item--coche' : docsManquants ? 'piece-item--manquant' : ''}`}>
                  {/* Miniature si le document est une photo, sinon l'icône de la pièce */}
                  {estImage(fichiers[i]) && apercus[i]
                    ? <img src={apercus[i]} alt="" className="piece-item__miniature" />
                    : <span className="piece-item__icone">{fichiers[i] ? '📄' : p.icone}</span>}
                  <div className="piece-item__info">
                    <span className="piece-item__doc">{t(`${I}.pieces.${i}`)} <span className="requis">*</span></span>
                    {fichiers[i] && (
                      <span className="piece-item__fichier">
                        📎 {fichiers[i].name} <span className="piece-item__taille">· {formaterTaille(fichiers[i].size)}</span>
                      </span>
                    )}
                  </div>
                  <div className="piece-item__actions">
                    {fichiers[i] && (
                      <button type="button" className="piece-item__btn piece-item__btn--voir" onClick={() => voirFichier(i)}>
                        {t(`${I}.e4.voir`)}
                      </button>
                    )}
                    <label className="piece-item__btn">
                      {fichiers[i] ? t(`${I}.e4.changer`) : t(`${I}.e4.choisir`)}
                      {/* Champ fichier masqué visuellement mais atteignable au clavier */}
                      <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png"
                        aria-label={t(`${I}.pieces.${i}`)}
                        onChange={e => choisirFichier(i, e)} />
                    </label>
                    {fichiers[i] && (
                      <button type="button" className="piece-item__btn piece-item__btn--retirer" onClick={() => retirerFichier(i)}
                        aria-label={t(`${I}.e4.retirerAria`, { doc: t(`${I}.pieces.${i}`) })}>
                        {t(`${I}.e4.retirer`)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="pieces-info">
              {t(`${I}.e4.compteur`, { n: fichiers.filter(f => f !== null).length, total: PIECES.length })}
              {fichiers.every(f => f !== null) && t(`${I}.e4.complet`)}
            </p>
            {docsManquants && !fichiers.every(f => f !== null) && (
              <p className="p-erreur" role="alert">⚠️ {t(`${I}.e4.docsManquants`)}</p>
            )}
          </div>
        )}

        {/* ── ÉTAPE 5 : COMMENTAIRE ─────────────────────────────── */}
        {etape === 4 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e5.titre`)}</h2>
            <div className="p-form-groupe">
              <label className="p-label" htmlFor="commentaire">{t(`${I}.e5.label`)}</label>
              <textarea id="commentaire" className="p-input p-textarea" rows={6} maxLength={2000} value={form.commentaire_parent}
                onChange={e => majForm({ commentaire_parent: e.target.value })}
                placeholder={t(`${I}.e5.placeholder`)} />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 6 : RÉCAPITULATIF ───────────────────────────── */}
        {/* Toutes les données saisies, par section, avec un lien "Modifier"
            qui ramène à l'étape concernée */}
        {etape === 5 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e6.titre`)}</h2>

            {/* Parents */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>👤 {t(`${I}.e6.sectionParents`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(0)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              {['parent1', 'parent2'].map(cle => (
                <div key={cle} className="recap-grille">
                  <div className="recap-item recap-item--full"><strong>{t(`${I}.e6.${cle}`)}</strong>
                    <span>{cle === 'parent2' && pi.seul_responsable && !nomComplet(pi.parent2) ? t(`${I}.e6.seulResponsable`) : ou(nomComplet(pi[cle]))}</span>
                  </div>
                  {(cle === 'parent1' || nomComplet(pi.parent2)) && (<>
                    <div className="recap-item"><strong>{t(`${I}.champs.telephone`)}</strong><span>{ou(pi[cle].telephone)}</span></div>
                    <div className="recap-item"><strong>{t(`${I}.champs.email`)}</strong><span>{ou(pi[cle].email)}</span></div>
                    <div className="recap-item"><strong>{t(`${I}.champs.adressePostale`)}</strong><span>{ou(pi[cle].adresse)}</span></div>
                    <div className="recap-item"><strong>{t(`${I}.champs.situation`)}</strong><span>{ou(libelleSituation(pi[cle].situation_familiale))}</span></div>
                  </>)}
                </div>
              ))}
            </section>

            {/* Famille et contacts */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>👨‍👩‍👧‍👦 {t(`${I}.e6.sectionFamille`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(0)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              <div className="recap-grille">
                <div className="recap-item"><strong>{t(`${I}.e6.fratrie`)}</strong><span>{pi.place_fratrie ? libelleFratrie(pi.place_fratrie) : NR}</span></div>
                <div className="recap-item"><strong>{t(`${I}.e6.rpe`)}</strong><span>{pi.autorisation_rpe ? t(`${I}.e6.oui`) : t(`${I}.e6.non`)}</span></div>
                <div className="recap-item recap-item--full"><strong>{t(`${I}.e6.contact1`)}</strong><span>{resumeContact(pi.contact1)}</span></div>
                <div className="recap-item recap-item--full"><strong>{t(`${I}.e6.contact2`)}</strong><span>{resumeContact(pi.contact2)}</span></div>
              </div>
            </section>

            {/* Enfant + accueil */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>👶 {t(`${I}.e6.sectionAccueil`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(2)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              <div className="recap-grille">
                <div className="recap-item"><strong>{t(`${I}.e6.enfant`)}</strong><span>{enfantSelectionne ? `${enfantSelectionne.prenom} ${enfantSelectionne.nom}` : NR}</span></div>
                <div className="recap-item"><strong>{t(`${I}.e6.date`)}</strong><span>{form.date_debut_souhaitee ? new Date(`${form.date_debut_souhaitee}T00:00:00`).toLocaleDateString(getLocale()) : NR}</span></div>
                <div className="recap-item"><strong>{t(`${I}.e6.type`)}</strong><span>{form.temps_accueil ? t(`${I}.e6.types.${form.temps_accueil}`) : NR}</span></div>
                <div className="recap-item"><strong>{t(`${I}.e6.jours`)}</strong><span>{form.jours_souhaites ? form.jours_souhaites.split(',').map(libelleJour).join(', ') : NR}</span></div>
              </div>
            </section>

            {/* Professions + numéros */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>💼 {t(`${I}.e6.sectionPro`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(3)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              <div className="recap-grille">
                {['employeur1', 'employeur2'].map((cle, n) => (
                  <div key={cle} className="recap-item recap-item--full">
                    <strong>{t(`${I}.e1.parent${n + 1}`)}</strong>
                    <span>
                      {pi[cle].profession.trim()
                        ? `${pi[cle].profession} — ${pi[cle].sans_emploi ? t(`${I}.e4.sansEmploi`) : ou(pi[cle].nom_employeur)}`
                        : NR}
                    </span>
                  </div>
                ))}
                <div className="recap-item"><strong>{t(`${I}.e4.nir`)}</strong><span>{ou(pi.numero_securite_sociale)}</span></div>
                <div className="recap-item"><strong>{t(`${I}.e4.caf`)}</strong><span>{ou(pi.numero_caf)}</span></div>
              </div>
            </section>

            {/* Message */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>💬 {t(`${I}.e6.message`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(4)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              <p className="recap-texte">{ou(form.commentaire_parent)}</p>
            </section>

            {/* Documents joints : dernière vérification avant l'envoi */}
            <section className="recap-section">
              <div className="recap-section__entete">
                <h3>📎 {t(`${I}.e6.documents`)}</h3>
                <button type="button" className="recap-modifier" onClick={() => allerEtape(3)}>✏️ {t(`${I}.e6.modifier`)}</button>
              </div>
              <ul className="recap-docs">
                {PIECES.map((p, i) => (
                  <li key={p.doc} className="recap-doc">
                    {estImage(fichiers[i]) && apercus[i]
                      ? <img src={apercus[i]} alt="" className="piece-item__miniature" />
                      : <span className="piece-item__icone">📄</span>}
                    <div className="piece-item__info">
                      <span className="piece-item__doc">{t(`${I}.pieces.${i}`)}</span>
                      <span className="piece-item__fichier">
                        {fichiers[i]
                          ? <>{fichiers[i].name} <span className="piece-item__taille">· {formaterTaille(fichiers[i].size)}</span></>
                          : NR}
                      </span>
                    </div>
                    {fichiers[i] && (
                      <button type="button" className="piece-item__btn piece-item__btn--voir" onClick={() => voirFichier(i)}>
                        {t(`${I}.e4.voir`)}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <div className="recap-info">
              <span>ℹ️</span>
              <p>{t(`${I}.e6.info`)}</p>
            </div>
          </div>
        )}

        {/* ── NAVIGATION ENTRE ÉTAPES ───────────────────────────── */}
        <div className="etape-nav">
          {etape > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => allerEtape(etape - 1)}>{t(`${I}.retour`)}</button>
          )}
          <div style={{ flex: 1 }} />
          {etape < NB_ETAPES - 1 ? (
            <button type="submit" className="btn btn--primary" disabled={etape === 1 && !form.enfant_id}>
              {t(`${I}.continuer`)}
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? t('common.envoi') : t(`${I}.envoyer`)}
            </button>
          )}
        </div>

        </form>
      </div>

      {/* ── APERÇU D'UNE IMAGE EN GRAND ─────────────────────────
          Clic sur le fond, bouton Fermer ou touche Échap pour fermer */}
      {imageZoom && (
        <div className="apercu-doc" role="dialog" aria-modal="true" aria-label={imageZoom.titre} onClick={() => setImageZoom(null)}>
          <div className="apercu-doc__contenu" onClick={e => e.stopPropagation()}>
            <div className="apercu-doc__entete">
              <p className="apercu-doc__titre">{imageZoom.titre}</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setImageZoom(null)} autoFocus>
                ✕ {t('common.fermer')}
              </button>
            </div>
            <img src={imageZoom.url} alt={imageZoom.titre} className="apercu-doc__image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscription;
