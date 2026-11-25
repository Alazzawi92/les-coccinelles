# Partenaires de la crèche — données initiales

Liste des 11 partenaires issue du document pédagogique de la crèche
(`partenaires.json`) et logos vérifiés (PNG). Import dans la base avec :

```bash
# depuis le dossier backend (sous Docker : docker exec coccinelles-backend ...)
node scripts/importer-partenaires.js              # simulation
node scripts/importer-partenaires.js --appliquer  # import réel
```

Un partenaire déjà présent (même nom) n'est jamais modifié ni dupliqué.
Ensuite, tout se gère depuis le back office : **Admin → Partenaires**.

## Sources des logos (vérifiées le 26/11/2026)

| Fichier | Partenaire | Source |
|---|---|---|
| `puilboreau.png` | Médiathèque de Puilboreau (logo de la mairie) | En-tête de https://www.ville-puilboreau.fr/ — logo officiel blanc, posé sur un fond foncé pour rester visible (logo lui-même non modifié) |
| `carre-amelot.png` | Carré Amelot | SVG officiel de https://www.carre-amelot.net/, converti en PNG |
| `le-pertuis.png` | Ludothèque du Pertuis de La Rochelle | SVG officiel de https://le-pertuis.fr/ (centre socio-culturel qui gère la ludothèque), converti en PNG |
| `creche-dompierre.png` | Crèche de Dompierre-sur-Mer | https://www.creche-dompierre.com/includes/images/logo.png (site de la crèche) |
| `espace-camaieux.png` | Espace Camaïeux | Logo publié par la Fondation Georges Truffaut (le site de l'association n'a qu'une bannière illustrée) |

⚠️ **Autorisation d'utilisation de chaque logo à confirmer avant publication.**
