// ============================================================
// FICHIER  : Dashboard.jsx (admin)
// ROUTE    : /admin/tableau-de-bord
// RÔLE     : Tableau de bord principal de l'espace administrateur.
//            Charge en parallèle : stats inscriptions, absences en
//            attente, messages non lus → calcule les alertes.
//            Affiche : alertes actives, 6 cartes statistiques
//            colorées, 6 raccourcis actions rapides, graphique
//            en barres de répartition des dossiers.
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import '../../../styles/admin.css';
import './Dashboard.css';

const AdminDashboard = () => {
  // Récupère le prénom de l'admin pour la salutation et l'id pour filtrer les messages
  const { user } = useAuth();

  // stats : données de /inscriptions/stats (total, en_attente, accepte, etc.)
  const [stats,   setStats]   = useState(null);
  // alertes : liste des alertes calculées (absences en attente + messages non lus)
  const [alertes, setAlertes] = useState([]);
  // charge : masque le contenu pendant le chargement initial
  const [charge,  setCharge]  = useState(true);

  // ── Chargement initial des données ───────────────────────
  // Appels parallèles : stats inscriptions + absences + messages
  useEffect(() => {
    const charger = async () => {
      try {
        const [resInscStats, resAbsences, resMessages] = await Promise.all([
          api.get('/inscriptions/stats'),
          api.get('/absences'),
          api.get('/messages')
        ]);
        setStats(resInscStats.data.data);

        // Calculer les alertes à partir des données reçues
        // Absences : seulement celles en statut 'en_attente'
        const abs = (resAbsences.data.data || []).filter(a => a.statut === 'en_attente');
        // Messages : seulement ceux non lus ET adressés à cet admin
        const msg = (resMessages.data.data || []).filter(m => !m.lu && m.destinataire_id === user.id);
        const al  = [];
        if (abs.length > 0)  al.push({ type: 'absence',  texte: `${abs.length} absence(s) en attente de validation`,  lien: '/admin/absences',    icone: '📅' });
        if (msg.length > 0)  al.push({ type: 'message',  texte: `${msg.length} message(s) non lu(s)`,                  lien: '/admin/messagerie',  icone: '✉️' });
        setAlertes(al);
      } catch {}
      setCharge(false);
    };
    charger();
  }, [user.id]); // Se relance si l'admin change de session

  // Garde : affiche un spinner pendant le chargement
  if (charge) return <div className="a-chargement">Chargement...</div>;

  return (
    <div className="admin-dashboard">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <div>
          <h1 className="admin-page-titre">Tableau de <span>bord</span></h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            Bienvenue, {user?.prenom}. Voici l'état de la crèche.
          </p>
        </div>
        {/* Date du jour affichée en haut à droite */}
        <p className="admin-date">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── ALERTES ACTIVES ──────────────────────────────────── */}
      {/* Affichées uniquement s'il y a des éléments nécessitant attention */}
      {alertes.length > 0 && (
        <div className="alertes-section">
          {alertes.map((a, i) => (
            // Chaque alerte est un lien vers la section concernée
            <Link key={i} to={a.lien} className={`alerte-item alerte-item--${a.type}`}>
              <span>{a.icone}</span>
              <span>{a.texte}</span>
              <span className="alerte-lien">Voir →</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── STATISTIQUES INSCRIPTIONS ─────────────────────────── */}
      {/* 6 cartes colorées : total, en_attente, accepte, en_cours, liste_attente, refuse */}
      {stats && (
        <>
          <div className="stats-grille">
            {[
              { label: 'Total dossiers',   valeur: stats.total        || 0, icone: '📝', couleur: 'orange' },
              { label: 'En attente',       valeur: stats.en_attente   || 0, icone: '⏳', couleur: 'orange' },
              { label: 'Acceptés',         valeur: stats.accepte      || 0, icone: '✅', couleur: 'vert'   },
              { label: 'En cours',         valeur: stats.en_cours     || 0, icone: '🔄', couleur: 'bleu'   },
              { label: 'Liste d\'attente', valeur: stats.liste_attente || 0, icone: '📋', couleur: 'violet' },
              { label: 'Refusés',          valeur: stats.refuse       || 0, icone: '❌', couleur: 'rouge'  }
            ].map(({ label, valeur, icone, couleur }) => (
              <div key={label} className={`stat-card stat-card--${couleur}`}>
                <span className="stat-card__icone">{icone}</span>
                <div>
                  <p className="stat-card__valeur">{valeur}</p>
                  <p className="stat-card__label">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── RACCOURCIS ACTIONS RAPIDES ────────────────────────── */}
      {/* 6 liens vers les sections les plus utilisées au quotidien */}
      <div className="admin-dashboard__section">
        <h2 className="a-card__titre" style={{ marginBottom: 'var(--space-lg)' }}>⚡ Actions rapides</h2>
        <div className="raccourcis-admin">
          {[
            { to: '/admin/inscriptions', icone: '📝', label: 'Dossiers inscription',  desc: 'Valider les demandes',    couleur: 'orange' },
            { to: '/admin/suivi',        icone: '📋', label: 'Suivi quotidien',        desc: 'Renseigner les suivis',   couleur: 'vert'   },
            { to: '/admin/absences',     icone: '📅', label: 'Absences',              desc: 'Valider les absences',    couleur: 'bleu'   },
            { to: '/admin/actualites',   icone: '📰', label: 'Actualités',            desc: 'Publier un article',      couleur: 'violet' },
            { to: '/admin/menus',        icone: '🍽️', label: 'Menus',                 desc: 'Renseigner les menus',    couleur: 'rose'   },
            { to: '/admin/messagerie',   icone: '✉️', label: 'Messagerie',            desc: 'Répondre aux parents',    couleur: 'jaune'  }
          ].map(({ to, icone, label, desc, couleur }) => (
            <Link key={to} to={to} className={`raccourci-admin raccourci-admin--${couleur}`}>
              <span className="raccourci-admin__icone">{icone}</span>
              <div>
                <p className="raccourci-admin__label">{label}</p>
                <p className="raccourci-admin__desc">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GRAPHIQUE RÉPARTITION DES DOSSIERS ───────────────── */}
      {/* Barre proportionnelle avec légende en dessous */}
      {stats && (
        <div className="admin-dashboard__section">
          <h2 className="a-card__titre" style={{ marginBottom: 'var(--space-lg)' }}>📊 Répartition des dossiers</h2>
          <div className="a-card">
            {/* Barre proportionnelle : chaque segment a une largeur en % */}
            <div className="repartition-barre">
              {[
                { statut: 'accepte',       label: 'Acceptés',          color: 'var(--success)' },
                { statut: 'en_attente',    label: 'En attente',        color: 'var(--warning)' },
                { statut: 'en_cours',      label: 'En cours',          color: 'var(--info)'    },
                { statut: 'liste_attente', label: 'Liste d\'attente',  color: 'var(--accent-3)'},
                { statut: 'refuse',        label: 'Refusés',           color: 'var(--error)'   }
              ].map(({ statut, label, color }) => {
                // Calcul du pourcentage pour ce statut
                const pct = stats.total > 0 ? Math.round((stats[statut] || 0) / stats.total * 100) : 0;
                // N'affiche pas les segments à 0 % pour garder une barre propre
                return pct > 0 ? (
                  <div key={statut} className="repartition-segment" style={{ width: `${pct}%`, background: color }} title={`${label} : ${stats[statut]} (${pct}%)`} />
                ) : null;
              })}
            </div>
            {/* Légende avec pastille colorée + libellé + nombre */}
            <div className="repartition-legende">
              {[
                { statut: 'accepte',       label: 'Acceptés',          color: 'var(--success)' },
                { statut: 'en_attente',    label: 'En attente',        color: 'var(--warning)' },
                { statut: 'en_cours',      label: 'En cours',          color: 'var(--info)'    },
                { statut: 'liste_attente', label: 'Liste d\'attente',  color: 'var(--accent-3)'},
                { statut: 'refuse',        label: 'Refusés',           color: 'var(--error)'   }
              ].map(({ statut, label, color }) => (
                <div key={statut} className="legende-item">
                  <span className="legende-couleur" style={{ background: color }} />
                  <span>{label} ({stats[statut] || 0})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
