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
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/parent.css';
import './Consentement.css';

const Consentement = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
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
      toast.success(!actuel ? t('parent.consentement.toastAccorde') : t('parent.consentement.toastRetire'));
    } catch { toast.error(t('common.erreurMaj')); }
    setEnvoi(prev => ({ ...prev, [enfantId]: false }));
  };

  // Garde : spinner pendant le chargement
  if (chargement) return <div className="p-chargement">{t('common.chargement')}</div>;

  return (
    <div className="consentement-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <div className="parent-page-header">
        <h1 className="parent-page-titre"><Trans i18nKey="parent.consentement.titre" components={{ s: <span /> }} /></h1>
      </div>

      {/* ── INFORMATIONS RGPD ─────────────────────────────────── */}
      <div className="p-card rgpd-info">
        <h2 className="p-card__titre">📋 {t('parent.consentement.aProposTitre')}</h2>
        <p>{t('parent.consentement.intro')}</p>
        <p>{t('parent.consentement.enAccordant')}</p>
        <ul>
          {t('parent.consentement.accordePoints', { returnObjects: true }).map(p => <li key={p}>✅ {p}</li>)}
        </ul>
        <p>{t('parent.consentement.enRefusant')}</p>
        <ul>
          {/* Effet immédiat : masquage à la prochaine génération côté API */}
          {t('parent.consentement.refusePoints', { returnObjects: true }).map(p => <li key={p}>❌ {p}</li>)}
        </ul>
        {/* Traçabilité RGPD : date + IP enregistrées côté serveur */}
        <p className="rgpd-note">{t('parent.consentement.note')}</p>
      </div>

      {/* ── LISTE DES ENFANTS AVEC STATUT DE CONSENTEMENT ────── */}
      {enfantsConsentements.length === 0 ? (
        <div className="p-vide">
          <span className="p-vide__icone">👶</span>
          <p>{t('parent.consentement.aucunEnfant')}</p>
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
                        {t('parent.consentement.derniereDecision', { date: new Date(dateConsentement).toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="consentement-carte__statut">
                  {/* Badge statut : ✅ ou ❌ */}
                  <span className={`consentement-statut ${consenti ? 'consentement-statut--oui' : 'consentement-statut--non'}`}>
                    {consenti ? t('parent.consentement.statutAccorde') : t('parent.consentement.statutRefuse')}
                  </span>

                  {/* Bouton toggle : rouge si consentement accordé (action de retrait), primaire sinon */}
                  <button
                    className={`btn btn--sm ${consenti ? 'btn--outline' : 'btn--primary'}`}
                    style={consenti ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}
                    onClick={() => toggleConsentement(enfant.id, consenti)}
                    disabled={enCours}
                  >
                    {enCours ? t('common.miseAJour') : consenti ? t('parent.consentement.retirer') : t('parent.consentement.accorder')}
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
