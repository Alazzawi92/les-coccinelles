// ============================================================
// FICHIER  : MesEnfants.jsx (parent)
// ROUTE    : /parent/mes-enfants
// RÔLE     : Gestion des enfants du parent : liste + ajout + modification.
//            FormulaireEnfant : sous-composant réutilisable (ajout et édition).
//            Validation locale des champs obligatoires (prénom, nom, date, sexe).
//            Affiche sante badges (allergies ⚠️, médicaments 💊).
//            Liens : Suivi, Inscription, Modifier.
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './MesEnfants.css';

// ── Calcul de l'âge en mois ou en années ─────────────────────
// Utilisé dans la fiche enfant
const calculerAge = (dateNaissance) => {
  const naissance  = new Date(dateNaissance);
  const maintenant = new Date();
  const mois = (maintenant.getFullYear() - naissance.getFullYear()) * 12 + (maintenant.getMonth() - naissance.getMonth());
  return mois < 24 ? `${mois} mois` : `${Math.floor(mois / 12)} ans`;
};

// ── Sous-composant formulaire enfant ─────────────────────────
// Props : initial (objet enfant pour édition, null pour ajout)
//         onSave (callback appelé avec les données du formulaire)
//         onAnnuler (callback pour fermer le formulaire)
const FormulaireEnfant = ({ initial, onSave, onAnnuler }) => {
  // Objet vide utilisé pour l'ajout d'un nouvel enfant
  const vide = { prenom: '', nom: '', date_naissance: '', sexe: '', allergies: '', medicaments: '', medecin_nom: '', medecin_tel: '' };
  // Initialisé avec les valeurs existantes ou vide
  const [form,    setForm]    = useState(initial || vide);
  // Indicateur d'envoi pendant l'appel onSave (POST ou PUT)
  const [envoi,   setEnvoi]   = useState(false);
  // Erreurs de validation locale
  const [erreurs, setErreurs] = useState({});

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Validation locale des champs obligatoires ─────────────
  const valider = () => {
    const e = {};
    if (!form.prenom.trim())         e.prenom         = 'Prénom requis';
    if (!form.nom.trim())            e.nom            = 'Nom requis';
    if (!form.date_naissance)        e.date_naissance = 'Date de naissance requise';
    if (!form.sexe)                  e.sexe           = 'Sexe requis';
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

  return (
    <form className="p-form enfant-form" onSubmit={handleSubmit}>
      {/* Ligne prénom + nom */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">Prénom <span className="requis">*</span></label>
          <input name="prenom" className={`p-input ${erreurs.prenom ? 'p-input--erreur' : ''}`} value={form.prenom} onChange={handleChange} placeholder="Léa" />
          {erreurs.prenom && <p className="p-erreur">{erreurs.prenom}</p>}
        </div>
        <div className="p-form-groupe">
          <label className="p-label">Nom <span className="requis">*</span></label>
          <input name="nom" className={`p-input ${erreurs.nom ? 'p-input--erreur' : ''}`} value={form.nom} onChange={handleChange} placeholder="Dupont" />
          {erreurs.nom && <p className="p-erreur">{erreurs.nom}</p>}
        </div>
      </div>

      {/* Ligne date de naissance + sexe */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">Date de naissance <span className="requis">*</span></label>
          <input name="date_naissance" type="date" className={`p-input ${erreurs.date_naissance ? 'p-input--erreur' : ''}`} value={form.date_naissance} onChange={handleChange} />
          {erreurs.date_naissance && <p className="p-erreur">{erreurs.date_naissance}</p>}
        </div>
        <div className="p-form-groupe">
          <label className="p-label">Sexe <span className="requis">*</span></label>
          <select name="sexe" className={`p-input ${erreurs.sexe ? 'p-input--erreur' : ''}`} value={form.sexe} onChange={handleChange}>
            <option value="">Choisir...</option>
            <option value="F">Fille</option>
            <option value="M">Garçon</option>
          </select>
          {erreurs.sexe && <p className="p-erreur">{erreurs.sexe}</p>}
        </div>
      </div>

      {/* Santé : allergies */}
      <div className="p-form-groupe">
        <label className="p-label">Allergies connues</label>
        <textarea name="allergies" className="p-input p-textarea" rows={2} value={form.allergies} onChange={handleChange} placeholder="Ex : allergie aux arachides, intolérance au gluten..." />
      </div>

      {/* Santé : traitements en cours */}
      <div className="p-form-groupe">
        <label className="p-label">Traitements médicaux en cours</label>
        <textarea name="medicaments" className="p-input p-textarea" rows={2} value={form.medicaments} onChange={handleChange} placeholder="Ex : Ventoline si besoin..." />
      </div>

      {/* Médecin traitant (facultatif) */}
      <div className="p-form-row">
        <div className="p-form-groupe">
          <label className="p-label">Médecin traitant</label>
          <input name="medecin_nom" className="p-input" value={form.medecin_nom} onChange={handleChange} placeholder="Dr. Martin" />
        </div>
        <div className="p-form-groupe">
          <label className="p-label">Téléphone du médecin</label>
          <input name="medecin_tel" type="tel" className="p-input" value={form.medecin_tel} onChange={handleChange} placeholder="05 46 XX XX XX" />
        </div>
      </div>

      {/* Boutons annuler/sauvegarder */}
      <div className="enfant-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onAnnuler}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? 'Enregistrement...' : initial ? 'Modifier l\'enfant' : 'Ajouter l\'enfant'}
        </button>
      </div>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
const MesEnfants = () => {
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
    } catch { toast.error('Erreur lors du chargement'); }
    setChargement(false);
  };

  // ── Ajouter un enfant ─────────────────────────────────────
  // POST /enfants → ajoute en fin de liste
  const handleAjouter = async (form) => {
    try {
      const res = await api.post('/enfants', form);
      setEnfants(prev => [...prev, res.data.data]);
      setModeAjout(false);
      toast.success('Enfant ajouté !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  // ── Modifier un enfant ────────────────────────────────────
  // PUT /enfants/:id → remplace l'entrée dans la liste
  const handleModifier = async (form) => {
    try {
      const res = await api.put(`/enfants/${enfantEdit.id}`, form);
      setEnfants(prev => prev.map(e => e.id === enfantEdit.id ? res.data.data : e));
      setEnfantEdit(null);
      toast.success('Enfant mis à jour !');
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="mes-enfants">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Mes <span>enfants</span></h1>
        {/* Bouton caché quand un formulaire est ouvert */}
        {!modeAjout && !enfantEdit && (
          <button className="btn btn--primary" onClick={() => setModeAjout(true)}>
            + Ajouter un enfant
          </button>
        )}
      </div>

      {/* ── FORMULAIRE D'AJOUT ────────────────────────────────── */}
      {modeAjout && (
        <div className="p-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className="p-card__titre">👶 Ajouter un enfant</h2>
          <FormulaireEnfant onSave={handleAjouter} onAnnuler={() => setModeAjout(false)} />
        </div>
      )}

      {/* ── GRILLE DES ENFANTS ────────────────────────────────── */}
      {enfants.length === 0 && !modeAjout ? (
        <div className="p-vide">
          <span className="p-vide__icone">👶</span>
          <p>Vous n'avez pas encore d'enfant enregistré.</p>
          <button className="btn btn--primary" onClick={() => setModeAjout(true)}>Ajouter mon premier enfant</button>
        </div>
      ) : (
        <div className="enfants-grille">
          {enfants.map(enfant => (
            <div key={enfant.id}>
              {/* Si cet enfant est en mode édition : affiche le formulaire */}
              {enfantEdit?.id === enfant.id ? (
                <div className="p-card">
                  <h2 className="p-card__titre">✏️ Modifier {enfant.prenom}</h2>
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
                      <p>{calculerAge(enfant.date_naissance)} · {enfant.sexe === 'F' ? 'Fille' : 'Garçon'}</p>
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
                    <Link to={`/parent/suivi/${enfant.id}`} className="btn btn--ghost btn--sm">📊 Suivi</Link>
                    <Link to="/parent/inscription" className="btn btn--ghost btn--sm">📝 Inscription</Link>
                    <button className="btn btn--outline btn--sm" onClick={() => setEnfantEdit(enfant)}>✏️ Modifier</button>
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
