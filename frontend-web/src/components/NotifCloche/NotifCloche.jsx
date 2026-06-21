// ============================================================
// FICHIER  : NotifCloche.jsx
// ROUTE    : Composant global (admin + parent)
// RÔLE     : Cloche de notifications avec panneau déroulant.
//            Polling toutes les 30s via setInterval + clearInterval cleanup.
//            Clic extérieur : mousedown + ref.current.contains pour fermer.
//            Badge plafonné à "99+" si plus de 99 non lues.
//            formatDate : relatif ("À l'instant", "Il y a X min", "Il y a Xh").
//            iconeType : objet lookup par type de notification.
//            clicNotif : marquerLue + navigate(n.lien).
//            toutLire : PATCH /notifications/tout-lire → map all lue:true.
//            supprimer : e.stopPropagation() avant DELETE.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './NotifCloche.css';

const NotifCloche = () => {
  // Liste de toutes les notifications de l'utilisateur connecté
  const [notifs,     setNotifs]     = useState([]);
  // true = panneau notifications ouvert
  const [ouvert,     setOuvert]     = useState(false);
  // true = rechargement en cours (affiche "Chargement...")
  const [chargement, setChargement] = useState(false);
  // Ref sur le conteneur pour détecter les clics extérieurs
  const ref      = useRef(null);
  const navigate = useNavigate();

  // Nombre de notifications non lues (pour le badge)
  const nonLues = notifs.filter(n => !n.lue).length;

  // ── Charger les notifications depuis l'API ────────────────
  const charger = async () => {
    try {
      setChargement(true);
      const res = await api.get('/notifications');
      setNotifs(res.data.data || []);
    } catch {
      // Silencieux si pas de notifs ou erreur réseau
    } finally {
      setChargement(false);
    }
  };

  // ── Polling toutes les 30 secondes + chargement initial ──
  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 30000);
    // Nettoyage : clearInterval au démontage du composant
    return () => clearInterval(intervalle);
  }, []);

  // ── Fermer le panneau si clic en dehors du composant ─────
  // mousedown (pas click) pour détecter avant le blur des inputs
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuvert(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Basculer l'ouverture du panneau
  const toggleOuvert = () => setOuvert(v => !v);

  // ── Marquer une notification comme lue ───────────────────
  // PATCH /notifications/:id/lue → met à jour en local
  const marquerLue = async (id) => {
    try {
      await api.patch(`/notifications/${id}/lue`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch {}
  };

  // ── Cliquer sur une notification ─────────────────────────
  // Marque comme lue si nécessaire, puis navigue vers n.lien
  const clicNotif = async (n) => {
    if (!n.lue) await marquerLue(n.id);
    if (n.lien) {
      setOuvert(false);
      navigate(n.lien);
    }
  };

  // ── Tout marquer comme lu ─────────────────────────────────
  // PATCH /notifications/tout-lire → map all lue:true en local
  const toutLire = async () => {
    try {
      await api.patch('/notifications/tout-lire');
      setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
    } catch {}
  };

  // ── Supprimer une notification ────────────────────────────
  // e.stopPropagation() pour ne pas déclencher clicNotif en même temps
  const supprimer = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // ── Formatage relatif de la date ─────────────────────────
  // < 1 min → "À l'instant", < 1h → "Il y a X min", < 24h → "Il y a Xh"
  const formatDate = (date) => {
    const d         = new Date(date);
    const maintenant = new Date();
    const diff      = Math.floor((maintenant - d) / 60000); // en minutes
    if (diff < 1)    return "À l'instant";
    if (diff < 60)   return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Emoji selon le type de notification
  const iconeType = (type) => ({
    'inscription': '📝',
    'message':     '✉️',
    'absence':     '📅',
    'suivi':       '📊',
    'document':    '📄',
    'info':        'ℹ️',
  }[type] || '🔔');

  return (
    <div className="notif-cloche" ref={ref}>

      {/* ── BOUTON CLOCHE ─────────────────────────────────────── */}
      <button className="notif-cloche__btn" onClick={toggleOuvert} aria-label="Notifications">
        <span className="notif-cloche__emoji">🔔</span>
        {/* Badge rouge plafonné à "99+" */}
        {nonLues > 0 && (
          <span className="notif-cloche__badge">{nonLues > 99 ? '99+' : nonLues}</span>
        )}
      </button>

      {/* ── PANNEAU DÉROULANT ─────────────────────────────────── */}
      {ouvert && (
        <div className="notif-panneau">
          <div className="notif-panneau__entete">
            <h3 className="notif-panneau__titre">Notifications</h3>
            {/* Bouton "Tout marquer lu" visible uniquement s'il y a des non lues */}
            {nonLues > 0 && (
              <button className="notif-panneau__tout-lire" onClick={toutLire}>
                Tout marquer lu
              </button>
            )}
          </div>

          {/* ── LISTE DES NOTIFICATIONS ─────────────────────── */}
          <div className="notif-panneau__liste">
            {chargement && <p className="notif-vide">Chargement...</p>}
            {!chargement && notifs.length === 0 && (
              <div className="notif-vide">
                <span>🔕</span>
                <p>Aucune notification</p>
              </div>
            )}
            {notifs.map(n => (
              <div
                key={n.id}
                // notif-item--nonlue si non lue, notif-item--cliquable si lien disponible
                className={`notif-item ${!n.lue ? 'notif-item--nonlue' : ''} ${n.lien ? 'notif-item--cliquable' : ''}`}
                onClick={() => clicNotif(n)}
              >
                <span className="notif-item__icone">{iconeType(n.type)}</span>
                <div className="notif-item__corps">
                  {n.titre && <p className="notif-item__titre">{n.titre}</p>}
                  <p className="notif-item__message">{n.message}</p>
                  <p className="notif-item__date">{formatDate(n.created_at)}</p>
                </div>
                <div className="notif-item__droite">
                  {/* Flèche de navigation si lien défini */}
                  {n.lien && <span className="notif-item__fleche">›</span>}
                  {/* Bouton suppression : stopPropagation pour éviter clicNotif */}
                  <button className="notif-item__suppr" onClick={(e) => supprimer(e, n.id)} aria-label="Supprimer">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotifCloche;
