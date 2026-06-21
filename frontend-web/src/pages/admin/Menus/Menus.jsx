// ============================================================
// FICHIER  : Menus.jsx (admin)
// ROUTE    : /admin/menus
// RÔLE     : Saisie des menus de la semaine (déjeuner + goûter)
//            par jour (lundi au vendredi).
//            Navigation par semaine via offset (+1/-1 semaine).
//            getLundiSemaine(offset) : calcule la date du lundi
//            de la semaine courante ± n semaines.
//            Formulaire : POST (création) ou PUT (mise à jour).
//            togglePublier : rend le menu visible sur le site public.
// ============================================================

import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/admin.css';
import './Menus.css';

// Les 5 jours de la semaine de crèche (pas de week-end)
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

// ── Calcul du lundi d'une semaine donnée ─────────────────────
// offset : décalage en semaines (0 = semaine courante, -1 = précédente, +1 = suivante)
// Retourne une chaîne YYYY-MM-DD (format attendu par l'API)
const getLundiSemaine = (offset = 0) => {
  const d   = new Date();
  const day = d.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi
  // Si dimanche (0), on remonte au lundi précédent (-6), sinon décalage normal
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

const MenusAdmin = () => {
  // Date du lundi de la semaine affichée (YYYY-MM-DD)
  const [semaine, setSemaine] = useState(getLundiSemaine());
  // Données du menu existant pour cette semaine (null = aucun menu créé)
  const [menu,    setMenu]    = useState(null);
  // Valeurs du formulaire : { lundi_midi, lundi_gouter, mardi_midi, ... }
  const [form,    setForm]    = useState({});
  // Indicateur d'envoi pendant la requête POST/PUT
  const [envoi,   setEnvoi]   = useState(false);
  // Décalage en semaines par rapport à la semaine courante
  const [offset,  setOffset]  = useState(0);

  // ── Recalcul de la date du lundi quand l'offset change ───
  useEffect(() => {
    setSemaine(getLundiSemaine(offset));
  }, [offset]);

  // ── Chargement du menu pour la semaine sélectionnée ──────
  // GET /menus/:date_lundi — initialise le formulaire avec les données existantes
  useEffect(() => {
    api.get(`/menus/${semaine}`)
      .then(r => {
        const m = r.data.data;
        setMenu(m);
        if (m) {
          // Menu existant : pré-remplir chaque champ jour_repas
          const f = {};
          JOURS.forEach(j => {
            f[`${j}_midi`]   = m[`${j}_midi`]   || '';
            f[`${j}_gouter`] = m[`${j}_gouter`] || '';
          });
          setForm(f);
        } else {
          // Pas de menu pour cette semaine : formulaire vide
          const f = {};
          JOURS.forEach(j => { f[`${j}_midi`] = ''; f[`${j}_gouter`] = ''; });
          setForm(f);
        }
      })
      .catch(() => {
        // En cas d'erreur réseau : réinitialise le formulaire
        setMenu(null);
        const f = {};
        JOURS.forEach(j => { f[`${j}_midi`] = ''; f[`${j}_gouter`] = ''; });
        setForm(f);
      });
  }, [semaine]); // Se relance à chaque changement de semaine

  // ── Sauvegarde du menu ────────────────────────────────────
  // PUT si menu existant, POST si nouveau
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      if (menu) {
        // Mise à jour : conserve le statut publie actuel
        await api.put(`/menus/${menu.id}`, { ...form, publie: menu.publie });
        toast.success('Menu mis à jour');
      } else {
        // Création : le menu commence toujours en brouillon (publie: false)
        const res = await api.post('/menus', { ...form, semaine_debut: semaine, publie: false });
        setMenu(res.data.data);
        toast.success('Menu créé');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    setEnvoi(false);
  };

  // ── Publier / dépublier le menu ───────────────────────────
  // Le menu doit d'abord être sauvegardé pour être publié
  const togglePublier = async () => {
    if (!menu) { toast.error('Enregistrez d\'abord le menu'); return; }
    try {
      await api.put(`/menus/${menu.id}`, { ...form, publie: !menu.publie });
      setMenu(prev => ({ ...prev, publie: !prev.publie }));
      toast.success(menu.publie ? 'Menu dépublié' : 'Menu publié sur le site');
    } catch { toast.error('Erreur'); }
  };

  // ── Formatage de l'affichage de la semaine ────────────────
  // Retourne "X {mois} — Y {mois} {année}" (lundi → vendredi)
  const formatSemaine = (d) => {
    const lundi    = new Date(d);
    const vendredi = new Date(d);
    vendredi.setDate(lundi.getDate() + 4); // Lundi + 4 jours = vendredi
    return `${lundi.toLocaleDateString('fr-FR', {day:'numeric', month:'long'})} — ${vendredi.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}`;
  };

  return (
    <div>

      {/* ── EN-TÊTE AVEC NAVIGATION PAR SEMAINE ──────────────── */}
      <div className="admin-page-entete">
        <h1 className="admin-page-titre">Gestion des <span>menus</span></h1>
        <div style={{ display:'flex', gap:'var(--space-md)', alignItems:'center' }}>
          {/* Navigation : semaine précédente */}
          <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o - 1)}>← Sem. préc.</button>
          {/* Affichage de la période lundi → vendredi */}
          <span style={{ fontSize:'0.9rem', fontWeight:700 }}>{formatSemaine(semaine)}</span>
          {/* Navigation : semaine suivante */}
          <button className="btn btn--ghost btn--sm" onClick={() => setOffset(o => o + 1)}>Sem. suiv. →</button>
        </div>
      </div>

      {/* ── BADGE ET BOUTON PUBLICATION ───────────────────────── */}
      {/* Affiché seulement si un menu existe pour cette semaine */}
      {menu && (
        <div style={{ marginBottom:'var(--space-lg)', display:'flex', alignItems:'center', gap:'var(--space-md)' }}>
          <span className={`s-badge ${menu.publie ? 's-badge--accepte' : 's-badge--en_attente'}`}>
            {menu.publie ? '🟢 Publié sur le site' : '⚫ Brouillon'}
          </span>
          <button className={`btn btn--sm ${menu.publie ? 'btn--outline' : 'btn--primary'}`} onClick={togglePublier}>
            {menu.publie ? 'Dépublier' : 'Publier sur le site'}
          </button>
        </div>
      )}

      {/* ── FORMULAIRE DES 5 JOURS ────────────────────────────── */}
      {/* Grille 5 colonnes : une par jour de la semaine */}
      <form onSubmit={handleSubmit}>
        <div className="menus-admin-grille">
          {JOURS.map(jour => (
            <div key={jour} className="menu-admin-col">
              {/* Titre du jour avec première lettre en majuscule */}
              <h3 className="menu-admin-jour">{jour.charAt(0).toUpperCase() + jour.slice(1)}</h3>

              {/* Textarea déjeuner : clé dynamique {jour}_midi */}
              <div className="a-form-groupe">
                <label className="a-label">🍽️ Déjeuner</label>
                <textarea
                  className="a-input a-textarea"
                  rows={3}
                  value={form[`${jour}_midi`] || ''}
                  onChange={e => setForm(p => ({...p, [`${jour}_midi`]: e.target.value}))}
                  placeholder="Ex: Carottes râpées, Poulet rôti, Purée, Fromage, Fruit"
                />
              </div>

              {/* Input goûter : clé dynamique {jour}_gouter */}
              <div className="a-form-groupe">
                <label className="a-label">🍪 Goûter</label>
                <input
                  className="a-input"
                  value={form[`${jour}_gouter`] || ''}
                  onChange={e => setForm(p => ({...p, [`${jour}_gouter`]: e.target.value}))}
                  placeholder="Ex: Compote, Pain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bouton de sauvegarde du formulaire */}
        <div style={{ display:'flex', gap:'var(--space-md)', justifyContent:'flex-end', marginTop:'var(--space-xl)' }}>
          <button type="submit" className="btn btn--primary" disabled={envoi}>
            {envoi ? 'Enregistrement...' : menu ? '💾 Mettre à jour' : '✅ Créer le menu'}
          </button>
        </div>
      </form>

    </div>
  );
};

export default MenusAdmin;
