// ============================================================
// FICHIER  : Inscription.jsx (parent)
// ROUTE    : /parent/inscription
// RÔLE     : Formulaire multi-étapes de demande d'inscription.
//            6 étapes : Pré-inscription → Enfant → Accueil
//                       → Documents → Commentaire → Récapitulatif.
//            Étape 1 : conditions + fiche de pré-inscription complète.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import { FormulaireEnfant } from '../MesEnfants/MesEnfants';
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

const parentVide    = () => ({ nom: '', prenom: '', telephone: '', email: '', adresse: '', situation_familiale: '' });
const contactVide   = () => ({ nom: '', prenom: '', telephone: '', adresse: '', parente: '' });
const employeurVide = () => ({ profession: '', nom_employeur: '' });

// ── Composants définis HORS du composant principal ──────────
// (sinon React les recrée à chaque frappe → perte de focus)

// ── Règles de validation réutilisables ─────────────────────
const RE_TEL   = /^0[1-9]([ .-]?\d{2}){4}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// cls() : ajoute la classe d'erreur si le champ correspondant est en erreur
const cls = (erreurs, champ) => `p-input ${erreurs?.[champ] ? 'p-input--erreur' : ''}`;

// Petit message d'erreur sous un champ (msg = clé de traduction de l'erreur)
const Err = ({ msg }) => {
  const { t } = useTranslation();
  return msg ? <p className="p-erreur">{t(`${I}.erreurs.${msg}`)}</p> : null;
};

const ChampParent = ({ cle, label, pi, majPI, erreurs = {} }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <div className="preinsc-section">
    <h3 className="preinsc-section__titre">👤 {label}</h3>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.nom`)} <span className="requis">*</span></label>
        <input type="text" className={cls(erreurs, 'nom')} value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder={t(`${I}.champs.nomPlaceholder`)} />
        <Err msg={erreurs.nom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.prenom`)} <span className="requis">*</span></label>
        <input type="text" className={cls(erreurs, 'prenom')} value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder={t(`${I}.champs.prenomPlaceholder`)} />
        <Err msg={erreurs.prenom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.telephone`)} <span className="requis">*</span></label>
        <input type="tel" className={cls(erreurs, 'telephone')} value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder={t(`${I}.champs.telephonePlaceholder`)} />
        <Err msg={erreurs.telephone} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.email`)} <span className="requis">*</span></label>
        <input type="email" className={cls(erreurs, 'email')} value={pi[cle].email}
          onChange={e => majPI(cle, 'email', e.target.value)} placeholder={t(`${I}.champs.emailPlaceholder`)} />
        <Err msg={erreurs.email} />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label">{t(`${I}.champs.adressePostale`)} <span className="requis">*</span></label>
      <input type="text" className={cls(erreurs, 'adresse')} value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder={t(`${I}.champs.adressePlaceholder`)} />
      <Err msg={erreurs.adresse} />
    </div>
    <div className="p-form-groupe">
      <label className="p-label">{t(`${I}.champs.situation`)} <span className="requis">*</span></label>
      <select className={cls(erreurs, 'situation_familiale')} value={pi[cle].situation_familiale}
        onChange={e => majPI(cle, 'situation_familiale', e.target.value)}>
        <option value="">{t('common.choisir')}</option>
        {SITUATIONS.map(s => <option key={s} value={s}>{t(`${I}.situations.${s}`)}</option>)}
      </select>
      <Err msg={erreurs.situation_familiale} />
    </div>
  </div>
  );
};

const ChampContact = ({ cle, label, pi, majPI, erreurs = {} }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <div className="preinsc-section preinsc-section--contact">
    <h3 className="preinsc-section__titre">🚨 {label}</h3>
    <p className="preinsc-section__aide">{t(`${I}.contactAide`)}</p>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.nom`)}</label>
        <input type="text" className={cls(erreurs, 'nom')} value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder={t(`${I}.champs.nomPlaceholder`)} />
        <Err msg={erreurs.nom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.prenom`)}</label>
        <input type="text" className={cls(erreurs, 'prenom')} value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder={t(`${I}.champs.prenomPlaceholder`)} />
        <Err msg={erreurs.prenom} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.telephone`)}</label>
        <input type="tel" className={cls(erreurs, 'telephone')} value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder={t(`${I}.champs.telephonePlaceholder`)} />
        <Err msg={erreurs.telephone} />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">{t(`${I}.champs.parente`)}</label>
        <input type="text" className={cls(erreurs, 'parente')} value={pi[cle].parente}
          onChange={e => majPI(cle, 'parente', e.target.value)} placeholder={t(`${I}.champs.parentePlaceholder`)} />
        <Err msg={erreurs.parente} />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label">{t(`${I}.champs.adresse`)}</label>
      <input type="text" className={cls(erreurs, 'adresse')} value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder={t(`${I}.champs.adressePlaceholder`)} />
      <Err msg={erreurs.adresse} />
    </div>
  </div>
  );
};

// ── Composant principal ──────────────────────────────────────

const Inscription = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [etape,    setEtape]    = useState(0);
  const [enfants,  setEnfants]  = useState([]);
  const [envoi,    setEnvoi]    = useState(false);
  const [fichiers, setFichiers] = useState(PIECES.map(() => null));
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
    autorisation_rpe: false, place_fratrie: '',
    contact1: contactVide(), contact2: contactVide(),
    employeur1: employeurVide(), employeur2: employeurVide(),
  });

  // Erreurs de validation de l'étape 1 (par section)
  const [erreurs, setErreurs] = useState({ parent1: {}, parent2: {}, contact1: {}, contact2: {}, place_fratrie: '' });

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/enfants').then(r => setEnfants(r.data.data || [])).catch(() => {});
  }, []);

  const majForm = (champs) => setForm(p => ({ ...p, ...champs }));

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

  const majPI = (section, champ, valeur) =>
    setPi(p => ({ ...p, [section]: { ...p[section], [champ]: valeur } }));

  const majPITop = (champ, valeur) =>
    setPi(p => ({ ...p, [champ]: valeur }));

  const handleSubmit = async () => {
    // Sécurité : retour à l'étape documents s'il en manque un
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

  // ── Validation de l'étape 1 (pré-inscription) ────────────
  // Parent 1 et Parent 2 : tous les champs obligatoires + formats.
  // Personnes à contacter : facultatives, mais format vérifié si rempli.
  const validerParent = (p) => {
    const e = {};
    // Valeurs = clés de traduction (parent.inscription.erreurs.*)
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
    if (c.telephone.trim() && !RE_TEL.test(c.telephone.trim()))
      e.telephone = 'telInvalide';
    return e;
  };

  const validerEtape0 = () => {
    const ev = {
      parent1: validerParent(pi.parent1),
      parent2: validerParent(pi.parent2),
      contact1: validerContact(pi.contact1),
      contact2: validerContact(pi.contact2),
      place_fratrie: pi.place_fratrie ? '' : 'fratrieRequise',
    };
    setErreurs(ev);
    const ok = !Object.keys(ev.parent1).length && !Object.keys(ev.parent2).length
      && !Object.keys(ev.contact1).length && !Object.keys(ev.contact2).length
      && !ev.place_fratrie;
    if (!ok) toast.error(t(`${I}.corriger`));
    return ok;
  };

  // Passage à l'étape suivante (avec validation selon l'étape courante)
  const etapeSuivante = () => {
    if (etape === 0 && !validerEtape0()) return;
    // Étape documents : les 5 pièces justificatives sont obligatoires
    if (etape === 3 && !fichiers.every(f => f !== null)) {
      setDocsManquants(true);
      toast.error(t(`${I}.e4.docsManquants`));
      return;
    }
    setEtape(e => e + 1);
  };

  const enfantSelectionne = enfants.find(e => e.id === parseInt(form.enfant_id));

  // ── Documents : choix, contrôle, aperçu, retrait ──────────
  // Mêmes règles que le serveur : PDF / JPG / PNG, 5 Mo max
  const TYPES_ACCEPTES = ['application/pdf', 'image/jpeg', 'image/png'];
  const TAILLE_MAX     = 5 * 1024 * 1024;

  const estImage = (f) => Boolean(f?.type?.startsWith('image/'));

  // Taille lisible : "350 Ko" / "1,2 Mo" (séparateur selon la langue)
  const formaterTaille = (octets) => octets < 1024 * 1024
    ? `${Math.max(1, Math.round(octets / 1024))} Ko`
    : `${(octets / (1024 * 1024)).toLocaleString(getLocale(), { maximumFractionDigits: 1 })} Mo`;

  // Contrôle immédiat du fichier choisi (sans attendre l'envoi final)
  const choisirFichier = (i, e) => {
    const f = e.target.files[0];
    e.target.value = ''; // Permet de rechoisir le même fichier après un retrait
    if (!f) return;
    if (!TYPES_ACCEPTES.includes(f.type)) { toast.error(t(`${I}.e4.typeInvalide`, { nom: f.name })); return; }
    if (f.size > TAILLE_MAX)              { toast.error(t(`${I}.e4.tropLourd`,    { nom: f.name })); return; }
    setFichiers(prev => prev.map((v, j) => (j === i ? f : v)));
  };

  const retirerFichier = (i) => setFichiers(prev => prev.map((v, j) => (j === i ? null : v)));

  // Image → grande vue dans la page ; PDF → nouvel onglet (lecteur du navigateur)
  const voirFichier = (i) => {
    if (!apercus[i]) return;
    if (estImage(fichiers[i])) setImageZoom({ url: apercus[i], titre: t(`${I}.pieces.${i}`) });
    else window.open(apercus[i], '_blank', 'noopener');
  };

  // Libellé traduit d'une valeur stockée (place dans la fratrie, jour)
  const libelleFratrie = (v) => { const i = FRATRIEOPT.indexOf(v); return i >= 0 ? t(`${I}.fratrie.${i}`) : v; };
  const libelleJour    = (v) => JOURS_ACCUEIL.includes(v) ? t(`common.jours.${v.toLowerCase()}`) : v;

  return (
    <div className="inscription-page">

      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.inscription.titre" components={{ s: <span /> }} /></h1>
      </div>

      {/* ── BARRE DE PROGRESSION ──────────────────────────────── */}
      <div className="etapes-barre">
        {t(`${I}.etapes`, { returnObjects: true }).map((label, i) => (
          <div key={label} className={`etape-step ${i === etape ? 'etape-step--actif' : ''} ${i < etape ? 'etape-step--fait' : ''}`}>
            <div className="etape-step__cercle">{i < etape ? '✓' : i + 1}</div>
            <span className="etape-step__label">{label}</span>
          </div>
        ))}
        <div className="etapes-barre__ligne" style={{ width: `${(etape / (NB_ETAPES - 1)) * 100}%` }} />
      </div>

      <div className="p-card inscription-contenu">

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
            <ChampParent cle="parent2" label={t(`${I}.e1.parent2`)} pi={pi} majPI={majPI} erreurs={erreurs.parent2} />

            {/* Autorisation RPE */}
            <label className="preinsc-autorisation">
              <input type="checkbox" checked={pi.autorisation_rpe}
                onChange={e => majPITop('autorisation_rpe', e.target.checked)} />
              <span>{t(`${I}.e1.rpe`)}</span>
            </label>

            {/* Place dans la fratrie */}
            <div className="preinsc-section">
              <h3 className="preinsc-section__titre">👨‍👩‍👧‍👦 {t(`${I}.e1.fratrieTitre`)}</h3>
              <div className="p-form-groupe">
                <label className="p-label">{t(`${I}.e1.fratrieLabel`)} <span className="requis">*</span></label>
                <select className={`p-input ${erreurs.place_fratrie ? 'p-input--erreur' : ''}`} value={pi.place_fratrie}
                  onChange={e => majPITop('place_fratrie', e.target.value)}>
                  <option value="">{t('common.choisir')}</option>
                  {FRATRIEOPT.map(o => <option key={o} value={o}>{libelleFratrie(o)}</option>)}
                </select>
                <Err msg={erreurs.place_fratrie} />
              </div>
            </div>

            {/* Personnes à contacter */}
            <div className="preinsc-intro-contacts">
              <p>{t(`${I}.e1.contactsIntro`)}</p>
            </div>
            <ChampContact cle="contact1" label={t(`${I}.e1.contact1`)} pi={pi} majPI={majPI} erreurs={erreurs.contact1} />
            <ChampContact cle="contact2" label={t(`${I}.e1.contact2`)} pi={pi} majPI={majPI} erreurs={erreurs.contact2} />
          </div>
        )}

        {/* ── ÉTAPE 2 : SÉLECTION DE L'ENFANT ──────────────────── */}
        {etape === 1 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e2.titre`)}</h2>
            {enfants.length === 0 || ajoutEnfant ? (
              // Aucun enfant (ou ajout demandé) : formulaire enfant intégré,
              // la saisie des étapes précédentes est conservée
              <div className="p-card">
                <p className="etape-intro">👶 {t(enfants.length === 0 ? `${I}.e2.dAbord` : `${I}.e2.ajoutIntro`)}</p>
                <FormulaireEnfant
                  onSave={ajouterEnfant}
                  onAnnuler={() => (enfants.length === 0 ? setEtape(0) : setAjoutEnfant(false))}
                />
              </div>
            ) : (
              <>
              <div className="enfants-choix">
                {enfants.map(enfant => (
                  <label key={enfant.id} className={`enfant-option ${form.enfant_id === String(enfant.id) ? 'enfant-option--selectionne' : ''}`}>
                    <input type="radio" name="enfant_id" value={enfant.id}
                      checked={form.enfant_id === String(enfant.id)}
                      onChange={e => majForm({ enfant_id: e.target.value })} />
                    <span className="enfant-option__icone">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                    <span className="enfant-option__nom">{enfant.prenom} {enfant.nom}</span>
                  </label>
                ))}
              </div>
              <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setAjoutEnfant(true)}>
                {t(`${I}.e2.autreEnfant`)}
              </button>
              </>
            )}
          </div>
        )}

        {/* ── ÉTAPE 3 : MODALITÉS D'ACCUEIL ────────────────────── */}
        {etape === 2 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e3.titre`)}</h2>
            <div className="p-form">
              <div className="p-form-groupe">
                <label className="p-label">{t(`${I}.e3.dateDebut`)} <span className="requis">*</span></label>
                <input type="date" className="p-input" value={form.date_debut_souhaitee}
                  onChange={e => majForm({ date_debut_souhaitee: e.target.value })} />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">{t(`${I}.e3.type`)} <span className="requis">*</span></label>
                <select className="p-input" value={form.temps_accueil}
                  onChange={e => majForm({ temps_accueil: e.target.value })}>
                  <option value="">{t('common.choisir')}</option>
                  {['temps_plein', 'temps_partiel', 'occasionnel'].map(v => (
                    <option key={v} value={v}>{t(`${I}.e3.types.${v}`)}</option>
                  ))}
                </select>
              </div>
              <div className="p-form-groupe">
                <label className="p-label">{t(`${I}.e3.jours`)}</label>
                <div className="jours-checkboxes">
                  {JOURS_ACCUEIL.map(jour => {
                    const jours   = form.jours_souhaites ? form.jours_souhaites.split(',') : [];
                    const checked = jours.includes(jour);
                    return (
                      <label key={jour} className={`jour-checkbox ${checked ? 'jour-checkbox--actif' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          const newJours = checked ? jours.filter(j => j !== jour) : [...jours, jour];
                          majForm({ jours_souhaites: newJours.join(',') });
                        }} />
                        {libelleJour(jour)}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : PIÈCES À FOURNIR ───────────────────────── */}
        {etape === 3 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e4.titre`)}</h2>

            {/* Profession et employeur — Parent 1 */}
            <div className="docs-employeur">
              <h3 className="docs-employeur__titre">💼 {t(`${I}.e4.employeurTitre`, { parent: t(`${I}.e1.parent1`) })}</h3>
              <div className="preinsc-grille">
                <div className="p-form-groupe">
                  <label className="p-label">{t(`${I}.e4.profession`)} <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur1.profession}
                    onChange={e => majPI('employeur1', 'profession', e.target.value)}
                    placeholder={t(`${I}.e4.profession1Placeholder`)} />
                </div>
                <div className="p-form-groupe">
                  <label className="p-label">{t(`${I}.e4.employeur`)} <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur1.nom_employeur}
                    onChange={e => majPI('employeur1', 'nom_employeur', e.target.value)}
                    placeholder={t(`${I}.e4.employeur1Placeholder`)} />
                </div>
              </div>
            </div>

            {/* Profession et employeur — Parent 2 */}
            <div className="docs-employeur">
              <h3 className="docs-employeur__titre">💼 {t(`${I}.e4.employeurTitre`, { parent: t(`${I}.e1.parent2`) })}</h3>
              <div className="preinsc-grille">
                <div className="p-form-groupe">
                  <label className="p-label">{t(`${I}.e4.profession`)} <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur2.profession}
                    onChange={e => majPI('employeur2', 'profession', e.target.value)}
                    placeholder={t(`${I}.e4.profession2Placeholder`)} />
                </div>
                <div className="p-form-groupe">
                  <label className="p-label">{t(`${I}.e4.employeur`)} <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur2.nom_employeur}
                    onChange={e => majPI('employeur2', 'nom_employeur', e.target.value)}
                    placeholder={t(`${I}.e4.employeur2Placeholder`)} />
                </div>
              </div>
            </div>

            {/* Documents à fournir */}
            <h3 className="docs-titre-section">📎 {t(`${I}.e4.docsTitre`)}</h3>
            <p className="etape-intro">
              {t(`${I}.e4.docsIntro`)}
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
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
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
              <p className="p-erreur">⚠️ {t(`${I}.e4.docsManquants`)}</p>
            )}
          </div>
        )}

        {/* ── ÉTAPE 5 : COMMENTAIRE ─────────────────────────────── */}
        {etape === 4 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e5.titre`)}</h2>
            <div className="p-form-groupe">
              <label className="p-label">{t(`${I}.e5.label`)}</label>
              <textarea className="p-input p-textarea" rows={6} value={form.commentaire_parent}
                onChange={e => majForm({ commentaire_parent: e.target.value })}
                placeholder={t(`${I}.e5.placeholder`)} />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 6 : RÉCAPITULATIF ───────────────────────────── */}
        {etape === 5 && (
          <div className="etape-section">
            <h2 className="etape-titre">{t(`${I}.e6.titre`)}</h2>
            <div className="recap-grille">
              <div className="recap-item"><strong>{t(`${I}.e6.parent1`)}</strong><span>{pi.parent1.prenom} {pi.parent1.nom}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.parent2`)}</strong><span>{pi.parent2.prenom} {pi.parent2.nom}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.enfant`)}</strong><span>{enfantSelectionne?.prenom} {enfantSelectionne?.nom}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.fratrie`)}</strong><span>{pi.place_fratrie ? libelleFratrie(pi.place_fratrie) : '—'}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.date`)}</strong><span>{form.date_debut_souhaitee ? new Date(form.date_debut_souhaitee).toLocaleDateString(getLocale()) : '—'}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.type`)}</strong><span>{form.temps_accueil ? t(`${I}.e6.types.${form.temps_accueil}`) : '—'}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.jours`)}</strong><span>{form.jours_souhaites ? form.jours_souhaites.split(',').map(libelleJour).join(', ') : '—'}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.rpe`)}</strong><span>{pi.autorisation_rpe ? t(`${I}.e6.oui`) : t(`${I}.e6.non`)}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.contact1`)}</strong><span>{pi.contact1.prenom} {pi.contact1.nom} — {pi.contact1.parente} — {pi.contact1.telephone}</span></div>
              <div className="recap-item"><strong>{t(`${I}.e6.contact2`)}</strong><span>{pi.contact2.prenom} {pi.contact2.nom} — {pi.contact2.parente} — {pi.contact2.telephone}</span></div>
              {form.commentaire_parent && (
                <div className="recap-item recap-item--full"><strong>{t(`${I}.e6.message`)}</strong><span>{form.commentaire_parent}</span></div>
              )}
            </div>

            {/* Documents joints : dernière vérification avant l'envoi */}
            <h3 className="docs-titre-section">📎 {t(`${I}.e6.documents`)}</h3>
            <ul className="recap-docs">
              {PIECES.map((p, i) => (
                <li key={p.doc} className="recap-doc">
                  {estImage(fichiers[i]) && apercus[i]
                    ? <img src={apercus[i]} alt="" className="piece-item__miniature" />
                    : <span className="piece-item__icone">📄</span>}
                  <div className="piece-item__info">
                    <span className="piece-item__doc">{t(`${I}.pieces.${i}`)}</span>
                    {fichiers[i] && (
                      <span className="piece-item__fichier">
                        {fichiers[i].name} <span className="piece-item__taille">· {formaterTaille(fichiers[i].size)}</span>
                      </span>
                    )}
                  </div>
                  {fichiers[i] && (
                    <button type="button" className="piece-item__btn piece-item__btn--voir" onClick={() => voirFichier(i)}>
                      {t(`${I}.e4.voir`)}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="recap-info">
              <span>ℹ️</span>
              <p>{t(`${I}.e6.info`)}</p>
            </div>
          </div>
        )}

        {/* ── NAVIGATION ENTRE ÉTAPES ───────────────────────────── */}
        <div className="etape-nav">
          {etape > 0 && (
            <button className="btn btn--ghost" onClick={() => setEtape(e => e - 1)}>{t(`${I}.retour`)}</button>
          )}
          <div style={{ flex: 1 }} />
          {etape < NB_ETAPES - 1 ? (
            <button
              className="btn btn--primary"
              onClick={etapeSuivante}
              disabled={etape === 1 && !form.enfant_id}
            >
              {t(`${I}.continuer`)}
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handleSubmit} disabled={envoi}>
              {envoi ? t('common.envoi') : t(`${I}.envoyer`)}
            </button>
          )}
        </div>

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
