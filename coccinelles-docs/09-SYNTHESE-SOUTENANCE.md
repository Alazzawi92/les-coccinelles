# 🎓 09 — SYNTHÈSE POUR LA SOUTENANCE
# Fichier : 09-SYNTHESE-SOUTENANCE.md
# Description : Matière première pour rédiger le dossier de projet, le dossier
# professionnel et la présentation orale du titre CDA.
# Tout ce qui est écrit ici est vérifié dans le code au 12/11/2026.
# Les points « À COMPLÉTER » doivent être remplis par Sabah (ne pas les inventer).

---

## 1. RÉSUMÉ DU PROJET

### En français
Les Coccinelles est une plateforme web réalisée pour une crèche associative de
Puilboreau (28 places, enfants de 2 mois et demi à 3 ans). Elle remplace deux outils séparés
par une application unique qui réunit le site public de la crèche, un espace
sécurisé pour les parents (demande d'inscription en ligne, suivi quotidien de
l'enfant, absences, documents, messagerie, galerie photos soumise au
consentement) et un espace de gestion pour l'équipe et la direction
(émargement, saisie du suivi, validation des dossiers, contenus du site,
statistiques, rapports de présence).

L'application suit une architecture trois tiers : interface React 18 hébergée
sur Vercel, API REST Node.js / Express avec Sequelize hébergée sur Alwaysdata,
base MySQL / MariaDB de 20 tables. Les données concernant des mineurs, dont des
données de santé, la sécurité et le RGPD ont guidé chaque choix : double
authentification par email, rôles et contrôle de propriété des données, liens
signés pour les fichiers privés, consentement photo par enfant, en-têtes de
sécurité corrigés après un audit OWASP ZAP. Le site est bilingue (français /
anglais), propose un thème sombre et s'installe sur téléphone comme une
application (PWA).

### In English (draft — to be reviewed)
Les Coccinelles is a web platform built for a non-profit day nursery in
Puilboreau, France (28 places, children aged 2½ months to 3 years). It replaces two separate
tools with a single application combining the nursery's public website, a
secure parent area (online enrolment request, child's daily log, absences,
documents, messaging, photo gallery subject to consent) and a management area
for staff and management (attendance, daily log entry, enrolment processing,
website content, statistics, attendance reports).

The application follows a three-tier architecture: a React 18 front end hosted
on Vercel, a Node.js / Express REST API using Sequelize hosted on Alwaysdata,
and a 20-table MySQL / MariaDB database. Because it handles data about minors,
including health data, security and GDPR compliance drove every decision:
two-factor authentication by email, role-based access with data-ownership
checks, signed links for private files, per-child photo consent, and security
headers fixed after an OWASP ZAP audit. The site is bilingual (French /
English), offers a dark theme and can be installed on a phone as an app (PWA).

---

## 2. CONTEXTE ET BESOINS

### Le client
- Crèche associative Les Coccinelles, Puilboreau (17) ; communes accueillies :
  Puilboreau, Saint-Xandre, Esnandes.
- 28 places fixes + 4 places de garderie, du lundi au vendredi, 7 h 30 – 18 h 30.
- Utilisateurs : parents, équipe éducative, direction.
- **À COMPLÉTER** : cadre du projet (stage, projet de formation, commande
  réelle ?), interlocuteur côté crèche, recueil des besoins (entretiens,
  réunions, outils existants observés).

### Besoins exprimés (sous forme de récits utilisateurs)
| En tant que… | je veux… | afin de… |
|---|---|---|
| visiteur | consulter la présentation, les tarifs, les menus, les actualités | découvrir la crèche avant d'inscrire mon enfant |
| parent | déposer une demande d'inscription complète en ligne | éviter les dossiers papier |
| parent | voir le suivi de la journée de mon enfant | savoir comment il a mangé, dormi, joué |
| parent | déclarer une absence avec justificatif | prévenir la crèche simplement |
| parent | échanger des messages et documents avec l'équipe | centraliser la communication |
| parent | choisir si mon enfant peut être photographié | garder la maîtrise de son image |
| membre de l'équipe | pointer les arrivées / départs et saisir le suivi | remplacer les feuilles papier |
| directrice | traiter les dossiers, publier les contenus, suivre les chiffres | piloter la crèche |
| directrice | ouvrir les inscriptions au bon moment | respecter le calendrier de la crèche |

### Contraintes
- **RGPD** : mineurs, données de santé, photos.
- **Sécurité** : comptes parents exposés sur Internet.
- **Budget nul** : hébergements gratuits ou peu coûteux, pas de store mobile.
- **Calendrier** : inscriptions ouvertes seulement en mars 2027.
- **Utilisateurs non techniciens** : interface simple, mobile d'abord pour les parents.

---

## 3. GESTION DU PROJET

### Démarche
Projet mené **seule**, de manière **itérative** : 7 phases planifiées
(fondations → site public → espace parents → espace admin → galerie et
absences → mobile → finalisation), chaque fonctionnalité livrée par un commit
`feat(...)` puis mise en ligne. Détail : `08-ROADMAP-PHASES.md`.

### Chronologie réelle (historique Git)
| Période | Réalisations |
|---|---|
| Juin 2026 | Socle : base de données, API, authentification JWT, site public, CMS, menus, équipe |
| Juillet 2026 | Émargement, calendrier admin, refonte des inscriptions |
| Août 2026 | Rapports de présence, jours de garde, séparation des droits admin / super admin, responsive complet |
| Septembre 2026 | **Premier déploiement** Vercel + Alwaysdata, mentions légales / RGPD |
| Octobre 2026 | **Audit OWASP ZAP** et en-têtes de sécurité, connexion Google, site en anglais, thème sombre, parcours d'inscription complet, fichiers privés protégés, notifications traduites, accessibilité |
| Novembre 2026 | Cloudflare Turnstile, paramètres du super admin (lancement en deux temps), **double authentification**, **PWA** (v1.0 → v1.3), mise à jour de la documentation |

### Outils
VS Code, Git / GitHub, Docker Desktop, navigateur et outils de développement,
phpMyAdmin, OWASP ZAP, Vercel, Alwaysdata, assistant IA Claude Code (aide au
développement et à la relecture). **À COMPLÉTER** : outil de suivi des tâches.

---

## 4. COMPÉTENCES DU TITRE CDA COUVERTES

> Intitulés repris du référentiel CDA (RNCP37873, version 2023) — **à vérifier
> avec le référentiel officiel remis par la formation**.

### Activité 1 — Développer une application sécurisée
| Compétence | Preuves dans le projet |
|---|---|
| Installer et configurer son environnement de travail | Docker Compose (MySQL + API + React), variables d'environnement, scripts npm (`06-OUTILS-DEVOPS.md`) |
| Développer des interfaces utilisateur | 44 pages React, 17 composants, responsive, FR / EN, thème sombre, accessibilité, PWA (`03`, `04`, `07`) |
| Développer des composants métier | 18 contrôleurs : inscription en 6 étapes et statuts, suivi quotidien, émargement → rapports de présence, consentement photo, 2FA (`02`) |
| Contribuer à la gestion d'un projet informatique | Planning en phases, suivi d'avancement, Git, livraisons versionnées (`08`) |

### Activité 2 — Concevoir et développer une application sécurisée organisée en couches
| Compétence | Preuves dans le projet |
|---|---|
| Analyser les besoins et maquetter une application | Récits utilisateurs (§2), maquette d'origine `design/Accueil-complet.html` — **À COMPLÉTER** : autres maquettes / wireframes |
| Définir l'architecture logicielle | 3 tiers ; backend en couches routes → middlewares → contrôleurs → services → modèles (`02`) |
| Concevoir et mettre en place une base de données relationnelle | 20 tables, clés étrangères et règles de suppression, index, migrations versionnées (`01`) |
| Développer des composants d'accès aux données SQL et NoSQL | Modèles et associations Sequelize, transactions avec verrou, requêtes d'agrégation (statistiques, rapports). **NoSQL : non utilisé dans ce projet** — à expliquer à l'oral (choix justifié : données très relationnelles) |

### Activité 3 — Préparer le déploiement d'une application sécurisée
| Compétence | Preuves dans le projet |
|---|---|
| Préparer et exécuter les plans de tests | Tests manuels par parcours, audit OWASP ZAP, vérification des builds — plan de tests au §7. **Pas de tests automatisés** (point faible à assumer) |
| Préparer et documenter le déploiement | Procédure de mise en production, migrations, `.env.example`, documentation `coccinelles-docs/` |
| Contribuer à la mise en production dans une démarche DevOps | Déploiement continu du frontend (push → Vercel), conteneurs Docker, versions affichées, mise à jour PWA |

---

## 5. RÉALISATIONS À MONTRER (extraits de code conseillés)

| Sujet | Fichier | Ce qu'il montre |
|---|---|---|
| Vérification du code 2FA | `backend/src/controllers/deuxFacteursController.js` (`verifier`) | Transaction + verrou de ligne, comparaison en temps constant, blocage après 5 erreurs |
| Codes 2FA | `backend/src/services/deuxFacteurs.service.js` | Clés dérivées (HKDF), empreinte HMAC, jeton d'étape séparé |
| Liens signés | `backend/src/utils/fichiersSignes.js` | Protection des photos et documents sans jeton dans `<img>` |
| Protection des routes | `backend/src/middlewares/auth.middleware.js`, `role.middleware.js` | JWT + rôles + utilisateur rechargé à chaque requête |
| Photos et consentement | `backend/src/controllers/galerieController.js` | Photo remplacée par une image floutée côté serveur |
| Garde de routes React | `frontend-web/src/router/ProtectedRoute.jsx` | Redirections selon la session et le rôle |
| Rafraîchissement du jeton | `frontend-web/src/services/api.js` | Intercepteurs Axios, nouvelle tentative automatique |
| PWA et RGPD | `frontend-web/src/service-worker.js` | Cache de l'interface uniquement, jamais l'API |
| Sécurité HTTP | `backend/server.js` | helmet (HSTS, CSP), CORS, Cache-Control, erreurs propres |
| Base de données | `database/schema.sql` | Tables, clés étrangères, index |

---

## 6. SÉCURITÉ (résumé pour l'oral)

1. **Authentification forte** : mot de passe bcrypt ou Google, puis code à
   6 chiffres par email ; jetons 15 min / 7 j révocables.
2. **Autorisations** : rôles sur chaque route + contrôle « ce parent est-il
   propriétaire de la donnée ? » dans chaque contrôleur (anti-IDOR).
3. **Attaques courantes** : limitation des tentatives, anti-robot, requêtes
   paramétrées, validation des entrées, CSP, HSTS.
4. **Fichiers** : types et tailles contrôlés, noms aléatoires, liens signés à
   durée limitée, pièces justificatives jamais servies directement.
5. **RGPD** : consentement photo par enfant (avec preuve), minimisation
   (comptes non confirmés supprimés à 24 h), suppression en cascade, bannière
   cookies, mentions légales, rien de personnel dans le cache du téléphone.
6. **Vérification** : audit OWASP ZAP, relecture de sécurité (une faille de
   force brute sur le code 2FA a été trouvée et corrigée le 12/11/2026).

Détail, correspondance OWASP Top 10 et limites : `05-SECURITE-RGPD.md`.

---

## 7. TESTS

### Ce qui a été fait
- **Tests manuels** de chaque parcours sur ordinateur et téléphone (réseau local
  et site en ligne).
- **Audit OWASP ZAP** du backend → corrections des en-têtes de sécurité.
- **Compilation de production** (`npm run build`) avant chaque mise en ligne.
- **Test ciblé** du correctif 2FA : compteur d'erreurs conservé après l'envoi
  d'un nouveau code (script exécuté sur la base de développement).
- Vérification de la PWA : manifeste, service worker, installation, mode hors ligne.

### Plan de tests fonctionnels (à exécuter et à dater avant l'examen)
| # | Cas de test | Résultat attendu |
|---|---|---|
| T1 | Connexion avec bon mot de passe | Code envoyé par email, page de saisie du code |
| T2 | 5 codes faux de suite | Blocage 15 min, même avec un nouveau code |
| T3 | Parent qui modifie l'identifiant d'un enfant d'une autre famille dans l'URL de l'API | Refus (403 / 404), aucune donnée renvoyée |
| T4 | Admin simple qui ouvre `/admin/familles` | Renvoyé vers l'émargement ; l'API refuse aussi |
| T5 | Ouverture directe d'une photo privée sans signature | 403 |
| T6 | Photo d'un enfant sans consentement | Image floutée côté parent |
| T7 | Envoi d'un fichier `.exe` ou de 20 Mo | Refus avec message clair |
| T8 | 11 tentatives de connexion en 15 min | Refus (limite de débit) |
| T9 | Création de compte non confirmée pendant 24 h | Compte supprimé automatiquement |
| T10 | Espace parents fermé par le super admin | Connexion parent refusée, pages parents inaccessibles |
| T11 | Passage FR → EN | Tous les textes et les messages de l'API traduits |
| T12 | Application installée, mode avion | Bandeau « hors ligne », aucune donnée en cache |

**À COMPLÉTER** : résultats (OK / KO, date), captures d'écran.

### Limite assumée et amélioration
Pas de tests automatisés. Étape suivante : tests d'API avec **Jest + Supertest**
(droits par rôle, cas T2 à T8) lancés automatiquement par **GitHub Actions** à
chaque push.

---

## 8. DIFFICULTÉS RENCONTRÉES ET SOLUTIONS

| Difficulté | Solution |
|---|---|
| Alwaysdata sert l'API sous un chemin (`/api-coccinelles`) qu'il ne retire pas | Variable `MOUNT_PREFIX` retirée par un middleware dans `server.js` ; écoute sur l'IP imposée (`IP`) |
| Les photos d'enfants étaient accessibles par simple adresse, et une balise `<img>` ne peut pas envoyer de jeton | **Liens signés HMAC** à durée limitée, ajoutés automatiquement aux réponses de l'API |
| Alertes de l'audit OWASP ZAP (en-têtes manquants, informations exposées) | helmet configuré : HSTS, CSP stricte, `nosniff`, `X-Powered-By` retiré, `Cache-Control` |
| Notifications restées en français pour les parents anglophones | Stockage d'un **code + paramètres** au lieu du texte (migration 004 + script de reprise) |
| La crèche ne peut pas ouvrir les inscriptions en cours d'année | **Interrupteurs** du super admin en base : ouverture sans redéploiement |
| Faille trouvée en relecture : chaque nouveau code 2FA remettait le compteur d'erreurs à zéro | Compteur attaché au **compte** ; testé puis corrigé |
| Application mobile Expo prévue : deuxième base de code, stores payants | **PWA** à partir du site React : même code, installation sans store |
| Une PWA peut garder les utilisateurs sur une ancienne version | Service worker jamais mis en cache, bandeau « Nouvelle version disponible », numéro de version affiché |
| iPhone : pas de bouton d'installation possible | Fenêtre qui explique les 2 étapes (Partager → Sur l'écran d'accueil) |
| Rechargement automatique du backend sous Docker (Windows) inopérant | Redémarrage du conteneur après modification backend ; polling activé pour le frontend |

---

## 9. BILAN ET PERSPECTIVES

### Bilan
- Application complète en ligne : 3 espaces, 102 routes API, 20 tables, 44 pages,
  bilingue, installable sur téléphone.
- Sécurité et RGPD traités à chaque couche, audit réalisé.
- **À COMPLÉTER** : bilan personnel (ce que le projet m'a appris, ce que je
  referais autrement).

### Perspectives
- Notifications push (Web Push) après l'ouverture de mars 2027.
- Tests automatisés + intégration continue (GitHub Actions).
- Jetons en cookies `HttpOnly`, journal d'audit, export et suppression du
  compte en libre-service.
- Glisser-déposer des photos dans la galerie admin, calendrier public des fermetures.

---

## 10. PLAN PROPOSÉ POUR LA PRÉSENTATION (diaporama)

1. Titre — Les Coccinelles, plateforme web d'une crèche (logo, nom, formation)
2. Qui suis-je / contexte de la formation
3. Le client et le problème (deux outils séparés)
4. Les besoins (récits utilisateurs) et les contraintes (RGPD, budget, calendrier)
5. Les 3 espaces + la version mobile (captures d'écran)
6. Gestion de projet : phases, chronologie, outils
7. Architecture 3 tiers et hébergement (schéma de `00-PROJET-GENERAL.md`)
8. Base de données : 20 tables, schéma des relations, choix de conception
9. Backend en couches : chaîne d'une requête (middlewares → contrôleur → modèle)
10. Frontend : routage, gardes, design system, traductions, accessibilité
11. Sécurité : authentification en deux étapes (schéma du parcours)
12. Sécurité : autorisations, liens signés, OWASP Top 10
13. RGPD : consentement photo, minimisation, droits
14. PWA : pourquoi pas Expo, installation, cache sans données personnelles
15. Démonstration (parcours parent puis admin)
16. Tests : ce qui est fait, plan de tests, limites
17. Déploiement : Vercel + Alwaysdata, migrations, versions
18. Difficultés et solutions (2 ou 3 exemples marquants)
19. Bilan, perspectives
20. Questions

---

## 11. À COMPLÉTER PAR SABAH AVANT DE GÉNÉRER LES DOSSIERS

- [ ] Nom complet tel qu'il doit apparaître (les fichiers mentionnent « Sabah Salih » et « Sabah Al-Azzawi »)
- [ ] Cadre du projet (stage / projet de formation / client réel) et interlocuteurs
- [ ] Recueil des besoins : comment il s'est passé
- [ ] Outil de suivi des tâches utilisé
- [ ] Maquettes ou wireframes (autres que `design/Accueil-complet.html`)
- [ ] Diagrammes UML attendus par le dossier (cas d'utilisation, classes ou séquence) — peuvent être produits à partir de `01` et `02`
- [ ] Résultats datés du plan de tests (§7) et captures d'écran
- [ ] Veille technologique et de sécurité réalisée (sujets, sources, dates)
- [ ] Bilan personnel
