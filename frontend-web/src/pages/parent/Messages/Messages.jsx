// ============================================================
// FICHIER  : Messages.jsx (parent)
// ROUTE    : /parent/messages
// RÔLE     : Messagerie privée parent ↔ équipe de la crèche.
//            Layout 2 colonnes : liste conversations | détail.
//            PieceJointe : sous-composant — détecte image vs document.
//            chargerDetail : marque automatiquement lu si destinataire.
//            envoyerNouveauMessage : FormData multipart, fichier optionnel.
//            envoyerReponse : contenu = reponse || '📎' si pièce jointe seule.
//            3 refs : finRef (auto-scroll), fileRef, fileRepRef.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Messages.css';

// URL de base du serveur pour construire les chemins des pièces jointes
const BACKEND = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002';

// ── Sous-composant : affichage d'une pièce jointe ────────────
// Vérifie l'extension pour rendre une image inline ou un lien document
const PieceJointe = ({ pj, nom }) => {
  if (!pj) return null;
  const url      = `${BACKEND}${pj}`;
  const estImage = /\.(jpg|jpeg|png|webp)$/i.test(pj);
  if (estImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="pj-bulle">
        <img src={url} alt={nom || 'image'} className="pj-bulle__img" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pj-bulle pj-bulle--doc">
      📄 <span>{nom || 'Document'}</span>
    </a>
  );
};

const Messages = () => {
  const { user }              = useAuth();
  // Liste des fils de conversation du parent (triés par date desc)
  const [conversations, setConversations] = useState([]);
  // Conversation sélectionnée dans la liste (null = rien sélectionné)
  const [selectionne,   setSelectionne]   = useState(null);
  // Détail de la conversation sélectionnée avec ses réponses imbriquées
  const [detail,        setDetail]        = useState(null);
  // Masque le layout pendant le chargement initial
  const [chargement,    setChargement]    = useState(true);
  // true = affiche le modal "Nouveau message"
  const [nouveauMsg,    setNouveauMsg]    = useState(false);
  // Valeurs du formulaire de nouveau message
  const [form,          setForm]          = useState({ sujet: '', contenu: '', destinataire_id: '' });
  // Pièce jointe du nouveau message
  const [fichier,       setFichier]       = useState(null);
  // Pièce jointe de la réponse
  const [fichierRep,    setFichierRep]    = useState(null);
  // Liste des membres de l'équipe (admins) pour le sélecteur de destinataire
  const [admins,        setAdmins]        = useState([]);
  // Texte saisi dans la zone de réponse
  const [reponse,       setReponse]       = useState('');
  // Indicateur d'envoi en cours (désactive le bouton pendant la requête)
  const [envoi,         setEnvoi]         = useState(false);
  // Ref pour auto-scroll en bas du fil de messages après chargement
  const finRef     = useRef(null);
  // Ref sur l'input file du nouveau message
  const fileRef    = useRef(null);
  // Ref sur l'input file de la zone de réponse
  const fileRepRef = useRef(null);

  // ── Chargement initial : conversations + liste des admins ─
  useEffect(() => {
    chargerConversations();
    api.get('/users/admins').then(r => setAdmins(r.data.data || [])).catch(() => {});
  }, []);

  // ── Recharger le détail quand une conversation est sélectionnée ─
  useEffect(() => {
    if (selectionne) chargerDetail(selectionne.id);
  }, [selectionne]);

  // ── Auto-scroll en bas du fil après chaque mise à jour du détail ─
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail]);

  // ── Charger la liste des conversations ───────────────────
  // GET /messages → liste paginée par date desc
  const chargerConversations = async () => {
    try {
      const res = await api.get('/messages');
      setConversations(res.data.data || []);
    } catch {}
    setChargement(false);
  };

  // ── Charger le détail d'une conversation ─────────────────
  // GET /messages/:id → message + réponses imbriquées
  // Marque automatiquement comme lu si l'utilisateur est le destinataire
  const chargerDetail = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      setDetail(res.data.data);
      if (!res.data.data?.lu && res.data.data?.destinataire_id === user.id) {
        await api.patch(`/messages/${id}/lu`);
        // Synchronise l'indicateur non-lu dans la liste
        setConversations(prev => prev.map(c => c.id === id ? { ...c, lu: true } : c));
      }
    } catch {}
  };

  // ── Fermer et réinitialiser le modal nouveau message ─────
  const fermerModal = () => {
    setNouveauMsg(false);
    setForm({ sujet: '', contenu: '', destinataire_id: '' });
    setFichier(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Envoyer un nouveau message ────────────────────────────
  // POST /messages avec FormData multipart (fichier optionnel)
  const envoyerNouveauMessage = async (e) => {
    e.preventDefault();
    if (!form.destinataire_id) { toast.error('Choisissez un destinataire'); return; }
    setEnvoi(true);
    try {
      const fd = new FormData();
      fd.append('sujet', form.sujet);
      fd.append('contenu', form.contenu);
      fd.append('destinataire_id', form.destinataire_id);
      if (fichier) fd.append('fichier', fichier);
      await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const admin = admins.find(a => a.id === Number(form.destinataire_id));
      toast.success(`Message envoyé à ${admin?.prenom} ${admin?.nom}`);
      fermerModal();
      chargerConversations();
    } catch { toast.error("Erreur lors de l'envoi"); }
    setEnvoi(false);
  };

  // ── Envoyer une réponse à la conversation ouverte ─────────
  // POST /messages avec parent_id → rattaché au fil parent
  // contenu = reponse || '📎' si la réponse est une pièce jointe seule
  const envoyerReponse = async (e) => {
    e.preventDefault();
    if (!reponse.trim() && !fichierRep) return;
    setEnvoi(true);
    try {
      const fd = new FormData();
      fd.append('sujet', `Re: ${detail?.sujet}`);
      fd.append('contenu', reponse || '📎');
      // Destinataire = l'autre participant de la conversation
      fd.append('destinataire_id', detail?.expediteur_id === user.id ? detail?.destinataire_id : detail?.expediteur_id);
      fd.append('parent_id', detail?.id);
      if (fichierRep) fd.append('fichier', fichierRep);
      await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReponse('');
      setFichierRep(null);
      if (fileRepRef.current) fileRepRef.current.value = '';
      // Recharger le fil pour afficher la nouvelle réponse
      chargerDetail(detail.id);
    } catch { toast.error("Erreur lors de l'envoi"); }
    setEnvoi(false);
  };

  // Formatage court : "1 janv. 14:30"
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Garde : spinner pendant le chargement initial
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="messages-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Ma <span>messagerie</span></h1>
        <button className="btn btn--primary btn--sm" onClick={() => setNouveauMsg(true)}>✉️ Nouveau message</button>
      </div>

      {/* ── MODAL NOUVEAU MESSAGE ─────────────────────────────── */}
      {nouveauMsg && (
        <div className="modal-overlay" onClick={fermerModal}>
          {/* stopPropagation empêche la fermeture au clic sur le contenu */}
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__entete">
              <h2>✉️ Nouveau message</h2>
              <button className="modal__fermer" onClick={fermerModal}>✕</button>
            </div>
            <form className="p-form" onSubmit={envoyerNouveauMessage}>
              {/* Sélecteur destinataire parmi les membres de l'équipe */}
              <div className="p-form-groupe">
                <label className="p-label">Destinataire <span className="requis">*</span></label>
                <select
                  className="p-input"
                  value={form.destinataire_id}
                  onChange={e => setForm(p => ({ ...p, destinataire_id: e.target.value }))}
                  required
                >
                  <option value="">— Choisir un membre de l'équipe —</option>
                  {admins.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.prenom} {a.nom}{a.role === 'super_admin' ? ' (Directrice)' : ' (Éducatrice)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Sujet <span className="requis">*</span></label>
                <input className="p-input" value={form.sujet} onChange={e => setForm(p => ({...p, sujet: e.target.value}))} placeholder="Objet de votre message..." required />
              </div>
              <div className="p-form-groupe">
                <label className="p-label">Message <span className="requis">*</span></label>
                <textarea className="p-input p-textarea" rows={4} value={form.contenu} onChange={e => setForm(p => ({...p, contenu: e.target.value}))} placeholder="Écrivez votre message..." required />
              </div>
              {/* Pièce jointe optionnelle : image ou PDF */}
              <div className="p-form-groupe">
                <label className="p-label">Pièce jointe <span className="p-label--opt">(photo ou PDF, max 10 Mo)</span></label>
                <div className="pj-zone">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="pj-input"
                    onChange={e => setFichier(e.target.files[0] || null)}
                  />
                  {fichier && (
                    <div className="pj-apercu">
                      {/* Prévisualisation si c'est une image */}
                      {fichier.type.startsWith('image/') && (
                        <img src={URL.createObjectURL(fichier)} alt="" className="pj-apercu__img" />
                      )}
                      <span className="pj-apercu__nom">{fichier.name}</span>
                      <button type="button" className="pj-apercu__sup" onClick={() => { setFichier(null); fileRef.current.value = ''; }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={fermerModal}>Annuler</button>
                <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? 'Envoi...' : 'Envoyer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LAYOUT 2 COLONNES : liste | détail ───────────────── */}
      <div className="messagerie-layout">

        {/* ── LISTE DES CONVERSATIONS ───────────────────────── */}
        <div className="conversations-liste">
          {conversations.length === 0 ? (
            <div className="p-vide" style={{ padding: 'var(--space-xl)' }}>
              <span className="p-vide__icone">✉️</span>
              <p style={{ fontSize: '0.9rem' }}>Aucun message</p>
            </div>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              // conv-item--actif si sélectionné, conv-item--nonlu si non lu et destinataire
              className={`conv-item ${selectionne?.id === conv.id ? 'conv-item--actif' : ''} ${!conv.lu && conv.destinataire_id === user.id ? 'conv-item--nonlu' : ''}`}
              onClick={() => setSelectionne(conv)}
            >
              {/* Avatar : initiale de l'interlocuteur */}
              <div className="conv-avatar">
                {conv.expediteur_id === user.id ? conv.destinataire?.prenom?.[0] : conv.expediteur?.prenom?.[0]}
              </div>
              <div className="conv-infos">
                {/* Nom de l'interlocuteur selon le sens de la conversation */}
                <p className="conv-nom">
                  {conv.expediteur_id === user.id
                    ? `${conv.destinataire?.prenom} ${conv.destinataire?.nom}`
                    : `${conv.expediteur?.prenom} ${conv.expediteur?.nom}`
                  }
                </p>
                <p className="conv-sujet">{conv.sujet}</p>
                <p className="conv-date">{formatDate(conv.created_at)}</p>
              </div>
              {/* Point bleu si message non lu reçu */}
              {!conv.lu && conv.destinataire_id === user.id && <span className="conv-point-nonlu" />}
            </button>
          ))}
        </div>

        {/* ── DÉTAIL DE LA CONVERSATION ─────────────────────── */}
        <div className="conversation-detail">
          {!detail ? (
            // État vide : aucune conversation sélectionnée
            <div className="detail-vide">
              <span>💬</span>
              <p>Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              {/* En-tête : sujet + interlocuteur */}
              <div className="detail-entete">
                <h2>{detail.sujet}</h2>
                <p className="detail-interlocuteur">
                  {detail.expediteur_id === user.id
                    ? `À : ${detail.destinataire?.prenom} ${detail.destinataire?.nom}`
                    : `De : ${detail.expediteur?.prenom} ${detail.expediteur?.nom}`
                  }
                </p>
              </div>

              {/* ── FIL DE MESSAGES ─────────────────────────── */}
              <div className="messages-fil">
                {/* Message principal */}
                <div className={`message-bulle ${detail.expediteur_id === user.id ? 'message-bulle--moi' : 'message-bulle--autre'}`}>
                  {/* Masque le contenu '📎' (placeholder pièce jointe seule) */}
                  {detail.contenu !== '📎' && <p className="message-contenu">{detail.contenu}</p>}
                  <PieceJointe pj={detail.piece_jointe} nom={detail.piece_jointe_nom} />
                  <p className="message-date">{formatDate(detail.created_at)}</p>
                </div>

                {/* Réponses imbriquées */}
                {detail.reponses?.map(r => (
                  <div key={r.id} className={`message-bulle ${r.expediteur_id === user.id ? 'message-bulle--moi' : 'message-bulle--autre'}`}>
                    {r.contenu !== '📎' && <p className="message-contenu">{r.contenu}</p>}
                    <PieceJointe pj={r.piece_jointe} nom={r.piece_jointe_nom} />
                    <p className="message-date">{formatDate(r.created_at)}</p>
                  </div>
                ))}
                {/* Ancre pour auto-scroll vers le bas */}
                <div ref={finRef} />
              </div>

              {/* ── ZONE DE RÉPONSE ─────────────────────────── */}
              <form className="reponse-zone" onSubmit={envoyerReponse}>
                <div className="reponse-gauche">
                  <textarea
                    className="p-input reponse-input"
                    rows={2}
                    value={reponse}
                    onChange={e => setReponse(e.target.value)}
                    placeholder="Écrire une réponse..."
                  />
                  {/* Aperçu de la pièce jointe de réponse */}
                  {fichierRep && (
                    <div className="pj-apercu pj-apercu--rep">
                      {fichierRep.type.startsWith('image/') && (
                        <img src={URL.createObjectURL(fichierRep)} alt="" className="pj-apercu__img" />
                      )}
                      <span className="pj-apercu__nom">{fichierRep.name}</span>
                      <button type="button" className="pj-apercu__sup" onClick={() => { setFichierRep(null); fileRepRef.current.value = ''; }}>✕</button>
                    </div>
                  )}
                </div>
                <div className="reponse-actions">
                  {/* Bouton 📎 : label cliquable pour déclencher l'input file masqué */}
                  <label className="btn btn--ghost btn--sm pj-btn" title="Joindre un fichier">
                    📎
                    <input ref={fileRepRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="pj-input--hidden" onChange={e => setFichierRep(e.target.files[0] || null)} />
                  </label>
                  {/* Désactivé si ni texte ni fichier */}
                  <button type="submit" className="btn btn--primary btn--sm" disabled={envoi || (!reponse.trim() && !fichierRep)}>
                    Envoyer ↑
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
