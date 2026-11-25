// ============================================================
// FICHIER  : Fermetures.jsx (admin)
// ROUTE    : /admin/fermetures (super admin uniquement)
// RÔLE     : Calendrier des fermetures de la crèche, affiché sur
//            la page Présentation (fermetures en cours et à venir).
//             1. Formulaire : ajouter ou modifier une fermeture
//             2. Liste de toutes les fermetures (passées comprises)
//            API : GET /fermetures/tous, POST /fermetures,
//                  PUT/DELETE /fermetures/:id
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import { depuisDateISO, versDateISO } from '../../../utils/dates'; // Dates en heure locale
import Chargement from '../../../components/ui/Chargement/Chargement';
import '../../../styles/admin.css';
import './Fermetures.css';

// Préfixe des clés de traduction de la page
const P = 'admin.fermetures';

// Formulaire vide
const FORMULAIRE_VIDE = { date_debut: '', date_fin: '', motif: '' };

const Fermetures = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  const [fermetures, setFermetures] = useState(null);            // null = chargement
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE); // Champs du formulaire
  const [enCours,    setEnCours]    = useState(null);            // Fermeture en modification (ou null)
  const [envoi,      setEnvoi]      = useState(false);           // Enregistrement en cours

  const aujourdhui = versDateISO(new Date()); // AAAA-MM-JJ en heure locale

  // Charge toutes les fermetures (plus récentes en haut)
  const charger = useCallback(() => {
    api.get('/fermetures/tous')
      .then(res => setFermetures(res.data.data || []))
      .catch(() => { setFermetures([]); toast.error(t(`${P}.erreurChargement`)); });
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  // Date lisible : « mercredi 24 décembre 2026 »
  const formaterDate = (iso) => depuisDateISO(iso).toLocaleDateString(getLocale(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Statut d'une fermeture par rapport à aujourd'hui
  const statut = (f) => {
    if (f.date_fin < aujourdhui)   return { cle: 'passee', badge: 'fermeture-badge--passee' };
    if (f.date_debut <= aujourdhui) return { cle: 'enCours', badge: 's-badge--en_attente' };
    return { cle: 'aVenir', badge: 's-badge--accepte' };
  };

  const reinitialiser = () => { setFormulaire(FORMULAIRE_VIDE); setEnCours(null); };

  // Passe en mode modification
  const modifier = (f) => {
    setEnCours(f);
    // Fermeture d'un jour : « dernier jour » laissé vide
    setFormulaire({ date_debut: f.date_debut, date_fin: f.date_fin === f.date_debut ? '' : f.date_fin, motif: f.motif });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ajout ou modification
  const enregistrer = async (e) => {
    e.preventDefault();
    // Même règle que le serveur : le dernier jour n'est jamais avant le premier
    if (formulaire.date_fin && formulaire.date_fin < formulaire.date_debut) {
      toast.error(t(`${P}.finAvantDebut`));
      return;
    }
    const donnees = { ...formulaire, motif: formulaire.motif.trim() };
    setEnvoi(true);
    try {
      if (enCours) {
        await api.put(`/fermetures/${enCours.id}`, donnees);
        toast.success(t(`${P}.toastMaj`));
      } else {
        await api.post('/fermetures', donnees);
        toast.success(t(`${P}.toastAjoute`));
      }
      reinitialiser();
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.erreur'));
    }
    setEnvoi(false);
  };

  // Suppression après confirmation
  const supprimer = async (f) => {
    if (!window.confirm(t(`${P}.confirmerSuppression`, { motif: f.motif }))) return;
    try {
      await api.delete(`/fermetures/${f.id}`);
      toast.success(t(`${P}.toastSupprime`));
      if (enCours?.id === f.id) reinitialiser();
      charger();
    } catch {
      toast.error(t('common.erreurSuppression'));
    }
  };

  if (!fermetures) return <Chargement />;

  return (
    <div>
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
      </div>
      <p className="contenu-admin-intro">{t(`${P}.intro`)}</p>

      <div className="contenu-admin-grille">

        {/* ── Formulaire : ajout ou modification ── */}
        <form className="a-card a-form contenu-admin-formulaire" onSubmit={enregistrer}>
          <h2 className="a-card__titre">{enCours ? `✏️ ${t(`${P}.modifierTitre`)}` : `➕ ${t(`${P}.nouveau`)}`}</h2>

          <div className="a-form-row">
            <div className="a-form-groupe">
              <label htmlFor="fermeture-debut" className="a-label">{t(`${P}.debut`)} <span className="requis">*</span></label>
              <input id="fermeture-debut" type="date" className="a-input" value={formulaire.date_debut} required
                onChange={e => setFormulaire({ ...formulaire, date_debut: e.target.value })} />
            </div>
            <div className="a-form-groupe">
              <label htmlFor="fermeture-fin" className="a-label">{t(`${P}.fin`)}</label>
              <input id="fermeture-fin" type="date" className="a-input" value={formulaire.date_fin}
                min={formulaire.date_debut || undefined}
                onChange={e => setFormulaire({ ...formulaire, date_fin: e.target.value })} />
              <p className="contenu-admin-aide">{t(`${P}.finAide`)}</p>
            </div>
          </div>

          <div className="a-form-groupe">
            <label htmlFor="fermeture-motif" className="a-label">{t(`${P}.motif`)} <span className="requis">*</span></label>
            <input id="fermeture-motif" className="a-input" value={formulaire.motif} required maxLength={150}
              placeholder={t(`${P}.motifPlaceholder`)}
              onChange={e => setFormulaire({ ...formulaire, motif: e.target.value })} />
          </div>

          <div className="contenu-admin-actions">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? t('common.enregistrement') : enCours ? t(`${P}.enregistrer`) : t(`${P}.ajouter`)}
            </button>
            {enCours && <button type="button" className="btn btn--ghost" onClick={reinitialiser}>{t('common.annuler')}</button>}
          </div>
        </form>

        {/* ── Liste de toutes les fermetures ── */}
        <div className="a-card">
          <h2 className="a-card__titre">🗓️ {t(`${P}.liste`, { count: fermetures.length })}</h2>
          {fermetures.length === 0 ? (
            <div className="a-vide"><span className="a-vide__icone">🗓️</span><p>{t(`${P}.vide`)}</p></div>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>{t(`${P}.colonnes.dates`)}</th>
                  <th>{t(`${P}.colonnes.motif`)}</th>
                  <th>{t(`${P}.colonnes.statut`)}</th>
                  <th>{t(`${P}.colonnes.actions`)}</th>
                </tr>
              </thead>
              <tbody>
                {fermetures.map(f => {
                  const { cle, badge } = statut(f);
                  return (
                    <tr key={f.id} className={[
                      enCours?.id === f.id ? 'contenu-admin-ligne--active' : '',
                      cle === 'passee' ? 'fermeture-ligne--passee' : ''
                    ].join(' ').trim()}>
                      <td>
                        {f.date_debut === f.date_fin
                          ? t('public.presentation.fermetureJour', { date: formaterDate(f.date_debut) })
                          : t('public.presentation.fermeturePeriode', { debut: formaterDate(f.date_debut), fin: formaterDate(f.date_fin) })}
                      </td>
                      <td>{f.motif}</td>
                      <td><span className={`s-badge ${badge}`}>{t(`${P}.statuts.${cle}`)}</span></td>
                      <td>
                        <div className="a-actions">
                          <button type="button" className="btn btn--sm btn--ghost" onClick={() => modifier(f)}
                            title={t('common.modifier')} aria-label={`${t('common.modifier')} : ${f.motif}`}>✏️</button>
                          <button type="button" className="btn btn--sm contenu-admin-supprimer" onClick={() => supprimer(f)}
                            title={t('common.supprimer')} aria-label={`${t('common.supprimer')} : ${f.motif}`}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fermetures;
