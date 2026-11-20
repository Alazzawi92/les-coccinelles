# 🎨 10 — SYSTÈME DE DESIGN (pour Figma)
# Fichier : 10-SYSTEME-DESIGN.md
# Description : Toutes les valeurs visuelles du site Les Coccinelles,
# prêtes à recréer dans Figma (variables, styles de couleur, styles de texte,
# effets, composants). Source de vérité : frontend-web/src/styles/variables.css

---

## 🎯 COMMENT UTILISER CE FICHIER DANS FIGMA

1. **Variables** : dans Figma, panneau *Local variables* → créer 3 collections :
   - `Couleurs` avec **2 modes** : `Clair` et `Sombre` (section 1 et 2)
   - `Espacements` (section 4)
   - `Arrondis` (section 5)
2. **Styles de texte** : créer les styles de la section 3 (polices Google Fonts
   Fredoka et Nunito, disponibles directement dans Figma).
3. **Effets** : créer les ombres de la section 6 comme *Effect styles*.
4. **Composants** : construire les composants de la section 8 en utilisant
   uniquement les variables (jamais une couleur tapée à la main).
5. **Import automatique (optionnel)** : le bloc JSON de la section 11 peut être
   importé avec le plugin Figma **Tokens Studio** ou **Variables Import**.

> Règle : le nom d'une variable dans Figma = le nom de la variable CSS sans
> les `--` (ex. `--primary` → `primary`). Ainsi la maquette et le code parlent
> la même langue.

---

## 1. 🎨 COULEURS — MODE CLAIR

### Marque (tirée du logo : pétales orange/jaune, coccinelles rouges)

| Variable | Valeur | Usage |
|---|---|---|
| `primary` | `#FF7A45` | Orange du logo — boutons principaux, liens actifs |
| `primary-dark` | `#E85A22` | Survol des éléments orange |
| `primary-light` | `#FFEDE1` | Fond doux : cartes, badges, zones mises en valeur |
| `secondary` | `#FFB020` | Jaune des pétales — couleur secondaire |
| `secondary-dark` | `#D98E0A` | Survol des éléments jaunes |

### Accents

| Variable | Valeur | Usage |
|---|---|---|
| `accent-1` | `#4FC3F7` | Bleu ciel — badges « en cours », infos |
| `accent-2` | `#FF2D55` | Rouge coccinelle — raccourcis, mises en valeur |
| `accent-3` | `#BA68C8` | Violet — « liste d'attente », super admin |
| `accent-4` | `#FFEB3B` | Jaune soleil — galerie, alertes douces |
| `teal` | `#26A69A` | Turquoise — partenaire Pirouette |
| `teal-dark` | `#00897B` | Survol turquoise |
| `teal-bg` | `#F0FDFB` | Fond de l'encadré Pirouette |

### Neutres, fonds et textes

| Variable | Valeur | Usage |
|---|---|---|
| `bg-light` | `#FFFDF7` | Fond global du site (blanc chaud) |
| `bg-gray` | `#F5F5F5` | Zones alternées, en-têtes de tableau |
| `bg-app` | `#F0F2F5` | Fond du contenu des espaces admin / parent |
| `surface` | `#FFFFFF` | Cartes, modales, barres du haut |
| `white` | `#FFFFFF` | Texte/icône sur fond coloré (reste blanc en sombre) |
| `text-dark` | `#2D3436` | Texte principal |
| `text-gray` | `#636E72` | Texte secondaire, labels, sous-titres |
| `text-light` | `#B2BEC3` | Placeholders, texte désactivé |
| `border` | `#E0E0E0` | Bordures standard, séparateurs |
| `border-strong` | `#BDBDBD` | Bordures marquées, survol |
| `tint` | `#000000` à 6 % | Survols discrets |
| `ink` | `#2D3436` | Zones toujours sombres (sidebar admin, pied de page) |
| `ink-soft` | `#4A4F52` | Survol dans les zones sombres |
| `ink-danger` | `#EF9A9A` | Texte rouge lisible sur l'encre |

### États (messages, statuts, badges)

| État | Couleur pleine | Fond teinté | Texte | Bordure |
|---|---|---|---|---|
| Succès | `success` `#43A047` | `success-bg` `#E8F5E9` | `success-text` `#2E7D32` | `success-border` `#A5D6A7` |
| Erreur | `error` `#E53935` | `error-bg` `#FFEBEE` | `error-text` `#C62828` | `error-border` `#EF9A9A` |
| Avertissement | `warning` `#FB8C00` | `warning-bg` `#FFF3E0` | `warning-text` `#E65100` | `warning-border` `#FFCC80` |
| Info | `info` `#1E88E5` | `info-bg` `#E3F2FD` | `info-text` `#1565C0` | — |
| Violet | — | `violet-bg` `#F3E5F5` | `violet-text` `#6A1B9A` | — |
| Rose | — | `rose-bg` `#FCE4EC` | `rose-text` `#AD1457` | — |
| Jaune | — | `yellow-bg` `#FFF8E1` | — | — |

Autres : `error-dark` `#C62828` (survol bouton « Supprimer »),
`focus-ring` `#FF7A45` à 20 % (halo de focus), `focus-ring-error` `#E53935` à 15 %.

### Illustration coccinelle (identique dans les deux modes)

| Variable | Valeur |
|---|---|
| `coccinelle-rouge` | `#F7163F` |
| `coccinelle-brun` | `#5B2A1E` |
| `coccinelle-brun-clair` | `#74392A` |
| `coccinelle-aile` | `#F99B57` |
| `coccinelle-nervure` | `#EC7A3A` |

---

## 2. 🌙 COULEURS — MODE SOMBRE

Seules ces variables changent. Toutes les autres gardent la valeur du mode clair
(dans Figma, mettre la même valeur dans les deux modes).

| Variable | Clair | Sombre |
|---|---|---|
| `bg-light` | `#FFFDF7` | `#16181B` |
| `bg-gray` | `#F5F5F5` | `#24272C` |
| `bg-app` | `#F0F2F5` | `#121417` |
| `surface` | `#FFFFFF` | `#1E2125` |
| `text-dark` | `#2D3436` | `#ECEFF1` |
| `text-gray` | `#636E72` | `#AAB4B9` |
| `text-light` | `#B2BEC3` | `#727E83` |
| `border` | `#E0E0E0` | `#363B42` |
| `border-strong` | `#BDBDBD` | `#4C535C` |
| `tint` | noir 6 % | blanc 8 % |
| `primary-light` | `#FFEDE1` | `#3B2519` |
| `error` | `#E53935` | `#EF5350` |
| `success` | `#43A047` | `#66BB6A` |
| `warning` | `#FB8C00` | `#FFA726` |
| `info` | `#1E88E5` | `#42A5F5` |
| `success-bg` / `-text` / `-border` | — | `#1B2E20` / `#81C784` / `#2E5A36` |
| `error-bg` / `-text` / `-border` | — | `#3A1D20` / `#EF9A9A` / `#7A3034` |
| `warning-bg` / `-text` / `-border` | — | `#3A2A15` / `#FFB74D` / `#7A5420` |
| `info-bg` / `-text` | — | `#15283A` / `#90CAF9` |
| `violet-bg` / `-text` | — | `#2D1F33` / `#CE93D8` |
| `rose-bg` / `-text` | — | `#3A1C29` / `#F48FB1` |
| `yellow-bg` | `#FFF8E1` | `#332C14` |
| `teal-bg` | `#F0FDFB` | `#12302C` |
| `ink` | `#2D3436` | `#0E1012` |
| `ink-soft` | `#4A4F52` | `#2A2E33` |

> En mode sombre, le logo (texte noir) est posé sur une plaque blanche
> arrondie (`radius-md`, marge 2 × 6 px).

---

## 3. 🔤 TYPOGRAPHIE

| Rôle | Police | Poids disponibles |
|---|---|---|
| Titres (h1 → h6) | **Fredoka** | 400, 500, 600, 700 |
| Texte courant, boutons, champs | **Nunito** | 400, 500, 600, 700, 800 |

Base : 1 rem = **16 px**. Interligne du texte courant : **160 %** ;
des titres : **120 %**.

### Styles de texte à créer dans Figma

| Nom du style | Police | Taille | Graisse | Interligne | Couleur |
|---|---|---|---|---|---|
| `Titre/Hero` | Fredoka | 56 px (35 px mobile) | 700 | 115 % | `text-dark` |
| `Titre/Section` | Fredoka | 32 px | 600 | 120 % | `text-dark` (mot clé en `primary`) |
| `Titre/Carte` | Fredoka | 20 px | 600 | 120 % | `text-dark` |
| `Texte/Intro` | Nunito | 17.6 px (1.1 rem) | 400 | 160 % | `text-gray` |
| `Texte/Courant` | Nunito | 16 px | 400 | 160 % | `text-dark` |
| `Texte/Label` | Nunito | 14.4 px (0.9 rem) | 700 | 160 % | `text-dark` |
| `Texte/Bouton` | Nunito | 14.4 px (0.9 rem) | 700 | 100 % | selon bouton |
| `Texte/Bouton grand` | Nunito | 16 px | 700 | 100 % | selon bouton |
| `Texte/Petit` | Nunito | 12.8 px (0.8 rem) | 700 | 140 % | selon usage (badges, erreurs) |

> Astuce titres : le dernier mot d'un titre de section est souvent en orange
> (« Notre **équipe** »).

---

## 4. 📐 ESPACEMENTS (grille de 8 px)

| Variable | Valeur | Usage |
|---|---|---|
| `space-xs` | 4 | Micro-espaces, gaps internes |
| `space-sm` | 8 | Entre icône et texte, padding compact |
| `space-md` | 16 | Entre champs, padding de bouton |
| `space-lg` | 24 | Padding de carte, gap de grille |
| `space-xl` | 32 | Padding de page, marges latérales du conteneur |
| `space-2xl` | 48 | Entre sections importantes |
| `space-3xl` | 64 | Hero, très grands espaces |

**Conteneur de page** : largeur max **1200 px**, centré, marges latérales 32 px.

---

## 5. ⭕ ARRONDIS

| Variable | Valeur | Usage |
|---|---|---|
| `radius-sm` | 8 | Badges carrés, miniatures |
| `radius-md` | 12 | Champs, selects, petites cartes |
| `radius-lg` | 16 | Cartes moyennes, éléments de liste |
| `radius-xl` | 20 | Cartes principales, modales |
| `radius-pill` | 50 | Boutons, badges de statut (forme de pilule) |

---

## 6. 🌫️ OMBRES (Effect styles)

| Nom | Clair | Sombre |
|---|---|---|
| `shadow-sm` | Y 1, flou 3, noir 10 % | Y 1, flou 3, noir 50 % |
| `shadow-md` | Y 4, flou 12, noir 10 % | Y 4, flou 12, noir 50 % |
| `shadow-lg` | Y 8, flou 24, noir 15 % | Y 8, flou 24, noir 60 % |
| `shadow-colored` | Y 4, flou 15, `#FF9800` 30 % | idem |

(X = 0 et étalement = 0 pour toutes les ombres.)

---

## 7. 📱 POINTS DE RUPTURE (frames Figma)

| Écran | Largeur max | Frame conseillée |
|---|---|---|
| Petit mobile | ≤ 479 px | 375 |
| Mobile | ≤ 767 px | 430 |
| Tablette | ≤ 1023 px | 768 |
| Petit ordinateur | ≤ 1279 px | 1024 |
| Ordinateur (base de conception) | ≤ 1439 px | **1440** |
| Grand écran | ≥ 1440 px | 1920 |

Le site est conçu d'abord pour 1440 px puis adapté vers le bas.

---

## 8. 🧩 COMPOSANTS

### 8.1 Bouton

Forme commune : pilule (`radius-pill`), bordure 2 px, texte Nunito 700,
icône + texte espacés de 8 px, auto-layout horizontal centré, pas de retour à la ligne.

**Propriétés Figma (variantes)** : `Type` × `Taille` × `État`

| Type | Fond | Bordure | Texte | Survol |
|---|---|---|---|---|
| `Primaire` | `primary` | `primary` | `white` | fond + bordure `primary-dark` |
| `Ghost` | transparent | `border` | `text-dark` | fond `bg-gray`, bordure `border-strong` |
| `Outline` | transparent | `primary` | `primary` | fond `primary-light` |

| Taille | Padding (vertical × horizontal) | Texte |
|---|---|---|
| `Petit` | 4 × 16 | 12.8 px |
| `Normal` | 8 × 24 | 14.4 px |
| `Grand` | 16 × 32 | 16 px |
| `Hero` (« Inscrire mon enfant ») | 24 × 48 | 18.4 → 22.4 px selon l'écran |

États : `Défaut`, `Survol`, `Désactivé` (opacité 55 %).
Transition au survol : 0,2 s, *ease* (Smart animate dans le prototype).

### 8.2 Champ de saisie

| Propriété | Valeur |
|---|---|
| Padding | 8 × 16 |
| Bordure | 2 px `border` |
| Arrondi | `radius-md` (12) |
| Fond | `surface` |
| Texte | Nunito 16 px, `text-dark` ; placeholder `text-light` |
| Label au-dessus | `Texte/Label` ; astérisque obligatoire en `error` |

États :
- `Défaut`
- `Focus` : bordure `primary` + halo 3 px `focus-ring`
- `Erreur` : bordure `error` + message dessous en `error` 12.8 px
- `Erreur + focus` : halo 3 px `focus-ring-error`

### 8.3 Badge de statut (inscription)

Pilule, padding 4 × 16, texte 12.8 px graisse 700.

| Variante | Fond | Texte |
|---|---|---|
| Acceptée | `success-bg` | `success-text` |
| En attente / En cours | `info-bg` | `info-text` |
| Dossier incomplet | `warning-bg` | `warning-text` |
| Liste d'attente | `violet-bg` | `violet-text` |
| Refusée | `error-bg` | `error-text` |

### 8.4 Carte

Fond `surface`, arrondi `radius-lg` ou `radius-xl`, padding 24, ombre `shadow-sm`
(au survol `shadow-md`).

### 8.5 Modale

Fond `surface`, arrondi `radius-xl`, ombre `shadow-lg`, voile noir derrière.

### 8.6 Autres composants du site (à dessiner à partir des mêmes variables)

Barre de navigation, pied de page (`ink`), barre latérale admin (`ink`),
bandeau cookies, notification (toast), bouton thème clair/sombre,
sélecteur de langue FR/EN, bouton Google, coccinelle « retour en haut »,
fenêtre « Installez l'application », écran de chargement.
Leur code est dans `frontend-web/src/components/ui/`.

---

## 9. 🗂️ ORDRE D'EMPILEMENT (calques)

Du plus bas au plus haut : contenu → barre latérale (90) → barre de navigation (100)
→ coccinelle « retour en haut » (150) → modale (200) → notification (300).

---

## 10. ✨ ANIMATIONS ET ACCESSIBILITÉ

- Transition standard : **0,2 s ease** sur tous les éléments interactifs.
- Apparition des sections au défilement : opacité 0 → 1 et montée de 24 px,
  **0,6 s ease**.
- Si l'utilisateur a choisi « Réduire les animations », tout est instantané (RGAA 13.8).
- Contraste : textes clairs sur fond sombre et couleurs d'état éclaircies en
  mode sombre pour rester lisibles.
- Le focus clavier est toujours visible (halo orange).

---

## 11. 📦 TOKENS JSON (import dans Figma)

À coller dans le plugin **Tokens Studio for Figma** (format « JSON » →
un set `clair` et un set `sombre`), puis *Export to Figma variables*.

```json
{
  "clair": {
    "primary":        { "value": "#FF7A45", "type": "color" },
    "primary-dark":   { "value": "#E85A22", "type": "color" },
    "primary-light":  { "value": "#FFEDE1", "type": "color" },
    "secondary":      { "value": "#FFB020", "type": "color" },
    "secondary-dark": { "value": "#D98E0A", "type": "color" },
    "accent-1":       { "value": "#4FC3F7", "type": "color" },
    "accent-2":       { "value": "#FF2D55", "type": "color" },
    "accent-3":       { "value": "#BA68C8", "type": "color" },
    "accent-4":       { "value": "#FFEB3B", "type": "color" },
    "teal":           { "value": "#26A69A", "type": "color" },
    "teal-dark":      { "value": "#00897B", "type": "color" },
    "teal-bg":        { "value": "#F0FDFB", "type": "color" },
    "bg-light":       { "value": "#FFFDF7", "type": "color" },
    "bg-gray":        { "value": "#F5F5F5", "type": "color" },
    "bg-app":         { "value": "#F0F2F5", "type": "color" },
    "surface":        { "value": "#FFFFFF", "type": "color" },
    "white":          { "value": "#FFFFFF", "type": "color" },
    "text-dark":      { "value": "#2D3436", "type": "color" },
    "text-gray":      { "value": "#636E72", "type": "color" },
    "text-light":     { "value": "#B2BEC3", "type": "color" },
    "border":         { "value": "#E0E0E0", "type": "color" },
    "border-strong":  { "value": "#BDBDBD", "type": "color" },
    "tint":           { "value": "rgba(0,0,0,0.06)", "type": "color" },
    "ink":            { "value": "#2D3436", "type": "color" },
    "ink-soft":       { "value": "#4A4F52", "type": "color" },
    "ink-danger":     { "value": "#EF9A9A", "type": "color" },
    "focus-ring":     { "value": "rgba(255,122,69,0.2)", "type": "color" },
    "focus-ring-error": { "value": "rgba(229,57,53,0.15)", "type": "color" },
    "error":          { "value": "#E53935", "type": "color" },
    "error-dark":     { "value": "#C62828", "type": "color" },
    "success":        { "value": "#43A047", "type": "color" },
    "warning":        { "value": "#FB8C00", "type": "color" },
    "info":           { "value": "#1E88E5", "type": "color" },
    "success-bg":     { "value": "#E8F5E9", "type": "color" },
    "success-text":   { "value": "#2E7D32", "type": "color" },
    "success-border": { "value": "#A5D6A7", "type": "color" },
    "error-bg":       { "value": "#FFEBEE", "type": "color" },
    "error-text":     { "value": "#C62828", "type": "color" },
    "error-border":   { "value": "#EF9A9A", "type": "color" },
    "warning-bg":     { "value": "#FFF3E0", "type": "color" },
    "warning-text":   { "value": "#E65100", "type": "color" },
    "warning-border": { "value": "#FFCC80", "type": "color" },
    "info-bg":        { "value": "#E3F2FD", "type": "color" },
    "info-text":      { "value": "#1565C0", "type": "color" },
    "violet-bg":      { "value": "#F3E5F5", "type": "color" },
    "violet-text":    { "value": "#6A1B9A", "type": "color" },
    "rose-bg":        { "value": "#FCE4EC", "type": "color" },
    "rose-text":      { "value": "#AD1457", "type": "color" },
    "yellow-bg":      { "value": "#FFF8E1", "type": "color" },
    "coccinelle-rouge":      { "value": "#F7163F", "type": "color" },
    "coccinelle-brun":       { "value": "#5B2A1E", "type": "color" },
    "coccinelle-brun-clair": { "value": "#74392A", "type": "color" },
    "coccinelle-aile":       { "value": "#F99B57", "type": "color" },
    "coccinelle-nervure":    { "value": "#EC7A3A", "type": "color" },

    "space-xs":  { "value": "4",  "type": "spacing" },
    "space-sm":  { "value": "8",  "type": "spacing" },
    "space-md":  { "value": "16", "type": "spacing" },
    "space-lg":  { "value": "24", "type": "spacing" },
    "space-xl":  { "value": "32", "type": "spacing" },
    "space-2xl": { "value": "48", "type": "spacing" },
    "space-3xl": { "value": "64", "type": "spacing" },

    "radius-sm":   { "value": "8",  "type": "borderRadius" },
    "radius-md":   { "value": "12", "type": "borderRadius" },
    "radius-lg":   { "value": "16", "type": "borderRadius" },
    "radius-xl":   { "value": "20", "type": "borderRadius" },
    "radius-pill": { "value": "50", "type": "borderRadius" },

    "font-heading": { "value": "Fredoka", "type": "fontFamilies" },
    "font-body":    { "value": "Nunito",  "type": "fontFamilies" }
  },
  "sombre": {
    "bg-light":       { "value": "#16181B", "type": "color" },
    "bg-gray":        { "value": "#24272C", "type": "color" },
    "bg-app":         { "value": "#121417", "type": "color" },
    "surface":        { "value": "#1E2125", "type": "color" },
    "text-dark":      { "value": "#ECEFF1", "type": "color" },
    "text-gray":      { "value": "#AAB4B9", "type": "color" },
    "text-light":     { "value": "#727E83", "type": "color" },
    "border":         { "value": "#363B42", "type": "color" },
    "border-strong":  { "value": "#4C535C", "type": "color" },
    "tint":           { "value": "rgba(255,255,255,0.08)", "type": "color" },
    "primary-light":  { "value": "#3B2519", "type": "color" },
    "error":          { "value": "#EF5350", "type": "color" },
    "success":        { "value": "#66BB6A", "type": "color" },
    "warning":        { "value": "#FFA726", "type": "color" },
    "info":           { "value": "#42A5F5", "type": "color" },
    "success-bg":     { "value": "#1B2E20", "type": "color" },
    "success-text":   { "value": "#81C784", "type": "color" },
    "success-border": { "value": "#2E5A36", "type": "color" },
    "error-bg":       { "value": "#3A1D20", "type": "color" },
    "error-text":     { "value": "#EF9A9A", "type": "color" },
    "error-border":   { "value": "#7A3034", "type": "color" },
    "warning-bg":     { "value": "#3A2A15", "type": "color" },
    "warning-text":   { "value": "#FFB74D", "type": "color" },
    "warning-border": { "value": "#7A5420", "type": "color" },
    "info-bg":        { "value": "#15283A", "type": "color" },
    "info-text":      { "value": "#90CAF9", "type": "color" },
    "violet-bg":      { "value": "#2D1F33", "type": "color" },
    "violet-text":    { "value": "#CE93D8", "type": "color" },
    "rose-bg":        { "value": "#3A1C29", "type": "color" },
    "rose-text":      { "value": "#F48FB1", "type": "color" },
    "yellow-bg":      { "value": "#332C14", "type": "color" },
    "teal-bg":        { "value": "#12302C", "type": "color" },
    "ink":            { "value": "#0E1012", "type": "color" },
    "ink-soft":       { "value": "#2A2E33", "type": "color" }
  }
}
```

---

## 📌 RÈGLES

- Une couleur, un espacement ou un arrondi qui n'existe pas ici ne doit pas
  apparaître dans la maquette : on l'ajoute d'abord dans `variables.css`, puis ici.
- Toute modification de `variables.css` doit être reportée dans ce fichier
  (et dans Figma) pour que maquette et code restent identiques.
- Voir aussi `07-COMPOSANTS-UI.md` pour la liste des composants React.
