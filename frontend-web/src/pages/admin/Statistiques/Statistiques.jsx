// ============================================================
// FICHIER  : Statistiques.jsx (admin)
// ROUTE    : /admin/statistiques
// RÔLE     : Tableau de bord statistique de la crèche.
//            Charge en parallèle : inscriptions/stats, users,
//            actualites → calcule 6 KPIs + 2 sections de graphes.
//            Grille KPI 6 cartes colorées.
//            Barres de répartition des inscriptions (6 statuts).
//            Compteurs de comptes (parents/admins/total)
//            + actualités (publiées/brouillons).
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import '../../../styles/admin.css';
import './Statistiques.css';

const Statistiques = () => {
  // Objet agrégé contenant toutes les statistiques calculées
  const [stats,      setStats]      = useState(null);
  // Masque le contenu pendant les appels API
  const [chargement, setChargement] = useState(true);

  // ── Chargement en parallèle des 3 sources de données ─────
  useEffect(() => {
    const charger = async () => {
      try {
        const [resInsc, resUsers, resActus] = await Promise.all([
          api.get('/inscriptions/stats'),     // Répartition par statut
          api.get('/users'),                  // Liste complète des utilisateurs
          api.get('/actualites?limite=100')   // Toutes les actualités
        ]);

        const inscStats = resInsc.data.data  || {};
        const users     = resUsers.data.data || [];
        const actus     = resActus.data.data?.actualites || [];

        // Consolidation des statistiques dans un seul objet
        setStats({
          inscriptions:     inscStats,
          parents:          users.filter(u => u.role === 'parent').length,
          admins:           users.filter(u => ['admin','super_admin'].includes(u.role)).length,
          comptes:          users.length,
          actusPubliees:    actus.filter(a => a.publie).length,
          actusBrouillons:  actus.filter(a => !a.publie).length
        });
      } catch {}
      setChargement(false);
    };
    charger();
  }, []);

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="a-chargement">Chargement...</div>;
  // Garde : erreur de chargement (stats null après tentative)
  if (!stats) return <div className="a-vide"><span className="a-vide__icone">📊</span><p>Impossible de charger les statistiques.</p></div>;

  // Taux d'acceptation : accepte / total (arrondi à l'entier)
  const tauxAcceptation = stats.inscriptions.total > 0
    ? Math.round((stats.inscriptions.accepte || 0) / stats.inscriptions.total * 100)
    : 0;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><span>Statistiques</span> de la crèche</h1>
      </div>

      {/* ── GRILLE KPI 6 CARTES COLORÉES ─────────────────────── */}
      {/* Chaque carte : icône + valeur + libellé avec couleur thématique */}
      <div className="kpi-grille">
        {[
          { icone:'📝', label:'Total inscriptions',     valeur: stats.inscriptions.total || 0,      couleur:'orange' },
          { icone:'✅', label:'Inscriptions acceptées', valeur: stats.inscriptions.accepte || 0,    couleur:'vert'   },
          { icone:'⏳', label:'En attente de décision', valeur: stats.inscriptions.en_attente || 0, couleur:'bleu'   },
          { icone:'👨‍👩‍👧', label:'Comptes parents',       valeur: stats.parents,                      couleur:'violet' },
          { icone:'📰', label:'Actualités publiées',    valeur: stats.actusPubliees,                couleur:'rose'   },
          { icone:'🎯', label:'Taux d\'acceptation',    valeur: `${tauxAcceptation}%`,              couleur:'orange' }
        ].map(({ icone, label, valeur, couleur }) => (
          <div key={label} className={`stat-card stat-card--${couleur}`}>
            <span className="stat-card__icone">{icone}</span>
            <div>
              <p className="stat-card__valeur">{valeur}</p>
              <p className="stat-card__label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTIONS GRAPHIQUES ───────────────────────────────── */}
      <div className="stats-sections">

        {/* ── BARRES DE RÉPARTITION DES INSCRIPTIONS ──────────── */}
        <div className="a-card">
          <h2 className="a-card__titre">📝 Répartition des dossiers d'inscription</h2>
          <div className="stats-bars">
            {[
              { label:'Acceptés',         val: stats.inscriptions.accepte       || 0, color:'var(--success)', total: stats.inscriptions.total },
              { label:'En attente',       val: stats.inscriptions.en_attente    || 0, color:'var(--warning)', total: stats.inscriptions.total },
              { label:'En cours',         val: stats.inscriptions.en_cours      || 0, color:'var(--info)',    total: stats.inscriptions.total },
              { label:'Liste d\'attente', val: stats.inscriptions.liste_attente || 0, color:'var(--accent-3)',total: stats.inscriptions.total },
              { label:'Incomplets',       val: stats.inscriptions.incomplet     || 0, color:'#ff9800',        total: stats.inscriptions.total },
              { label:'Refusés',          val: stats.inscriptions.refuse        || 0, color:'var(--error)',   total: stats.inscriptions.total }
            ].map(({ label, val, color, total }) => {
              // Pourcentage arrondi pour la largeur de la barre
              const pct = total > 0 ? Math.round(val / total * 100) : 0;
              return (
                <div key={label} className="stat-bar-ligne">
                  <span className="stat-bar-label">{label}</span>
                  {/* Barre de fond gris + remplissage coloré proportionnel */}
                  <div className="stat-bar-fond">
                    <div className="stat-bar-remplissage" style={{ width:`${pct}%`, background:color }} />
                  </div>
                  {/* Valeur numérique + pourcentage à droite */}
                  <span className="stat-bar-valeur">{val} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COMPTEURS DE COMPTES ET ACTUALITÉS ───────────────── */}
        <div className="a-card">
          <h2 className="a-card__titre">👥 Répartition des comptes</h2>
          <div className="comptes-stats">
            {[
              { label:'Parents',       val: stats.parents, icone:'👨‍👩‍👧', color:'var(--primary)'   },
              { label:'Admins',        val: stats.admins,  icone:'👩‍💼', color:'var(--text-dark)'  },
              { label:'Total comptes', val: stats.comptes, icone:'👥',  color:'var(--secondary)' }
            ].map(({ label, val, icone, color }) => (
              <div key={label} className="compte-item">
                <span style={{ fontSize:'2.5rem' }}>{icone}</span>
                <div>
                  <p style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', fontWeight:700, color }}>{val}</p>
                  <p style={{ color:'var(--text-gray)', fontSize:'0.85rem' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sous-section actualités dans la même carte */}
          <div style={{ marginTop:'var(--space-xl)' }}>
            <h3 className="a-card__titre" style={{ borderBottom:'none', marginBottom:'var(--space-md)' }}>📰 Actualités</h3>
            <div className="comptes-stats">
              {/* Publiées */}
              <div className="compte-item">
                <span style={{ fontSize:'2.5rem' }}>🟢</span>
                <div>
                  <p style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', fontWeight:700, color:'var(--success)' }}>{stats.actusPubliees}</p>
                  <p style={{ color:'var(--text-gray)', fontSize:'0.85rem' }}>Publiées</p>
                </div>
              </div>
              {/* Brouillons */}
              <div className="compte-item">
                <span style={{ fontSize:'2.5rem' }}>⚫</span>
                <div>
                  <p style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', fontWeight:700, color:'var(--text-gray)' }}>{stats.actusBrouillons}</p>
                  <p style={{ color:'var(--text-gray)', fontSize:'0.85rem' }}>Brouillons</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Statistiques;
