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
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Inscription.css';

const ETAPES = ['Pré-inscription', 'Enfant', 'Accueil', 'Documents', 'Commentaire', 'Récapitulatif'];

const SITUATIONS = [
  { value: 'marie',       label: 'Marié(e)' },
  { value: 'pacse',       label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'En concubinage' },
  { value: 'separe',      label: 'Séparé(e)' },
  { value: 'divorce',     label: 'Divorcé(e)' },
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'veuf',        label: 'Veuf / Veuve' },
];

const FRATRIEOPT = ['1er enfant', '2ème enfant', '3ème enfant', '4ème enfant ou plus'];

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

const ChampParent = ({ cle, label, pi, majPI }) => (
  <div className="preinsc-section">
    <h3 className="preinsc-section__titre">👤 {label}</h3>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label">Nom <span className="requis">*</span></label>
        <input type="text" className="p-input" required value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder="Nom de famille" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Prénom <span className="requis">*</span></label>
        <input type="text" className="p-input" required value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder="Prénom" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Numéro de téléphone <span className="requis">*</span></label>
        <input type="tel" className="p-input" required value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder="06 XX XX XX XX" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Adresse email <span className="requis">*</span></label>
        <input type="email" className="p-input" required value={pi[cle].email}
          onChange={e => majPI(cle, 'email', e.target.value)} placeholder="email@exemple.fr" />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label">Adresse postale <span className="requis">*</span></label>
      <input type="text" className="p-input" required value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder="Numéro, rue, code postal, ville" />
    </div>
    <div className="p-form-groupe">
      <label className="p-label">Situation familiale <span className="requis">*</span></label>
      <select className="p-input" required value={pi[cle].situation_familiale}
        onChange={e => majPI(cle, 'situation_familiale', e.target.value)}>
        <option value="">Choisir...</option>
        {SITUATIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  </div>
);

const ChampContact = ({ cle, label, pi, majPI }) => (
  <div className="preinsc-section preinsc-section--contact">
    <h3 className="preinsc-section__titre">🚨 {label}</h3>
    <div className="preinsc-grille">
      <div className="p-form-groupe">
        <label className="p-label">Nom <span className="requis">*</span></label>
        <input type="text" className="p-input" required value={pi[cle].nom}
          onChange={e => majPI(cle, 'nom', e.target.value)} placeholder="Nom de famille" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Prénom <span className="requis">*</span></label>
        <input type="text" className="p-input" required value={pi[cle].prenom}
          onChange={e => majPI(cle, 'prenom', e.target.value)} placeholder="Prénom" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Numéro de téléphone <span className="requis">*</span></label>
        <input type="tel" className="p-input" required value={pi[cle].telephone}
          onChange={e => majPI(cle, 'telephone', e.target.value)} placeholder="06 XX XX XX XX" />
      </div>
      <div className="p-form-groupe">
        <label className="p-label">Lien de parenté <span className="requis">*</span></label>
        <input type="text" className="p-input" required value={pi[cle].parente}
          onChange={e => majPI(cle, 'parente', e.target.value)} placeholder="Grand-parent, oncle, ami..." />
      </div>
    </div>
    <div className="p-form-groupe">
      <label className="p-label">Adresse <span className="requis">*</span></label>
      <input type="text" className="p-input" required value={pi[cle].adresse}
        onChange={e => majPI(cle, 'adresse', e.target.value)} placeholder="Numéro, rue, code postal, ville" />
    </div>
  </div>
);

// ── Composant principal ──────────────────────────────────────

const Inscription = () => {
  const [etape,    setEtape]    = useState(0);
  const [enfants,  setEnfants]  = useState([]);
  const [envoi,    setEnvoi]    = useState(false);
  const [fichiers, setFichiers] = useState(PIECES.map(() => null));

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

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/enfants').then(r => setEnfants(r.data.data || [])).catch(() => {});
  }, []);

  const majForm = (champs) => setForm(p => ({ ...p, ...champs }));

  const majPI = (section, champ, valeur) =>
    setPi(p => ({ ...p, [section]: { ...p[section], [champ]: valeur } }));

  const majPITop = (champ, valeur) =>
    setPi(p => ({ ...p, [champ]: valeur }));

  const handleSubmit = async () => {
    setEnvoi(true);
    try {
      const res = await api.post('/inscriptions', { ...form, preinscription: pi });
      const inscriptionId = res.data.data?.id;
      const aDesFichiers = fichiers.some(f => f !== null);
      if (inscriptionId && aDesFichiers) {
        const fd = new FormData();
        fichiers.forEach((f, i) => {
          if (f) { fd.append('fichiers', f); fd.append('labels', PIECES[i].doc); }
        });
        await api.post(`/inscriptions/${inscriptionId}/documents`, fd);
      }
      toast.success('Demande d\'inscription envoyée !');
      navigate('/parent/mes-enfants');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    }
    setEnvoi(false);
  };

  const enfantSelectionne = enfants.find(e => e.id === parseInt(form.enfant_id));

  return (
    <div className="inscription-page">

      <div className="parent-page-header">
        <h1 className="parent-page-titre">Dossier <span>d'inscription</span></h1>
      </div>

      {/* ── BARRE DE PROGRESSION ──────────────────────────────── */}
      <div className="etapes-barre">
        {ETAPES.map((label, i) => (
          <div key={label} className={`etape-step ${i === etape ? 'etape-step--actif' : ''} ${i < etape ? 'etape-step--fait' : ''}`}>
            <div className="etape-step__cercle">{i < etape ? '✓' : i + 1}</div>
            <span className="etape-step__label">{label}</span>
          </div>
        ))}
        <div className="etapes-barre__ligne" style={{ width: `${(etape / (ETAPES.length - 1)) * 100}%` }} />
      </div>

      <div className="p-card inscription-contenu">

        {/* ── ÉTAPE 1 : PRÉ-INSCRIPTION ─────────────────────────── */}
        {etape === 0 && (
          <div className="etape-section">
            <h2 className="etape-titre">Conditions & fiche de pré-inscription</h2>
            <p className="etape-intro">
              Veuillez lire les conditions d'accueil puis compléter la fiche ci-dessous.
              Les champs marqués <span className="requis">*</span> sont obligatoires.
            </p>

            {/* Conditions */}
            <div className="cond-paragraphes">
              <p>Les enfants accueillis doivent habiter prioritairement les communes de Puilboreau, Saint-Xandre ou Esnandes.</p>
              <p>Pour l'accueil régulier ou occasionnel, un dossier d'inscription complet est obligatoire. Les parents doivent respecter la date prévue d'entrée de l'enfant.</p>
              <p>Le cas échéant, les jours d'absence seront facturés comme si l'enfant était présent dans la structure.</p>
              <p>La place de l'enfant n'est réservée qu'après la signature du contrat et de l'inscription sur le site « Pirouette ».</p>
            </div>

            <div className="cond-pirouette">
              <a href="https://www.mon-enfant.fr" target="_blank" rel="noopener noreferrer" className="btn-pirouette">
                Accéder à Pirouette
              </a>
            </div>

            <div className="cond-handicap">
              <span className="cond-handicap__icone">♿</span>
              <div>
                <h3 className="cond-handicap__titre">Accueil des enfants en situation de handicap</h3>
                <p>L'établissement met en œuvre un projet autour de l'inclusion. Un projet spécifique sera réalisé avec la directrice, l'équipe éducative, le référent santé et les partenaires accompagnant l'enfant et sa famille. Les conditions d'inscription seront les mêmes.</p>
              </div>
            </div>

            {/* ── Tarifs ──────────────────────────────────────── */}
            <div className="preinsc-separateur"><span>Les tarifs</span></div>

            {/* Adhésion annuelle */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">🏷️ Adhésion annuelle</h3>
              <p>Une adhésion annuelle à l'association Les Coccinelles est obligatoire, payable au premier jour de présence de l'enfant.</p>
              <div className="tarif-pills">
                <span className="tarif-pill tarif-pill--regular">Accueil régulier — <strong>24 €</strong></span>
                <span className="tarif-pill tarif-pill--occa">Accueil occasionnel — <strong>10 €</strong></span>
              </div>
              <p className="tarif-note">La carte d'adhésion est renouvelée chaque année en janvier (valable du 1er janvier au 31 décembre). Une adhésion prise en cours d'année jusqu'au 1er novembre reste acquise pour l'année en cours.</p>
            </div>

            {/* Tarif horaire */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">⏱️ Tarif horaire</h3>
              <div className="tarif-formule">
                <div className="tarif-formule__fraction">
                  <span className="tarif-formule__num">Revenus des parents</span>
                  <span className="tarif-formule__trait" />
                  <span className="tarif-formule__den">12</span>
                </div>
                <span className="tarif-formule__op">×</span>
                <span className="tarif-formule__label">taux d'effort</span>
              </div>
              <p className="tarif-sous-titre">Le taux d'effort est de :</p>
              <ul className="tarif-taux">
                <li><strong>0,0619 %</strong> pour 1 enfant à charge</li>
                <li><strong>0,0516 %</strong> pour 2 enfants</li>
                <li><strong>0,0413 %</strong> pour 3 enfants</li>
                <li><strong>0,0310 %</strong> pour 4 enfants et plus</li>
              </ul>
              <div className="tarif-plancher">
                <div className="tarif-plancher__item">
                  <span className="tarif-plancher__lbl">Prix plancher (au 1er janv. 2025)</span>
                  <span className="tarif-plancher__val">801 € → min <strong>0,49 €/h</strong></span>
                </div>
                <div className="tarif-plancher__item">
                  <span className="tarif-plancher__lbl">Prix plafond (depuis 1er sept. 2024)</span>
                  <span className="tarif-plancher__val">7 000 € → max <strong>4,33 €/h</strong></span>
                </div>
              </div>
            </div>

            {/* Accueil régulier */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">📅 Tarification pour l'accueil régulier</h3>
              <p>Pour l'accueil régulier, la tarification s'établit sur un contrat forfaitaire en fonction des besoins.</p>
              <div className="tarif-calcul">
                <span className="tarif-calcul__item">Tarif de la famille</span>
                <span className="tarif-calcul__op">×</span>
                <span className="tarif-calcul__item">Nombre d'heures</span>
                <span className="tarif-calcul__op">×</span>
                <span className="tarif-calcul__item">Nombre de jours de présence / mois</span>
              </div>
            </div>

            {/* Accueil occasionnel */}
            <div className="tarif-bloc">
              <h3 className="tarif-bloc__titre">🔔 Tarification pour l'accueil occasionnel</h3>
              <p>La tarification pour l'accueil occasionnel est la même que pour l'accueil régulier (accueil ponctuel sans contrat).</p>
            </div>

            <div className="preinsc-separateur"><span>Fiche de pré-inscription</span></div>

            <ChampParent cle="parent1" label="Parent 1" pi={pi} majPI={majPI} />
            <ChampParent cle="parent2" label="Parent 2" pi={pi} majPI={majPI} />

            {/* Autorisation RPE */}
            <label className="preinsc-autorisation">
              <input type="checkbox" checked={pi.autorisation_rpe}
                onChange={e => majPITop('autorisation_rpe', e.target.checked)} />
              <span>
                J'autorise la crèche à communiquer mon numéro de téléphone à la responsable du
                Relais Petite Enfance (RPE).
              </span>
            </label>

            {/* Place dans la fratrie */}
            <div className="preinsc-section">
              <h3 className="preinsc-section__titre">👨‍👩‍👧‍👦 Place dans la fratrie</h3>
              <div className="p-form-groupe">
                <label className="p-label">L'enfant est le… <span className="requis">*</span></label>
                <select className="p-input" required value={pi.place_fratrie}
                  onChange={e => majPITop('place_fratrie', e.target.value)}>
                  <option value="">Choisir...</option>
                  {FRATRIEOPT.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Personnes à contacter */}
            <div className="preinsc-intro-contacts">
              <p>
                Indiquez deux personnes autorisées à venir chercher l'enfant ou à être contactées
                en cas d'urgence (en dehors des parents).
              </p>
            </div>
            <ChampContact cle="contact1" label="Personne à contacter n°1" pi={pi} majPI={majPI} />
            <ChampContact cle="contact2" label="Personne à contacter n°2" pi={pi} majPI={majPI} />
          </div>
        )}

        {/* ── ÉTAPE 2 : SÉLECTION DE L'ENFANT ──────────────────── */}
        {etape === 1 && (
          <div className="etape-section">
            <h2 className="etape-titre">Quel enfant souhaitez-vous inscrire ?</h2>
            {enfants.length === 0 ? (
              <div className="p-vide">
                <span className="p-vide__icone">👶</span>
                <p>Vous devez d'abord ajouter un enfant.</p>
                <button className="btn btn--primary btn--sm" onClick={() => navigate('/parent/mes-enfants')}>Ajouter un enfant</button>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* ── ÉTAPE 3 : MODALITÉS D'ACCUEIL ────────────────────── */}
        {etape === 2 && (
          <div className="etape-section">
            <h2 className="etape-titre">Modalités d'accueil souhaitées</h2>
            <div className="p-form">
              <div className="p-form-groupe">
                <label className="p-label">Date de début souhaitée <span className="requis">*</span></label>
                <input type="date" className="p-input" value={form.date_debut_souhaitee}
                  onChange={e => majForm({ date_debut_souhaitee: e.target.value })} />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Type d'accueil <span className="requis">*</span></label>
                <select className="p-input" value={form.temps_accueil}
                  onChange={e => majForm({ temps_accueil: e.target.value })}>
                  <option value="">Choisir...</option>
                  <option value="temps_plein">Temps plein (5 jours/semaine)</option>
                  <option value="temps_partiel">Temps partiel (2–3 jours/semaine)</option>
                  <option value="occasionnel">Occasionnel (selon disponibilités)</option>
                </select>
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Jours souhaités</label>
                <div className="jours-checkboxes">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(jour => {
                    const jours   = form.jours_souhaites ? form.jours_souhaites.split(',') : [];
                    const checked = jours.includes(jour);
                    return (
                      <label key={jour} className={`jour-checkbox ${checked ? 'jour-checkbox--actif' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          const newJours = checked ? jours.filter(j => j !== jour) : [...jours, jour];
                          majForm({ jours_souhaites: newJours.join(',') });
                        }} />
                        {jour}
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
            <h2 className="etape-titre">Documents & informations complémentaires</h2>

            {/* Profession et employeur — Parent 1 */}
            <div className="docs-employeur">
              <h3 className="docs-employeur__titre">💼 Profession et employeur — Parent 1</h3>
              <div className="preinsc-grille">
                <div className="p-form-groupe">
                  <label className="p-label">Profession <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur1.profession}
                    onChange={e => majPI('employeur1', 'profession', e.target.value)}
                    placeholder="Ex : Infirmière, Enseignant..." />
                </div>
                <div className="p-form-groupe">
                  <label className="p-label">Nom de l'employeur <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur1.nom_employeur}
                    onChange={e => majPI('employeur1', 'nom_employeur', e.target.value)}
                    placeholder="Ex : CHU de La Rochelle, Mairie..." />
                </div>
              </div>
            </div>

            {/* Profession et employeur — Parent 2 */}
            <div className="docs-employeur">
              <h3 className="docs-employeur__titre">💼 Profession et employeur — Parent 2</h3>
              <div className="preinsc-grille">
                <div className="p-form-groupe">
                  <label className="p-label">Profession <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur2.profession}
                    onChange={e => majPI('employeur2', 'profession', e.target.value)}
                    placeholder="Ex : Comptable, Commerçant..." />
                </div>
                <div className="p-form-groupe">
                  <label className="p-label">Nom de l'employeur <span className="requis">*</span></label>
                  <input type="text" className="p-input" value={pi.employeur2.nom_employeur}
                    onChange={e => majPI('employeur2', 'nom_employeur', e.target.value)}
                    placeholder="Ex : Cabinet Martin, Auto-entrepreneur..." />
                </div>
              </div>
            </div>

            {/* Documents à fournir */}
            <h3 className="docs-titre-section">📎 Documents à fournir</h3>
            <p className="etape-intro">
              Déposez dès maintenant vos documents (PDF ou image). Vous pouvez aussi les apporter en mains propres — cette étape est facultative.
            </p>
            <div className="pieces-liste">
              {PIECES.map((p, i) => (
                <div key={p.doc} className={`piece-item ${fichiers[i] ? 'piece-item--coche' : ''}`}>
                  <span className="piece-item__icone">{p.icone}</span>
                  <div className="piece-item__info">
                    <span className="piece-item__doc">{p.doc}</span>
                    {fichiers[i] && <span className="piece-item__fichier">📎 {fichiers[i].name}</span>}
                  </div>
                  <label className="piece-item__btn">
                    {fichiers[i] ? '🔄 Changer' : '📤 Choisir'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) setFichiers(prev => prev.map((v, j) => j === i ? f : v));
                      }} />
                  </label>
                </div>
              ))}
            </div>
            <p className="pieces-info">
              {fichiers.filter(f => f !== null).length} / {PIECES.length} document(s) ajouté(s)
              {fichiers.every(f => f !== null) && ' — Dossier complet ✓'}
            </p>
          </div>
        )}

        {/* ── ÉTAPE 5 : COMMENTAIRE ─────────────────────────────── */}
        {etape === 4 && (
          <div className="etape-section">
            <h2 className="etape-titre">Message à l'équipe (optionnel)</h2>
            <div className="p-form-groupe">
              <label className="p-label">Précisions, questions, situation particulière...</label>
              <textarea className="p-input p-textarea" rows={6} value={form.commentaire_parent}
                onChange={e => majForm({ commentaire_parent: e.target.value })}
                placeholder="Parlez-nous de votre enfant, de vos contraintes, de vos attentes..." />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 6 : RÉCAPITULATIF ───────────────────────────── */}
        {etape === 5 && (
          <div className="etape-section">
            <h2 className="etape-titre">Récapitulatif de votre demande</h2>
            <div className="recap-grille">
              <div className="recap-item"><strong>Parent 1</strong><span>{pi.parent1.prenom} {pi.parent1.nom}</span></div>
              <div className="recap-item"><strong>Parent 2</strong><span>{pi.parent2.prenom} {pi.parent2.nom}</span></div>
              <div className="recap-item"><strong>Enfant</strong><span>{enfantSelectionne?.prenom} {enfantSelectionne?.nom}</span></div>
              <div className="recap-item"><strong>Place dans la fratrie</strong><span>{pi.place_fratrie || '—'}</span></div>
              <div className="recap-item"><strong>Date souhaitée</strong><span>{form.date_debut_souhaitee ? new Date(form.date_debut_souhaitee).toLocaleDateString('fr-FR') : '—'}</span></div>
              <div className="recap-item"><strong>Type d'accueil</strong><span>{{ temps_plein: 'Temps plein', temps_partiel: 'Temps partiel', occasionnel: 'Occasionnel' }[form.temps_accueil] || '—'}</span></div>
              <div className="recap-item"><strong>Jours souhaités</strong><span>{form.jours_souhaites || '—'}</span></div>
              <div className="recap-item"><strong>Autorisation RPE</strong><span>{pi.autorisation_rpe ? 'Oui ✓' : 'Non'}</span></div>
              <div className="recap-item"><strong>Contact urgence 1</strong><span>{pi.contact1.prenom} {pi.contact1.nom} — {pi.contact1.parente} — {pi.contact1.telephone}</span></div>
              <div className="recap-item"><strong>Contact urgence 2</strong><span>{pi.contact2.prenom} {pi.contact2.nom} — {pi.contact2.parente} — {pi.contact2.telephone}</span></div>
              {form.commentaire_parent && (
                <div className="recap-item recap-item--full"><strong>Message</strong><span>{form.commentaire_parent}</span></div>
              )}
            </div>
            <div className="recap-info">
              <span>ℹ️</span>
              <p>Votre demande sera examinée par l'équipe dans les meilleurs délais. Vous recevrez une notification dès qu'une décision sera prise.</p>
            </div>
          </div>
        )}

        {/* ── NAVIGATION ENTRE ÉTAPES ───────────────────────────── */}
        <div className="etape-nav">
          {etape > 0 && (
            <button className="btn btn--ghost" onClick={() => setEtape(e => e - 1)}>← Retour</button>
          )}
          <div style={{ flex: 1 }} />
          {etape < ETAPES.length - 1 ? (
            <button
              className="btn btn--primary"
              onClick={() => setEtape(e => e + 1)}
              disabled={etape === 1 && !form.enfant_id}
            >
              Continuer →
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handleSubmit} disabled={envoi}>
              {envoi ? 'Envoi...' : '✅ Envoyer la demande'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Inscription;
