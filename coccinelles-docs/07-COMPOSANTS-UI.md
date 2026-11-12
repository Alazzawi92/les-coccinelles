# 🎨 07 — DESIGN SYSTEM & COMPOSANTS UI
# Fichier : 07-COMPOSANTS-UI.md
# Description : Identité visuelle, variables CSS, boutons communs et
# composants réutilisables réellement présents dans frontend-web/src/components

---

## 🎯 PRINCIPE

- Identité visuelle tirée du **logo de la crèche** (fleurs orange et jaune,
  coccinelles rouges) : ambiance douce et rassurante pour les familles.
- Tout passe par des **variables CSS** (`styles/variables.css`, 97 variables) :
  changer une couleur à un seul endroit la change dans tout le site, et le
  **thème sombre** redéfinit simplement ces variables.
- Un composant = un dossier : `Nom/Nom.jsx` + `Nom/Nom.css`, en-tête
  `FICHIER / ROLE`, props documentées avec valeurs par défaut.
- Pas de bibliothèque de composants externe : boutons et formulaires sont des
  **classes CSS communes** (`global.css`), les composants React sont réservés
  aux éléments qui ont un comportement.

---

## 🎨 COULEURS

| Variable | Valeur (thème clair) | Usage |
|---|---|---|
| `--primary` | `#FF7A45` | Orange des pétales du logo — couleur de la marque, boutons principaux |
| `--primary-dark` | `#E85A22` | Survol / focus des éléments orange |
| `--primary-light` | `#FFEDE1` | Fonds doux, badges |
| `--secondary` | `#FFB020` | Jaune des pétales — couleur secondaire |
| `--accent-1` | `#4FC3F7` | Bleu ciel — informations, statut « en cours » |
| `--accent-2` | `#FF2D55` | Rouge des coccinelles |
| `--accent-3` | `#BA68C8` | Violet — liste d'attente, super admin |
| `--bg-light` | `#FFFDF7` | Fond global (blanc chaud) |
| `--text-dark` / `--text-gray` | `#2D3436` / `#636e72` | Texte principal / secondaire |
| `--success` / `--error` / `--warning` / `--info` | `#43A047` / `#E53935` / `#FB8C00` / `#1E88E5` | États |

**Thème sombre** : `<html data-theme="dark">` redéfinit fonds, surfaces, textes,
bordures et ombres ; l'orange de la marque reste identique.

## 🔤 TYPOGRAPHIE
- Titres : **Fredoka** (`--font-heading`) — arrondie, adaptée à l'univers petite enfance.
- Texte : **Nunito** (`--font-body`) — très lisible.
- Chargées depuis Google Fonts.

## 📐 ESPACEMENTS, ARRONDIS, OMBRES, PROFONDEUR
| Famille | Valeurs |
|---|---|
| Espacements (système de 8 px) | `--space-xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 · `2xl` 48 · `3xl` 64 px |
| Arrondis | `--radius-sm` 8 · `md` 12 · `lg` 16 · `xl` 20 px · `--radius-pill` 50 px |
| Ombres | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-colored` |
| Profondeur (z-index) | sidebar 90 · navbar 100 · décor 150 · fenêtres 200 · notifications 300 |
| Animation | `--transition: all 0.2s ease` ; désactivée si `prefers-reduced-motion` |

---

## 🔘 BOUTONS (classes communes de global.css)

| Classe | Rendu |
|---|---|
| `.btn` | Base : arrondi pilule, police Nunito grasse, transition |
| `.btn--primary` | Fond orange, texte blanc (action principale) |
| `.btn--outline` | Contour, fond transparent (action secondaire) |
| `.btn--ghost` | Sans fond ni bordure (action discrète) |
| `.btn--sm` / `.btn--lg` | Petite / grande taille |

```jsx
<button type="button" className="btn btn--primary">Installer</button>
<Link to="/contact" className="btn btn--outline btn--lg">Nous contacter</Link>
```

---

## 🧩 COMPOSANTS RÉUTILISABLES (components/)

| Composant | Rôle |
|---|---|
| `AccesReserve` | Enveloppe une page parent réservée aux familles dont l'inscription est acceptée (galerie, suivi, absences, consentement). Sans inscription acceptée : écran explicatif avec un lien vers les demandes d'inscription. Le serveur bloque aussi ces routes (403) : ce composant évite seulement d'afficher une page vide ou en erreur. L'accès vient du ParentLayout (<Outlet context>) : il est déjà chargé pour le menu, on ne refait pas l'appel API. |
| `ApercuEquipe` | Aperçu "Notre équipe" : les premiers membres de l'équipe (photo, nom, fonction) + lien vers /equipe. Sorti de la page d'accueil pour pouvoir être placé sur n'importe quelle page. Charge ses propres données. Rien n'est affiché tant qu'aucun membre n'existe. |
| `BadgeInscription` | Badge du statut d'inscription d'un enfant, avec un libellé adapté : Inscrit(e), Demande en attente, Dossier incomplet, Liste d'attente, Demande refusée... Utilisé sur "Mes enfants" et à l'étape 2 de l'inscription. |
| `BandeauHorsLigne` | Bandeau affiché en haut de l'écran quand le téléphone ou l'ordinateur perd la connexion internet. Utile surtout pour l'application installée (PWA) : l'interface s'ouvre même hors ligne, mais les données (suivi, messages, photos...) ne sont jamais gardées sur l'appareil (RGPD), il faut donc prévenir le parent. Disparaît tout seul au retour de la connexion. |
| `BandeauMiseAJour` | Bandeau « Nouvelle version disponible » de la PWA. Apparaît quand une nouvelle version du site a été déployée et téléchargée en arrière-plan. - « Mettre à jour » : active la nouvelle version et recharge la page. - « Plus tard » : masque le bandeau ; la nouvelle version s'appliquera à la prochaine ouverture. |
| `Chargement` | Indicateur de chargement : une coccinelle qui fait le tour d'une petite piste en pointillés, avec le texte "Chargement...". Annoncé aux lecteurs d'écran (role=status). |
| `CoccinelleDefilement` | Coccinelle "retour en haut" sur le bord droit de l'écran. - Au repos : carapace fermée. - Pendant le défilement, elle ouvre ses ailes, les bat et se déplace : en haut de l'écran = début de la page, en bas = fin. - Quand le défilement s'arrête, elle se pose et referme ses ailes. - Tête vers le bas quand on descend, vers le haut quand on monte. - Au clic, ailes grandes ouvertes, elle ramène en haut de la page. C'est un vrai bouton : accessible au clavier et aux lecteurs d'écran ("Retour en haut de la page"). |
| `CoccinelleSvg` | Dessin SVG de la coccinelle de la crèche (vue de dessus, tête en haut), en 3 étapes : - 'fermee' : carapace fermée, ailes rangées - 'mi'     : carapace entrouverte, ailes à moitié sorties - 'ouverte': carapace levée, grandes ailes orange déployées Les passages d'une étape à l'autre sont animés en CSS. |
| `CookieBanner` | Bannière RGPD de consentement aux cookies. Affichée tant qu'aucun choix n'est enregistré dans localStorage (clé "coccinelles_cookie_consent"). 3 choix : Tout accepter / Tout refuser / Personnaliser (mesure d'audience uniquement, les cookies "essentiels" ne sont jamais désactivables). Le consentement est relu par le reste de l'app via getCookieConsent() pour ne charger les scripts de mesure d'audience que si consent.mesure === true. |
| `GoogleButton` | Bouton officiel "Se connecter avec Google". Charge le script Google Identity Services, affiche le bouton, puis envoie le jeton d'identité reçu au backend (POST /api/auth/google) qui le vérifie lui-même. Le bouton n'est pas affiché si REACT_APP_GOOGLE_CLIENT_ID n'est pas configuré (fonctionnalité désactivée). |
| `ImageSecours` | <img> qui affiche un visuel de remplacement si l'image ne se charge pas (fichier supprimé, lien expiré, erreur réseau), au lieu d'une icône d'image cassée. Props : src, alt, icone (emoji du visuel de secours, 📷 par défaut) + toutes les autres props d'un <img> (loading...). |
| `LanguageSwitcher` | Sélecteur de langue FR / EN. Change la langue de toute l'application via i18next ; le choix est mémorisé dans localStorage par le détecteur de langue (voir i18n/index.js). |
| `ModaleEmailConfirme` | Fenêtre affichée sur la page d'accueil juste après la confirmation de l'email (redirection depuis /verify-email). Explique la suite : l'équipe va vérifier le compte et le parent recevra un email à l'activation. Fermeture : "J'ai compris", Échap, clic sur le fond. "Découvrir la crèche" mène à la page de présentation. |
| `ModaleInstallation` | Fenêtre (pop-up) qui propose d'installer l'application Les Coccinelles dès l'ouverture du site. |
| `ThemeToggle` | Bouton ☀️ / 🌙 pour passer du thème clair au thème sombre. Au premier passage, le thème suit le réglage du système (voir public/theme-init.js) ; dès que le visiteur clique, son choix est mémorisé. |
| `Turnstile` | Case anti-robot Cloudflare Turnstile. Charge le script Cloudflare, affiche la case, puis transmet le jeton obtenu au formulaire parent, qui l'envoie au backend (vérifié par turnstile.middleware). Rien n'est affiché si REACT_APP_TURNSTILE_SITE_KEY n'est pas configuré (fonctionnalité désactivée). |
| `NotifCloche` | Cloche de notifications avec panneau déroulant. Rafraîchissement toutes les 60 s, UNIQUEMENT quand l'onglet est visible (pause si l'onglet est caché, rechargement au retour). Clic extérieur : mousedown + ref.current.contains pour fermer. Badge plafonné à "99+" si plus de 99 non lues. formatDate : relatif ("À l'instant", "Il y a X min", "Il y a Xh"). iconeType : objet lookup par type de notification. clicNotif : marquerLue + navigate(n.lien). toutLire : PATCH /notifications/tout-lire → map all lue:true. supprimer : e.stopPropagation() avant DELETE. |

### Composants « mise en page » (layouts/)
| Layout | Contenu |
|---|---|
| `PublicLayout` | Barre de navigation (menu hamburger sur mobile), pied de page (version, mentions légales, installation de l'application) |
| `ParentLayout` | Sidebar de l'espace parents → barre de navigation en bas sur mobile ; cloche de notifications |
| `AdminLayout` | Sidebar groupée (« Quotidien » / « Gestion ») selon le rôle ; cloche de notifications |

---

## 📌 RÈGLES COMPOSANTS

1. Un dossier par composant : `Nom/Nom.jsx` + `Nom/Nom.css` (PascalCase).
2. Classes CSS en kebab-case, méthode BEM (`bloc__element--variante`).
3. Toujours `var(--variable)`, jamais de couleur en dur, jamais de style inline.
4. Props documentées et valeurs par défaut sur les props optionnelles.
5. Textes via `t('…')` (FR / EN), jamais écrits en dur.
6. Accessibilité : vrais `<button>`, `aria-*` sur les éléments dynamiques,
   fenêtres fermables avec Échap.
7. `export default NomComposant` en bas du fichier.
