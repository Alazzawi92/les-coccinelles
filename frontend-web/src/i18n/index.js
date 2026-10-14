// ============================================================
// FICHIER  : i18n/index.js
// RÔLE     : Configuration de l'internationalisation (i18n)
//            avec i18next + react-i18next.
//            Langues disponibles : français (par défaut) et anglais.
//            La langue choisie est mémorisée dans localStorage
//            (clé "coccinelles_langue") puis détectée au prochain
//            chargement ; à défaut, on utilise la langue du navigateur.
//
//            Les traductions sont rangées par espace du site
//            (common, public, auth, parent, admin) et accessibles
//            via t('espace.page.cle'), ex : t('public.accueil.titre').
// ============================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traductions françaises (une par espace du site)
import frCommon from './locales/fr/common.json';
import frPublic from './locales/fr/public.json';
import frAuth   from './locales/fr/auth.json';
import frParent from './locales/fr/parent.json';
import frAdmin  from './locales/fr/admin.json';

// Traductions anglaises (mêmes clés que les fichiers français)
import enCommon from './locales/en/common.json';
import enPublic from './locales/en/public.json';
import enAuth   from './locales/en/auth.json';
import enParent from './locales/en/parent.json';
import enAdmin  from './locales/en/admin.json';

// Clé localStorage où la langue choisie par l'utilisateur est mémorisée
export const CLE_LANGUE = 'coccinelles_langue';

// Langues proposées dans le sélecteur
export const LANGUES = ['fr', 'en'];

i18n
  .use(LanguageDetector)  // Détecte la langue (localStorage puis navigateur)
  .use(initReactI18next)  // Branche i18next sur React (hook useTranslation)
  .init({
    resources: {
      fr: { translation: { common: frCommon, public: frPublic, auth: frAuth, parent: frParent, admin: frAdmin } },
      en: { translation: { common: enCommon, public: enPublic, auth: enAuth, parent: enParent, admin: enAdmin } }
    },
    fallbackLng:   'fr',     // Si une clé manque en anglais, on affiche le français
    supportedLngs: LANGUES,  // Toute autre langue détectée retombe sur le français
    nonExplicitSupportedLngs: true, // "en-GB" / "fr-CA" → "en" / "fr"
    interpolation: { escapeValue: false }, // React échappe déjà le HTML (protection XSS)
    detection: {
      order:  ['localStorage', 'navigator'], // Choix mémorisé en priorité
      caches: ['localStorage'],              // Mémorise la langue choisie
      lookupLocalStorage: CLE_LANGUE
    }
  });

// Met à jour l'attribut lang de <html> (accessibilité : lecteurs d'écran)
const majLangHtml = (langue) => {
  document.documentElement.lang = langue?.startsWith('en') ? 'en' : 'fr';
};
majLangHtml(i18n.language);
i18n.on('languageChanged', majLangHtml);

// Retourne la locale à utiliser pour formater dates et nombres
// (toLocaleDateString, toLocaleTimeString...) selon la langue active
export const getLocale = () => (i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR');

export default i18n;
