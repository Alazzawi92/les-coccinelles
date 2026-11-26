# 📚 Documentation — Les Coccinelles

Documentation à jour du projet (état réel du code au **12/11/2026**).
Elle sert à la fois de référence technique et de matière première pour le
**dossier de projet**, le **dossier professionnel** et la **présentation** du
titre CDA.

## Contenu

| Fichier | Sujet |
|---|---|
| `00-PROJET-GENERAL.md` | Vue d'ensemble : client, besoins, rôles, fonctionnalités, architecture, stack, chiffres clés |
| `01-BASE-DE-DONNEES.md` | 24 tables, relations, choix de conception, migrations, schéma SQL complet |
| `02-BACKEND-API.md` | Architecture en couches, middlewares, parcours d'authentification, 102 routes |
| `03-FRONTEND-WEB.md` | Arborescence, routage et gardes, API, styles, traductions, accessibilité |
| `04-FRONTEND-MOBILE.md` | Version mobile en PWA (choix face à Expo, cache RGPD, installation, mises à jour) |
| `05-SECURITE-RGPD.md` | Mesures de sécurité, OWASP Top 10, RGPD, limites connues |
| `06-OUTILS-DEVOPS.md` | Environnements, Docker, Git, hébergement Vercel + Alwaysdata, mise en production |
| `07-COMPOSANTS-UI.md` | Design system (couleurs, typographie, espacements) et composants |
| `08-ROADMAP-PHASES.md` | Planning en 7 phases et avancement réel |
| `09-SYNTHESE-SOUTENANCE.md` | **Résumé FR / EN, compétences CDA, tests, difficultés, plan de présentation** |
| `CLAUDE.md` | Consignes de code pour l'assistant Claude Code |

## Consignes pour l'IA qui rédige les dossiers

1. Utiliser **uniquement** les informations de ces fichiers ; ne rien inventer
   (chiffres, outils, résultats de tests, dates).
2. Les mentions **« À COMPLÉTER »** signalent une information que seule Sabah
   peut fournir : la demander au lieu de la deviner.
3. Les limites et points faibles listés (pas de tests automatisés, jetons en
   `localStorage`, etc.) doivent être présentés honnêtement, avec
   l'amélioration prévue.
4. Les intitulés de compétences du titre CDA sont à vérifier avec le
   référentiel officiel fourni par la formation.
