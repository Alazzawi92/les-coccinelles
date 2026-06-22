// ============================================================
// FICHIER  : Equipe.jsx
// ROUTE    : /equipe
// RÔLE     : Page de présentation de l'équipe éducative.
//            Membres chargés depuis /api/equipe (table equipe_membres).
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import './Equipe.css';

const photoUrl = (membre) => {
  try {
    const data = JSON.parse(membre.photo);
    return `http://localhost:3002${data.web}`;
  } catch { return null; }
};

const Equipe = () => {
  const [membres,    setMembres]    = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get('/equipe')
      .then(r => setMembres(r.data.data || []))
      .catch(() => setMembres([]))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="equipe">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--bleu">
        <div className="container">
          <p className="page-hero__tag">👥 L'équipe</p>
          <h1 className="page-hero__titre">Notre <span>équipe éducative</span></h1>
          <p className="page-hero__sous">Des professionnelles qualifiées et passionnées à l'écoute de vos enfants</p>
        </div>
      </section>

      {/* ── INTRO ─────────────────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">Une équipe diplômée</h2>
            <p>Notre équipe est composée de professionnelles de la petite enfance, toutes diplômées. Elles se forment régulièrement pour offrir les meilleures pratiques d'accueil.</p>
            <p>La continuité des soins est une priorité : les mêmes professionnelles accompagnent votre enfant tout au long de son parcours à la crèche.</p>
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">👩‍👧‍👦</div>
            {membres.length > 0 && (
              <div className="info-bulle">
                <strong>{membres.length}</strong>
                <span>membre{membres.length > 1 ? 's' : ''} d'équipe</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── GRILLE DES MEMBRES ───────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Les membres de l'équipe</h2>

          {chargement ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-gray)' }}>
              Chargement...
            </div>
          ) : membres.length === 0 ? (
            <div className="liste-vide">
              <span>👥</span>
              <p>L'équipe sera présentée prochainement.</p>
            </div>
          ) : (
            <div className="equipe-grille">
              {membres.map(m => (
                <div key={m.id} className="membre-carte">
                  <div className="membre-carte__avatar">
                    {photoUrl(m)
                      ? <img src={photoUrl(m)} alt={`${m.prenom} ${m.nom}`} />
                      : <span>{m.prenom[0]}{m.nom[0]}</span>
                    }
                  </div>
                  <h3 className="membre-carte__nom">{m.prenom} {m.nom}</h3>
                  <p className="membre-carte__poste">{m.titre}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>Vous voulez rencontrer l'équipe ?</p>
          <Link to="/contact" className="btn btn--primary btn--lg">Prendre contact</Link>
        </div>
      </section>

    </div>
  );
};

export default Equipe;
