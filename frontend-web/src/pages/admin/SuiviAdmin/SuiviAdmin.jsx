// ============================================================
// FICHIER  : SuiviAdmin.jsx (admin)
// ROUTE    : /admin/suivi
// RÔLE     : Saisie du suivi quotidien pour chaque enfant.
//            Sélection de la date (max = aujourd'hui).
//            N'affiche que les enfants "présents" (arrivés et pas
//            encore repartis) selon l'émargement de la date, comme
//            sur /admin/emargement — pas la peine de remplir un
//            suivi pour un enfant absent ou pas encore arrivé.
//            Charge en parallèle le suivi existant de chaque
//            enfant pour la date sélectionnée.
//            Pour chaque enfant : formulaire repas (3 selects),
//            biberons (liste heure + ml, quantités rapides, total),
//            siestes multiples (liste début/fin),
//            selles (oui/non + compteur), humeur (5 boutons emoji),
//            activités et note générale (textareas).
//            POST si nouveau (_nouveau flag), PUT si existant.
//            envoi{} : objet pour désactiver le bouton par enfant.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './SuiviAdmin.css';
import Chargement from '../../../components/ui/Chargement/Chargement';
import useMenuDuJour from '../../../hooks/useMenuDuJour';

// Date du jour au format YYYY-MM-DD (constante, ne change pas au rendu)
const today = new Date().toISOString().split('T')[0];

// ── Biberons ─────────────────────────────────────────────────
// Boutons de quantité rapide (ml) proposés sous chaque biberon
const QUANTITES_RAPIDES = [90, 120, 150, 180, 210];
// Même limite que le serveur
const BIBERON_ML_MAX = 400;

// Délai sans nouvelle saisie avant l'enregistrement automatique (ms)
const DELAI_SAUVEGARDE_AUTO = 1000;

// Types de selles proposés (même liste que le serveur)
const TYPES_SELLES = ['normale', 'molle', 'liquide'];

// Quantité valide : entier entre 0 et 400 ml
const mlValide = (ml) => ml !== '' && ml !== null && Number.isInteger(Number(ml))
  && Number(ml) >= 0 && Number(ml) <= BIBERON_ML_MAX;

// Heure actuelle "HH:MM" (pré-remplie pour un biberon ajouté aujourd'hui)
const heureActuelle = () => new Date().toTimeString().slice(0, 5);

// Calculer la durée en minutes entre deux horaires "HH:MM"
const calcDuree = (debut, fin) => {
  if (!debut || !fin) return null;
  const [dh, dm] = debut.split(':').map(Number);
  const [fh, fm] = fin.split(':').map(Number);
  const diff = (fh * 60 + fm) - (dh * 60 + dm);
  return diff > 0 ? diff : null;
};

// Formater une durée en minutes en "Xh Ym" pour l'affichage
const formatDuree = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

// Statut de présence à partir de l'émargement — même logique que /admin/emargement
const getStatutPresence = (emargement) => {
  if (!emargement)              return 'non_arrive';
  if (!emargement.heure_depart) return 'present';
  return 'parti';
};

const SuiviAdmin = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  // Liste des enfants inscrits chargée une seule fois au montage
  const [enfants,    setEnfants]    = useState([]);
  // Date sélectionnée pour le suivi (défaut = aujourd'hui)
  const [date,       setDate]       = useState(today);
  // Menu prévu pour la date choisie (rappel dans chaque carte enfant)
  const menuDuJour = useMenuDuJour(date);
  // Objet { [enfant_id]: suivi_data } — un suivi par enfant pour la date
  const [suivis,     setSuivis]     = useState({});
  // Masque le composant pendant le chargement des enfants
  const [chargement, setChargement] = useState(true);
  // État d'enregistrement par enfant :
  // 'modifie' (en attente) | 'enCours' | 'ok' | 'aCorriger' (saisie invalide) | 'erreur'
  const [etat,       setEtat]       = useState({});
  // Heure du dernier enregistrement réussi, par enfant ("10:42")
  const [derniereSauvegarde, setDerniereSauvegarde] = useState({});

  // Références lues par les minuteurs d'enregistrement automatique :
  // un minuteur garde la version des données du moment où il a été créé,
  // suivisRef donne toujours la DERNIÈRE version saisie.
  const suivisRef = useRef(suivis);
  suivisRef.current = suivis;
  const minuteurs = useRef({});   // setTimeout en attente, par enfant
  const enCours   = useRef({});   // true pendant une requête d'enregistrement
  const aRefaire  = useRef({});   // modification arrivée pendant une requête

  // Heures pré-remplies seulement si on saisit le suivi du jour même
  const estAujourdhui = date === today;

  // Options disponibles pour les selects repas
  const REPAS_OPTIONS   = ['absent', 'tout', 'peu', 'rien'];
  // Options disponibles pour les boutons d'humeur
  const HUMEUR_OPTIONS  = ['joyeux', 'calme', 'fatigue', 'pleureur', 'autre'];

  // ── Chargement des enfants présents ce jour-là ───────────
  // Réutilise /emargements/:date (même source que /admin/emargement) et
  // ne garde que les enfants "présents" (arrivés, pas encore repartis).
  useEffect(() => {
    setChargement(true);
    api.get(`/emargements/${date}`)
      .then(r => {
        const donnees = r.data.data || [];
        const presents = donnees
          .filter(({ emargement }) => getStatutPresence(emargement) === 'present')
          .map(({ enfant }) => enfant);
        setEnfants(presents);
      })
      .catch(() => setEnfants([]))
      .finally(() => setChargement(false));
  }, [date]);

  // ── Chargement des suivis quand la date ou les enfants changent ─
  // Appels parallèles : un GET /suivi/:id/:date par enfant
  useEffect(() => {
    if (enfants.length === 0) { setSuivis({}); return; }
    const chargerSuivis = async () => {
      const nouveauxSuivis = {};
      await Promise.all(enfants.map(async e => {
        try {
          const r = await api.get(`/suivi/${e.id}/${date}`);
          nouveauxSuivis[e.id] = {
            ...r.data.data,
            // S'assurer que les listes horodatées sont toujours des tableaux
            siestes:        r.data.data.siestes        || [],
            biberons:       r.data.data.biberons       || [],
            selles_details: r.data.data.selles_details || []
          };
        } catch {
          // Pas de suivi pour ce jour → initialiser un objet vide marqué _nouveau
          // _nouveau : flag interne, jamais envoyé à l'API
          nouveauxSuivis[e.id] = {
            enfant_id:      e.id,
            date_suivi:     date,
            repas_matin:    'absent',
            repas_midi:     'absent',
            repas_gouter:   'absent',
            repas_note:     '',
            siestes:        [],           // [{debut, fin}] — fin vide = sieste en cours
            activites:      '',
            humeur:         '',
            biberons:       [],           // [{heure, ml}] — un élément par biberon
            selles_details: [],           // [{heure, type}] — un élément par selle
            temperature:    '',
            note_generale:  '',
            _nouveau:       true          // Indique qu'il faut faire un POST et non PUT
          };
        }
      }));
      setSuivis(nouveauxSuivis);
      setEtat({});
      setDerniereSauvegarde({});
    };
    chargerSuivis();
  }, [date, enfants]); // Se relance à chaque changement de date

  // ── Enregistrement automatique ───────────────────────────
  // Chaque modification (re)lance un minuteur : 1 s sans nouvelle saisie
  // → enregistrement. Le bouton "Enregistrer" reste disponible.
  const programmerSauvegarde = (enfantId) => {
    setEtat(prev => ({ ...prev, [enfantId]: 'modifie' }));
    clearTimeout(minuteurs.current[enfantId]);
    minuteurs.current[enfantId] = setTimeout(() => {
      delete minuteurs.current[enfantId];
      sauvegarder(enfantId, { auto: true });
    }, DELAI_SAUVEGARDE_AUTO);
  };

  // Changement de date ou sortie de la page : on enregistre tout de suite
  // ce qui était encore en attente, pour ne rien perdre
  useEffect(() => () => {
    Object.keys(minuteurs.current).forEach(id => {
      clearTimeout(minuteurs.current[id]);
      delete minuteurs.current[id];
      sauvegarder(Number(id), { auto: true });
    });
  }, [date]); // Volontairement lié à la date seule (sauvegarder lit suivisRef)

  // Fermeture de l'onglet avec une saisie pas encore enregistrée : avertissement
  useEffect(() => {
    const enAttente = Object.values(etat).some(e => e === 'modifie' || e === 'enCours');
    if (!enAttente) return;
    const avertir = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [etat]);

  // ── Mise à jour d'un champ d'un suivi spécifique ─────────
  // Merge immutable sur l'objet suivis pour un seul enfant, puis
  // enregistrement automatique
  const majSuivi = (enfantId, champ, valeur) => {
    setSuivis(prev => ({ ...prev, [enfantId]: { ...prev[enfantId], [champ]: valeur } }));
    programmerSauvegarde(enfantId);
  };

  // Outils communs aux listes horodatées (siestes, biberons, selles)
  const majListe = (enfantId, cle, index, champ, valeur) => {
    const liste = [...(suivis[enfantId]?.[cle] || [])];
    liste[index] = { ...liste[index], [champ]: valeur };
    majSuivi(enfantId, cle, liste);
  };
  const supprimerDeListe = (enfantId, cle, index) => {
    const liste = [...(suivis[enfantId]?.[cle] || [])];
    liste.splice(index, 1);
    majSuivi(enfantId, cle, liste);
  };
  const ajouterAListe = (enfantId, cle, element) =>
    majSuivi(enfantId, cle, [...(suivis[enfantId]?.[cle] || []), element]);

  // ── Siestes : début = heure actuelle, bouton "Réveil maintenant" ──
  const ajouterSieste   = (enfantId) => ajouterAListe(enfantId, 'siestes', { debut: estAujourdhui ? heureActuelle() : '', fin: '' });
  const majSieste       = (enfantId, index, champ, valeur) => majListe(enfantId, 'siestes', index, champ, valeur);
  const reveilSieste    = (enfantId, index) => majListe(enfantId, 'siestes', index, 'fin', heureActuelle());
  const supprimerSieste = (enfantId, index) => supprimerDeListe(enfantId, 'siestes', index);

  // ── Biberons : heure actuelle à l'ajout, bouton ⏱ pour la remettre ──
  const ajouterBiberon   = (enfantId) => ajouterAListe(enfantId, 'biberons', { heure: estAujourdhui ? heureActuelle() : '', ml: '' });
  const majBiberon       = (enfantId, index, champ, valeur) => majListe(enfantId, 'biberons', index, champ, valeur);
  const supprimerBiberon = (enfantId, index) => supprimerDeListe(enfantId, 'biberons', index);

  // ── Selles : heure actuelle + type (normale / molle / liquide) ──
  const ajouterSelle   = (enfantId) => ajouterAListe(enfantId, 'selles_details', { heure: estAujourdhui ? heureActuelle() : '', type: 'normale' });
  const majSelle       = (enfantId, index, champ, valeur) => majListe(enfantId, 'selles_details', index, champ, valeur);
  const supprimerSelle = (enfantId, index) => supprimerDeListe(enfantId, 'selles_details', index);

  // ── Sauvegarde du suivi d'un enfant ──────────────────────
  // POST si _nouveau ou pas d'id, PUT sinon.
  // auto : enregistrement automatique (pas de toast de succès)
  const sauvegarder = async (enfantId, { auto = false } = {}) => {
    clearTimeout(minuteurs.current[enfantId]);
    delete minuteurs.current[enfantId];

    const s = suivisRef.current[enfantId];
    if (!s) return;

    // Une requête est déjà en cours pour cet enfant : on relancera à la fin
    // (évite deux POST simultanés qui créeraient le suivi en double)
    if (enCours.current[enfantId]) { aRefaire.current[enfantId] = true; return; }

    // Chaque biberon doit avoir une quantité valide (0 à 400 ml)
    if ((s.biberons || []).some(b => !mlValide(b.ml))) {
      setEtat(prev => ({ ...prev, [enfantId]: 'aCorriger' }));
      if (!auto) toast.error(t('admin.suivi.mlInvalide', { max: BIBERON_ML_MAX }));
      return;
    }

    enCours.current[enfantId] = true;
    setEtat(prev => ({ ...prev, [enfantId]: 'enCours' }));
    try {
      // Nettoyer le payload : supprimer les champs internes et convertir les vides en null.
      // biberon_nb / biberon_ml / selles / selles_nb : recalculés par le serveur
      const { _nouveau, id, created_at, updated_at, biberon_nb, biberon_ml, selles, selles_nb, ...payload } = s;
      const propre = {
        ...payload,
        enfant_id:      enfantId,
        date_suivi:     s.date_suivi || date,
        humeur:         payload.humeur       || null,
        temperature:    payload.temperature  || null,
        biberons:       (payload.biberons || []).map(b => ({ heure: b.heure || null, ml: Number(b.ml) })),
        // Une sieste sans fin = en cours : elle est enregistrée quand même
        siestes:        (payload.siestes || []).filter(sv => sv.debut).map(sv => ({ debut: sv.debut, fin: sv.fin || null })),
        selles_details: (payload.selles_details || []).map(e => ({ heure: e.heure || null, type: e.type || 'normale' }))
      };
      const res = (_nouveau || !id)
        ? await api.post('/suivi', propre)          // Création
        : await api.put(`/suivi/${id}`, propre);    // Mise à jour

      // On ne remplace PAS les champs affichés par la réponse : l'équipe a pu
      // continuer à saisir pendant la requête. On récupère seulement l'id.
      const nouvelId = res.data.data?.id ?? id;
      suivisRef.current = { ...suivisRef.current, [enfantId]: { ...suivisRef.current[enfantId], id: nouvelId, _nouveau: false } };
      setSuivis(prev => ({ ...prev, [enfantId]: { ...prev[enfantId], id: nouvelId, _nouveau: false } }));
      setEtat(prev => ({ ...prev, [enfantId]: aRefaire.current[enfantId] ? 'modifie' : 'ok' }));
      setDerniereSauvegarde(prev => ({ ...prev, [enfantId]: heureActuelle() }));
      if (!auto) {
        const enfant = enfants.find(e => e.id === enfantId);
        toast.success(t('admin.suivi.toastEnregistre', { prenom: enfant?.prenom }));
      }
    } catch (err) {
      setEtat(prev => ({ ...prev, [enfantId]: 'erreur' }));
      toast.error(err.response?.data?.message || t('admin.suivi.erreurEnregistrement'));
    } finally {
      enCours.current[enfantId] = false;
      if (aRefaire.current[enfantId]) {
        aRefaire.current[enfantId] = false;
        sauvegarder(enfantId, { auto: true });
      }
    }
  };

  // Garde : spinner si chargement des enfants en cours
  if (chargement) return <Chargement className="a-chargement" />;
  // Garde : aucun enfant présent ce jour-là (voir /admin/emargement pour pointer les arrivées)
  if (enfants.length === 0) return <div className="a-vide"><span className="a-vide__icone">👶</span><p>{t('admin.suivi.aucunPresent')}</p></div>;

  return (
    <div>

      {/* ── EN-TÊTE AVEC SÉLECTEUR DE DATE ───────────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey="admin.suivi.titre" components={{ s: <span /> }} /></h1>
        {/* max=today empêche de saisir un suivi dans le futur */}
        <input
          type="date"
          className="a-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
          style={{ width:'auto' }}
        />
      </div>

      <p style={{ color:'var(--text-gray)', fontSize:'0.9rem', marginBottom:'var(--space-xl)' }}>
        {t('admin.suivi.intro', { date: new Date(date).toLocaleDateString(getLocale(), { weekday:'long', day:'numeric', month:'long' }) })}
      </p>

      {/* ── GRILLE DES CARTES ENFANT ──────────────────────────── */}
      {/* Une carte par enfant avec tous les champs du suivi */}
      <div className="suivi-admin-grille">
        {enfants.map(enfant => {
          const s = suivis[enfant.id];
          if (!s) return null; // Suivi non encore chargé pour cet enfant

          return (
            <div key={enfant.id} className="suivi-admin-carte">

              {/* En-tête de la carte : emoji sexe + nom */}
              <div className="suivi-admin-entete">
                <span className="suivi-admin-avatar">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                <h3>{enfant.prenom} {enfant.nom}</h3>
                {/* Badge "Nouveau" si pas encore de suivi enregistré ce jour */}
                {!s._nouveau && !s.id && <span className="suivi-nouveau-badge">{t('admin.suivi.nouveau')}</span>}
              </div>

              {/* ── REPAS ─────────────────────────────────────── */}
              {/* 3 selects côte à côte : matin, midi, gouter */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.repas')}</p>
                <div className="repas-row">
                  {['matin', 'midi', 'gouter'].map(r => (
                    <div key={r} className="repas-col">
                      <p className="repas-mini-label">{t(`admin.suivi.moments.${r}`)}</p>
                      {/* Clé dynamique : repas_matin / repas_midi / repas_gouter */}
                      <select
                        className="repas-select"
                        value={s[`repas_${r}`]}
                        onChange={e => majSuivi(enfant.id, `repas_${r}`, e.target.value)}
                      >
                        {REPAS_OPTIONS.map(o => <option key={o} value={o}>{t(`common.repasValeur.${o}`)}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {/* Rappel du menu du jour (page Menus) pendant la saisie */}
                {(menuDuJour.midi || menuDuJour.gouter) && (
                  <div className="suivi-menu-rappel">
                    {menuDuJour.midi   && <p><strong>🍽️ {t('admin.suivi.moments.midi')} :</strong> {menuDuJour.midi}</p>}
                    {menuDuJour.gouter && <p><strong>🍪 {t('admin.suivi.moments.gouter')} :</strong> {menuDuJour.gouter}</p>}
                  </div>
                )}
              </div>

              {/* ── BIBERONS ──────────────────────────────────── */}
              {/* Une ligne par biberon : heure + quantité (ml) + quantités rapides.
                  Le total (nombre + ml) est calculé automatiquement. */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.biberon')}</p>
                {(s.biberons || []).map((b, idx) => {
                  const invalide = b.ml !== '' && !mlValide(b.ml);
                  return (
                    <div key={idx} className="biberon-item">
                      <div className="biberon-ligne">
                        <span className="sieste-numero">{idx + 1}</span>
                        <input
                          type="time"
                          className="a-input biberon-heure"
                          value={b.heure || ''}
                          onChange={e => majBiberon(enfant.id, idx, 'heure', e.target.value)}
                          aria-label={t('admin.suivi.heureBiberon', { n: idx + 1 })}
                        />
                        <button
                          type="button"
                          className="btn-maintenant btn-maintenant--icone"
                          onClick={() => majBiberon(enfant.id, idx, 'heure', heureActuelle())}
                          title={t('admin.suivi.mettreHeureActuelle')}
                          aria-label={t('admin.suivi.mettreHeureActuelle')}
                        >⏱</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={`a-input biberon-ml-input ${invalide ? 'biberon-ml-input--erreur' : ''}`}
                          value={b.ml}
                          onChange={e => majBiberon(enfant.id, idx, 'ml', e.target.value)}
                          placeholder={t('admin.suivi.mlPlaceholder')}
                          aria-label={t('admin.suivi.quantiteBiberon', { n: idx + 1 })}
                          min="0"
                          max={BIBERON_ML_MAX}
                          step="10"
                        />
                        <span className="compteur-unite">ml</span>
                        <button
                          type="button"
                          className="sieste-supprimer"
                          onClick={() => supprimerBiberon(enfant.id, idx)}
                          title={t('admin.suivi.supprimerBiberon')}
                          aria-label={t('admin.suivi.supprimerBiberon')}
                        >✕</button>
                      </div>
                      {/* Quantités rapides : un clic remplit le champ ml */}
                      <div className="biberon-rapides">
                        {QUANTITES_RAPIDES.map(q => (
                          <button
                            key={q}
                            type="button"
                            className={`biberon-rapide ${Number(b.ml) === q && b.ml !== '' ? 'biberon-rapide--actif' : ''}`}
                            onClick={() => majBiberon(enfant.id, idx, 'ml', q)}
                          >{q}</button>
                        ))}
                      </div>
                      {invalide && <p className="biberon-erreur">{t('admin.suivi.mlInvalide', { max: BIBERON_ML_MAX })}</p>}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="sieste-ajouter"
                  onClick={() => ajouterBiberon(enfant.id)}
                >
                  {t('admin.suivi.ajouterBiberon')}
                </button>
                {/* Total de la journée, si au moins un biberon */}
                {(s.biberons || []).length > 0 && (
                  <p className="biberon-total">
                    {t('admin.suivi.totalBiberons', {
                      count: s.biberons.length,
                      ml: s.biberons.reduce((total, b) => total + (mlValide(b.ml) ? Number(b.ml) : 0), 0)
                    })}
                  </p>
                )}
              </div>

              {/* ── SIESTES MULTIPLES ─────────────────────────── */}
              {/* Liste de siestes avec début + fin + durée calculée automatiquement */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.siestes')}</p>
                {/* Liste des siestes saisies */}
                {(s.siestes || []).map((sv, idx) => {
                  const duree = calcDuree(sv.debut, sv.fin);
                  return (
                    <div key={idx} className="sieste-item">
                      {/* Numéro de la sieste */}
                      <span className="sieste-numero">{idx + 1}</span>
                      {/* Heure de début */}
                      <input
                        type="time"
                        className="a-input sieste-time"
                        value={sv.debut || ''}
                        onChange={e => majSieste(enfant.id, idx, 'debut', e.target.value)}
                      />
                      <span className="sieste-fleche">→</span>
                      {/* Heure de fin */}
                      <input
                        type="time"
                        className="a-input sieste-time"
                        value={sv.fin || ''}
                        onChange={e => majSieste(enfant.id, idx, 'fin', e.target.value)}
                      />
                      {/* Durée calculée automatiquement si début et fin renseignés */}
                      {duree && (
                        <span className="sieste-duree">{formatDuree(duree)}</span>
                      )}
                      {/* Sieste commencée mais pas terminée : l'enfant dort encore */}
                      {sv.debut && !sv.fin && (
                        <>
                          <span className="sieste-en-cours">😴 {t('admin.suivi.enCours')}</span>
                          <button
                            type="button"
                            className="btn-maintenant"
                            onClick={() => reveilSieste(enfant.id, idx)}
                          >⏰ {t('admin.suivi.reveilMaintenant')}</button>
                        </>
                      )}
                      {/* Bouton supprimer cette sieste */}
                      <button
                        type="button"
                        className="sieste-supprimer"
                        onClick={() => supprimerSieste(enfant.id, idx)}
                        title={t('admin.suivi.supprimerSieste')}
                      >✕</button>
                    </div>
                  );
                })}
                {/* Bouton ajouter une nouvelle sieste */}
                <button
                  type="button"
                  className="sieste-ajouter"
                  onClick={() => ajouterSieste(enfant.id)}
                >
                  {t('admin.suivi.ajouterSieste')}
                </button>
              </div>

              {/* ── SELLES ────────────────────────────────────── */}
              {/* Une ligne par selle : heure (actuelle à l'ajout) + type.
                  Le nombre est calculé automatiquement. */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.selles')}</p>
                {(s.selles_details || []).map((e, idx) => (
                  <div key={idx} className="selle-item">
                    <span className="sieste-numero">{idx + 1}</span>
                    <input
                      type="time"
                      className="a-input biberon-heure"
                      value={e.heure || ''}
                      onChange={ev => majSelle(enfant.id, idx, 'heure', ev.target.value)}
                      aria-label={t('admin.suivi.heureSelle', { n: idx + 1 })}
                    />
                    <button
                      type="button"
                      className="btn-maintenant btn-maintenant--icone"
                      onClick={() => majSelle(enfant.id, idx, 'heure', heureActuelle())}
                      title={t('admin.suivi.mettreHeureActuelle')}
                      aria-label={t('admin.suivi.mettreHeureActuelle')}
                    >⏱</button>
                    {/* Type : normale / molle / liquide (utile en cas de maladie) */}
                    <div className="selle-types" role="group" aria-label={t('admin.suivi.typeSelle')}>
                      {TYPES_SELLES.map(type => (
                        <button
                          key={type}
                          type="button"
                          className={`selle-type selle-type--${type} ${e.type === type ? 'selle-type--actif' : ''}`}
                          aria-pressed={e.type === type}
                          onClick={() => majSelle(enfant.id, idx, 'type', type)}
                        >{t(`common.typeSelle.${type}`)}</button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="sieste-supprimer"
                      onClick={() => supprimerSelle(enfant.id, idx)}
                      title={t('admin.suivi.supprimerSelle')}
                      aria-label={t('admin.suivi.supprimerSelle')}
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  className="sieste-ajouter"
                  onClick={() => ajouterSelle(enfant.id)}
                >
                  {t('admin.suivi.ajouterSelle')}
                </button>
                {(s.selles_details || []).length === 0 && (
                  <p className="suivi-aucune">{t('admin.suivi.aucuneSelle')}</p>
                )}
              </div>

              {/* ── HUMEUR ────────────────────────────────────── */}
              {/* 5 boutons emoji cliquables, actif = fond coloré */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.humeur')}</p>
                <div className="humeur-row">
                  {HUMEUR_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`humeur-btn ${s.humeur === h ? 'humeur-btn--actif' : ''}`}
                      onClick={() => majSuivi(enfant.id, 'humeur', h)}
                      title={t(`common.humeur.${h}`)}
                      aria-label={t(`common.humeur.${h}`)}
                    >
                      {/* Emoji correspondant à chaque valeur d'humeur */}
                      {{'joyeux':'😄','calme':'😊','fatigue':'😴','pleureur':'😢','autre':'😐'}[h]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── ACTIVITÉS & NOTE GÉNÉRALE ─────────────────── */}
              {/* Activités : visible par l'admin, note_generale : visible par le parent */}
              <div className="suivi-admin-section">
                <p className="suivi-admin-label">{t('admin.suivi.activitesNote')}</p>
                <textarea
                  className="a-input a-textarea"
                  rows={2}
                  value={s.activites || ''}
                  onChange={e => majSuivi(enfant.id, 'activites', e.target.value)}
                  placeholder={t('admin.suivi.activitesPlaceholder')}
                />
                {/* Note générale : message transmis aux parents dans leur espace */}
                <textarea
                  className="a-input a-textarea"
                  rows={2}
                  value={s.note_generale || ''}
                  onChange={e => majSuivi(enfant.id, 'note_generale', e.target.value)}
                  placeholder={t('admin.suivi.notePlaceholder')}
                  style={{ marginTop:'var(--space-sm)' }}
                />
              </div>

              {/* Bouton d'enregistrement individuel par enfant */}
              <button
                className="btn btn--primary"
                style={{ width:'100%' }}
                onClick={() => sauvegarder(enfant.id)}
                disabled={etat[enfant.id] === 'enCours'}
              >
                {etat[enfant.id] === 'enCours' ? t('common.enregistrement') : t('admin.suivi.enregistrer')}
              </button>
              {/* État de l'enregistrement automatique */}
              {etat[enfant.id] && (
                <p className={`suivi-etat suivi-etat--${etat[enfant.id]}`} role="status">
                  {etat[enfant.id] === 'ok'
                    ? t('admin.suivi.etat.ok', { heure: derniereSauvegarde[enfant.id] })
                    : t(`admin.suivi.etat.${etat[enfant.id]}`)}
                </p>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SuiviAdmin;
