# Guide pratique d'inscription — source

Le PDF téléchargé depuis le site (`backend/assets/guide-inscription.pdf`,
route publique `GET /api/parametres/guide-inscription`) est fabriqué à partir
de ce dossier :

| Fichier | Rôle |
|---|---|
| `guide-inscription.html` | Pages 1 et 2 du guide (texte à modifier ici) |
| `annexe-fiche-unique.pdf` | Page 3 : fiche unique de renseignements scannée, ajoutée telle quelle |
| `logo.png` | Logo de l'en-tête (copie de `frontend-web/public/images/logo.png`) |
| `polices/Lato-*.ttf` | Police Lato (licence SIL OFL 1.1, fichiers Fontsource) |
| `generer-guide.mjs` | Script : HTML → PDF avec Chrome, puis ajout de l'annexe |

## Modifier le guide

1. Modifier le texte dans `guide-inscription.html`
   (aperçu : ouvrir le fichier dans Chrome).
2. Régénérer le PDF, depuis ce dossier :
   ```bash
   npm install --no-save pdf-lib   # une seule fois
   node generer-guide.mjs           # chemin de Chrome en argument si besoin
   ```
3. Ouvrir `backend/assets/guide-inscription.pdf` et vérifier que chaque page
   tient sur une feuille A4 (sinon réduire un texte ou un espacement).
4. Commit, puis mise à jour du backend sur Alwaysdata.

> Si le super admin a déjà envoyé un autre guide depuis l'espace admin
> (Paramètres), c'est **ce guide envoyé** qui est servi en priorité
> (`stockage/guide/guide-inscription.pdf`). Dans ce cas, envoyer aussi le
> nouveau PDF depuis l'espace admin.
