// ============================================================
// FICHIER  : Inscriptions.jsx (admin)
// ROUTE    : /admin/inscriptions
// RÔLE     : Gestion des dossiers d'inscription des enfants.
//            Tableau filtrable (texte + statut). Clic "Traiter"
//            ouvre une modal pour changer le statut et ajouter
//            un commentaire admin → PATCH /inscriptions/:id/statut.
//            Le parent reçoit une notification automatique.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Inscriptions.css';

// Tous les statuts possibles pour le filtre dropdown
const STATUTS = ['tous', 'en_attente', 'en_cours', 'incomplet', 'accepte', 'refuse', 'liste_attente'];

// Labels lisibles en français pour chaque statut
const STATUT_LABELS = {
  en_attente:    'En attente',
  en_cours:      'En cours',
  incomplet:     'Incomplet',
  accepte:       'Accepté',
  refuse:        'Refusé',
  liste_attente: 'Liste d\'attente'
};

const Inscriptions = () => {
  // Liste complète des dossiers d'inscription chargés depuis l'API
  const [inscriptions,  setInscriptions]  = useState([]);
  // Recherche textuelle : filtre sur nom enfant, nom parent, email
  const [filtre,        setFiltre]        = useState('');
  // Filtre par statut : 'tous' ou l'une des valeurs de STATUTS
  const [statutFil,     setStatutFil]     = useState('tous');
  // Masque le tableau pendant le premier chargement
  const [chargement,    setChargement]    = useState(true);
  // Dossier ouvert dans la modal de traitement (null = modal fermée)
  const [selected,      setSelected]      = useState(null);
  // Statut choisi dans la modal avant validation
  const [nouveauStatut, setNouveauStatut] = useState('');
  // Commentaire interne saisi par l'admin dans la modal
  const [commentaire,   setCommentaire]   = useState('');
  // Indicateur d'envoi pendant la requête PATCH
  const [envoi,         setEnvoi]         = useState(false);
  // Documents justificatifs du dossier sélectionné
  const [documents,     setDocuments]     = useState([]);
  const [chargeDocs,    setChargeDocs]    = useState(false);

  // ── Chargement de tous les dossiers au montage ───────────
  useEffect(() => {
    api.get('/inscriptions')
      .then(r => setInscriptions(r.data.data || []))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setChargement(false));
  }, []);

  // ── Ouverture de la modal de traitement ──────────────────
  // Pré-remplit le statut actuel et le commentaire admin existant
  const ouvrirDossier = (insc) => {
    setSelected(insc);
    setNouveauStatut(insc.statut);
    setCommentaire(insc.commentaire_admin || '');
    // Charger les documents justificatifs du dossier
    setDocuments([]);
    setChargeDocs(true);
    api.get(`/inscriptions/${insc.id}/documents`)
      .then(r => setDocuments(r.data.data || []))
      .catch(() => setDocuments([]))
      .finally(() => setChargeDocs(false));
  };

  // ── Validation de la décision admin ──────────────────────
  // PATCH /inscriptions/:id/statut avec le nouveau statut + commentaire
  const traiterDossier = async () => {
    setEnvoi(true);
    try {
      await api.patch(`/inscriptions/${selected.id}/statut`, {
        statut:            nouveauStatut,
        commentaire_admin: commentaire
      });
      // Mise à jour optimiste du tableau sans rechargement global
      setInscriptions(prev => prev.map(i =>
        i.id === selected.id
          ? { ...i, statut: nouveauStatut, commentaire_admin: commentaire }
          : i
      ));
      setSelected(null);
      toast.success('Dossier mis à jour');
    } catch { toast.error('Erreur mise à jour'); }
    setEnvoi(false);
  };

  // ── Filtrage combiné (texte + statut) ────────────────────
  const filtrees = inscriptions.filter(i =>
    (statutFil === 'tous' || i.statut === statutFil) &&
    (i.enfant?.prenom?.toLowerCase().includes(filtre.toLowerCase()) ||
     i.parent?.nom?.toLowerCase().includes(filtre.toLowerCase()) ||
     i.parent?.email?.toLowerCase().includes(filtre.toLowerCase()))
  );

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>inscriptions</span></h1>
        <span className="admin-compteur">{filtrees.length} dossier(s)</span>
      </div>

      {/* ── FILTRES : RECHERCHE + STATUT ──────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input placeholder="Rechercher par enfant ou parent..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        </div>
        <select className="a-select" value={statutFil} onChange={e => setStatutFil(e.target.value)}>
          <option value="tous">Tous les statuts</option>
          {/* Slice(1) pour exclure 'tous' de la liste d'options */}
          {STATUTS.slice(1).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
      </div>

      {/* ── TABLEAU DES DOSSIERS ──────────────────────────────── */}
      <div className="a-card">
        {filtrees.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📝</span><p>Aucun dossier trouvé.</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Parent</th>
                <th>Type</th>
                <th>Date souhaitée</th>
                <th>Statut</th>
                <th>Soumis le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(insc => (
                <tr key={insc.id}>
                  <td><strong>{insc.enfant?.prenom} {insc.enfant?.nom}</strong></td>
                  <td>
                    <p>{insc.parent?.prenom} {insc.parent?.nom}</p>
                    <p style={{ fontSize:'0.78rem', color:'var(--text-gray)' }}>{insc.parent?.email}</p>
                  </td>
                  {/* Type d'accueil : traduit depuis la valeur en base */}
                  <td style={{ fontSize:'0.85rem' }}>
                    {{ temps_plein:'Temps plein', temps_partiel:'Temps partiel', occasionnel:'Occasionnel' }[insc.temps_accueil] || '—'}
                  </td>
                  <td style={{ fontSize:'0.85rem' }}>
                    {insc.date_debut_souhaitee ? new Date(insc.date_debut_souhaitee).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  {/* Badge statut : couleur définie par s-badge--{statut} dans admin.css */}
                  <td><span className={`s-badge s-badge--${insc.statut}`}>{STATUT_LABELS[insc.statut]}</span></td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-gray)' }}>
                    {new Date(insc.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <button className="btn btn--primary btn--sm" onClick={() => ouvrirDossier(insc)}>Traiter</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL TRAITEMENT DOSSIER ──────────────────────────── */}
      {/* Clic overlay ferme la modal sans sauvegarder */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2 className="modal__titre">📝 Dossier de {selected.enfant?.prenom} {selected.enfant?.nom}</h2>
              <button className="modal__fermer" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* ── INFORMATIONS DEMANDE ─────────────────────────── */}
            <div className="dossier-section">
              <h3 className="dossier-section__titre">📋 Demande d'accueil</h3>
              <div className="dossier-grille">
                <div className="detail-item"><span className="detail-label">Enfant</span><span className="detail-valeur">{selected.enfant?.prenom} {selected.enfant?.nom}</span></div>
                <div className="detail-item"><span className="detail-label">Type d'accueil</span><span className="detail-valeur">{{ temps_plein:'Temps plein', temps_partiel:'Temps partiel', occasionnel:'Occasionnel' }[selected.temps_accueil] || '—'}</span></div>
                <div className="detail-item"><span className="detail-label">Date souhaitée</span><span className="detail-valeur">{selected.date_debut_souhaitee ? new Date(selected.date_debut_souhaitee).toLocaleDateString('fr-FR') : '—'}</span></div>
                <div className="detail-item"><span className="detail-label">Jours souhaités</span><span className="detail-valeur">{selected.jours_souhaites || '—'}</span></div>
                {selected.commentaire_parent && (
                  <div className="detail-item detail-item--full"><span className="detail-label">Message du parent</span><span className="detail-valeur">{selected.commentaire_parent}</span></div>
                )}
              </div>
            </div>

            {/* ── PRÉ-INSCRIPTION ──────────────────────────────── */}
            {selected.preinscription && (() => {
              const pi = selected.preinscription;
              return (
                <>
                  {/* Parents */}
                  <div className="dossier-section">
                    <h3 className="dossier-section__titre">👤 Parents</h3>
                    <div className="dossier-parents">
                      {[['parent1', 'Parent 1'], ['parent2', 'Parent 2']].map(([cle, lbl]) => (
                        pi[cle]?.nom ? (
                          <div key={cle} className="dossier-parent-bloc">
                            <p className="dossier-parent-bloc__titre">{lbl}</p>
                            <div className="dossier-grille dossier-grille--compact">
                              <div className="detail-item"><span className="detail-label">Nom complet</span><span className="detail-valeur">{pi[cle].prenom} {pi[cle].nom}</span></div>
                              <div className="detail-item"><span className="detail-label">Téléphone</span><span className="detail-valeur">{pi[cle].telephone || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">Email</span><span className="detail-valeur">{pi[cle].email || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">Situation familiale</span><span className="detail-valeur">{pi[cle].situation_familiale || '—'}</span></div>
                              <div className="detail-item detail-item--full"><span className="detail-label">Adresse</span><span className="detail-valeur">{pi[cle].adresse || '—'}</span></div>
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>

                  {/* Employeurs */}
                  {(pi.employeur1?.profession || pi.employeur2?.profession) && (
                    <div className="dossier-section">
                      <h3 className="dossier-section__titre">💼 Profession & employeur</h3>
                      <div className="dossier-grille">
                        {pi.employeur1?.profession && <>
                          <div className="detail-item"><span className="detail-label">Profession — Parent 1</span><span className="detail-valeur">{pi.employeur1.profession}</span></div>
                          <div className="detail-item"><span className="detail-label">Employeur — Parent 1</span><span className="detail-valeur">{pi.employeur1.nom_employeur || '—'}</span></div>
                        </>}
                        {pi.employeur2?.profession && <>
                          <div className="detail-item"><span className="detail-label">Profession — Parent 2</span><span className="detail-valeur">{pi.employeur2.profession}</span></div>
                          <div className="detail-item"><span className="detail-label">Employeur — Parent 2</span><span className="detail-valeur">{pi.employeur2.nom_employeur || '—'}</span></div>
                        </>}
                      </div>
                    </div>
                  )}

                  {/* Fratrie + RPE */}
                  <div className="dossier-section">
                    <h3 className="dossier-section__titre">👨‍👩‍👧‍👦 Famille</h3>
                    <div className="dossier-grille">
                      <div className="detail-item"><span className="detail-label">Place dans la fratrie</span><span className="detail-valeur">{pi.place_fratrie || '—'}</span></div>
                      <div className="detail-item"><span className="detail-label">Autorisation RPE</span><span className="detail-valeur">{pi.autorisation_rpe ? '✅ Oui' : '❌ Non'}</span></div>
                    </div>
                  </div>

                  {/* Contacts d'urgence */}
                  <div className="dossier-section">
                    <h3 className="dossier-section__titre">🚨 Personnes à contacter en cas d'urgence</h3>
                    <div className="dossier-parents">
                      {[['contact1', 'Contact n°1'], ['contact2', 'Contact n°2']].map(([cle, lbl]) => (
                        pi[cle]?.nom ? (
                          <div key={cle} className="dossier-parent-bloc dossier-parent-bloc--urgence">
                            <p className="dossier-parent-bloc__titre">{lbl}</p>
                            <div className="dossier-grille dossier-grille--compact">
                              <div className="detail-item"><span className="detail-label">Nom complet</span><span className="detail-valeur">{pi[cle].prenom} {pi[cle].nom}</span></div>
                              <div className="detail-item"><span className="detail-label">Lien de parenté</span><span className="detail-valeur">{pi[cle].parente || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">Téléphone</span><span className="detail-valeur">{pi[cle].telephone || '—'}</span></div>
                              <div className="detail-item detail-item--full"><span className="detail-label">Adresse</span><span className="detail-valeur">{pi[cle].adresse || '—'}</span></div>
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── DOCUMENTS JUSTIFICATIFS ───────────────────────── */}
            <div className="dossier-docs">
              <h3 className="dossier-docs__titre">📎 Pièces justificatives</h3>
              {chargeDocs ? (
                <p className="dossier-docs__vide">Chargement...</p>
              ) : documents.length === 0 ? (
                <p className="dossier-docs__vide">Aucun document déposé par le parent.</p>
              ) : (
                <div className="dossier-docs__liste">
                  {documents.map(doc => {
                    const estPdf = doc.fichier_nom?.toLowerCase().endsWith('.pdf');
                    return (
                      <a
                        key={doc.id}
                        href={`http://localhost:3002${doc.fichier_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-item"
                      >
                        <span className="doc-item__icone">{estPdf ? '📄' : '🖼️'}</span>
                        <div className="doc-item__info">
                          <span className="doc-item__label">{doc.label}</span>
                          <span className="doc-item__nom">{doc.fichier_nom}</span>
                        </div>
                        <span className="doc-item__dl">↓</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Zone de décision : sélection du nouveau statut + commentaire */}
            <div className="dossier-actions">
              <div className="a-form-groupe">
                <label className="a-label">Nouveau statut</label>
                <select className="a-input" value={nouveauStatut} onChange={e => setNouveauStatut(e.target.value)}>
                  {STATUTS.slice(1).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="a-form-groupe">
                <label className="a-label">Note interne (facultatif)</label>
                {/* Commentaire visible uniquement par l'équipe, jamais par le parent */}
                <textarea className="a-input a-textarea" value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Commentaire visible uniquement par l'équipe..." />
              </div>
              <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                <button className="btn btn--ghost" onClick={() => setSelected(null)}>Annuler</button>
                <button className="btn btn--primary" onClick={traiterDossier} disabled={envoi}>
                  {envoi ? 'Mise à jour...' : '✅ Valider la décision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inscriptions;
