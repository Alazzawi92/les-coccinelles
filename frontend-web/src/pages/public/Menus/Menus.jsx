// ============================================================
// FICHIER  : Menus.jsx
// ROUTE    : /menus
// RÔLE     : Page des menus hebdomadaires de la crèche.
//            Navigation semaine précédente / suivante.
//            Affiche le déjeuner et le goûter pour chaque jour.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import './Menus.css';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

// Quill produit "<p><br></p>" pour un champ vide
const quillVide = v => !v || v === '<p><br></p>';

// ── Utilitaire : calcule la date du lundi de la semaine donnée ──
// Retourne une chaîne YYYY-MM-DD utilisée comme clé d'API
const getLundiSemaine = (date = new Date()) => {
  const d   = new Date(date);
  const day = d.getDay();                              // 0=Dim, 1=Lun, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ramène au lundi
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

const Menus = () => {

  const [menu,       setMenu]       = useState(null);             // Données du menu courant
  const [chargement, setChargement] = useState(true);            // Indicateur de chargement
  const [semaine,    setSemaine]    = useState(getLundiSemaine()); // Date du lundi courant

  // ── Chargement du menu à chaque changement de semaine ─────
  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const res = await api.get(`/menus/${semaine}`); // Clé = date du lundi
        setMenu(res.data.data);
      } catch {
        setMenu(null); // Semaine sans menu publié
      }
      setChargement(false);
    };
    charger();
  }, [semaine]); // Recharge quand la semaine change

  // ── Navigation semaine ────────────────────────────────────
  // sens=-1 → semaine précédente, sens=+1 → semaine suivante
  const changerSemaine = (sens) => {
    const d = new Date(semaine);
    d.setDate(d.getDate() + sens * 7); // Décale de 7 jours
    setSemaine(d.toISOString().split('T')[0]);
  };

  // ── Formatage de la période de la semaine ─────────────────
  // Ex: "2 juin — 6 juin 2025"
  const formaterSemaine = (dateStr) => {
    const lundi    = new Date(dateStr);
    const vendredi = new Date(dateStr);
    vendredi.setDate(lundi.getDate() + 4); // Vendredi = lundi + 4 jours
    return `${lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${vendredi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="menus-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">🍽️ Menus</p>
          <h1 className="page-hero__titre">Menus de <span>la semaine</span></h1>
          <p className="page-hero__sous">Des repas équilibrés et adaptés aux tout-petits, préparés avec des produits frais</p>
        </div>
      </section>

      <section className="section-blanche">
        <div className="container">

          {/* Navigation entre les semaines */}
          <div className="semaine-nav">
            <button className="btn btn--ghost btn--sm" onClick={() => changerSemaine(-1)}>
              ← Semaine précédente
            </button>
            <h2 className="semaine-titre">
              📅 Semaine du {formaterSemaine(semaine)}
            </h2>
            <button className="btn btn--ghost btn--sm" onClick={() => changerSemaine(1)}>
              Semaine suivante →
            </button>
          </div>

          {/* ── État de chargement ────────────────────────────── */}
          {chargement ? (
            <div className="menus-chargement">Chargement du menu...</div>

          /* ── Menu disponible : grille 5 jours ──────────────── */
          ) : menu ? (
            <div className="menus-grille">
              {JOURS.map((jour) => (
                <div key={jour} className="menu-carte">
                  <div className="menu-carte__entete">
                    <span className="menu-carte__icone">🌟</span>
                    {/* Première lettre en majuscule */}
                    <h3 className="menu-carte__jour">
                      {jour.charAt(0).toUpperCase() + jour.slice(1)}
                    </h3>
                  </div>
                  <div className="menu-carte__repas">
                    <div className="repas-section repas-section--midi">
                      <p className="repas-label">🍽️ Déjeuner</p>
                      {quillVide(menu[`${jour}_midi`])
                        ? <p className="repas-contenu repas-vide">Non renseigné</p>
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_midi`] }} />
                      }
                    </div>
                    <div className="repas-section repas-section--gouter">
                      <p className="repas-label">🍪 Goûter</p>
                      {quillVide(menu[`${jour}_gouter`])
                        ? <p className="repas-contenu repas-vide">Non renseigné</p>
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_gouter`] }} />
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

          /* ── Aucun menu pour cette semaine ──────────────────── */
          ) : (
            <div className="liste-vide">
              <span>🍽️</span>
              <p>Le menu pour cette semaine n'a pas encore été publié.</p>
              <p className="liste-vide__sous">Revenez bientôt ou consultez la semaine précédente.</p>
            </div>
          )}

          {/* Encart engagement nutritionnel */}
          <div className="nutrition-info">
            <span>🥦</span>
            <div>
              <h3>Notre engagement nutritionnel</h3>
              <p>Nos repas sont élaborés par une diététicienne. Nous privilégions les produits locaux et biologiques, sans additifs. Les menus sont adaptés aux enfants allergiques sur présentation d'un PAI médical.</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Menus;
