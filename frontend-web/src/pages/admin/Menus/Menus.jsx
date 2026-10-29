// ============================================================
// FICHIER  : Menus.jsx (admin)
// ROUTE    : /admin/menus
// RÔLE     : Gestion des menus de la crèche.
//            Deux modes :
//            - "Menu par défaut" : template répété toutes les semaines
//            - "Par semaine"     : personnalisation d'une semaine précise
//            Chaque champ jour (déjeuner + goûter) est édité via Quill.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Menus.css';
import { lundiDeLaSemaine } from '../../../utils/dates'; // Dates en heure locale

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

// Toolbar minimale adaptée à la saisie d'un menu (pas besoin de titres ni couleurs)
const QUILL_MODULES_MENU = {
  toolbar: [
    ['bold', 'italic'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};
const QUILL_FORMATS_MENU = ['bold', 'italic', 'list'];

const FORM_VIDE = () => {
  const f = {};
  JOURS.forEach(j => { f[`${j}_midi`] = ''; f[`${j}_gouter`] = ''; });
  return f;
};

// Lundi de la semaine courante (+ offset semaines), en heure locale
const getLundiSemaine = (offset = 0) => lundiDeLaSemaine(new Date(), offset);

const extraireForm = (menu) => {
  const f = {};
  JOURS.forEach(j => {
    f[`${j}_midi`]   = menu[`${j}_midi`]   || '';
    f[`${j}_gouter`] = menu[`${j}_gouter`] || '';
  });
  return f;
};

// Détecte si le contenu HTML Quill est vide (<p><br></p> ou chaîne vide)
const quillVide = (val) => !val || val === '<p><br></p>';

// ── Formulaire 5 jours avec Quill ────────────────────────────
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
              onChange={val => onChange(`${jour}_midi`, val)}
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
              onChange={val => onChange(`${jour}_gouter`, val)}
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

// ── Aperçu lecture seule (affiche le HTML Quill) ─────────────
const ApercuMenu = ({ form }) => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <div className="menus-admin-grille">
    {JOURS.map(jour => (
      <div key={jour} className="menu-admin-col menu-admin-col--apercu">
        <h3 className="menu-admin-jour">{t(`common.jours.${jour}`)}</h3>
        <p className="apercu-label">🍽️</p>
        {quillVide(form[`${jour}_midi`])
          ? <em style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{t('admin.menus.nonRenseigne')}</em>
          : <div className="menu-apercu-html" dangerouslySetInnerHTML={{ __html: form[`${jour}_midi`] }} />
        }
        <p className="apercu-label" style={{ marginTop: 'var(--space-sm)' }}>🍪</p>
        {quillVide(form[`${jour}_gouter`])
          ? <em style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{t('admin.menus.nonRenseigne')}</em>
          : <div className="menu-apercu-html" dangerouslySetInnerHTML={{ __html: form[`${jour}_gouter`] }} />
        }
      </div>
    ))}
  </div>
  );
};

// ── Mode "Menu par défaut" ────────────────────────────────────
const SectionMenuDefaut = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [menu,  setMenu]  = useState(null);
  const [form,  setForm]  = useState(FORM_VIDE());
  const [envoi, setEnvoi] = useState(false);
  const [modif, setModif] = useState(false);

  useEffect(() => {
    api.get('/menus/defaut')
      .then(r => {
        const m = r.data.data;
        setMenu(m);
        if (m) setForm(extraireForm(m));
      })
      .catch(() => {});
  }, []);

  const handleChange = (cle, val) => setForm(p => ({ ...p, [cle]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const res = await api.post('/menus/defaut', form);
      setMenu(res.data.data);
      setModif(false);
      toast.success(t('admin.menus.toastDefaut'));
    } catch { toast.error(t('admin.menus.erreurSauvegarde')); }
    setEnvoi(false);
  };

  return (
    <div className="a-card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 {t('admin.menus.defautTitre')}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', margin: '4px 0 0' }}>
            {t('admin.menus.defautAide')}
          </p>
        </div>
        {!modif && (
          <button className="btn btn--primary btn--sm" onClick={() => setModif(true)}>
            ✏️ {menu ? t('admin.menus.modifier') : t('admin.menus.creerDefaut')}
          </button>
        )}
      </div>

      {modif ? (
        <form onSubmit={handleSubmit}>
          <FormulaireMenu form={form} onChange={handleChange} />
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            <button type="button" className="btn btn--ghost" onClick={() => { setModif(false); if (menu) setForm(extraireForm(menu)); }}>
              {t('common.annuler')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? t('common.enregistrement') : t('admin.menus.sauverDefaut')}
            </button>
          </div>
        </form>
      ) : menu ? (
        <ApercuMenu form={form} />
      ) : (
        <div className="a-vide">
          <span className="a-vide__icone">📋</span>
          <p>{t('admin.menus.aucunDefaut')}</p>
        </div>
      )}
    </div>
  );
};

// ── Mode "Menu par semaine" ───────────────────────────────────
const SectionMenuSemaine = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [offset,    setOffset]    = useState(0);
  const [semaine,   setSemaine]   = useState(getLundiSemaine());
  const [menu,      setMenu]      = useState(null);
  const [estDefaut, setEstDefaut] = useState(false);
  const [form,      setForm]      = useState(FORM_VIDE());
  const [envoi,     setEnvoi]     = useState(false);
  const [modif,     setModif]     = useState(false);

  useEffect(() => { setSemaine(getLundiSemaine(offset)); }, [offset]);

  const charger = useCallback(() => {
    setModif(false);
    api.get(`/menus/${semaine}`)
      .then(r => {
        const m = r.data.data;
        setMenu(m);
        setEstDefaut(m?.est_defaut ?? false);
        setForm(m ? extraireForm(m) : FORM_VIDE());
      })
      .catch(() => { setMenu(null); setEstDefaut(false); setForm(FORM_VIDE()); });
  }, [semaine]);

  useEffect(() => { charger(); }, [charger]);

  const handleChange = (cle, val) => setForm(p => ({ ...p, [cle]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      if (menu && !estDefaut) {
        await api.put(`/menus/${menu.id}`, { ...form, publie: menu.publie });
        toast.success(t('admin.menus.toastMaj'));
        charger();
      } else {
        const res = await api.post('/menus', { ...form, semaine_debut: semaine, publie: false });
        setMenu(res.data.data);
        setEstDefaut(false);
        setModif(false);
        toast.success(t('admin.menus.toastCree'));
      }
    } catch (err) { toast.error(err.response?.data?.message || t('common.erreur')); }
    setEnvoi(false);
  };

  const togglePublier = async () => {
    if (!menu || estDefaut) return;
    try {
      await api.put(`/menus/${menu.id}`, { ...form, publie: !menu.publie });
      setMenu(prev => ({ ...prev, publie: !prev.publie }));
      toast.success(menu.publie ? t('admin.menus.toastDepublie') : t('admin.menus.toastPublie'));
    } catch { toast.error(t('common.erreur')); }
  };

  const supprimerPerso = async () => {
    if (!menu || estDefaut) return;
    if (!window.confirm(t('admin.menus.confirmerSuppression'))) return;
    try {
      await api.delete(`/menus/${menu.id}`);
      toast.success(t('admin.menus.toastSupprime'));
      charger();
    } catch { toast.error(t('common.erreur')); }
  };

  const formatSemaine = (d) => {
    const lundi    = new Date(d);
    const vendredi = new Date(d);
    vendredi.setDate(lundi.getDate() + 4);
    return `${lundi.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long' })} — ${vendredi.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="a-card">
      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o - 1)}>{t('admin.menus.precedente')}</button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📅 {formatSemaine(semaine)}</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o + 1)}>{t('admin.menus.suivante')}</button>
      </div>

      {/* Bandeau statut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {estDefaut ? (
          <>
            <span className="s-badge s-badge--en_attente">{t('admin.menus.defautApplique')}</span>
            <button className="btn btn--primary btn--sm" onClick={() => setModif(true)}>
              {t('admin.menus.personnaliser')}
            </button>
          </>
        ) : menu ? (
          <>
            <span className={`s-badge ${menu.publie ? 's-badge--accepte' : 's-badge--en_attente'}`}>
              {menu.publie ? t('admin.menus.publie') : t('admin.menus.brouillon')}
            </span>
            <button className={`btn btn--sm ${menu.publie ? 'btn--outline' : 'btn--primary'}`} onClick={togglePublier}>
              {menu.publie ? t('admin.menus.depublier') : t('admin.menus.publier')}
            </button>
            <button className="btn btn--sm btn--ghost" onClick={supprimerPerso} style={{ color: 'var(--error)' }}>
              {t('admin.menus.retourDefaut')}
            </button>
          </>
        ) : (
          <span className="s-badge s-badge--en_attente">{t('admin.menus.aucunMenu')}</span>
        )}
      </div>

      {/* Formulaire ou aperçu */}
      {modif || (!estDefaut && menu) ? (
        <form onSubmit={handleSubmit}>
          <FormulaireMenu form={form} onChange={handleChange} />
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            {modif && estDefaut && (
              <button type="button" className="btn btn--ghost" onClick={() => setModif(false)}>{t('common.annuler')}</button>
            )}
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? t('common.enregistrement') : menu && !estDefaut ? t('admin.menus.mettreAJour') : t('admin.menus.creerPerso')}
            </button>
          </div>
        </form>
      ) : estDefaut && !modif ? (
        <ApercuMenu form={form} />
      ) : null}
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────
const MenusAdmin = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  return (
  <div>
    <div className="admin-page-entete">
      <h1 className="admin-page-titre"><Trans i18nKey="admin.menus.titre" components={{ s: <span /> }} /></h1>
    </div>
    <SectionMenuDefaut />
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
        📅 {t('admin.menus.semaineTitre')}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: 'var(--space-lg)' }}>
        {t('admin.menus.semaineAide')}
      </p>
    </div>
    <SectionMenuSemaine />
  </div>
  );
};

export default MenusAdmin;
