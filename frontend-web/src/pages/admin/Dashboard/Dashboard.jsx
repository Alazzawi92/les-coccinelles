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
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import '../../../styles/admin.css';
import './Dashboard.css';
import Chargement from '../../../components/ui/Chargement/Chargement';

const AdminDashboard = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Récupère le prénom de l'admin pour la salutation et l'id pour filtrer les messages
  const { user } = useAuth();

  // stats : données de /inscriptions/stats (total, en_attente, accepte, etc.)
  const [stats,   setStats]   = useState(null);
  // alertes : liste des alertes calculées (absences en attente + messages non lus)
  // cle + n : clé de traduction et nombre, traduits à l'affichage (pluriel géré par i18next)
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
        if (abs.length > 0)  al.push({ type: 'absence',  cle: 'alerteAbsences', n: abs.length, lien: '/admin/absences',    icone: '📅' });
        if (msg.length > 0)  al.push({ type: 'message',  cle: 'alerteMessages', n: msg.length, lien: '/admin/messagerie',  icone: '✉️' });
        setAlertes(al);
      } catch {}
      setCharge(false);
    };
    charger();
  }, [user.id]); // Se relance si l'admin change de session

  // Garde : affiche un spinner pendant le chargement
  if (charge) return <Chargement className="a-chargement" />;

  return (
    <div className="admin-dashboard">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <div>
          <h1 className="admin-page-titre"><Trans i18nKey="admin.dashboard.titre" components={{ s: <span /> }} /></h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            {t('admin.dashboard.bienvenue', { prenom: user?.prenom })}
          </p>
        </div>
        {/* Date du jour affichée en haut à droite */}
        <p className="admin-date">
          {new Date().toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
              <span>{t(`admin.dashboard.${a.cle}`, { count: a.n })}</span>
              <span className="alerte-lien">{t('common.voir')}</span>
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
              // cle : statut, sert aussi de clé de traduction (admin.dashboard.stats.*)
              { cle: 'total',         icone: '📝', couleur: 'orange' },
              { cle: 'en_attente',    icone: '⏳', couleur: 'orange' },
              { cle: 'accepte',       icone: '✅', couleur: 'vert'   },
              { cle: 'en_cours',      icone: '🔄', couleur: 'bleu'   },
              { cle: 'liste_attente', icone: '📋', couleur: 'violet' },
              { cle: 'refuse',        icone: '❌', couleur: 'rouge'  }
            ].map(({ cle, icone, couleur }) => ({ label: t(`admin.dashboard.stats.${cle}`), valeur: stats[cle] || 0, icone, couleur }))
             .map(({ label, valeur, icone, couleur }) => (
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
        <h2 className="a-card__titre" style={{ marginBottom: 'var(--space-lg)' }}>⚡ {t('admin.dashboard.actionsRapides')}</h2>
        <div className="raccourcis-admin">
          {[
            // cle : clé de traduction (admin.dashboard.raccourcis.*)
            { to: '/admin/inscriptions', icone: '📝', cle: 'inscriptions', couleur: 'orange' },
            { to: '/admin/suivi',        icone: '📋', cle: 'suivi',        couleur: 'vert'   },
            { to: '/admin/absences',     icone: '📅', cle: 'absences',     couleur: 'bleu'   },
            { to: '/admin/actualites',   icone: '📰', cle: 'actualites',   couleur: 'violet' },
            { to: '/admin/menus',        icone: '🍽️', cle: 'menus',        couleur: 'rose'   },
            { to: '/admin/messagerie',   icone: '✉️', cle: 'messagerie',   couleur: 'jaune'  }
          ].map(({ to, icone, cle, couleur }) => (
            <Link key={to} to={to} className={`raccourci-admin raccourci-admin--${couleur}`}>
              <span className="raccourci-admin__icone">{icone}</span>
              <div>
                <p className="raccourci-admin__label">{t(`admin.dashboard.raccourcis.${cle}.label`)}</p>
                <p className="raccourci-admin__desc">{t(`admin.dashboard.raccourcis.${cle}.desc`)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GRAPHIQUE RÉPARTITION DES DOSSIERS ───────────────── */}
      {/* Barre proportionnelle avec légende en dessous */}
      {stats && (
        <div className="admin-dashboard__section">
          <h2 className="a-card__titre" style={{ marginBottom: 'var(--space-lg)' }}>📊 {t('admin.dashboard.repartition')}</h2>
          <div className="a-card">
            {/* Barre proportionnelle : chaque segment a une largeur en % */}
            <div className="repartition-barre">
              {[
                { statut: 'accepte',       label: t('admin.dashboard.stats.accepte'),  color: 'var(--success)' },
                { statut: 'en_attente',    label: t('admin.dashboard.stats.en_attente'),  color: 'var(--warning)' },
                { statut: 'en_cours',      label: t('admin.dashboard.stats.en_cours'),  color: 'var(--info)'    },
                { statut: 'liste_attente', label: t('admin.dashboard.stats.liste_attente'),  color: 'var(--accent-3)'},
                { statut: 'refuse',        label: t('admin.dashboard.stats.refuse'),  color: 'var(--error)'   }
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
                { statut: 'accepte',       label: t('admin.dashboard.stats.accepte'),  color: 'var(--success)' },
                { statut: 'en_attente',    label: t('admin.dashboard.stats.en_attente'),  color: 'var(--warning)' },
                { statut: 'en_cours',      label: t('admin.dashboard.stats.en_cours'),  color: 'var(--info)'    },
                { statut: 'liste_attente', label: t('admin.dashboard.stats.liste_attente'),  color: 'var(--accent-3)'},
                { statut: 'refuse',        label: t('admin.dashboard.stats.refuse'),  color: 'var(--error)'   }
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
