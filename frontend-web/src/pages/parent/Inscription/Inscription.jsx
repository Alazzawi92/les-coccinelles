// ============================================================
// FICHIER  : Inscription.jsx (parent)
// ROUTE    : /parent/inscription
// RÔLE     : Formulaire multi-étapes de demande d'inscription.
//            4 étapes : Enfant → Accueil → Commentaire → Récapitulatif.
//            Barre de progression avec cercles numérotés (✓ si validé).
//            Jours souhaités : stockés en chaîne CSV ("Lundi,Mardi,...").
//            Soumission via POST /inscriptions → redirige vers /parent/mes-enfants.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Inscription.css';

// Labels des 5 étapes affichés dans la barre de progression
const ETAPES = ['Enfant', 'Accueil', 'Documents', 'Commentaire', 'Récapitulatif'];

const PIECES = [
  { icone: '🪪', doc: "Numéro d'assuré social dont dépend l'enfant + photocopie justificative" },
  { icone: '💼', doc: "Profession et nom de l'employeur de chacun des parents" },
  { icone: '💳', doc: "Numéro d'Allocations Familiales (CAF PRO) + photocopie justificative" },
  { icone: '💉', doc: "Carnet de santé de l'enfant : vaccinations obligatoires et à jour" },
  { icone: '🏥', doc: "Nom et coordonnées du médecin traitant" },
  { icone: '📋', doc: "Certificat d'aptitude à la vie en collectivité" },
  { icone: '🛡️', doc: "Attestation de responsabilité civile à jour" },
  { icone: '📞', doc: "Nom, prénom, adresse et téléphone des personnes susceptibles de reprendre l'enfant" },
  { icone: '✍️', doc: "Les différents protocoles à signer" },
];

const Inscription = () => {
  // Indice de l'étape courante (0 à 3)
  const [etape,   setEtape]   = useState(0);
  // Liste des enfants du parent (chargée au montage pour l'étape 1)
  const [enfants, setEnfants] = useState([]);
  // Indicateur d'envoi pendant la requête POST /inscriptions
  const [envoi,   setEnvoi]   = useState(false);
  // Fichiers sélectionnés dans l'étape Documents (null = pas encore choisi)
  const [fichiers, setFichiers] = useState(PIECES.map(() => null));
  // Données du formulaire (partagées entre toutes les étapes)
  const [form,    setForm]    = useState({
    enfant_id: '', date_debut_souhaitee: '', jours_souhaites: '',
    temps_accueil: '', commentaire_parent: ''
  });

  const navigate = useNavigate();

  // ── Chargement des enfants du parent ─────────────────────
  useEffect(() => {
    api.get('/enfants').then(r => setEnfants(r.data.data || [])).catch(() => {});
  }, []);

  // ── Mise à jour partielle du formulaire ──────────────────
  // Permet de mettre à jour un ou plusieurs champs en une seule opération
  const majForm = (champs) => setForm(p => ({ ...p, ...champs }));

  // ── Soumission finale (étape 4) ───────────────────────────
  // POST /inscriptions → notification toast → redirection
  const handleSubmit = async () => {
    setEnvoi(true);
    try {
      const res = await api.post('/inscriptions', form);
      const inscriptionId = res.data.data?.id;

      // Upload des documents sélectionnés si au moins un fichier
      const aDesFichiers = fichiers.some(f => f !== null);
      if (inscriptionId && aDesFichiers) {
        const fd = new FormData();
        fichiers.forEach((f, i) => {
          if (f) {
            fd.append('fichiers', f);
            fd.append('labels', PIECES[i].doc);
          }
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

  // Enfant sélectionné (pour l'affichage dans le récapitulatif)
  const enfantSelectionne = enfants.find(e => e.id === parseInt(form.enfant_id));

  return (
    <div className="inscription-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Dossier <span>d'inscription</span></h1>
      </div>

      {/* ── BARRE DE PROGRESSION ──────────────────────────────── */}
      {/* Ligne d'avancement dont la largeur est proportionnelle à l'étape */}
      <div className="etapes-barre">
        {ETAPES.map((label, i) => (
          <div key={label} className={`etape-step ${i === etape ? 'etape-step--actif' : ''} ${i < etape ? 'etape-step--fait' : ''}`}>
            {/* Cercle : ✓ si étape passée, numéro sinon */}
            <div className="etape-step__cercle">{i < etape ? '✓' : i + 1}</div>
            <span className="etape-step__label">{label}</span>
          </div>
        ))}
        {/* Ligne de progression dynamique : 0% à 100% selon l'étape */}
        <div className="etapes-barre__ligne" style={{ width: `${(etape / (ETAPES.length - 1)) * 100}%` }} />
      </div>

      <div className="p-card inscription-contenu">

        {/* ── ÉTAPE 1 : SÉLECTION DE L'ENFANT ──────────────────── */}
        {etape === 0 && (
          <div className="etape-section">
            <h2 className="etape-titre">Quel enfant souhaitez-vous inscrire ?</h2>
            {enfants.length === 0 ? (
              <div className="p-vide">
                <span className="p-vide__icone">👶</span>
                <p>Vous devez d'abord ajouter un enfant.</p>
                <button className="btn btn--primary btn--sm" onClick={() => navigate('/parent/mes-enfants')}>Ajouter un enfant</button>
              </div>
            ) : (
              // Cartes radio : une par enfant
              <div className="enfants-choix">
                {enfants.map(enfant => (
                  <label key={enfant.id} className={`enfant-option ${form.enfant_id === String(enfant.id) ? 'enfant-option--selectionne' : ''}`}>
                    <input type="radio" name="enfant_id" value={enfant.id} checked={form.enfant_id === String(enfant.id)} onChange={e => majForm({ enfant_id: e.target.value })} />
                    <span className="enfant-option__icone">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                    <span className="enfant-option__nom">{enfant.prenom} {enfant.nom}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : MODALITÉS D'ACCUEIL ────────────────────── */}
        {etape === 1 && (
          <div className="etape-section">
            <h2 className="etape-titre">Modalités d'accueil souhaitées</h2>
            <div className="p-form">
              <div className="p-form-groupe">
                <label className="p-label">Date de début souhaitée <span className="requis">*</span></label>
                <input type="date" className="p-input" value={form.date_debut_souhaitee} onChange={e => majForm({ date_debut_souhaitee: e.target.value })} />
              </div>

              <div className="p-form-groupe">
                <label className="p-label">Type d'accueil <span className="requis">*</span></label>
                <select className="p-input" value={form.temps_accueil} onChange={e => majForm({ temps_accueil: e.target.value })}>
                  <option value="">Choisir...</option>
                  <option value="temps_plein">Temps plein (5 jours/semaine)</option>
                  <option value="temps_partiel">Temps partiel (2–3 jours/semaine)</option>
                  <option value="occasionnel">Occasionnel (selon disponibilités)</option>
                </select>
              </div>

              {/* Jours souhaités : stockés en CSV "Lundi,Mardi,..." */}
              <div className="p-form-groupe">
                <label className="p-label">Jours souhaités</label>
                <div className="jours-checkboxes">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(jour => {
                    // Sépare la chaîne CSV pour vérifier si le jour est coché
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

        {/* ── ÉTAPE 3 : PIÈCES À FOURNIR ───────────────────────── */}
        {etape === 2 && (
          <div className="etape-section">
            <h2 className="etape-titre">Pièces à fournir</h2>
            <p className="etape-intro">
              Déposez dès maintenant vos documents (PDF ou image). Vous pouvez aussi les apporter en mains propres lors de votre visite — cette étape est facultative.
            </p>
            <div className="pieces-liste">
              {PIECES.map((p, i) => (
                <div key={p.doc} className={`piece-item ${fichiers[i] ? 'piece-item--coche' : ''}`}>
                  <span className="piece-item__icone">{p.icone}</span>
                  <div className="piece-item__info">
                    <span className="piece-item__doc">{p.doc}</span>
                    {fichiers[i] && (
                      <span className="piece-item__fichier">📎 {fichiers[i].name}</span>
                    )}
                  </div>
                  <label className="piece-item__btn">
                    {fichiers[i] ? '🔄 Changer' : '📤 Choisir'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) setFichiers(prev => prev.map((v, j) => j === i ? f : v));
                      }}
                    />
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

        {/* ── ÉTAPE 4 : COMMENTAIRE ─────────────────────────────── */}
        {etape === 3 && (
          <div className="etape-section">
            <h2 className="etape-titre">Message à l'équipe (optionnel)</h2>
            <div className="p-form-groupe">
              <label className="p-label">Précisions, questions, situation particulière...</label>
              <textarea className="p-input p-textarea" rows={6} value={form.commentaire_parent} onChange={e => majForm({ commentaire_parent: e.target.value })} placeholder="Parlez-nous de votre enfant, de vos contraintes, de vos attentes..." />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 : RÉCAPITULATIF ───────────────────────────── */}
        {etape === 4 && (
          <div className="etape-section">
            <h2 className="etape-titre">Récapitulatif de votre demande</h2>
            {/* Grille résumé des choix des étapes précédentes */}
            <div className="recap-grille">
              <div className="recap-item"><strong>Enfant</strong><span>{enfantSelectionne?.prenom} {enfantSelectionne?.nom}</span></div>
              <div className="recap-item"><strong>Date souhaitée</strong><span>{form.date_debut_souhaitee ? new Date(form.date_debut_souhaitee).toLocaleDateString('fr-FR') : '—'}</span></div>
              <div className="recap-item"><strong>Type d'accueil</strong><span>{{ temps_plein: 'Temps plein', temps_partiel: 'Temps partiel', occasionnel: 'Occasionnel' }[form.temps_accueil] || '—'}</span></div>
              <div className="recap-item"><strong>Jours souhaités</strong><span>{form.jours_souhaites || '—'}</span></div>
              {form.commentaire_parent && <div className="recap-item recap-item--full"><strong>Message</strong><span>{form.commentaire_parent}</span></div>}
            </div>
            {/* Note d'information sur les délais de traitement */}
            <div className="recap-info">
              <span>ℹ️</span>
              <p>Votre demande sera examinée par l'équipe dans les meilleurs délais. Vous recevrez une notification dès qu'une décision sera prise.</p>
            </div>
          </div>
        )}

        {/* ── NAVIGATION ENTRE ÉTAPES ───────────────────────────── */}
        <div className="etape-nav">
          {/* Bouton "Retour" uniquement à partir de l'étape 2 */}
          {etape > 0 && (
            <button className="btn btn--ghost" onClick={() => setEtape(e => e - 1)}>← Retour</button>
          )}
          <div style={{ flex: 1 }} />
          {etape < ETAPES.length - 1 ? (
            <button
              className="btn btn--primary"
              onClick={() => setEtape(e => e + 1)}
              // Désactivé si aucun enfant sélectionné à l'étape 1
              disabled={etape === 0 && !form.enfant_id}
            >
              Continuer →
            </button>
          ) : (
            // Dernière étape : bouton de soumission finale
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
