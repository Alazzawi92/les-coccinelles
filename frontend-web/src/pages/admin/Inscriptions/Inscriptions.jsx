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
import { useTranslation, Trans } from 'react-i18next';
import api, { BACKEND_URL } from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Inscriptions.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

// Tous les statuts possibles pour le filtre dropdown
const STATUTS = ['tous', 'en_attente', 'en_cours', 'incomplet', 'accepte', 'refuse', 'liste_attente'];

// Valeurs stockées en base par la fiche de pré-inscription (en français) :
// on retrouve leur position pour afficher le libellé traduit
const FRATRIEOPT    = ['1er enfant', '2ème enfant', '3ème enfant', '4ème enfant ou plus'];
const JOURS_ACCUEIL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const Inscriptions = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // Libellés traduits des valeurs stockées en base
  const libelleStatut    = (s) => t(`common.statutInscription.${s}`, { defaultValue: s });
  const libelleType      = (v) => (v ? t(`common.typeAccueil.${v}`, { defaultValue: v }) : '—');
  const libelleFratrie   = (v) => { const i = FRATRIEOPT.indexOf(v); return i >= 0 ? t(`parent.inscription.fratrie.${i}`) : (v || '—'); };
  const libelleSituation = (v) => (v ? t(`parent.inscription.situations.${v}`, { defaultValue: v }) : '—');
  const libelleJours     = (v) => (v ? v.split(',').map(j => JOURS_ACCUEIL.includes(j) ? t(`common.jours.${j.toLowerCase()}`) : j).join(', ') : '—');
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
      .catch(() => toast.error(t('admin.inscriptions.erreurChargement')))
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
      toast.success(t('admin.inscriptions.toastMaj'));
    } catch { toast.error(t('admin.inscriptions.erreurMaj')); }
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
  if (chargement) return <Chargement className="a-chargement" />;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.inscriptions.titre" components={{ s: <span /> }} /></h1>
        <span className="admin-compteur">{t('admin.inscriptions.compteur', { count: filtrees.length })}</span>
      </div>

      {/* ── FILTRES : RECHERCHE + STATUT ──────────────────────── */}
      <div className="a-filtres">
        <div className="a-recherche">
          <span className="a-recherche__icone">🔍</span>
          <input placeholder={t('admin.inscriptions.recherche')} value={filtre} onChange={e => setFiltre(e.target.value)} />
        </div>
        <select className="a-select" value={statutFil} onChange={e => setStatutFil(e.target.value)}>
          <option value="tous">{t('admin.inscriptions.tousStatuts')}</option>
          {/* Slice(1) pour exclure 'tous' de la liste d'options */}
          {STATUTS.slice(1).map(s => <option key={s} value={s}>{libelleStatut(s)}</option>)}
        </select>
      </div>

      {/* ── TABLEAU DES DOSSIERS ──────────────────────────────── */}
      <div className="a-card">
        {filtrees.length === 0 ? (
          <div className="a-vide"><span className="a-vide__icone">📝</span><p>{t('admin.inscriptions.aucun')}</p></div>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>{t('admin.commun.colEnfant')}</th>
                <th>{t('admin.commun.colParent')}</th>
                <th>{t('admin.inscriptions.colType')}</th>
                <th>{t('admin.inscriptions.colDate')}</th>
                <th>{t('admin.commun.colStatut')}</th>
                <th>{t('admin.inscriptions.colSoumis')}</th>
                <th>{t('admin.commun.colActions')}</th>
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
                    {libelleType(insc.temps_accueil)}
                  </td>
                  <td style={{ fontSize:'0.85rem' }}>
                    {insc.date_debut_souhaitee ? new Date(insc.date_debut_souhaitee).toLocaleDateString(getLocale()) : '—'}
                  </td>
                  {/* Badge statut : couleur définie par s-badge--{statut} dans admin.css */}
                  <td><span className={`s-badge s-badge--${insc.statut}`}>{libelleStatut(insc.statut)}</span></td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-gray)' }}>
                    {new Date(insc.created_at).toLocaleDateString(getLocale())}
                  </td>
                  <td>
                    <button className="btn btn--primary btn--sm" onClick={() => ouvrirDossier(insc)}>{t('admin.inscriptions.traiter')}</button>
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
              <h2 className="modal__titre">📝 {t('admin.inscriptions.modalTitre', { nom: `${selected.enfant?.prenom} ${selected.enfant?.nom}` })}</h2>
              <button className="modal__fermer" onClick={() => setSelected(null)} aria-label={t('common.fermer')}>✕</button>
            </div>

            {/* ── INFORMATIONS DEMANDE ─────────────────────────── */}
            <div className="dossier-section">
              <h3 className="dossier-section__titre">📋 {t('admin.inscriptions.demande')}</h3>
              <div className="dossier-grille">
                <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.enfant')}</span><span className="detail-valeur">{selected.enfant?.prenom} {selected.enfant?.nom}</span></div>
                <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.typeAccueil')}</span><span className="detail-valeur">{libelleType(selected.temps_accueil)}</span></div>
                <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.dateSouhaitee')}</span><span className="detail-valeur">{selected.date_debut_souhaitee ? new Date(selected.date_debut_souhaitee).toLocaleDateString(getLocale()) : '—'}</span></div>
                <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.joursSouhaites')}</span><span className="detail-valeur">{libelleJours(selected.jours_souhaites)}</span></div>
                {selected.commentaire_parent && (
                  <div className="detail-item detail-item--full"><span className="detail-label">{t('admin.inscriptions.messageParent')}</span><span className="detail-valeur">{selected.commentaire_parent}</span></div>
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
                    <h3 className="dossier-section__titre">👤 {t('admin.inscriptions.parents')}</h3>
                    <div className="dossier-parents">
                      {[['parent1', t('admin.inscriptions.parent1')], ['parent2', t('admin.inscriptions.parent2')]].map(([cle, lbl]) => (
                        pi[cle]?.nom ? (
                          <div key={cle} className="dossier-parent-bloc">
                            <p className="dossier-parent-bloc__titre">{lbl}</p>
                            <div className="dossier-grille dossier-grille--compact">
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.nomComplet')}</span><span className="detail-valeur">{pi[cle].prenom} {pi[cle].nom}</span></div>
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.telephone')}</span><span className="detail-valeur">{pi[cle].telephone || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.email')}</span><span className="detail-valeur">{pi[cle].email || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.situation')}</span><span className="detail-valeur">{libelleSituation(pi[cle].situation_familiale)}</span></div>
                              <div className="detail-item detail-item--full"><span className="detail-label">{t('admin.inscriptions.adresse')}</span><span className="detail-valeur">{pi[cle].adresse || '—'}</span></div>
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>

                  {/* Employeurs */}
                  {(pi.employeur1?.profession || pi.employeur2?.profession) && (
                    <div className="dossier-section">
                      <h3 className="dossier-section__titre">💼 {t('admin.inscriptions.professionTitre')}</h3>
                      <div className="dossier-grille">
                        {pi.employeur1?.profession && <>
                          <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.professionParent', { parent: t('admin.inscriptions.parent1') })}</span><span className="detail-valeur">{pi.employeur1.profession}</span></div>
                          <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.employeurParent', { parent: t('admin.inscriptions.parent1') })}</span><span className="detail-valeur">{pi.employeur1.nom_employeur || '—'}</span></div>
                        </>}
                        {pi.employeur2?.profession && <>
                          <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.professionParent', { parent: t('admin.inscriptions.parent2') })}</span><span className="detail-valeur">{pi.employeur2.profession}</span></div>
                          <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.employeurParent', { parent: t('admin.inscriptions.parent2') })}</span><span className="detail-valeur">{pi.employeur2.nom_employeur || '—'}</span></div>
                        </>}
                      </div>
                    </div>
                  )}

                  {/* Fratrie + RPE */}
                  <div className="dossier-section">
                    <h3 className="dossier-section__titre">👨‍👩‍👧‍👦 {t('admin.inscriptions.famille')}</h3>
                    <div className="dossier-grille">
                      <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.fratrie')}</span><span className="detail-valeur">{libelleFratrie(pi.place_fratrie)}</span></div>
                      <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.rpe')}</span><span className="detail-valeur">{pi.autorisation_rpe ? t('admin.inscriptions.oui') : t('admin.inscriptions.non')}</span></div>
                    </div>
                  </div>

                  {/* Contacts d'urgence */}
                  <div className="dossier-section">
                    <h3 className="dossier-section__titre">🚨 {t('admin.inscriptions.urgence')}</h3>
                    <div className="dossier-parents">
                      {[['contact1', t('admin.inscriptions.contact1')], ['contact2', t('admin.inscriptions.contact2')]].map(([cle, lbl]) => (
                        pi[cle]?.nom ? (
                          <div key={cle} className="dossier-parent-bloc dossier-parent-bloc--urgence">
                            <p className="dossier-parent-bloc__titre">{lbl}</p>
                            <div className="dossier-grille dossier-grille--compact">
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.nomComplet')}</span><span className="detail-valeur">{pi[cle].prenom} {pi[cle].nom}</span></div>
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.parente')}</span><span className="detail-valeur">{pi[cle].parente || '—'}</span></div>
                              <div className="detail-item"><span className="detail-label">{t('admin.inscriptions.telephone')}</span><span className="detail-valeur">{pi[cle].telephone || '—'}</span></div>
                              <div className="detail-item detail-item--full"><span className="detail-label">{t('admin.inscriptions.adresse')}</span><span className="detail-valeur">{pi[cle].adresse || '—'}</span></div>
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
              <h3 className="dossier-docs__titre">📎 {t('admin.inscriptions.pieces')}</h3>
              {chargeDocs ? (
                <p className="dossier-docs__vide">{t('common.chargement')}</p>
              ) : documents.length === 0 ? (
                <p className="dossier-docs__vide">{t('admin.inscriptions.aucunePiece')}</p>
              ) : (
                <div className="dossier-docs__liste">
                  {documents.map(doc => {
                    const estPdf = doc.fichier_nom?.toLowerCase().endsWith('.pdf');
                    return (
                      <a
                        key={doc.id}
                        href={`${BACKEND_URL}${doc.fichier_path}`}
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
                <label className="a-label">{t('admin.inscriptions.nouveauStatut')}</label>
                <select className="a-input" value={nouveauStatut} onChange={e => setNouveauStatut(e.target.value)}>
                  {STATUTS.slice(1).map(s => <option key={s} value={s}>{libelleStatut(s)}</option>)}
                </select>
              </div>
              <div className="a-form-groupe">
                <label className="a-label">{t('admin.inscriptions.note')}</label>
                {/* Commentaire visible uniquement par l'équipe, jamais par le parent */}
                <textarea className="a-input a-textarea" value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder={t('admin.inscriptions.notePlaceholder')} />
              </div>
              <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                <button className="btn btn--ghost" onClick={() => setSelected(null)}>{t('common.annuler')}</button>
                <button className="btn btn--primary" onClick={traiterDossier} disabled={envoi}>
                  {envoi ? t('common.miseAJour') : t('admin.inscriptions.valider')}
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
