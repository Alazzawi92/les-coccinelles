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
import { ALLERGENES } from '../../../utils/allergenes';      // Les 14 allergènes, ordre du menu imprimé

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

// Quill produit "<p><br></p>" pour un champ vide
const quillVide = v => !v || v === '<p><br></p>';

// Un plat par ligne : les plats saisis sur une seule ligne et séparés
// par « • » (ex : "Salade • Steak haché • Fromage blanc") sont affichés
// les uns sous les autres. La mise en forme (gras, italique) est conservée.
const unPlatParLigne = html => html.replace(/\s*•\s*/g, '<br>');

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

  // ── En-tête du PDF : « Semaine du 2 au 6 novembre » ──────
  // Le mois du lundi n'est écrit que s'il diffère de celui du vendredi
  // (ex : « du 30 novembre au 4 décembre »)
  const enTetePdf = (dateStr) => {
    const lundi    = depuisDateISO(dateStr);
    const vendredi = depuisDateISO(dateStr);
    vendredi.setDate(lundi.getDate() + 4);
    const memeMois = lundi.getMonth() === vendredi.getMonth();
    return t('public.menus.pdfSemaine', {
      debut: lundi.toLocaleDateString(getLocale(), memeMois ? { day: 'numeric' } : { day: 'numeric', month: 'long' }),
      fin:   vendredi.toLocaleDateString(getLocale(), { day: 'numeric', month: 'long' })
    });
  };

  // Texte d'un repas (HTML de l'éditeur) → un plat par ligne
  const plats = (html) => menuEnTexte(html).split(' • ').filter(Boolean);

  // ── Téléchargement du menu affiché, au format PDF ─────────
  // Même style que le menu imprimé de la crèche (voir utils/menuPdf.js)
  const telecharger = async () => {
    setTelechargement(true);
    try {
      await telechargerMenuPdf({
        titre:  t('public.menus.pdfTitre'),
        enTete: enTetePdf(semaine),
        jours:  JOURS.map(jour => ({
          nom:    t(`common.jours.${jour}`),
          midi:   plats(menu[`${jour}_midi`]),
          gouter: plats(menu[`${jour}_gouter`]),
          // Les 14 allergènes, chacun marqué présent ou non ce jour-là
          allergenes: ALLERGENES.map(cle => ({
            libelle: t(`common.allergenes.${cle}`),
            present: (menu[`${jour}_allergenes`] || []).includes(cle)
          }))
        })),
        labels: {
          sousTitre:    t('public.menus.pdfSousTitre'),
          gouter:       t('public.menus.gouter'),
          allergenes:   t('public.menus.allergenes'),
          nonRenseigne: t('public.menus.nonRenseigne'),
          legende:      t('public.menus.pdfLegende'),
          pied:         t('public.menus.pdfPied')
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
            <>
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
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: unPlatParLigne(menu[`${jour}_midi`]) }} />
                      }
                    </div>
                    <div className="repas-section repas-section--gouter">
                      <p className="repas-label">🍎 {t('public.menus.gouter')}</p>
                      {quillVide(menu[`${jour}_gouter`])
                        ? <p className="repas-contenu repas-vide">{t('public.menus.nonRenseigne')}</p>
                        : <div className="repas-contenu repas-html" dangerouslySetInnerHTML={{ __html: unPlatParLigne(menu[`${jour}_gouter`]) }} />
                      }
                    </div>

                    {/* Allergènes du jour : les 14 listés, ceux présents en rouge + ✔
                        (comme sur le menu imprimé). Rien de coché → message simple. */}
                    <div className="repas-allergenes">
                      <p className="repas-allergenes__titre">⚠️ {t('public.menus.allergenes')}</p>
                      {(menu[`${jour}_allergenes`] || []).length === 0 ? (
                        <p className="repas-contenu repas-vide">{t('public.menus.aucunAllergene')}</p>
                      ) : (
                        <ul className="repas-allergenes__liste">
                          {ALLERGENES.map(cle => {
                            const present = menu[`${jour}_allergenes`].includes(cle);
                            return (
                              <li key={cle} className={present ? 'allergene--present' : 'allergene--absent'}>
                                {present && <span aria-hidden="true">✔ </span>}
                                {t(`common.allergenes.${cle}`)}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Légende : la couleur seule ne suffit pas (accessibilité) → ✔ en plus */}
            <p className="allergenes-legende">⚠️ {t('public.menus.allergenesLegende')}</p>
            </>

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
