// ============================================================
// FICHIER  : Documentation.jsx (admin)
// ROUTE    : /admin/documentation (super admin uniquement)
// RÔLE     : Documents PDF publics de la section « Documentation »
//            de la page Présentation (règlement, projet...).
//             1. Formulaire : ajouter ou modifier un document
//             2. Liste des documents en ligne (modifier / supprimer)
//            API : GET/POST /documentation, PUT/DELETE /documentation/:id
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { urlFichier } from '../../../services/api';
import { TAILLE_MAX_DOCUMENT_MO, documentTropLourd } from '../../../config/limites';
import Chargement from '../../../components/ui/Chargement/Chargement';
import '../../../styles/admin.css';
import './Documentation.css';

// Préfixe des clés de traduction de la page
const P = 'admin.documentation';

// Envoi multipart : l'instance api envoie du JSON par défaut
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// Formulaire vide
const FORMULAIRE_VIDE = { titre: '', description: '', ordre: '' };

// Taille lisible : 1 234 567 octets → « 1,2 Mo »
const formaterTaille = (octets) => (octets ? `${(octets / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : '');

const Documentation = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN

  const [documents,  setDocuments]  = useState(null);            // null = chargement
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE); // Champs texte
  const [fichier,    setFichier]    = useState(null);            // PDF choisi (File)
  const [enCours,    setEnCours]    = useState(null);            // Document en modification (ou null)
  const [envoi,      setEnvoi]      = useState(false);           // Enregistrement en cours
  const champFichier = useRef(null);                             // Pour vider le champ fichier

  // Charge la liste des documents
  const charger = useCallback(() => {
    api.get('/documentation')
      .then(res => setDocuments(res.data.data || []))
      .catch(() => { setDocuments([]); toast.error(t(`${P}.erreurChargement`)); });
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  // Remet le formulaire à zéro (mode ajout)
  const reinitialiser = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setFichier(null);
    setEnCours(null);
    if (champFichier.current) champFichier.current.value = '';
  };

  // Passe en mode modification d'un document
  const modifier = (doc) => {
    setEnCours(doc);
    setFormulaire({ titre: doc.titre, description: doc.description || '', ordre: String(doc.ordre ?? '') });
    setFichier(null);
    if (champFichier.current) champFichier.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Le formulaire est en haut de la page
  };

  // Vérifie le fichier choisi (PDF, taille) avant de le garder
  const choisirFichier = (e) => {
    const f = e.target.files[0] || null;
    if (f && f.type !== 'application/pdf') { toast.error(t(`${P}.pdfSeulement`)); e.target.value = ''; return; }
    if (documentTropLourd(f)) { toast.error(t(`${P}.tropLourd`, { nom: f.name, max: TAILLE_MAX_DOCUMENT_MO })); e.target.value = ''; return; }
    setFichier(f);
  };

  // Ajout ou modification (multipart : champs + fichier)
  const enregistrer = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titre', formulaire.titre.trim());
    fd.append('description', formulaire.description.trim());
    fd.append('ordre', formulaire.ordre);
    if (fichier) fd.append('fichier', fichier);

    setEnvoi(true);
    try {
      if (enCours) {
        await api.put(`/documentation/${enCours.id}`, fd, MULTIPART);
        toast.success(t(`${P}.toastMaj`));
      } else {
        await api.post('/documentation', fd, MULTIPART);
        toast.success(t(`${P}.toastAjoute`));
      }
      reinitialiser();
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.erreur'));
    }
    setEnvoi(false);
  };

  // Suppression après confirmation (le fichier est supprimé par le serveur)
  const supprimer = async (doc) => {
    if (!window.confirm(t(`${P}.confirmerSuppression`, { titre: doc.titre }))) return;
    try {
      await api.delete(`/documentation/${doc.id}`);
      toast.success(t(`${P}.toastSupprime`));
      if (enCours?.id === doc.id) reinitialiser();
      charger();
    } catch {
      toast.error(t('common.erreurSuppression'));
    }
  };

  if (!documents) return <Chargement />;

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

          <div className="a-form-groupe">
            <label htmlFor="doc-titre" className="a-label">{t(`${P}.titreChamp`)} <span className="requis">*</span></label>
            <input id="doc-titre" className="a-input" value={formulaire.titre} required maxLength={150}
              placeholder={t(`${P}.titrePlaceholder`)}
              onChange={e => setFormulaire({ ...formulaire, titre: e.target.value })} />
          </div>

          <div className="a-form-groupe">
            <label htmlFor="doc-description" className="a-label">{t(`${P}.description`)}</label>
            <input id="doc-description" className="a-input" value={formulaire.description} maxLength={255}
              placeholder={t(`${P}.descriptionPlaceholder`)}
              onChange={e => setFormulaire({ ...formulaire, description: e.target.value })} />
          </div>

          <div className="a-form-row">
            <div className="a-form-groupe">
              <label htmlFor="doc-fichier" className="a-label">
                {t(`${P}.fichier`)} {!enCours && <span className="requis">*</span>}
              </label>
              {/* Obligatoire à l'ajout ; en modification, vide = fichier actuel gardé */}
              <input id="doc-fichier" ref={champFichier} type="file" accept="application/pdf" className="a-input"
                required={!enCours} onChange={choisirFichier} />
              <p className="contenu-admin-aide">
                {enCours
                  ? t(`${P}.fichierRemplacer`, { nom: enCours.fichier.split('/').pop() })
                  : t(`${P}.fichierAide`, { max: TAILLE_MAX_DOCUMENT_MO })}
              </p>
            </div>
            <div className="a-form-groupe">
              <label htmlFor="doc-ordre" className="a-label">{t(`${P}.ordre`)}</label>
              <input id="doc-ordre" type="number" min="0" max="999" className="a-input" value={formulaire.ordre}
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

        {/* ── Liste des documents en ligne ── */}
        <div className="a-card">
          <h2 className="a-card__titre">📚 {t(`${P}.liste`, { count: documents.length })}</h2>
          {documents.length === 0 ? (
            <div className="a-vide"><span className="a-vide__icone">📚</span><p>{t(`${P}.vide`)}</p></div>
          ) : (
            <table className="a-table">
              <thead>
                <tr>
                  <th>{t(`${P}.colonnes.titre`)}</th>
                  <th>{t(`${P}.colonnes.fichier`)}</th>
                  <th>{t(`${P}.colonnes.ordre`)}</th>
                  <th>{t(`${P}.colonnes.actions`)}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className={enCours?.id === doc.id ? 'contenu-admin-ligne--active' : ''}>
                    <td>
                      <strong>{doc.titre}</strong>
                      {doc.description && <span className="contenu-admin-secondaire">{doc.description}</span>}
                    </td>
                    <td>
                      {/* Ouvre le PDF tel que les visiteurs le verront */}
                      <a href={urlFichier(doc.fichier)} target="_blank" rel="noopener noreferrer">📄 PDF</a>
                      <span className="contenu-admin-secondaire">{formaterTaille(doc.taille)}</span>
                    </td>
                    <td>{doc.ordre}</td>
                    <td>
                      <div className="a-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => modifier(doc)}
                          title={t('common.modifier')} aria-label={`${t('common.modifier')} : ${doc.titre}`}>✏️</button>
                        <button type="button" className="btn btn--sm contenu-admin-supprimer" onClick={() => supprimer(doc)}
                          title={t('common.supprimer')} aria-label={`${t('common.supprimer')} : ${doc.titre}`}>🗑️</button>
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

export default Documentation;
