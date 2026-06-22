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
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Menus.css';

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

const getLundiSemaine = (offset = 0) => {
  const d   = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

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
const FormulaireMenu = ({ form, onChange }) => (
  <div className="menus-admin-grille">
    {JOURS.map(jour => (
      <div key={jour} className="menu-admin-col">
        <h3 className="menu-admin-jour">{jour.charAt(0).toUpperCase() + jour.slice(1)}</h3>

        {/* Déjeuner — Quill complet */}
        <div className="a-form-groupe">
          <label className="a-label">🍽️ Déjeuner</label>
          <div className="menu-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={form[`${jour}_midi`] || ''}
              onChange={val => onChange(`${jour}_midi`, val)}
              modules={QUILL_MODULES_MENU}
              formats={QUILL_FORMATS_MENU}
              placeholder="Ex : Carottes râpées, Poulet rôti, Purée..."
            />
          </div>
        </div>

        {/* Goûter — Quill léger */}
        <div className="a-form-groupe">
          <label className="a-label">🍪 Goûter</label>
          <div className="menu-quill-wrapper menu-quill-wrapper--petit">
            <ReactQuill
              theme="snow"
              value={form[`${jour}_gouter`] || ''}
              onChange={val => onChange(`${jour}_gouter`, val)}
              modules={QUILL_MODULES_MENU}
              formats={QUILL_FORMATS_MENU}
              placeholder="Ex : Compote, Pain"
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Aperçu lecture seule (affiche le HTML Quill) ─────────────
const ApercuMenu = ({ form }) => (
  <div className="menus-admin-grille">
    {JOURS.map(jour => (
      <div key={jour} className="menu-admin-col menu-admin-col--apercu">
        <h3 className="menu-admin-jour">{jour.charAt(0).toUpperCase() + jour.slice(1)}</h3>
        <p className="apercu-label">🍽️</p>
        {quillVide(form[`${jour}_midi`])
          ? <em style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Non renseigné</em>
          : <div className="menu-apercu-html" dangerouslySetInnerHTML={{ __html: form[`${jour}_midi`] }} />
        }
        <p className="apercu-label" style={{ marginTop: 'var(--space-sm)' }}>🍪</p>
        {quillVide(form[`${jour}_gouter`])
          ? <em style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Non renseigné</em>
          : <div className="menu-apercu-html" dangerouslySetInnerHTML={{ __html: form[`${jour}_gouter`] }} />
        }
      </div>
    ))}
  </div>
);

// ── Mode "Menu par défaut" ────────────────────────────────────
const SectionMenuDefaut = () => {
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
      toast.success('Menu par défaut sauvegardé');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setEnvoi(false);
  };

  return (
    <div className="a-card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 Menu par défaut</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', margin: '4px 0 0' }}>
            Ce menu s'affiche automatiquement toutes les semaines si aucun menu spécifique n'est saisi.
          </p>
        </div>
        {!modif && (
          <button className="btn btn--primary btn--sm" onClick={() => setModif(true)}>
            ✏️ {menu ? 'Modifier' : 'Créer le menu par défaut'}
          </button>
        )}
      </div>

      {modif ? (
        <form onSubmit={handleSubmit}>
          <FormulaireMenu form={form} onChange={handleChange} />
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            <button type="button" className="btn btn--ghost" onClick={() => { setModif(false); if (menu) setForm(extraireForm(menu)); }}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? 'Enregistrement...' : '💾 Sauvegarder comme menu par défaut'}
            </button>
          </div>
        </form>
      ) : menu ? (
        <ApercuMenu form={form} />
      ) : (
        <div className="a-vide">
          <span className="a-vide__icone">📋</span>
          <p>Aucun menu par défaut configuré. Cliquez sur "Créer le menu par défaut" pour commencer.</p>
        </div>
      )}
    </div>
  );
};

// ── Mode "Menu par semaine" ───────────────────────────────────
const SectionMenuSemaine = () => {
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
        toast.success('Menu mis à jour');
        charger();
      } else {
        const res = await api.post('/menus', { ...form, semaine_debut: semaine, publie: false });
        setMenu(res.data.data);
        setEstDefaut(false);
        setModif(false);
        toast.success('Menu personnalisé créé — pensez à le publier');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setEnvoi(false);
  };

  const togglePublier = async () => {
    if (!menu || estDefaut) return;
    try {
      await api.put(`/menus/${menu.id}`, { ...form, publie: !menu.publie });
      setMenu(prev => ({ ...prev, publie: !prev.publie }));
      toast.success(menu.publie ? 'Menu dépublié' : 'Menu publié sur le site');
    } catch { toast.error('Erreur'); }
  };

  const supprimerPerso = async () => {
    if (!menu || estDefaut) return;
    if (!window.confirm('Supprimer la personnalisation de cette semaine ? Le menu par défaut sera affiché.')) return;
    try {
      await api.delete(`/menus/${menu.id}`);
      toast.success('Personnalisation supprimée — le menu par défaut est rétabli');
      charger();
    } catch { toast.error('Erreur'); }
  };

  const formatSemaine = (d) => {
    const lundi    = new Date(d);
    const vendredi = new Date(d);
    vendredi.setDate(lundi.getDate() + 4);
    return `${lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${vendredi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="a-card">
      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o - 1)}>← Sem. préc.</button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📅 {formatSemaine(semaine)}</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o + 1)}>Sem. suiv. →</button>
      </div>

      {/* Bandeau statut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {estDefaut ? (
          <>
            <span className="s-badge s-badge--en_attente">📋 Menu par défaut appliqué</span>
            <button className="btn btn--primary btn--sm" onClick={() => setModif(true)}>
              ✏️ Personnaliser cette semaine
            </button>
          </>
        ) : menu ? (
          <>
            <span className={`s-badge ${menu.publie ? 's-badge--accepte' : 's-badge--en_attente'}`}>
              {menu.publie ? '🟢 Publié' : '⚫ Brouillon'}
            </span>
            <button className={`btn btn--sm ${menu.publie ? 'btn--outline' : 'btn--primary'}`} onClick={togglePublier}>
              {menu.publie ? 'Dépublier' : 'Publier sur le site'}
            </button>
            <button className="btn btn--sm btn--ghost" onClick={supprimerPerso} style={{ color: 'var(--error)' }}>
              🗑️ Retour au menu par défaut
            </button>
          </>
        ) : (
          <span className="s-badge s-badge--en_attente">Aucun menu</span>
        )}
      </div>

      {/* Formulaire ou aperçu */}
      {modif || (!estDefaut && menu) ? (
        <form onSubmit={handleSubmit}>
          <FormulaireMenu form={form} onChange={handleChange} />
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            {modif && estDefaut && (
              <button type="button" className="btn btn--ghost" onClick={() => setModif(false)}>Annuler</button>
            )}
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? 'Enregistrement...' : menu && !estDefaut ? '💾 Mettre à jour' : '✅ Créer le menu personnalisé'}
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
const MenusAdmin = () => (
  <div>
    <div className="admin-page-entete">
      <h1 className="admin-page-titre">Gestion des <span>menus</span></h1>
    </div>
    <SectionMenuDefaut />
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
        📅 Menu par semaine
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: 'var(--space-lg)' }}>
        Personnalisez une semaine spécifique si le menu change (sorties, fêtes, etc.).
      </p>
    </div>
    <SectionMenuSemaine />
  </div>
);

export default MenusAdmin;
