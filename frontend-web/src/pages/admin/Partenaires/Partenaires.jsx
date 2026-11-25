// ============================================================
// FICHIER  : Partenaires.jsx (admin)
// ROUTE    : /admin/partenaires (super admin uniquement)
// RÔLE     : Partenaires de la crèche affichés dans la section
//            « Les partenaires » de la page Présentation.
//             1. Formulaire : ajouter ou modifier (nom, catégorie, logo, lien)
//             2. Liste des partenaires (modifier / supprimer)
//            API : GET/POST /partenaires, PUT/DELETE /partenaires/:id
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { urlFichier } from '../../../services/api';
import { TAILLE_MAX_LOGO_MO, logoTropLourd } from '../../../config/limites';
import Chargement from '../../../components/ui/Chargement/Chargement';
import '../../../styles/admin.css';
import './Partenaires.css';

// Préfixe des clés de traduction de la page
const P = 'admin.partenaires';

// Envoi multipart : l'instance api envoie du JSON par défaut
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// Logos acceptés (mêmes types que le serveur)
const TYPES_LOGO = ['image/jpeg', 'image/png'];

// Formulaire vide
const FORMULAIRE_VIDE = { nom: '', categorie: '', lien: '', ordre: '' };

const Partenaires = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  const [partenaires,  setPartenaires]  = useState(null);            // null = chargement
  const [formulaire,   setFormulaire]   = useState(FORMULAIRE_VIDE); // Champs texte
  const [logo,         setLogo]         = useState(null);            // Nouveau logo choisi (File)
  const [apercu,       setApercu]       = useState(null);            // Adresse locale de l'aperçu
  const [retirerLogo,  setRetirerLogo]  = useState(false);           // Retirer le logo actuel
  const [enCours,      setEnCours]      = useState(null);            // Partenaire en modification (ou null)
  const [envoi,        setEnvoi]        = useState(false);           // Enregistrement en cours
  const champLogo = useRef(null);                                    // Pour vider le champ fichier

  // Charge la liste des partenaires
  const charger = useCallback(() => {
    api.get('/partenaires')
      .then(res => setPartenaires(res.data.data || []))
      .catch(() => { setPartenaires([]); toast.error(t(`${P}.erreurChargement`)); });
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  // Aperçu du logo choisi ; l'adresse locale est libérée quand il change
  useEffect(() => {
    if (!logo) { setApercu(null); return undefined; }
    const url = URL.createObjectURL(logo);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  // Remet le formulaire à zéro (mode ajout)
  const reinitialiser = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setLogo(null);
    setRetirerLogo(false);
    setEnCours(null);
    if (champLogo.current) champLogo.current.value = '';
  };

  // Passe en mode modification
  const modifier = (p) => {
    reinitialiser();
    setEnCours(p);
    setFormulaire({ nom: p.nom, categorie: p.categorie || '', lien: p.lien || '', ordre: String(p.ordre ?? '') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Vérifie le logo choisi (type, taille) avant de le garder
  const choisirLogo = (e) => {
    const f = e.target.files[0] || null;
    if (f && !TYPES_LOGO.includes(f.type)) { toast.error(t(`${P}.imageSeulement`)); e.target.value = ''; return; }
    if (logoTropLourd(f)) { toast.error(t(`${P}.tropLourd`, { nom: f.name, max: TAILLE_MAX_LOGO_MO })); e.target.value = ''; return; }
    setLogo(f);
    setRetirerLogo(false);
  };

  // Ajout ou modification (multipart : champs + logo)
  const enregistrer = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('nom', formulaire.nom.trim());
    fd.append('categorie', formulaire.categorie.trim());
    fd.append('lien', formulaire.lien.trim());
    fd.append('ordre', formulaire.ordre);
    if (logo) fd.append('logo', logo);
    if (enCours && retirerLogo) fd.append('supprimer_logo', 'true');

    setEnvoi(true);
    try {
      if (enCours) {
        await api.put(`/partenaires/${enCours.id}`, fd, MULTIPART);
        toast.success(t(`${P}.toastMaj`));
      } else {
        await api.post('/partenaires', fd, MULTIPART);
        toast.success(t(`${P}.toastAjoute`));
      }
      reinitialiser();
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.erreur'));
    }
    setEnvoi(false);
  };

  // Suppression après confirmation (le logo est supprimé par le serveur)
  const supprimer = async (p) => {
    if (!window.confirm(t(`${P}.confirmerSuppression`, { nom: p.nom }))) return;
    try {
      await api.delete(`/partenaires/${p.id}`);
      toast.success(t(`${P}.toastSupprime`));
      if (enCours?.id === p.id) reinitialiser();
      charger();
    } catch {
      toast.error(t('common.erreurSuppression'));
    }
  };

  if (!partenaires) return <Chargement />;

  // Logo affiché dans le formulaire : nouveau choisi, sinon logo actuel (sauf s'il est retiré)
  const logoFormulaire = apercu || (enCours?.logo && !retirerLogo ? urlFichier(enCours.logo) : null);

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
              <label htmlFor="partenaire-nom" className="a-label">{t(`${P}.nom`)} <span className="requis">*</span></label>
              <input id="partenaire-nom" className="a-input" value={formulaire.nom} required maxLength={150}
                placeholder={t(`${P}.nomPlaceholder`)}
                onChange={e => setFormulaire({ ...formulaire, nom: e.target.value })} />
            </div>
            <div className="a-form-groupe">
              <label htmlFor="partenaire-lien" className="a-label">{t(`${P}.lien`)}</label>
              <input id="partenaire-lien" className="a-input" value={formulaire.lien} maxLength={500}
                placeholder={t(`${P}.lienPlaceholder`)} inputMode="url"
                onChange={e => setFormulaire({ ...formulaire, lien: e.target.value })} />
              <p className="contenu-admin-aide">{t(`${P}.lienAide`)}</p>
            </div>
          </div>

          <div className="a-form-groupe">
            <label htmlFor="partenaire-categorie" className="a-label">{t(`${P}.categorie`)}</label>
            <input id="partenaire-categorie" className="a-input" value={formulaire.categorie} maxLength={100}
              placeholder={t(`${P}.categoriePlaceholder`)}
              onChange={e => setFormulaire({ ...formulaire, categorie: e.target.value })} />
            <p className="contenu-admin-aide">{t(`${P}.categorieAide`)}</p>
          </div>

          <div className="a-form-row">
            <div className="a-form-groupe">
              <label htmlFor="partenaire-logo" className="a-label">{t(`${P}.logo`)}</label>
              <div className="partenaire-logo-champ">
                {/* Aperçu du logo (nouveau ou actuel) */}
                {logoFormulaire && <img src={logoFormulaire} alt={t(`${P}.logoActuel`)} className="partenaire-logo-apercu" />}
                <input id="partenaire-logo" ref={champLogo} type="file" accept="image/jpeg,image/png" className="a-input"
                  onChange={choisirLogo} />
              </div>
              <p className="contenu-admin-aide">{t(`${P}.logoAide`, { max: TAILLE_MAX_LOGO_MO })}</p>
              {/* Retirer le logo actuel (modification seulement, sans nouveau logo choisi) */}
              {enCours?.logo && !logo && (
                <label className="partenaire-retirer">
                  <input type="checkbox" checked={retirerLogo} onChange={e => setRetirerLogo(e.target.checked)} />
                  {t(`${P}.retirerLogo`)}
                </label>
              )}
            </div>
            <div className="a-form-groupe">
              <label htmlFor="partenaire-ordre" className="a-label">{t(`${P}.ordre`)}</label>
              <input id="partenaire-ordre" type="number" min="0" max="999" className="a-input" value={formulaire.ordre}
                onChange={e => setFormulaire({ ...formulaire, ordre: e.target.value })} />
              <p className="contenu-admin-aide">{t(`${P}.ordreAide`)}</p>
            </div>
          </div>

          <div className="contenu-admin-actions">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? t('common.enregistrement') : enCours ? t(`${P}.enregistrer`) : t(`${P}.ajouter`)}
            </button>
            {enCours && <button type="button" className="btn btn--ghost" onClick={reinitialiser}>{t('common.annuler')}</button>}
          </div>
        </form>

        {/* ── Liste des partenaires ── */}
        <div className="a-card">
          <h2 className="a-card__titre">🤝 {t(`${P}.liste`, { count: partenaires.length })}</h2>
          {partenaires.length === 0 ? (
            <div className="a-vide"><span className="a-vide__icone">🤝</span><p>{t(`${P}.vide`)}</p></div>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>{t(`${P}.colonnes.logo`)}</th>
                  <th>{t(`${P}.colonnes.nom`)}</th>
                  <th>{t(`${P}.colonnes.categorie`)}</th>
                  <th>{t(`${P}.colonnes.lien`)}</th>
                  <th>{t(`${P}.colonnes.ordre`)}</th>
                  <th>{t(`${P}.colonnes.actions`)}</th>
                </tr>
              </thead>
              <tbody>
                {partenaires.map(p => (
                  <tr key={p.id} className={enCours?.id === p.id ? 'contenu-admin-ligne--active' : ''}>
                    <td>
                      {p.logo
                        ? <img src={urlFichier(p.logo)} alt="" className="partenaire-logo-liste" />
                        : <span className="contenu-admin-secondaire">{t(`${P}.sansLogo`)}</span>}
                    </td>
                    <td><strong>{p.nom}</strong></td>
                    <td>{p.categorie || '—'}</td>
                    <td>
                      {p.lien
                        ? <a href={p.lien} target="_blank" rel="noopener noreferrer" className="partenaire-lien">{p.lien.replace(/^https?:\/\//, '')}</a>
                        : '—'}
                    </td>
                    <td>{p.ordre}</td>
                    <td>
                      <div className="a-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => modifier(p)}
                          title={t('common.modifier')} aria-label={`${t('common.modifier')} : ${p.nom}`}>✏️</button>
                        <button type="button" className="btn btn--sm contenu-admin-supprimer" onClick={() => supprimer(p)}
                          title={t('common.supprimer')} aria-label={`${t('common.supprimer')} : ${p.nom}`}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partenaires;
