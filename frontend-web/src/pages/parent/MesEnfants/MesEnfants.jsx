// ============================================================
// FICHIER  : MesEnfants.jsx (parent)
// ROUTE    : /parent/mes-enfants
// RÔLE     : Gestion des enfants du parent : liste + ajout + modification.
//            FormulaireEnfant : sous-composant réutilisable (ajout et édition).
//            Validation locale : TOUS les champs sont obligatoires.
//            Affiche sante badges (allergies ⚠️, médicaments 💊).
//            Liens : Suivi, Inscription, Modifier.
//            DemandesInscription : statut des demandes d'inscription,
//            message de la crèche, envoi des documents manquants.
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import i18n from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './MesEnfants.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

// ── Calcul de l'âge en mois ou en années ─────────────────────
// Utilisé dans la fiche enfant (traduit dans la langue active)
const calculerAge = (dateNaissance) => {
  const naissance  = new Date(dateNaissance);
  const maintenant = new Date();
  const mois = (maintenant.getFullYear() - naissance.getFullYear()) * 12 + (maintenant.getMonth() - naissance.getMonth());
  return mois < 24
    ? i18n.t('common.age.mois', { count: mois })
    : i18n.t('common.age.ans', { count: Math.floor(mois / 12) });
};

// ── Sous-composant formulaire enfant ─────────────────────────
// Props : initial (objet enfant pour édition, null pour ajout)
//         onSave (callback appelé avec les données du formulaire)
//         onAnnuler (callback pour fermer le formulaire)
// Exporté : réutilisé dans le formulaire d'inscription (ajout d'un enfant
// sans quitter le formulaire)
export const FormulaireEnfant = ({ initial, onSave, onAnnuler }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Objet vide utilisé pour l'ajout d'un nouvel enfant
  const vide = { prenom: '', nom: '', date_naissance: '', sexe: '', allergies: '', medicaments: '', medecin_nom: '', medecin_tel: '' };
  // Initialisé avec les valeurs existantes ou vide
  const [form,    setForm]    = useState(initial || vide);
  // Indicateur d'envoi pendant l'appel onSave (POST ou PUT)
  const [envoi,   setEnvoi]   = useState(false);
  // Erreurs de validation locale : { champ: true } — le message est traduit
  // à l'affichage via parent.mesEnfants.erreurs.<champ>
  const [erreurs, setErreurs] = useState({});

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Validation locale : tous les champs sont obligatoires ─
  const valider = () => {
    const e = {};
    if (!form.prenom.trim())            e.prenom         = true;
    if (!form.nom.trim())               e.nom            = true;
    if (!form.date_naissance)           e.date_naissance = true;
    if (!form.sexe)                     e.sexe           = true;
    if (!form.allergies.trim())         e.allergies      = true;
    if (!form.medicaments.trim())       e.medicaments    = true;
    if (!form.medecin_nom.trim())       e.medecin_nom    = true;
    if (!form.medecin_tel.trim())       e.medecin_tel    = true;
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ev = valider();
    if (Object.keys(ev).length) { setErreurs(ev); return; }
    setEnvoi(true);
    await onSave(form); // onSave gère l'appel API et les toasts
    setEnvoi(false);
  };

  // Message d'erreur traduit d'un champ (ou null s'il est valide)
  const erreur = (champ) => erreurs[champ] && <p className="p-erreur">{t(`parent.mesEnfants.erreurs.${champ}`)}</p>;

  return (
    <form className="p-form enfant-form" onSubmit={handleSubmit}>
      {/* Ligne prénom + nom */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.prenom')} <span className="requis">*</span></label>
          <input name="prenom" className={`p-input ${erreurs.prenom ? 'p-input--erreur' : ''}`} value={form.prenom} onChange={handleChange} placeholder={t('parent.mesEnfants.form.prenomPlaceholder')} />
          {erreur('prenom')}
        </div>
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.nom')} <span className="requis">*</span></label>
          <input name="nom" className={`p-input ${erreurs.nom ? 'p-input--erreur' : ''}`} value={form.nom} onChange={handleChange} placeholder={t('parent.mesEnfants.form.nomPlaceholder')} />
          {erreur('nom')}
        </div>
      </div>

      {/* Ligne date de naissance + sexe */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.dateNaissance')} <span className="requis">*</span></label>
          <input name="date_naissance" type="date" className={`p-input ${erreurs.date_naissance ? 'p-input--erreur' : ''}`} value={form.date_naissance} onChange={handleChange} />
          {erreur('date_naissance')}
        </div>
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.sexe')} <span className="requis">*</span></label>
          <select name="sexe" className={`p-input ${erreurs.sexe ? 'p-input--erreur' : ''}`} value={form.sexe} onChange={handleChange}>
            <option value="">{t('common.choisir')}</option>
            <option value="F">{t('common.sexe.F')}</option>
            <option value="M">{t('common.sexe.M')}</option>
          </select>
          {erreur('sexe')}
        </div>
      </div>

      {/* Santé : allergies */}
      <div className="p-form-groupe">
        <label className="p-label">{t('parent.mesEnfants.form.allergies')} <span className="requis">*</span></label>
        <textarea name="allergies" className={`p-input p-textarea ${erreurs.allergies ? 'p-input--erreur' : ''}`} rows={2} value={form.allergies} onChange={handleChange} placeholder={t('parent.mesEnfants.form.allergiesPlaceholder')} />
        {erreur('allergies')}
      </div>

      {/* Santé : traitements en cours */}
      <div className="p-form-groupe">
        <label className="p-label">{t('parent.mesEnfants.form.medicaments')} <span className="requis">*</span></label>
        <textarea name="medicaments" className={`p-input p-textarea ${erreurs.medicaments ? 'p-input--erreur' : ''}`} rows={2} value={form.medicaments} onChange={handleChange} placeholder={t('parent.mesEnfants.form.medicamentsPlaceholder')} />
        {erreur('medicaments')}
      </div>

      {/* Médecin traitant */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.medecin')} <span className="requis">*</span></label>
          <input name="medecin_nom" className={`p-input ${erreurs.medecin_nom ? 'p-input--erreur' : ''}`} value={form.medecin_nom} onChange={handleChange} placeholder={t('parent.mesEnfants.form.medecinPlaceholder')} />
          {erreur('medecin_nom')}
        </div>
        <div className="p-form-groupe">
          <label className="p-label">{t('parent.mesEnfants.form.medecinTel')} <span className="requis">*</span></label>
          <input name="medecin_tel" type="tel" className={`p-input ${erreurs.medecin_tel ? 'p-input--erreur' : ''}`} value={form.medecin_tel} onChange={handleChange} placeholder={t('parent.mesEnfants.form.medecinTelPlaceholder')} />
          {erreur('medecin_tel')}
        </div>
      </div>

      {/* Boutons annuler/sauvegarder */}
      <div className="enfant-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onAnnuler}>{t('common.annuler')}</button>
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? t('common.enregistrement') : initial ? t('parent.mesEnfants.form.modifier') : t('parent.mesEnfants.form.ajouter')}
        </button>
      </div>
    </form>
  );
};

// ── Sous-composant : demandes d'inscription du parent ────────
// Liste chaque demande avec son statut et le message de la crèche.
// Statut "incomplet" : encadré d'alerte + envoi des documents manquants
// (POST /inscriptions/:id/documents → la demande repasse "en cours").
// demandeCiblee : id venant de l'URL (?demande=ID, lien de la notification)
// → la carte est mise en avant et la page défile jusqu'à elle.
const DemandesInscription = ({ demandeCiblee }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const D = 'parent.mesEnfants.demandes';

  const [demandes, setDemandes] = useState([]);
  // Fichiers choisis par demande : { [idDemande]: File[] }
  const [fichiers, setFichiers] = useState({});
  // Id de la demande en cours d'envoi (désactive son bouton)
  const [envoiId,  setEnvoiId]  = useState(null);

  const charger = async () => {
    try {
      const res = await api.get('/inscriptions');
      setDemandes(res.data.data || []);
    } catch { /* section simplement masquée si l'appel échoue */ }
  };

  useEffect(() => { charger(); }, []);

  // Défilement jusqu'à la demande ciblée une fois la liste chargée
  useEffect(() => {
    if (!demandeCiblee || demandes.length === 0) return;
    document.getElementById(`demande-${demandeCiblee}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [demandeCiblee, demandes]);

  // Envoi des documents manquants d'une demande incomplète
  const envoyerDocuments = async (demande) => {
    const liste = fichiers[demande.id] || [];
    if (liste.length === 0) return;
    setEnvoiId(demande.id);
    try {
      const fd = new FormData();
      liste.forEach(f => { fd.append('fichiers', f); fd.append('labels', f.name); });
      await api.post(`/inscriptions/${demande.id}/documents`, fd);
      toast.success(t(`${D}.toastEnvoye`));
      setFichiers(p => ({ ...p, [demande.id]: [] }));
      await charger(); // Statut mis à jour (incomplet → en cours)
    } catch (err) {
      toast.error(err.response?.data?.message || t(`${D}.erreurEnvoi`));
    }
    setEnvoiId(null);
  };

  if (demandes.length === 0) return null;

  return (
    <section className="demandes">
      <h2 className="demandes__titre">📝 {t(`${D}.titre`)}</h2>

      <div className="demandes__liste">
        {demandes.map(d => {
          const choisis = fichiers[d.id] || [];
          return (
            <article
              key={d.id}
              id={`demande-${d.id}`}
              className={`demande demande--${d.statut} ${String(d.id) === demandeCiblee ? 'demande--ciblee' : ''}`}
            >
              {/* En-tête : enfant + date d'envoi + statut */}
              <div className="demande__entete">
                <div>
                  <h3 className="demande__enfant">{d.enfant?.prenom} {d.enfant?.nom}</h3>
                  <p className="demande__date">
                    {t(`${D}.envoyeeLe`, { date: new Date(d.created_at).toLocaleDateString(i18n.language) })}
                  </p>
                </div>
                <span className={`demande__statut demande__statut--${d.statut}`}>
                  {t(`common.statutInscription.${d.statut}`, { defaultValue: d.statut })}
                </span>
              </div>

              {/* Message laissé par la crèche lors du traitement */}
              {d.commentaire_admin && (
                <div className="demande__message">
                  <p className="demande__message-titre">💬 {t(`${D}.messageCreche`)}</p>
                  <p className="demande__message-texte">{d.commentaire_admin}</p>
                </div>
              )}

              {/* Dossier incomplet : ajout des documents manquants */}
              {d.statut === 'incomplet' && (
                <div className="demande__completer">
                  <p className="demande__completer-titre">⚠️ {t(`${D}.incompletTitre`)}</p>
                  <p className="demande__completer-texte">{t(`${D}.incompletTexte`)}</p>

                  <label className="demande__fichiers">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setFichiers(p => ({ ...p, [d.id]: Array.from(e.target.files) }))}
                    />
                    <span className="demande__fichiers-bouton">📎 {t(`${D}.choisir`)}</span>
                    <span className="demande__fichiers-aide">{t(`${D}.formats`)}</span>
                  </label>

                  {choisis.length > 0 && (
                    <ul className="demande__fichiers-liste">
                      {choisis.map(f => <li key={f.name}>📄 {f.name}</li>)}
                    </ul>
                  )}

                  <button
                    className="btn btn--primary"
                    disabled={choisis.length === 0 || envoiId === d.id}
                    onClick={() => envoyerDocuments(d)}
                  >
                    {envoiId === d.id ? t('common.enregistrement') : t(`${D}.envoyer`, { count: choisis.length })}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

// ── Page principale ───────────────────────────────────────────
const MesEnfants = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // ?demande=ID : demande à mettre en avant (lien de la notification / email)
  const [searchParams] = useSearchParams();
  const demandeCiblee  = searchParams.get('demande');
  // Liste des enfants du parent connecté
  const [enfants,    setEnfants]    = useState([]);
  // Masque la grille pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // true = formulaire d'ajout affiché en haut de la page
  const [modeAjout,  setModeAjout]  = useState(false);
  // Enfant actuellement en mode édition (null = aucun)
  const [enfantEdit, setEnfantEdit] = useState(null);

  useEffect(() => {
    chargerEnfants();
  }, []);

  // ── Chargement ou rechargement de la liste ────────────────
  const chargerEnfants = async () => {
    setChargement(true);
    try {
      const res = await api.get('/enfants');
      setEnfants(res.data.data || []);
    } catch { toast.error(t('common.erreurChargement')); }
    setChargement(false);
  };

  // ── Ajouter un enfant ─────────────────────────────────────
  // POST /enfants → ajoute en fin de liste
  const handleAjouter = async (form) => {
    try {
      const res = await api.post('/enfants', form);
      setEnfants(prev => [...prev, res.data.data]);
      setModeAjout(false);
      toast.success(t('parent.mesEnfants.toastAjoute'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('parent.mesEnfants.erreurAjout'));
    }
  };

  // ── Modifier un enfant ────────────────────────────────────
  // PUT /enfants/:id → remplace l'entrée dans la liste
  const handleModifier = async (form) => {
    try {
      const res = await api.put(`/enfants/${enfantEdit.id}`, form);
      setEnfants(prev => prev.map(e => e.id === enfantEdit.id ? res.data.data : e));
      setEnfantEdit(null);
      toast.success(t('parent.mesEnfants.toastModifie'));
    } catch {
      toast.error(t('parent.mesEnfants.erreurModif'));
    }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="p-chargement" />;

  return (
    <div className="mes-enfants">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.mesEnfants.titre" components={{ s: <span /> }} /></h1>
        {/* Bouton caché quand un formulaire est ouvert */}
        {!modeAjout && !enfantEdit && (
          <button className="btn btn--primary" onClick={() => setModeAjout(true)}>
            {t('parent.mesEnfants.ajouter')}
          </button>
        )}
      </div>

      {/* ── DEMANDES D'INSCRIPTION (statut + documents manquants) ─ */}
      <DemandesInscription demandeCiblee={demandeCiblee} />

      {/* ── FORMULAIRE D'AJOUT ────────────────────────────────── */}
      {modeAjout && (
        <div className="p-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className="p-card__titre">👶 {t('parent.mesEnfants.ajouterTitre')}</h2>
          <FormulaireEnfant onSave={handleAjouter} onAnnuler={() => setModeAjout(false)} />
        </div>
      )}

      {/* ── GRILLE DES ENFANTS ────────────────────────────────── */}
      {enfants.length === 0 && !modeAjout ? (
        <div className="p-vide">
          <span className="p-vide__icone">👶</span>
          <p>{t('parent.commun.aucunEnfant')}</p>
          <button className="btn btn--primary" onClick={() => setModeAjout(true)}>{t('parent.mesEnfants.premier')}</button>
        </div>
      ) : (
        <div className="enfants-grille">
          {enfants.map(enfant => (
            <div key={enfant.id}>
              {/* Si cet enfant est en mode édition : affiche le formulaire */}
              {enfantEdit?.id === enfant.id ? (
                <div className="p-card">
                  <h2 className="p-card__titre">✏️ {t('parent.mesEnfants.modifierTitre', { prenom: enfant.prenom })}</h2>
                  {/* Pré-rempli avec les données actuelles de l'enfant */}
                  <FormulaireEnfant initial={{
                    prenom: enfant.prenom, nom: enfant.nom,
                    date_naissance: enfant.date_naissance?.split('T')[0],
                    sexe: enfant.sexe, allergies: enfant.allergies || '',
                    medicaments: enfant.medicaments || '',
                    medecin_nom: enfant.medecin_nom || '', medecin_tel: enfant.medecin_tel || ''
                  }} onSave={handleModifier} onAnnuler={() => setEnfantEdit(null)} />
                </div>
              ) : (
                // Sinon : affiche la fiche de l'enfant
                <div className="enfant-fiche">
                  <div className="enfant-fiche__entete">
                    {/* Avatar emoji selon le sexe */}
                    <div className="enfant-fiche__avatar">{enfant.sexe === 'F' ? '👧' : '👦'}</div>
                    <div className="enfant-fiche__identite">
                      <h3>{enfant.prenom} {enfant.nom}</h3>
                      <p>{calculerAge(enfant.date_naissance)} · {t(`common.sexe.${enfant.sexe === 'F' ? 'F' : 'M'}`)}</p>
                      {enfant.groupe && <span className="enfant-groupe">{enfant.groupe}</span>}
                    </div>
                  </div>

                  {/* Badges santé (allergies et médicaments) */}
                  {(enfant.allergies || enfant.medicaments) && (
                    <div className="enfant-fiche__sante">
                      {enfant.allergies   && <p className="sante-item sante-allergie">⚠️ {enfant.allergies}</p>}
                      {enfant.medicaments && <p className="sante-item sante-medicament">💊 {enfant.medicaments}</p>}
                    </div>
                  )}

                  {/* Actions : Suivi | Inscription | Modifier */}
                  <div className="enfant-fiche__actions">
                    <Link to={`/parent/suivi/${enfant.id}`} className="btn btn--ghost btn--sm">{t('parent.mesEnfants.suivi')}</Link>
                    <Link to="/parent/inscription" className="btn btn--ghost btn--sm">{t('parent.mesEnfants.inscription')}</Link>
                    <button className="btn btn--outline btn--sm" onClick={() => setEnfantEdit(enfant)}>{t('parent.mesEnfants.modifier')}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MesEnfants;
