# 📅 08 — ROADMAP & PLANNING
# Fichier : 08-ROADMAP-PHASES.md
# Description : Planning de développement en 7 phases
# Durée totale estimée : 3-4 mois

---

## 🗺️ VUE D'ENSEMBLE

```
Phase 1 — Fondations         (3 semaines) ████████████
Phase 2 — Site Public        (3 semaines) ████████████
Phase 3 — Espace Parents     (4 semaines) ████████████████
Phase 4 — Espace Admin       (3 semaines) ████████████
Phase 5 — Galerie & Absences (2 semaines) ████████
Phase 6 — App Mobile (PWA)   (4 semaines) ████████████████
Phase 7 — Finalisation       (2 semaines) ████████
                                          ─────────────────
TOTAL                                     21 semaines (~5 mois)
```

---

## 🟠 PHASE 1 — FONDATIONS (3 semaines)

### Objectif
Mettre en place toute l'infrastructure du projet.

### Tâches

#### Setup & Configuration
```
✅ Créer les repos GitHub (monorepo ou 3 repos séparés)
✅ Configurer Docker (docker-compose.yml)
✅ Créer la structure de dossiers complète
✅ Configurer les variables d'environnement
✅ Initialiser le backend Node.js + Express
✅ Initialiser le frontend React
```

#### Base de données
```
✅ Créer le schéma SQL complet (20 tables)
✅ Configurer Sequelize + connexion BDD
✅ Créer tous les modèles Sequelize
✅ Créer les migrations
✅ Créer les seeds (données de test)
```

#### Authentification
```
✅ Route POST /api/auth/register
✅ Route POST /api/auth/login
✅ Route POST /api/auth/logout
✅ Route POST /api/auth/refresh-token
✅ Route POST /api/auth/forgot-password
✅ Route POST /api/auth/reset-password
✅ Middleware verifierToken
✅ Middleware verifierRole
✅ Pages Login et Register React
✅ AuthContext (gestion état auth)
✅ ProtectedRoute (protection routes)
```

### ✅ Critères de fin de phase 1
- [x] Se connecter et recevoir un JWT
- [x] Token rafraîchi automatiquement
- [x] Routes protégées inaccessibles sans token
- [x] BDD créée avec toutes les tables

---

## 🟡 PHASE 2 — SITE PUBLIC (3 semaines)

### Objectif
Créer toutes les pages visibles sans connexion.

### Tâches

#### Layout Public
```
✅ Composant PublicLayout + navbar + footer
✅ PublicLayout.css avec design system
✅ Responsive mobile (hamburger menu)
```

#### Pages publiques
```
✅ Page Accueil (sections dynamiques)
✅ Page Présentation de la crèche
✅ Page Équipe éducative
✅ Page Projet pédagogique
✅ Page Horaires d'accueil
✅ Page Tarifs
✅ Page Conditions d'inscription
✅ Page Actualités (liste + détail)
✅ Page Menus de la semaine
□ Page Calendrier fermetures (publique) — non faite : le calendrier existe côté admin
✅ Page Contact (formulaire)
✅ Page Mentions légales (RGPD)
```

#### Backend pages publiques
```
✅ GET /api/actualites (liste + pagination)
✅ GET /api/actualites/:id (détail)
✅ GET /api/menus (semaine courante)
✅ GET /api/cms/pages/:slug (contenu dynamique)
✅ POST /api/contact (formulaire)
```

### ✅ Critères de fin de phase 2
- [x] Toutes les pages publiques accessibles
- [x] Design System appliqué sur toutes les pages
- [x] Responsive sur mobile et tablette
- [x] Formulaire contact fonctionnel

---

## 🟢 PHASE 3 — ESPACE PARENTS (4 semaines)

### Objectif
Créer tout l'espace sécurisé pour les parents.

### Tâches

#### Layout Parent
```
✅ Composant ParentLayout + sidebar + header
✅ ParentLayout.css
✅ Navigation avec liens actifs
✅ Responsive (sidebar → barre du bas sur mobile)
```

#### Pages parent
```
✅ Tableau de bord parent
✅ Page Mon Profil (modifier infos + mot de passe)
✅ Page Mes Enfants (liste + détails)
✅ Page Dossier Inscription (formulaire multi-étapes)
✅ Page Suivi Quotidien (voir le suivi du jour)
✅ Page Mes Documents (upload + télécharger)
✅ Page Messagerie (envoyer/recevoir messages)
✅ Notifications (cloche dans l'en-tête, sans page dédiée)
✅ Page Galerie Privée (voir photos)
✅ Page Consentement RGPD (accepter/refuser photos)
```

#### Backend espace parent
```
✅ CRUD /api/enfants
✅ CRUD /api/inscriptions
✅ GET  /api/suivi/:enfant_id
✅ CRUD /api/documents
✅ CRUD /api/messages
✅ GET  /api/notifications
✅ GET  /api/galerie (avec vérif consentement)
✅ POST /api/galerie/consentement
```

### ✅ Critères de fin de phase 3
- [x] Parent peut créer un compte et se connecter
- [x] Dossier d'inscription complet envoyable
- [x] Consultation du suivi quotidien de l'enfant
- [x] Messagerie fonctionnelle crèche ↔ parent
- [x] Upload/téléchargement de documents

---

## 🔵 PHASE 4 — ESPACE ADMIN (3 semaines)

### Objectif
Créer toute l'interface de gestion pour l'équipe.

### Tâches

#### Layout Admin
```
✅ Composant AdminLayout (sidebar sombre)
✅ AdminLayout.css
✅ Navigation groupée par catégorie
✅ Responsive
```

#### Pages admin
```
✅ Tableau de bord (statistiques + alertes)
✅ Gestion des familles (liste + recherche + filtres)
✅ Gestion des dossiers d'inscription
✅ Gestion des enfants
✅ Interface suivi quotidien (créer/modifier)
✅ Gestion des absences (valider/refuser)
✅ Messagerie admin (avec tous les parents)
✅ Publication actualités (éditeur texte)
✅ Gestion menus de la semaine
✅ Gestion des documents
✅ Interface galerie photos (upload albums)
✅ CMS (modifier contenu pages)
✅ Statistiques (graphiques)
✅ Gestion comptes utilisateurs (super admin)
```

#### Backend espace admin
```
✅ PATCH /api/inscriptions/:id/statut
✅ PATCH /api/absences/:id/valider
✅ CRUD  /api/actualites
✅ CRUD  /api/menus
✅ POST  /api/suivi (créer suivi)
✅ CRUD  /api/galerie/albums
✅ POST  /api/galerie/albums/:id/photos
✅ PUT   /api/cms/pages/:slug
✅ GET   /api/inscriptions/stats
✅ GET   /api/users (super admin)
```

### ✅ Critères de fin de phase 4
- [x] Admin peut gérer tous les dossiers
- [x] Workflow inscription complet (reception → validation)
- [x] Publication actualités et menus
- [x] Suivi quotidien des enfants créable par admin
- [x] Tableau de bord avec statistiques

---

## 🟣 PHASE 5 — GALERIE & ABSENCES (2 semaines)

### Objectif
Finaliser les fonctionnalités galerie et absences.

### Tâches

#### Galerie photos
```
✅ Upload multiple photos (□ glisser-déposer à ajouter)
✅ Compression automatique avec Sharp (3 tailles)
✅ Tagging des enfants sur les photos
✅ Système de consentement RGPD complet
✅ Affichage photos floues si pas de consentement
✅ Téléchargement photos par les parents
✅ Notification parents quand nouvelles photos
```

#### Gestion absences
```
✅ Formulaire déclaration absence (parent)
✅ Upload justificatif (optionnel)
✅ Interface validation admin (accepter/refuser)
✅ Calendrier des absences
✅ Notifications automatiques
```

### ✅ Critères de fin de phase 5
- [x] Upload de photos avec compression automatique
- [x] Système de consentement RGPD opérationnel
- [x] Parent peut déclarer une absence
- [x] Admin peut valider/refuser les absences

---

## 📱 PHASE 6 — APPLICATION MOBILE : PWA (4 semaines)

### Objectif
Offrir une application installable sur téléphone (Android et iPhone).

> **Changement de choix technique (novembre 2026)** : l'application React
> Native / Expo prévue au départ est remplacée par une **Progressive Web App**
> construite à partir du site React. Une seule base de code, pas de store,
> pas de frais, mises à jour immédiates, et toutes les fonctionnalités parents
> (suivi, absences, messages, galerie) sont déjà disponibles.
> Détails et justification : voir `04-FRONTEND-MOBILE.md`.

### Tâches
```
✅ Manifest + icônes (192, 512, maskable, iPhone)
✅ Service worker Workbox : cache de l'interface uniquement (jamais l'API — RGPD)
✅ Bandeau « Vous êtes hors ligne »
✅ Bandeau « Nouvelle version disponible » + numéro de version en pied de page
✅ Fenêtre « Installez l'application » (Android : bouton, iPhone : étapes)
✅ En-têtes Vercel (pas de cache du service worker, CSP worker / manifest)
□ Notifications Web Push (VAPID + web-push) — après mars 2027
□ Tests d'installation sur plusieurs téléphones Android / iPhone
```

### ✅ Critères de fin de phase 6
- [x] Application installable sur Android et iPhone
- [x] Connexion + navigation fonctionnelle (même code que le site)
- [x] Consultation du suivi enfant (même code que le site)
- [x] Aucune donnée personnelle gardée en cache sur le téléphone
- [ ] Réception des notifications push

---

## 🏁 PHASE 7 — FINALISATION (2 semaines)

### Objectif
Tests, corrections, déploiement, soutenance.

### Tâches
```
□ Tests manuels complets (tous les parcours)
□ Corrections des bugs identifiés
□ Optimisation des performances (images, API)
□ Vérification conformité RGPD
✅ Page mentions légales complète
✅ HTTPS (fourni par Vercel et Alwaysdata)
✅ Déploiement : frontend sur Vercel, API + BDD sur Alwaysdata
□ Backup automatique de la BDD
□ README.md complet
□ Préparation dossier de soutenance CDA
□ Présentation du projet
```

### ✅ Critères de fin de phase 7
- [x] Application déployée et accessible en ligne
- [ ] Aucun bug critique
- [x] HTTPS activé
- [ ] Documentation à jour
- [ ] Dossier de soutenance prêt

---

## ➕ RÉALISÉ EN PLUS DU PLAN INITIAL

```
✅ Connexion avec Google (parents)
✅ Double authentification par email (code à 6 chiffres à chaque connexion)
✅ Anti-robot Cloudflare Turnstile sur les formulaires publics
✅ Site bilingue français / anglais (i18next), notifications traduites
✅ Thème clair / sombre
✅ Émargement (arrivées / départs) et calendrier admin
✅ Rapports PDF et menus en PDF (cycle de 4 semaines)
✅ Paramètres super admin : ouverture espace parents / création de comptes
   (lancement en 2 temps : site vitrine, puis inscriptions en mars 2027)
✅ Accessibilité (lecteurs d'écran, navigation clavier)
```

---

## 📊 RÉCAPITULATIF

| Phase | Durée | Statut |
|-------|-------|--------|
| Phase 1 — Fondations | 3 semaines | ✅ Terminée |
| Phase 2 — Site Public | 3 semaines | ✅ Terminée (sauf calendrier public des fermetures) |
| Phase 3 — Espace Parents | 4 semaines | ✅ Terminée |
| Phase 4 — Espace Admin | 3 semaines | ✅ Terminée |
| Phase 5 — Galerie & Absences | 2 semaines | ✅ Terminée (glisser-déposer des photos à ajouter) |
| Phase 6 — App Mobile (PWA) | 4 semaines | 🟡 En cours (push après mars 2027) |
| Phase 7 — Finalisation | 2 semaines | 🟡 En cours (déployé, tests et soutenance à finir) |
| **TOTAL** | **21 semaines** | *Mis à jour le 12/11/2026* |
