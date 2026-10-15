// ============================================================
// FICHIER  : Dashboard.jsx (parent)
// ROUTE    : /parent/tableau-de-bord
// RÔLE     : Tableau de bord de l'espace parent.
//            Charge en parallèle : enfants + notifications,
//            puis le suivi du jour pour le premier enfant.
//            Salutation dynamique selon l'heure (matin/après-midi/soir).
//            6 raccourcis colorés, 3 cartes (enfants, suivi, notifs).
//            Les fonctions utilitaires (calcAge, emojis) sont définies
//            après le composant car elles ne dépendent pas du state.
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import i18n, { getLocale } from '../../../i18n';
import '../../../styles/parent.css';
import './Dashboard.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

const Dashboard = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Utilisateur connecté (pour la salutation personnalisée)
  const { user } = useAuth();
  // Objet agrégé : enfants[], notifications[], dernierSuivi
  const [donnees, setDonnees] = useState({ enfants: [], notifications: [], dernierSuivi: null });
  // Masque le contenu pendant le chargement initial
  const [chargement, setChargement] = useState(true);

  // ── Chargement en parallèle des données du dashboard ─────
  useEffect(() => {
    const charger = async () => {
      try {
        const [resEnfants, resNotifs] = await Promise.all([
          api.get('/enfants'),
          api.get('/notifications')
        ]);
        const enfants       = resEnfants.data.data || [];
        const notifications = resNotifs.data.data  || [];

        // Charger le suivi du jour pour le premier enfant (séquentiel car dépend des enfants)
        let dernierSuivi = null;
        if (enfants.length > 0) {
          try {
            const today = new Date().toISOString().split('T')[0];
            const res   = await api.get(`/suivi/${enfants[0].id}/${today}`);
            dernierSuivi = res.data.data;
          } catch { /* Pas de suivi aujourd'hui — état normal */ }
        }

        setDonnees({ enfants, notifications, dernierSuivi });
      } catch { /* Erreur réseau silencieuse */ }
      setChargement(false);
    };
    charger();
  }, []);

  // Compteur de notifications non lues pour le badge
  const notifsNonLues = donnees.notifications.filter(n => !n.lue).length;
  // Salutation adaptée à l'heure locale
  const heure      = new Date().getHours();
  const salutation = t(`parent.dashboard.${heure < 12 ? 'bonjour' : heure < 18 ? 'apresMidi' : 'bonsoir'}`);

  // Garde : spinner pendant le chargement
  if (chargement) return <Chargement className="p-chargement" />;

  return (
    <div className="dashboard">

      {/* ── SALUTATION ─────────────────────────────────────── */}
      <div className="dashboard__salutation">
        <div>
          <h1 className="dashboard__titre">{salutation}, <span>{user?.prenom}</span> 👋</h1>
          <p className="dashboard__sous">{t('parent.dashboard.sous')}</p>
        </div>
        {/* Badge de notifications non lues — redirige vers la messagerie */}
        {notifsNonLues > 0 && (
          <Link to="/parent/messages" className="notif-badge">
            🔔 {t('parent.dashboard.notifs', { count: notifsNonLues })}
          </Link>
        )}
      </div>

      {/* ── RACCOURCIS ─────────────────────────────────────── */}
      {/* 6 liens rapides en grille colorée */}
      <div className="dashboard__raccourcis">
        {[
          // cle : clé de traduction du libellé (parent.dashboard.raccourcis.*)
          { to: '/parent/mes-enfants',  icone: '👶', cle: 'enfants',   couleur: 'orange' },
          // URL suivi dépend du premier enfant — lien vide si aucun enfant
          { to: '/parent/suivi/' + (donnees.enfants[0]?.id || ''), icone: '📊', cle: 'suivi', couleur: 'vert' },
          { to: '/parent/absences',     icone: '📅', cle: 'absences',  couleur: 'bleu' },
          { to: '/parent/documents',    icone: '📄', cle: 'documents', couleur: 'violet' },
          { to: '/parent/messages',     icone: '✉️', cle: 'messages',  couleur: 'rose' },
          { to: '/parent/galerie',      icone: '🖼️', cle: 'galerie',   couleur: 'jaune' }
        ].map(({ to, icone, cle, couleur }) => (
          <Link key={to} to={to} className={`raccourci raccourci--${couleur}`}>
            <span className="raccourci__icone">{icone}</span>
            <span className="raccourci__label">{t(`parent.dashboard.raccourcis.${cle}`)}</span>
          </Link>
        ))}
      </div>

      {/* ── GRILLE DE CARTES ───────────────────────────────── */}
      <div className="dashboard__grille">

        {/* ── CARTE MES ENFANTS ──────────────────────────── */}
        <div className="p-card">
          <h2 className="p-card__titre">👶 {t('parent.dashboard.mesEnfants')}</h2>
          {donnees.enfants.length === 0 ? (
            <div className="p-vide">
              <span className="p-vide__icone">👶</span>
              <p>{t('parent.commun.aucunEnfant')}</p>
              <Link to="/parent/mes-enfants" className="btn btn--primary btn--sm">{t('parent.commun.ajouterEnfant')}</Link>
            </div>
          ) : (
            <div className="enfants-liste">
              {donnees.enfants.map(enfant => (
                <div key={enfant.id} className="enfant-item">
                  {/* Avatar : initiale du prénom */}
                  <div className="enfant-avatar">{enfant.prenom[0]}</div>
                  <div className="enfant-infos">
                    <p className="enfant-nom">{enfant.prenom} {enfant.nom}</p>
                    <p className="enfant-age">
                      {calculerAge(enfant.date_naissance)}
                      {enfant.groupe && ` · ${enfant.groupe}`}
                    </p>
                  </div>
                  <Link to={`/parent/suivi/${enfant.id}`} className="btn btn--ghost btn--sm">{t('parent.dashboard.suivi')}</Link>
                </div>
              ))}
              <Link to="/parent/mes-enfants" className="p-voir-tout">{t('parent.dashboard.gererEnfants')}</Link>
            </div>
          )}
        </div>

        {/* ── CARTE SUIVI DU JOUR ────────────────────────── */}
        <div className="p-card">
          <h2 className="p-card__titre">📊 {t('parent.dashboard.suiviJour')}</h2>
          {donnees.dernierSuivi ? (
            <div className="suivi-apercu">
              {/* Prénom du premier enfant comme titre du suivi */}
              <p className="suivi-enfant-nom">{donnees.enfants[0]?.prenom}</p>
              {/* 3 repas : matin, midi, goûter avec emoji de la valeur */}
              <div className="suivi-repas-row">
                {[
                  { cle: 'matin',  valeur: donnees.dernierSuivi.repas_matin  },
                  { cle: 'midi',   valeur: donnees.dernierSuivi.repas_midi   },
                  { cle: 'gouter', valeur: donnees.dernierSuivi.repas_gouter }
                ].map(({ cle, valeur }) => (
                  <div key={cle} className="suivi-repas-item">
                    <span className="suivi-repas-label">{t(`parent.dashboard.repas.${cle}`)}</span>
                    <span className={`suivi-repas-valeur suivi-repas--${valeur}`}>
                      {emojiRepas(valeur)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Humeur : affichée uniquement si renseignée */}
              {donnees.dernierSuivi.humeur && (
                <p className="suivi-humeur">{t('parent.dashboard.humeur')} {emojiHumeur(donnees.dernierSuivi.humeur)} {t(`common.humeur.${donnees.dernierSuivi.humeur}`, { defaultValue: donnees.dernierSuivi.humeur })}</p>
              )}
              {/* Note de l'équipe : message transmis aux parents */}
              {donnees.dernierSuivi.note_generale && (
                <p className="suivi-note">💬 {donnees.dernierSuivi.note_generale}</p>
              )}
              <Link to={`/parent/suivi/${donnees.enfants[0]?.id}`} className="p-voir-tout">{t('parent.dashboard.voirSuivi')}</Link>
            </div>
          ) : (
            <div className="p-vide">
              <span className="p-vide__icone">📋</span>
              <p>{t('parent.dashboard.pasDeSuivi')}</p>
            </div>
          )}
        </div>

        {/* ── CARTE NOTIFICATIONS ────────────────────────── */}
        <div className="p-card">
          <h2 className="p-card__titre">🔔 {t('parent.dashboard.notifications')}</h2>
          {donnees.notifications.length === 0 ? (
            <div className="p-vide">
              <span className="p-vide__icone">🔔</span>
              <p>{t('parent.dashboard.aucuneNotif')}</p>
            </div>
          ) : (
            <div className="notifs-liste">
              {/* Affichage des 5 dernières notifications uniquement */}
              {donnees.notifications.slice(0, 5).map(notif => (
                <div key={notif.id} className={`notif-item ${notif.lue ? '' : 'notif-item--nonlue'}`}>
                  <span className="notif-type">{iconeNotif(notif.type)}</span>
                  <div className="notif-contenu">
                    <p className="notif-titre">{notif.titre}</p>
                    <p className="notif-message">{notif.message}</p>
                    <p className="notif-date">{formatDate(notif.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Fonctions utilitaires (hors composant) ──────────────────
// Calculer l'âge en mois (< 24 mois) ou en années, traduit dans la langue active
// (appelée pendant le rendu, donc i18n.t utilise toujours la langue courante)
const calculerAge = (dateNaissance) => {
  const naissance = new Date(dateNaissance);
  const maintenant = new Date();
  const mois = (maintenant.getFullYear() - naissance.getFullYear()) * 12 + (maintenant.getMonth() - naissance.getMonth());
  if (mois < 24) return i18n.t('common.age.mois', { count: mois });
  return i18n.t('common.age.ans', { count: Math.floor(mois / 12) });
};

// Emoji pour chaque valeur de repas
const emojiRepas  = (v) => ({ tout: '😋', peu: '😐', rien: '😕', absent: '—' }[v] || '—');
// Emoji pour chaque valeur d'humeur
const emojiHumeur = (v) => ({ joyeux: '😄', calme: '😊', fatigue: '😴', pleureur: '😢', autre: '😐' }[v] || '');
// Icône pour chaque type de notification
const iconeNotif  = (t) => ({ info: 'ℹ️', inscription: '📝', message: '✉️', absence: '📅', document: '📄', alerte: '⚠️' }[t] || '🔔');
// Date courte pour l'affichage dans la liste (format de la langue active)
const formatDate  = (d) => new Date(d).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });

export default Dashboard;
