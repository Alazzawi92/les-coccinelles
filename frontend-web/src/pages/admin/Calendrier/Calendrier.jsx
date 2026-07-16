// ============================================================
// FICHIER  : Calendrier.jsx (admin)
// ROUTE    : /admin/calendrier
// RÔLE     : Calendrier mensuel de présences/absences.
//            L'admin navigue mois par mois, clique sur un jour
//            et voit en temps réel la liste des enfants présents
//            et absents pour cette date.
//            GET /api/absences/presences/:date au clic sur un jour.
//            Logique : absent = a une absence validée/en_attente
//            couvrant ce jour. Présent = tous les autres.
// ============================================================

import { useState, useCallback } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Calendrier.css';

// Noms des mois en français
const MOIS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

// Noms courts des jours de la semaine (lundi en premier)
const JOURS_SEMAINE = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// Emoji et libellé pour chaque motif d'absence
const MOTIFS = {
  maladie:     '🤒 Maladie',
  vacances:    '🏖️ Vacances',
  rendez_vous: '🏥 RDV médical',
  autre:       '📝 Autre'
};

// Construire la grille du mois : tableau de 42 cases (6 semaines × 7 jours)
// null = case vide avant le 1er ou après le dernier jour
const construireGrilleMois = (annee, mois) => {
  const premierJour  = new Date(annee, mois, 1);
  const nbJours      = new Date(annee, mois + 1, 0).getDate();

  // getDay() : 0=dim → convertir en 0=lun
  const jourSemaine0 = premierJour.getDay();
  const decalage     = jourSemaine0 === 0 ? 6 : jourSemaine0 - 1;

  const grille = [];
  // Cases vides avant le 1er du mois
  for (let i = 0; i < decalage; i++) grille.push(null);
  // Jours du mois
  for (let j = 1; j <= nbJours; j++) grille.push(j);
  // Compléter la dernière ligne si besoin
  while (grille.length % 7 !== 0) grille.push(null);

  return grille;
};

// Formater un numéro de jour en date YYYY-MM-DD
const toDateStr = (annee, mois, jour) => {
  const mm = String(mois + 1).padStart(2, '0');
  const jj = String(jour).padStart(2, '0');
  return `${annee}-${mm}-${jj}`;
};

const CalendrierAdmin = () => {
  const now = new Date();

  // Mois/année actuellement affichés dans le calendrier
  const [annee,      setAnnee]      = useState(now.getFullYear());
  const [mois,       setMois]       = useState(now.getMonth()); // 0-indexé

  // Jour sélectionné (string YYYY-MM-DD) ou null
  const [jourSelec,  setJourSelec]  = useState(null);

  // Résultat de l'API : { date, presents: [], absents: [] }
  const [presences,  setPresences]  = useState(null);

  // Indicateur de chargement du panneau latéral
  const [chargement, setChargement] = useState(false);

  // Grille des jours du mois courant
  const grille = construireGrilleMois(annee, mois);

  // ── Navigation mois précédent / suivant ──────────────────
  const naviguer = (delta) => {
    let nouveauMois  = mois + delta;
    let nouvelleAnnee = annee;
    if (nouveauMois < 0)  { nouveauMois = 11; nouvelleAnnee--; }
    if (nouveauMois > 11) { nouveauMois = 0;  nouvelleAnnee++; }
    setMois(nouveauMois);
    setAnnee(nouvelleAnnee);
    // Réinitialise le panneau si le mois change
    setJourSelec(null);
    setPresences(null);
  };

  // ── Sélectionner un jour et charger les présences ────────
  const selectionnerJour = useCallback(async (jour) => {
    const dateStr = toDateStr(annee, mois, jour);
    setJourSelec(dateStr);
    setPresences(null);
    setChargement(true);
    try {
      const r = await api.get(`/absences/presences/${dateStr}`);
      setPresences(r.data.data);
    } catch {
      toast.error('Erreur lors du chargement des présences');
    }
    setChargement(false);
  }, [annee, mois]);

  // Date du jour pour mettre en évidence le jour actuel
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  // Formater la date sélectionnée pour l'en-tête du panneau
  const labelJourSelec = jourSelec
    ? new Date(jourSelec + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div>

      {/* ── EN-TÊTE ───────────────────────────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Calendrier <span>des présences</span></h1>
      </div>

      {/* ── ZONE PRINCIPALE : calendrier + panneau ────────── */}
      <div className="cal-conteneur">

        {/* ── CALENDRIER ──────────────────────────────────── */}
        <div className="cal-bloc">

          {/* Navigation mois : < Juillet 2026 > */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={() => naviguer(-1)}>‹</button>
            <h2 className="cal-nav-titre">{MOIS_FR[mois]} {annee}</h2>
            <button className="cal-nav-btn" onClick={() => naviguer(1)}>›</button>
          </div>

          {/* Grille 7 colonnes : en-têtes + jours */}
          <div className="cal-grille">

            {/* En-têtes des jours de la semaine */}
            {JOURS_SEMAINE.map(j => (
              <div key={j} className="cal-entete-jour">{j}</div>
            ))}

            {/* Cases du calendrier */}
            {grille.map((jour, idx) => {
              if (jour === null) {
                // Case vide (hors mois)
                return <div key={`vide-${idx}`} className="cal-case cal-case--vide" />;
              }

              const dateStr   = toDateStr(annee, mois, jour);
              const estAujourd = dateStr === todayStr;
              const estSelec   = dateStr === jourSelec;
              // Samedi (idx%7===5) et Dimanche (idx%7===6) après le décalage
              const posGrille  = idx % 7;
              const estWeekend = posGrille === 5 || posGrille === 6;

              return (
                <button
                  key={jour}
                  className={[
                    'cal-case',
                    estAujourd  ? 'cal-case--aujourd'   : '',
                    estSelec    ? 'cal-case--selec'      : '',
                    estWeekend  ? 'cal-case--weekend'    : '',
                  ].join(' ').trim()}
                  onClick={() => selectionnerJour(jour)}
                  title={`Voir les présences du ${jour} ${MOIS_FR[mois]} ${annee}`}
                >
                  {jour}
                </button>
              );
            })}
          </div>

          {/* Légende */}
          <div className="cal-legende">
            <span className="cal-legende-item"><span className="cal-legende-point cal-legende-point--aujourd" />Aujourd'hui</span>
            <span className="cal-legende-item"><span className="cal-legende-point cal-legende-point--selec" />Jour sélectionné</span>
            <span className="cal-legende-item"><span className="cal-legende-point cal-legende-point--weekend" />Week-end</span>
          </div>
        </div>

        {/* ── PANNEAU DES PRÉSENCES ───────────────────────── */}
        <div className="cal-panneau">

          {/* Aucun jour sélectionné */}
          {!jourSelec && (
            <div className="cal-panneau-vide">
              <span className="cal-panneau-icone">📅</span>
              <p>Cliquez sur un jour pour voir les présences</p>
            </div>
          )}

          {/* Chargement en cours */}
          {jourSelec && chargement && (
            <div className="cal-panneau-vide">
              <p>Chargement...</p>
            </div>
          )}

          {/* Données chargées */}
          {jourSelec && !chargement && presences && (
            <>
              {/* En-tête du panneau : date sélectionnée */}
              <h3 className="cal-panneau-titre">{labelJourSelec}</h3>

              {/* Résumé rapide : X présents / Y absents */}
              <div className="cal-resume">
                <div className="cal-resume-item cal-resume-item--present">
                  <span className="cal-resume-nb">{presences.presents.length}</span>
                  <span className="cal-resume-label">Présent{presences.presents.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="cal-resume-item cal-resume-item--absent">
                  <span className="cal-resume-nb">{presences.absents.length}</span>
                  <span className="cal-resume-label">Absent{presences.absents.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* ── LISTE DES PRÉSENTS ──────────────────────── */}
              <div className="cal-section">
                <p className="cal-section-titre cal-section-titre--present">
                  ✅ Présents ({presences.presents.length})
                </p>
                {presences.presents.length === 0 ? (
                  <p className="cal-vide-msg">Aucun enfant présent ce jour</p>
                ) : (
                  <ul className="cal-liste">
                    {presences.presents.map(e => (
                      <li key={e.id} className="cal-enfant">
                        <span className="cal-enfant-avatar">{e.sexe === 'F' ? '👧' : '👦'}</span>
                        <div className="cal-enfant-info">
                          <span className="cal-enfant-nom">{e.prenom} {e.nom}</span>
                          {e.groupe && <span className="cal-enfant-groupe">{e.groupe}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── LISTE DES ABSENTS ───────────────────────── */}
              <div className="cal-section">
                <p className="cal-section-titre cal-section-titre--absent">
                  ❌ Absents ({presences.absents.length})
                </p>
                {presences.absents.length === 0 ? (
                  <p className="cal-vide-msg">Aucune absence ce jour</p>
                ) : (
                  <ul className="cal-liste">
                    {presences.absents.map(e => (
                      <li key={e.id} className="cal-enfant cal-enfant--absent">
                        <span className="cal-enfant-avatar">{e.sexe === 'F' ? '👧' : '👦'}</span>
                        <div className="cal-enfant-info">
                          <span className="cal-enfant-nom">{e.prenom} {e.nom}</span>
                          <span className="cal-enfant-motif">
                            {MOTIFS[e.absence?.motif] || e.absence?.motif}
                          </span>
                          {/* Statut en attente : badge orange */}
                          {e.absence?.statut === 'en_attente' && (
                            <span className="cal-badge-attente">En attente</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CalendrierAdmin;
