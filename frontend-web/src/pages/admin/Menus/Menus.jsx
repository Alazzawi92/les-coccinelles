// ============================================================
// FICHIER  : Menus.jsx (admin)
// ROUTE    : /admin/menus
// RÔLE     : Saisie des 4 menus du cycle (Semaine 1 à 4) qui se
//            répète toute l'année. Un onglet par semaine.
//            Chaque champ jour (déjeuner + goûter) est édité via Quill.
// ============================================================

import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Menus.css';

const JOURS    = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
const NUMEROS  = [1, 2, 3, 4]; // Les 4 semaines du cycle

// Toolbar minimale adaptée à la saisie d'un menu (pas besoin de titres ni couleurs)
const QUILL_MODULES_MENU = {
  toolbar: [
    ['bold', 'italic'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};
const QUILL_FORMATS_MENU = ['bold', 'italic', 'list'];

// ── Formulaire 5 jours avec Quill ────────────────────────────
// form     : contenu de la semaine affichée
// onChange : (champ, valeur, source) — source = 'user' si c'est une frappe au clavier
const FormulaireMenu = ({ form, onChange }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <div className="menus-admin-grille">
    {JOURS.map(jour => (
      <div key={jour} className="menu-admin-col">
        <h3 className="menu-admin-jour">{t(`common.jours.${jour}`)}</h3>

        {/* Déjeuner — Quill complet */}
        <div className="a-form-groupe">
          <label className="a-label">{t('admin.menus.dejeuner')}</label>
          <div className="menu-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={form[`${jour}_midi`] || ''}
              onChange={(val, _delta, source) => onChange(`${jour}_midi`, val, source)}
              modules={QUILL_MODULES_MENU}
              formats={QUILL_FORMATS_MENU}
              placeholder={t('admin.menus.dejeunerPlaceholder')}
            />
          </div>
        </div>

        {/* Goûter — Quill léger */}
        <div className="a-form-groupe">
          <label className="a-label">{t('admin.menus.gouter')}</label>
          <div className="menu-quill-wrapper menu-quill-wrapper--petit">
            <ReactQuill
              theme="snow"
              value={form[`${jour}_gouter`] || ''}
              onChange={(val, _delta, source) => onChange(`${jour}_gouter`, val, source)}
              modules={QUILL_MODULES_MENU}
              formats={QUILL_FORMATS_MENU}
              placeholder={t('admin.menus.gouterPlaceholder')}
            />
          </div>
        </div>
      </div>
    ))}
  </div>
  );
};

// ── Composant principal ───────────────────────────────────────
const MenusAdmin = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [semaines,      setSemaines]      = useState(null);  // { 1: {...}, 2: {...}, 3: {...}, 4: {...} }
  const [numero,        setNumero]        = useState(1);     // Onglet affiché
  const [numeroCourant, setNumeroCourant] = useState(null);  // Semaine du cycle en cours
  const [nonSauvees,    setNonSauvees]    = useState([]);    // Semaines modifiées mais pas enregistrées
  const [echec,         setEchec]         = useState(false); // Chargement impossible
  const [envoi,         setEnvoi]         = useState(false);

  useEffect(() => {
    api.get('/menus/cycle')
      .then(r => {
        const { numero_courant, semaines: liste } = r.data.data;
        setSemaines(Object.fromEntries(liste.map(s => [s.numero, s])));
        setNumeroCourant(numero_courant);
        setNumero(numero_courant); // Ouvre directement la semaine en cours
      })
      .catch(() => setEchec(true)); // Pas de formulaire vide : il écraserait les vrais menus
  }, []);

  const handleChange = (champ, valeur, source) => {
    setSemaines(p => ({ ...p, [numero]: { ...p[numero], [champ]: valeur } }));
    // Quill signale aussi ses reformatages au chargement : seule la frappe compte
    if (source === 'user') setNonSauvees(p => (p.includes(numero) ? p : [...p, numero]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numeroEnvoye = numero; // L'onglet peut changer pendant l'envoi
    setEnvoi(true);
    try {
      // Le champ "numero" est ignoré par le serveur : seuls les champs de menu sont gardés
      await api.put(`/menus/cycle/${numeroEnvoye}`, semaines[numeroEnvoye]);
      setNonSauvees(p => p.filter(n => n !== numeroEnvoye));
      toast.success(t('admin.menus.toastEnregistre', { numero: numeroEnvoye }));
    } catch { toast.error(t('admin.menus.erreurSauvegarde')); }
    setEnvoi(false);
  };

  return (
  <div>
    <div className="admin-page-entete">
      <h1 className="admin-page-titre"><Trans i18nKey="admin.menus.titre" components={{ s: <span /> }} /></h1>
    </div>

    <div className="a-card">
      <p className="menus-cycle-aide">{t('admin.menus.aide')}</p>

      {echec ? (
        <div className="a-vide"><p>{t('admin.menus.erreurChargement')}</p></div>
      ) : !semaines ? (
        <div className="a-vide"><p>{t('admin.menus.chargement')}</p></div>
      ) : (
        <>
          {/* Un onglet par semaine du cycle */}
          <div className="menus-onglets" role="tablist">
            {NUMEROS.map(n => (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={n === numero}
                className={`menus-onglet ${n === numero ? 'menus-onglet--actif' : ''}`}
                onClick={() => setNumero(n)}
              >
                {t('admin.menus.semaine', { numero: n })}
                {/* Point visible tant que la semaine n'est pas enregistrée */}
                {nonSauvees.includes(n) && (
                  <span className="menus-onglet__point" title={t('admin.menus.nonEnregistre')} aria-label={t('admin.menus.nonEnregistre')}>●</span>
                )}
              </button>
            ))}
          </div>

          <p className="menus-cycle-courant">📅 {t('admin.menus.enCours', { numero: numeroCourant })}</p>

          <form onSubmit={handleSubmit}>
            {/* key : recrée les éditeurs Quill à chaque changement d'onglet */}
            <FormulaireMenu key={numero} form={semaines[numero]} onChange={handleChange} />
            <div className="menus-cycle-actions">
              <button type="submit" className="btn btn--primary" disabled={envoi}>
                {envoi ? t('common.enregistrement') : t('admin.menus.enregistrer', { numero })}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  </div>
  );
};

export default MenusAdmin;
