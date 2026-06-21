// ============================================================
// FICHIER  : Messagerie.jsx (admin)
// ROUTE    : /admin/messagerie
// RÔLE     : Messagerie interne entre l'admin et les parents.
//            Layout 2 colonnes : liste conversations | détail.
//            Modal "Nouveau message" avec recherche multi-
//            destinataires (chips) + dropdown résultats + option
//            "Tout sélectionner". Envoi parallèle à N parents.
//            Réponse à la conversation sélectionnée avec autoScroll.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Messagerie.css';

const MessagerieAdmin = () => {
  // Utilisateur admin connecté (pour déterminer si on est expéditeur ou destinataire)
  const { user } = useAuth();

  // Liste de toutes les conversations de l'admin
  const [conversations, setConversations] = useState([]);
  // Conversation sélectionnée dans la liste (objet résumé)
  const [selectionne,   setSelectionne]   = useState(null);
  // Détail complet de la conversation (avec réponses)
  const [detail,        setDetail]        = useState(null);
  // Texte saisi dans le champ de réponse
  const [reponse,       setReponse]       = useState('');
  // Masque la liste pendant le chargement initial
  const [chargement,    setChargement]    = useState(true);
  // Indicateur d'envoi de la réponse
  const [envoi,         setEnvoi]         = useState(false);

  // ── États de la modal "Nouveau message" ──────────────────
  const [modalOuvert,     setModalOuvert]     = useState(false);
  // Liste complète des parents actifs (chargée à l'ouverture de la modal)
  const [parents,         setParents]         = useState([]);
  // Texte de recherche dans le champ de sélection des destinataires
  const [recherche,       setRecherche]       = useState('');
  // Tableau des parents sélectionnés comme destinataires
  const [destinataires,   setDestinataires]   = useState([]);
  // Sujet du nouveau message
  const [sujet,           setSujet]           = useState('');
  // Contenu du nouveau message
  const [contenu,         setContenu]         = useState('');
  // Indicateur d'envoi du nouveau message (distinct de celui de la réponse)
  const [envoiNouveau,    setEnvoiNouveau]    = useState(false);
  // Contrôle la visibilité du dropdown de résultats
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Ref pour scroll automatique vers le bas du fil de messages
  const finRef       = useRef(null);
  // Ref pour focus automatique sur l'input de recherche dans la modal
  const rechercheRef = useRef(null);

  // ── Chargement ou rechargement des conversations ─────────
  const chargerConversations = () =>
    api.get('/messages').then(r => setConversations(r.data.data || []));

  // ── Chargement initial ────────────────────────────────────
  useEffect(() => {
    chargerConversations().finally(() => setChargement(false));
  }, []);

  // ── Chargement du détail quand une conversation est sélectionnée ─
  useEffect(() => {
    if (selectionne) {
      api.get(`/messages/${selectionne.id}`)
        .then(r => setDetail(r.data.data))
        .catch(() => {});
    }
  }, [selectionne]);

  // ── Auto-scroll vers le bas du fil après chaque mise à jour ─
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [detail]);

  // ── Chargement des parents à l'ouverture de la modal ─────
  // Focus automatique sur le champ de recherche
  useEffect(() => {
    if (modalOuvert && parents.length === 0) {
      api.get('/users').then(r => {
        // Filtre : uniquement les parents actifs
        setParents((r.data.data || []).filter(u => u.role === 'parent' && u.actif));
      }).catch(() => toast.error('Impossible de charger les parents'));
    }
    if (modalOuvert) setTimeout(() => rechercheRef.current?.focus(), 50);
  }, [modalOuvert]);

  // ── Parents filtrés dans le dropdown ─────────────────────
  // Exclut les déjà sélectionnés + filtre sur la recherche textuelle
  const parentsFiltres = parents.filter(p => {
    const dejaSelectionne = destinataires.some(d => d.id === p.id);
    if (dejaSelectionne) return false;
    const q = recherche.toLowerCase();
    return !q || `${p.prenom} ${p.nom} ${p.email}`.toLowerCase().includes(q);
  });

  // ── Ajouter un parent comme destinataire ─────────────────
  const ajouterDestinataire = (parent) => {
    setDestinataires(prev => [...prev, parent]);
    setRecherche('');
    setDropdownVisible(false);
    rechercheRef.current?.focus(); // Repositionne le focus pour ajouter d'autres parents
  };

  // ── Retirer un destinataire (clic × sur le chip) ─────────
  const retirerDestinataire = (id) => {
    setDestinataires(prev => prev.filter(d => d.id !== id));
  };

  // ── Envoyer une réponse à la conversation sélectionnée ───
  const envoyerReponse = async (e) => {
    e.preventDefault();
    if (!reponse.trim()) return;
    setEnvoi(true);
    try {
      await api.post('/messages', {
        sujet:           `Re: ${detail?.sujet}`,
        contenu:         reponse,
        // Destinataire = l'autre participant de la conversation
        destinataire_id: detail?.expediteur_id === user.id ? detail?.destinataire_id : detail?.expediteur_id,
        parent_id:       detail?.id // Rattache la réponse à la conversation parente
      });
      setReponse('');
      // Recharge le détail pour afficher la nouvelle réponse
      const r = await api.get(`/messages/${selectionne.id}`);
      setDetail(r.data.data);
      chargerConversations();
    } catch { toast.error('Erreur envoi'); }
    setEnvoi(false);
  };

  // ── Envoyer un nouveau message à N destinataires ─────────
  // Envoi parallèle : un POST /messages par destinataire
  const envoyerNouveauMessage = async (e) => {
    e.preventDefault();
    if (destinataires.length === 0 || !sujet.trim() || !contenu.trim()) {
      toast.error('Remplissez tous les champs');
      return;
    }
    setEnvoiNouveau(true);
    try {
      await Promise.all(
        destinataires.map(d =>
          api.post('/messages', { destinataire_id: d.id, sujet, contenu })
        )
      );
      const nb = destinataires.length;
      toast.success(nb > 1 ? `Message envoyé à ${nb} parents` : 'Message envoyé');
      fermerModal();
      chargerConversations().finally(() => setChargement(false));
    } catch { toast.error("Erreur lors de l'envoi"); }
    setEnvoiNouveau(false);
  };

  // ── Fermeture et réinitialisation de la modal ────────────
  const fermerModal = () => {
    setModalOuvert(false);
    setDestinataires([]);
    setRecherche('');
    setSujet('');
    setContenu('');
    setDropdownVisible(false);
  };

  // ── Utilitaires ──────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  // Nombre de messages non lus adressés à cet admin
  const nonLus = conversations.filter(c => !c.lu && c.destinataire_id === user.id).length;

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">
          Messagerie {nonLus > 0 && <span className="nonlus-badge">{nonLus} non lu(s)</span>}
        </h1>
        <button className="btn btn--primary" onClick={() => setModalOuvert(true)}>
          ✉️ Nouveau message
        </button>
      </div>

      {/* ── LAYOUT 2 COLONNES ─────────────────────────────────── */}
      <div className="messagerie-admin-layout">

        {/* ── LISTE DES CONVERSATIONS ─────────────────────────── */}
        <div className="conv-liste-admin">
          {conversations.length === 0 ? (
            <div className="conv-vide">
              <span>💬</span>
              <p>Aucun message</p>
            </div>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              // Classe actif + nonlu selon l'état de la conversation
              className={`conv-admin-item ${selectionne?.id === conv.id ? 'conv-admin-item--actif' : ''} ${!conv.lu && conv.destinataire_id === user.id ? 'conv-admin-item--nonlu' : ''}`}
              onClick={() => setSelectionne(conv)}
            >
              {/* Avatar : initiale de l'interlocuteur (pas de soi-même) */}
              <div className="conv-admin-avatar">
                {conv.expediteur_id === user.id ? conv.destinataire?.prenom?.[0] : conv.expediteur?.prenom?.[0]}
              </div>
              <div className="conv-admin-infos">
                <p className="conv-admin-nom">
                  {conv.expediteur_id === user.id
                    ? `${conv.destinataire?.prenom} ${conv.destinataire?.nom}`
                    : `${conv.expediteur?.prenom} ${conv.expediteur?.nom}`}
                </p>
                <p className="conv-admin-sujet">{conv.sujet}</p>
                <p className="conv-admin-date">{formatDate(conv.created_at)}</p>
              </div>
              {/* Point orange : indique un message non lu */}
              {!conv.lu && conv.destinataire_id === user.id && <span className="conv-point" />}
            </button>
          ))}
        </div>

        {/* ── DÉTAIL CONVERSATION ─────────────────────────────── */}
        <div className="conv-detail-admin">
          {!detail ? (
            <div className="conv-vide conv-vide--centre">
              <span>💬</span>
              <p>Sélectionnez une conversation</p>
              <button className="btn btn--outline btn--sm" onClick={() => setModalOuvert(true)}>
                Écrire un message
              </button>
            </div>
          ) : (
            <>
              {/* En-tête du détail : sujet + expéditeur + date */}
              <div className="conv-detail-entete">
                <h2>{detail.sujet}</h2>
                <p style={{ color:'var(--text-gray)', fontSize:'0.85rem' }}>
                  De : {detail.expediteur?.prenom} {detail.expediteur?.nom} · {formatDate(detail.created_at)}
                </p>
              </div>

              {/* Fil de messages : message principal + réponses */}
              <div className="conv-messages-fil">
                {/* Message original */}
                <div className={`msg-bulle ${detail.expediteur_id === user.id ? 'msg-bulle--moi' : 'msg-bulle--autre'}`}>
                  <p>{detail.contenu}</p>
                  <small>{formatDate(detail.created_at)}</small>
                </div>
                {/* Réponses associées */}
                {detail.reponses?.map(r => (
                  <div key={r.id} className={`msg-bulle ${r.expediteur_id === user.id ? 'msg-bulle--moi' : 'msg-bulle--autre'}`}>
                    <p>{r.contenu}</p>
                    <small>{formatDate(r.created_at)}</small>
                  </div>
                ))}
                {/* Ancre invisible pour le scroll automatique vers le bas */}
                <div ref={finRef} />
              </div>

              {/* Zone de saisie de la réponse */}
              <form className="conv-reponse" onSubmit={envoyerReponse}>
                <textarea className="a-input" rows={3} value={reponse} onChange={e => setReponse(e.target.value)} placeholder="Écrire une réponse..." />
                <button type="submit" className="btn btn--primary btn--sm" disabled={envoi || !reponse.trim()}>Envoyer ↑</button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL NOUVEAU MESSAGE ─────────────────────────────── */}
      {/* Clic sur l'overlay ferme la modal */}
      {modalOuvert && (
        <div className="modal-overlay" onClick={fermerModal}>
          <div className="modal-boite modal-boite--lg" onClick={e => e.stopPropagation()}>
            <div className="modal-entete">
              <h2 className="modal-titre">✉️ Nouveau message</h2>
              <button className="modal-fermer" onClick={fermerModal}>×</button>
            </div>

            <form onSubmit={envoyerNouveauMessage} className="modal-corps">

              {/* ── ZONE DESTINATAIRES ──────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">
                  Destinataires <span className="requis">*</span>
                  {/* Compteur du nombre de parents sélectionnés */}
                  {destinataires.length > 0 && (
                    <span className="dest-compteur">{destinataires.length} parent{destinataires.length > 1 ? 's' : ''}</span>
                  )}
                </label>

                {/* Zone chips + input de recherche cliquable */}
                <div
                  className={`dest-zone ${dropdownVisible ? 'dest-zone--focus' : ''}`}
                  onClick={() => { setDropdownVisible(true); rechercheRef.current?.focus(); }}
                >
                  {/* Chips des parents déjà sélectionnés */}
                  {destinataires.map(d => (
                    <span key={d.id} className="dest-chip">
                      <span className="dest-chip__avatar">{d.prenom[0]}{d.nom[0]}</span>
                      {d.prenom} {d.nom}
                      {/* × supprime ce destinataire de la sélection */}
                      <button
                        type="button"
                        className="dest-chip__suppr"
                        onClick={e => { e.stopPropagation(); retirerDestinataire(d.id); }}
                      >×</button>
                    </span>
                  ))}
                  {/* Input inline pour la recherche — onBlur avec délai pour autoriser le clic dropdown */}
                  <input
                    ref={rechercheRef}
                    type="text"
                    className="dest-input"
                    placeholder={destinataires.length === 0 ? '🔍 Rechercher un parent...' : 'Ajouter...'}
                    value={recherche}
                    onChange={e => { setRecherche(e.target.value); setDropdownVisible(true); }}
                    onFocus={() => setDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setDropdownVisible(false), 150)}
                  />
                </div>

                {/* Dropdown résultats de recherche (max 8 résultats affichés) */}
                {dropdownVisible && (
                  <div className="parents-liste-dropdown">
                    {parentsFiltres.length === 0 ? (
                      <p className="dropdown-vide">
                        {recherche ? `Aucun résultat pour « ${recherche} »` : 'Tous les parents sont sélectionnés'}
                      </p>
                    ) : parentsFiltres.slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="parent-option"
                        // onMouseDown : déclenché avant onBlur pour capturer le clic
                        onMouseDown={() => ajouterDestinataire(p)}
                      >
                        <span className="parent-option__avatar">{p.prenom[0]}{p.nom[0]}</span>
                        <span className="parent-option__infos">
                          <strong>{p.prenom} {p.nom}</strong>
                          <small>{p.email}</small>
                        </span>
                        <span className="parent-option__ajouter">+ Ajouter</span>
                      </button>
                    ))}
                    {/* Bouton "Sélectionner tous les parents" en bas du dropdown */}
                    {parents.length > 0 && destinataires.length < parents.length && (
                      <button
                        type="button"
                        className="parent-option parent-option--tous"
                        onMouseDown={() => {
                          setDestinataires(parents);
                          setRecherche('');
                          setDropdownVisible(false);
                        }}
                      >
                        <span style={{ fontSize:'1.1rem' }}>👨‍👩‍👧‍👦</span>
                        <span className="parent-option__infos">
                          <strong>Sélectionner tous les parents</strong>
                          <small>{parents.length} parents</small>
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── SUJET ───────────────────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">Sujet <span className="requis">*</span></label>
                <input
                  type="text"
                  className="a-input"
                  placeholder="Objet du message..."
                  value={sujet}
                  onChange={e => setSujet(e.target.value)}
                />
              </div>

              {/* ── MESSAGE ─────────────────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">Message <span className="requis">*</span></label>
                <textarea
                  className="a-input a-textarea"
                  rows={6}
                  placeholder="Écrivez votre message..."
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                />
              </div>

              {/* Actions : annuler | envoyer (bouton adapté selon nb destinataires) */}
              <div className="modal-actions">
                <button type="button" className="btn btn--outline" onClick={fermerModal}>Annuler</button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={envoiNouveau || destinataires.length === 0 || !sujet.trim() || !contenu.trim()}
                >
                  {envoiNouveau
                    ? 'Envoi en cours...'
                    : destinataires.length > 1
                      ? `✉️ Envoyer à ${destinataires.length} parents`
                      : '✉️ Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MessagerieAdmin;
