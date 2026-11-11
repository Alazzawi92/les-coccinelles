// ============================================================
// FICHIER  : Menus.jsx
// ROUTE    : /menus
// RÔLE     : Page des menus hebdomadaires de la crèche.
//            Navigation semaine précédente / suivante.
//            Affiche le déjeuner et le goûter pour chaque jour.
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import './Menus.css';
import { versDateISO, depuisDateISO, lundiDeLaSemaine } from '../../../utils/dates'; // Dates en heure locale
import { telechargerMenuPdf } from '../../../utils/menuPdf';
import { menuEnTexte } from '../../../hooks/useMenuDuJour'; // HTML de l'éditeur → texte simple

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

// Quill produit "<p><br></p>" pour un champ vide
const quillVide = v => !v || v === '<p><br></p>';

// ── Utilitaire : calcule la date du lundi de la semaine donnée ──
// Retourne une chaîne YYYY-MM-DD utilisée comme clé d'API
const getLundiSemaine = (date = new Date()) => lundiDeLaSemaine(date); // Heure locale

const Menus = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const [menu,       setMenu]       = useState(null);             // Données du menu courant
  const [chargement, setChargement] = useState(true);            // Indicateur de chargement
  const [semaine,    setSemaine]    = useState(getLundiSemaine()); // Date du lundi courant
  const [telechargement, setTelechargement] = useState(false);     // PDF en cours de création

  // ── Chargement du menu à chaque changement de semaine ─────
  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const res = await api.get(`/menus/${semaine}`); // Clé = date du lundi
        setMenu(res.data.data);
      } catch {
        setMenu(null); // Semaine sans menu publié
      }
      setChargement(false);
    };
    charger();
  }, [semaine]); // Recharge quand la semaine change

  // ── Navigation semaine ────────────────────────────────────
  // sens=-1 → semaine précédente, sens=+1 → semaine suivante
  const changerSemaine = (sens) => {
    const d = depuisDateISO(semaine);  // Minuit local (pas UTC)
    d.setDate(d.getDate() + sens * 7); // Décale de 7 jours
    setSemaine(versDateISO(d));
  };

  // ── Formatage de la période de la semaine ─────────────────
  // Ex: "2 juin — 6 juin 2025" / "2 June — 6 June 2025" selon la langue
  const formaterSemaine = (dateStr) => {
    const lundi    = new Date(dateStr);
    const vendredi = new Date(dateStr);
    vendredi.setDate(lundi.getDate() + 4); // Vendredi = lundi + 4 jours
    return `${lundi.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long' })} — ${vendredi.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  // ── Téléchargement du menu affiché, au format PDF ─────────
  const telecharger = async () => {
    setTelechargement(true);
    try {
      await telechargerMenuPdf({
        titre:      t('public.menus.pdfTitre'),
        sousTitre:  t('public.menus.semaineDu', { periode: formaterSemaine(semaine) }),
        jours:      JOURS.map(jour => ({
          nom:    t(`common.jours.${jour}`),
          midi:   menuEnTexte(menu[`${jour}_midi`]),
          gouter: menuEnTexte(menu[`${jour}_gouter`])
        })),
        labels: {
          dejeuner:     t('public.menus.dejeuner'),
          gouter:       t('public.menus.gouter'),
          nonRenseigne: t('public.menus.nonRenseigne')
        },
        nomFichier: `menu-coccinelles-${semaine}.pdf`
      });
    } catch {
      toast.error(t('public.menus.erreurTelechargement'));
    }
    setTelechargement(false);
  };

  return (
    <div className="menus-page">

      {/* ── EN-TÊTE ───────────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">🍽️ {t('public.menus.tag')}</p>
          <h1 className="page-hero__titre"><Trans i18nKey="public.menus.titre" components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t('public.menus.sousTitre')}</p>
        </div>
      </section>

      <section className="section-blanche">
        <div className="container">

          {/* Navigation entre les semaines */}
          <div className="semaine-nav">
            <button className="btn btn--ghost btn--sm" onClick={() => changerSemaine(-1)}>
              {t('public.menus.precedente')}
            </button>
            <h2 className="semaine-titre">
              📅 {t('public.menus.semaineDu', { periode: formaterSemaine(semaine) })}
            </h2>
            <button className="btn btn--ghost btn--sm" onClick={() => changerSemaine(1)}>
              {t('public.menus.suivante')}
            </button>
          </div>

          {/* Bouton visible seulement quand un menu est affiché */}
          {!chargement && menu && (
            <div className="menu-telecharger">
              <button className="btn btn--primary btn--sm" onClick={telecharger} disabled={telechargement}>
                📄 {t('public.menus.telecharger')}
              </button>
            </div>
          )}

          {/* ── État de chargement ────────────────────────────── */}
          {chargement ? (
            <div className="menus-chargement">{t('public.menus.chargement')}</div>

          /* ── Menu disponible : grille 5 jours ──────────────── */
          ) : menu ? (
            <div className="menus-grille">
              {JOURS.map((jour) => (
                <div key={jour} className="menu-carte">
                  <div className="menu-carte__entete">
                    <span className="menu-carte__icone">🌟</span>
                    {/* Nom du jour traduit */}
                    <h3 className="menu-carte__jour">
                      {t(`common.jours.${jour}`)}
                    </h3>
                  </div>
                  <div className="menu-carte__repas">
                    <div className="repas-section repas-section--midi">
                      <p className="repas-label">🍽️ {t('public.menus.dejeuner')}</p>
                      {quillVide(menu[`${jour}_midi`])
                        ? <p className="repas-contenu repas-vide">{t('public.menus.nonRenseigne')}</p>
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_midi`] }} />
                      }
                    </div>
                    <div className="repas-section repas-section--gouter">
                      <p className="repas-label">🍪 {t('public.menus.gouter')}</p>
                      {quillVide(menu[`${jour}_gouter`])
                        ? <p className="repas-contenu repas-vide">{t('public.menus.nonRenseigne')}</p>
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: menu[`${jour}_gouter`] }} />
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

          /* ── Aucun menu pour cette semaine ──────────────────── */
          ) : (
            <div className="liste-vide">
              <span>🍽️</span>
              <p>{t('public.menus.nonPublie')}</p>
              <p className="liste-vide__sous">{t('public.menus.revenez')}</p>
            </div>
          )}

          {/* Encart engagement nutritionnel */}
          <div className="nutrition-info">
            <span>🥦</span>
            <div>
              <h3>{t('public.menus.nutritionTitre')}</h3>
              <p>{t('public.menus.nutritionTexte')}</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Menus;
