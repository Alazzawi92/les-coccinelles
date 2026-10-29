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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { getLocale } from '../../../i18n';
import api, { BACKEND_URL as BACKEND, estCheminImage } from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Messagerie.css';
import Chargement from '../../../components/ui/Chargement/Chargement';
import useFenetreModale from '../../../hooks/useFenetreModale'; // Échap + focus dans la fenêtre

// ── Sous-composant : affichage d'une pièce jointe ────────────
// Vérifie l'extension pour rendre une image inline ou un lien document
const PieceJointe = ({ pj, nom }) => {
  const { t } = useTranslation();
  if (!pj) return null;
  const url      = `${BACKEND}${pj}`;
  const estImage = estCheminImage(pj); // Ignore la signature ?exp=...&sig=...
  if (estImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="pj-bulle">
        <img src={url} alt={nom || t('admin.messagerie.image')} className="pj-bulle__img" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pj-bulle pj-bulle--doc">
      📄 <span>{nom || t('admin.messagerie.document')}</span>
    </a>
  );
};

const MessagerieAdmin = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
      }).catch(() => toast.error(t('admin.messagerie.erreurParents')));
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
    } catch { toast.error(t('admin.messagerie.erreurEnvoi')); }
    setEnvoi(false);
  };

  // ── Envoyer un nouveau message à N destinataires ─────────
  // Envoi parallèle : un POST /messages par destinataire
  const envoyerNouveauMessage = async (e) => {
    e.preventDefault();
    if (destinataires.length === 0 || !sujet.trim() || !contenu.trim()) {
      toast.error(t('admin.messagerie.remplir'));
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
      toast.success(nb > 1 ? t('admin.messagerie.toastEnvoyeN', { count: nb }) : t('admin.messagerie.toastEnvoye'));
      fermerModal();
      chargerConversations().finally(() => setChargement(false));
    } catch { toast.error(t('admin.messagerie.erreurEnvoiNouveau')); }
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

  // Fenêtre accessible : Échap pour fermer, focus gardé dans la fenêtre
  const refModale = useFenetreModale(modalOuvert, fermerModal);

  // ── Utilitaires ──────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString(getLocale(), { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  // Nombre de messages non lus adressés à cet admin
  const nonLus = conversations.filter(c => !c.lu && c.destinataire_id === user.id).length;

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="a-chargement" />;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">
          {t('admin.messagerie.titre')} {nonLus > 0 && <span className="nonlus-badge">{t('admin.messagerie.nonLus', { count: nonLus })}</span>}
        </h1>
        <button className="btn btn--primary" onClick={() => setModalOuvert(true)}>
          {t('admin.messagerie.nouveau')}
        </button>
      </div>

      {/* ── LAYOUT 2 COLONNES ─────────────────────────────────── */}
      <div className="messagerie-admin-layout">

        {/* ── LISTE DES CONVERSATIONS ─────────────────────────── */}
        <div className="conv-liste-admin">
          {conversations.length === 0 ? (
            <div className="conv-vide">
              <span>💬</span>
              <p>{t('admin.messagerie.aucun')}</p>
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
              <p>{t('admin.messagerie.selectionnez')}</p>
              <button className="btn btn--outline btn--sm" onClick={() => setModalOuvert(true)}>
                {t('admin.messagerie.ecrire')}
              </button>
            </div>
          ) : (
            <>
              {/* En-tête du détail : avatar + sujet + expéditeur + date */}
              <div className="conv-detail-entete">
                <div className="conv-detail-avatar">
                  {detail.expediteur_id === user.id ? detail.destinataire?.prenom?.[0] : detail.expediteur?.prenom?.[0]}
                </div>
                <div className="conv-detail-textes">
                  <h2>{detail.sujet}</h2>
                  <p className="conv-detail-sous-titre">
                    {t('admin.messagerie.de', { nom: `${detail.expediteur?.prenom} ${detail.expediteur?.nom}`, date: formatDate(detail.created_at) })}
                  </p>
                </div>
              </div>

              {/* Fil de messages : message principal + réponses */}
              <div className="conv-messages-fil">
                {/* Message original */}
                <div className={`msg-bulle ${detail.expediteur_id === user.id ? 'msg-bulle--moi' : 'msg-bulle--autre'}`}>
                  {/* Masque le contenu '📎' (placeholder pièce jointe seule) */}
                  {detail.contenu !== '📎' && <p>{detail.contenu}</p>}
                  <PieceJointe pj={detail.piece_jointe} nom={detail.piece_jointe_nom} />
                  <small>{formatDate(detail.created_at)}</small>
                </div>
                {/* Réponses associées */}
                {detail.reponses?.map(r => (
                  <div key={r.id} className={`msg-bulle ${r.expediteur_id === user.id ? 'msg-bulle--moi' : 'msg-bulle--autre'}`}>
                    {r.contenu !== '📎' && <p>{r.contenu}</p>}
                    <PieceJointe pj={r.piece_jointe} nom={r.piece_jointe_nom} />
                    <small>{formatDate(r.created_at)}</small>
                  </div>
                ))}
                {/* Ancre invisible pour le scroll automatique vers le bas */}
                <div ref={finRef} />
              </div>

              {/* Zone de saisie de la réponse */}
              <form className="conv-reponse" onSubmit={envoyerReponse}>
                <textarea className="a-input" rows={3} value={reponse} onChange={e => setReponse(e.target.value)} placeholder={t('admin.messagerie.reponsePlaceholder')} />
                <button type="submit" className="btn btn--primary btn--sm" disabled={envoi || !reponse.trim()}>{t('admin.messagerie.envoyerReponse')}</button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL NOUVEAU MESSAGE ─────────────────────────────── */}
      {/* Clic sur l'overlay ferme la modal */}
      {modalOuvert && (
        <div className="modal-overlay" onClick={fermerModal}>
          {/* ref : Échap ferme, Tab reste dans la fenêtre (useFenetreModale) */}
          <div className="modal-boite modal-boite--lg" onClick={e => e.stopPropagation()}
            ref={refModale} role="dialog" aria-modal="true" aria-labelledby="titre-nouveau-message-admin">
            <div className="modal-entete">
              <h2 className="modal-titre" id="titre-nouveau-message-admin">{t('admin.messagerie.nouveau')}</h2>
              <button className="modal-fermer" onClick={fermerModal} aria-label={t('common.fermer')}>×</button>
            </div>

            <form onSubmit={envoyerNouveauMessage} className="modal-corps">

              {/* ── ZONE DESTINATAIRES ──────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">
                  {t('admin.messagerie.destinataires')} <span className="requis">*</span>
                  {/* Compteur du nombre de parents sélectionnés */}
                  {destinataires.length > 0 && (
                    <span className="dest-compteur">{t('admin.messagerie.compteur', { count: destinataires.length })}</span>
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
                    placeholder={destinataires.length === 0 ? t('admin.messagerie.rechercher') : t('admin.messagerie.ajouterPlaceholder')}
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
                        {recherche ? t('admin.messagerie.aucunResultat', { q: recherche }) : t('admin.messagerie.tousSelectionnes')}
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
                        <span className="parent-option__ajouter">{t('admin.messagerie.ajouter')}</span>
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
                          <strong>{t('admin.messagerie.selectionnerTous')}</strong>
                          <small>{t('admin.messagerie.compteur', { count: parents.length })}</small>
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── SUJET ───────────────────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">{t('admin.messagerie.sujet')} <span className="requis">*</span></label>
                <input
                  type="text"
                  className="a-input"
                  placeholder={t('admin.messagerie.sujetPlaceholder')}
                  value={sujet}
                  onChange={e => setSujet(e.target.value)}
                />
              </div>

              {/* ── MESSAGE ─────────────────────────────────── */}
              <div className="form-groupe">
                <label className="form-label-admin">{t('admin.messagerie.message')} <span className="requis">*</span></label>
                <textarea
                  className="a-input a-textarea"
                  rows={6}
                  placeholder={t('admin.messagerie.messagePlaceholder')}
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                />
              </div>

              {/* Actions : annuler | envoyer (bouton adapté selon nb destinataires) */}
              <div className="modal-actions">
                <button type="button" className="btn btn--outline" onClick={fermerModal}>{t('common.annuler')}</button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={envoiNouveau || destinataires.length === 0 || !sujet.trim() || !contenu.trim()}
                >
                  {envoiNouveau
                    ? t('admin.messagerie.envoiEnCours')
                    : destinataires.length > 1
                      ? t('admin.messagerie.envoyerN', { count: destinataires.length })
                      : t('admin.messagerie.envoyer')}
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
