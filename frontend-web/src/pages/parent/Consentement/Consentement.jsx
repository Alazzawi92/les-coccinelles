// ============================================================
// FICHIER  : Consentement.jsx (parent)
// ROUTE    : /parent/consentement
// RÔLE     : Gestion du consentement photographique RGPD
//            par enfant. Charge GET /galerie/consentement.
//            toggleConsentement : POST /galerie/consentement
//            avec { enfant_id, consenti: !actuel }.
//            Mise à jour optimiste : met à jour l'état local
//            avant confirmation serveur.
//            envoi{} : objet pour désactiver le bouton par enfant.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Consentement.css';

const Consentement = () => {
  // Liste des enfants avec leur statut de consentement photo
  const [enfantsConsentements, setEnfantsConsentements] = useState([]);
  // Masque la liste pendant le chargement initial
  const [chargement, setChargement] = useState(true);
  // Objet { [enfant.id]: true/false } pour désactiver le bouton par enfant
  const [envoi,      setEnvoi]      = useState({});

  // ── Chargement des consentements au montage ───────────────
  useEffect(() => {
    api.get('/galerie/consentement')
      .then(r => setEnfantsConsentements(r.data.data || []))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  // ── Accorder ou retirer le consentement ──────────────────
  // POST /galerie/consentement avec { enfant_id, consenti: !actuel }
  const toggleConsentement = async (enfantId, actuel) => {
    setEnvoi(prev => ({ ...prev, [enfantId]: true }));
    try {
      await api.post('/galerie/consentement', { enfant_id: enfantId, consenti: !actuel });
      // Mise à jour optimiste : met à jour le statut et la date localement
      setEnfantsConsentements(prev => prev.map(e =>
        e.id === enfantId
          ? { ...e, consentement: { ...e.consentement, consenti: !actuel, date_consentement: new Date().toISOString() } }
          : e
      ));
      toast.success(!actuel ? 'Consentement accordé' : 'Consentement retiré');
    } catch { toast.error('Erreur lors de la mise à jour'); }
    setEnvoi(prev => ({ ...prev, [enfantId]: false }));
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">Chargement...</div>;

  return (
    <div className="consentement-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre">Consentement <span>RGPD</span></h1>
      </div>

      {/* ── INFORMATIONS RGPD ─────────────────────────────────── */}
      <div className="p-card rgpd-info">
        <h2 className="p-card__titre">📋 À propos du consentement photographique</h2>
        <p>Conformément au RGPD, la publication de photos de votre enfant nécessite votre accord explicite.</p>
        <p>En accordant votre consentement :</p>
        <ul>
          <li>✅ Les photos de votre enfant seront visibles dans votre galerie privée</li>
          <li>✅ Votre enfant pourra apparaître dans les albums partagés avec les familles</li>
        </ul>
        <p>En refusant ou retirant votre consentement :</p>
        <ul>
          <li>❌ Aucune photo de votre enfant ne sera accessible</li>
          {/* Effet immédiat : masquage à la prochaine génération côté API */}
          <li>❌ Les photos existantes seront masquées immédiatement</li>
        </ul>
        {/* Traçabilité RGPD : date + IP enregistrées côté serveur */}
        <p className="rgpd-note">Vous pouvez modifier votre consentement à tout moment. Votre décision est enregistrée avec la date et l'adresse IP pour assurer la traçabilité RGPD.</p>
      </div>

      {/* ── LISTE DES ENFANTS AVEC STATUT DE CONSENTEMENT ────── */}
      {enfantsConsentements.length === 0 ? (
        <div className="p-vide">
          <span className="p-vide__icone">👶</span>
          <p>Aucun enfant enregistré. Ajoutez d'abord un enfant.</p>
        </div>
      ) : (
        <div className="consentements-liste">
          {enfantsConsentements.map(enfant => {
            const consenti         = enfant.consentement?.consenti || false;
            const dateConsentement = enfant.consentement?.date_consentement;
            // Indicateur d'envoi pour cet enfant spécifique
            const enCours          = envoi[enfant.id];

            return (
              // Classe modifier selon le statut : --accorde (vert) ou --refuse (rouge)
              <div key={enfant.id} className={`consentement-carte ${consenti ? 'consentement-carte--accorde' : 'consentement-carte--refuse'}`}>
                <div className="consentement-carte__infos">
                  {/* Avatar emoji selon le sexe */}
                  <span className="consentement-avatar">{enfant.sexe === 'F' ? '👧' : '👦'}</span>
                  <div>
                    <h3>{enfant.prenom} {enfant.nom}</h3>
                    {/* Date de la dernière décision (si existante) */}
                    {dateConsentement && (
                      <p className="consentement-date">
                        Dernière décision le {new Date(dateConsentement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="consentement-carte__statut">
                  {/* Badge statut : ✅ ou ❌ */}
                  <span className={`consentement-statut ${consenti ? 'consentement-statut--oui' : 'consentement-statut--non'}`}>
                    {consenti ? '✅ Consentement accordé' : '❌ Consentement refusé'}
                  </span>

                  {/* Bouton toggle : rouge si consentement accordé (action de retrait), primaire sinon */}
                  <button
                    className={`btn btn--sm ${consenti ? 'btn--outline' : 'btn--primary'}`}
                    style={consenti ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}
                    onClick={() => toggleConsentement(enfant.id, consenti)}
                    disabled={enCours}
                  >
                    {enCours ? 'Mise à jour...' : consenti ? 'Retirer le consentement' : 'Accorder le consentement'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Consentement;
