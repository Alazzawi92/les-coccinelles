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
Phase 6 — App Mobile         (4 semaines) ████████████████
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
□ Créer les repos GitHub (monorepo ou 3 repos séparés)
□ Configurer Docker (docker-compose.yml)
□ Créer la structure de dossiers complète
□ Configurer les variables d'environnement
□ Initialiser le backend Node.js + Express
□ Initialiser le frontend React
□ Initialiser Expo (mobile)
```

#### Base de données
```
□ Créer le schéma SQL complet (15 tables)
□ Configurer Sequelize + connexion BDD
□ Créer tous les modèles Sequelize
□ Créer les migrations
□ Créer les seeds (données de test)
```

#### Authentification
```
□ Route POST /api/auth/register
□ Route POST /api/auth/login
□ Route POST /api/auth/logout
□ Route POST /api/auth/refresh-token
□ Route POST /api/auth/forgot-password
□ Route POST /api/auth/reset-password
□ Middleware verifierToken
□ Middleware verifierRole
□ Pages Login et Register React
□ AuthContext (gestion état auth)
□ ProtectedRoute (protection routes)
```

### ✅ Critères de fin de phase 1
- [ ] Se connecter et recevoir un JWT
- [ ] Token rafraîchi automatiquement
- [ ] Routes protégées inaccessibles sans token
- [ ] BDD créée avec toutes les tables

---

## 🟡 PHASE 2 — SITE PUBLIC (3 semaines)

### Objectif
Créer toutes les pages visibles sans connexion.

### Tâches

#### Layout Public
```
□ Composant PublicLayout + navbar + footer
□ PublicLayout.css avec design system
□ Responsive mobile (hamburger menu)
```

#### Pages publiques
```
□ Page Accueil (sections dynamiques)
□ Page Présentation de la crèche
□ Page Équipe éducative
□ Page Projet pédagogique
□ Page Horaires d'accueil
□ Page Tarifs
□ Page Conditions d'inscription
□ Page Actualités (liste + détail)
□ Page Menus de la semaine
□ Page Calendrier fermetures
□ Page Contact (formulaire)
□ Page Mentions légales (RGPD)
```

#### Backend pages publiques
```
□ GET /api/actualites (liste + pagination)
□ GET /api/actualites/:id (détail)
□ GET /api/menus (semaine courante)
□ GET /api/cms/pages/:slug (contenu dynamique)
□ POST /api/contact (formulaire)
```

### ✅ Critères de fin de phase 2
- [ ] Toutes les pages publiques accessibles
- [ ] Design System appliqué sur toutes les pages
- [ ] Responsive sur mobile et tablette
- [ ] Formulaire contact fonctionnel

---

## 🟢 PHASE 3 — ESPACE PARENTS (4 semaines)

### Objectif
Créer tout l'espace sécurisé pour les parents.

### Tâches

#### Layout Parent
```
□ Composant ParentLayout + sidebar + header
□ ParentLayout.css
□ Navigation avec liens actifs
□ Responsive (sidebar → barre du bas sur mobile)
```

#### Pages parent
```
□ Tableau de bord parent
□ Page Mon Profil (modifier infos + mot de passe)
□ Page Mes Enfants (liste + détails)
□ Page Dossier Inscription (formulaire multi-étapes)
□ Page Suivi Quotidien (voir le suivi du jour)
□ Page Mes Documents (upload + télécharger)
□ Page Messagerie (envoyer/recevoir messages)
□ Page Notifications (liste)
□ Page Galerie Privée (voir photos)
□ Page Consentement RGPD (accepter/refuser photos)
```

#### Backend espace parent
```
□ CRUD /api/enfants
□ CRUD /api/inscriptions
□ GET  /api/suivi/:enfant_id
□ CRUD /api/documents
□ CRUD /api/messages
□ GET  /api/notifications
□ GET  /api/galerie (avec vérif consentement)
□ POST /api/galerie/consentement
```

### ✅ Critères de fin de phase 3
- [ ] Parent peut créer un compte et se connecter
- [ ] Dossier d'inscription complet envoyable
- [ ] Consultation du suivi quotidien de l'enfant
- [ ] Messagerie fonctionnelle crèche ↔ parent
- [ ] Upload/téléchargement de documents

---

## 🔵 PHASE 4 — ESPACE ADMIN (3 semaines)

### Objectif
Créer toute l'interface de gestion pour l'équipe.

### Tâches

#### Layout Admin
```
□ Composant AdminLayout (sidebar sombre)
□ AdminLayout.css
□ Navigation groupée par catégorie
□ Responsive
```

#### Pages admin
```
□ Tableau de bord (statistiques + alertes)
□ Gestion des familles (liste + recherche + filtres)
□ Gestion des dossiers d'inscription
□ Gestion des enfants
□ Interface suivi quotidien (créer/modifier)
□ Gestion des absences (valider/refuser)
□ Messagerie admin (avec tous les parents)
□ Publication actualités (éditeur texte)
□ Gestion menus de la semaine
□ Gestion des documents
□ Interface galerie photos (upload albums)
□ CMS (modifier contenu pages)
□ Statistiques (graphiques)
□ Gestion comptes utilisateurs (super admin)
```

#### Backend espace admin
```
□ PATCH /api/inscriptions/:id/statut
□ PATCH /api/absences/:id/valider
□ CRUD  /api/actualites
□ CRUD  /api/menus
□ POST  /api/suivi (créer suivi)
□ CRUD  /api/galerie/albums
□ POST  /api/galerie/albums/:id/photos
□ PUT   /api/cms/pages/:slug
□ GET   /api/inscriptions/stats
□ GET   /api/users (super admin)
```

### ✅ Critères de fin de phase 4
- [ ] Admin peut gérer tous les dossiers
- [ ] Workflow inscription complet (reception → validation)
- [ ] Publication actualités et menus
- [ ] Suivi quotidien des enfants créable par admin
- [ ] Tableau de bord avec statistiques

---

## 🟣 PHASE 5 — GALERIE & ABSENCES (2 semaines)

### Objectif
Finaliser les fonctionnalités galerie et absences.

### Tâches

#### Galerie photos
```
□ Upload multiple photos (glisser-déposer)
□ Compression automatique avec Sharp (3 tailles)
□ Tagging des enfants sur les photos
□ Système de consentement RGPD complet
□ Affichage photos floues si pas de consentement
□ Téléchargement photos par les parents
□ Notification parents quand nouvelles photos
```

#### Gestion absences
```
□ Formulaire déclaration absence (parent)
□ Upload justificatif (optionnel)
□ Interface validation admin (accepter/refuser)
□ Calendrier des absences
□ Notifications automatiques
```

### ✅ Critères de fin de phase 5
- [ ] Upload de photos avec compression automatique
- [ ] Système de consentement RGPD opérationnel
- [ ] Parent peut déclarer une absence
- [ ] Admin peut valider/refuser les absences

---

## 📱 PHASE 6 — APPLICATION MOBILE (4 semaines)

### Objectif
Créer l'application mobile React Native.

### Tâches
```
□ Setup Expo + Expo Router
□ Navigation par onglets
□ Écran connexion
□ Tableau de bord mobile
□ Écran suivi quotidien
□ Écran déclaration absence
□ Écran messagerie
□ Écran galerie photos
□ Écran profil
□ Notifications push (Expo Notifications)
□ Stockage token (AsyncStorage)
□ Build APK Android (test)
```

### ✅ Critères de fin de phase 6
- [ ] Application installable sur Android
- [ ] Connexion + navigation fonctionnelle
- [ ] Réception des notifications push
- [ ] Consultation du suivi enfant

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
□ Page mentions légales complète
□ Mise en place HTTPS (Let's Encrypt)
□ Déploiement sur serveur (VPS ou hébergeur)
□ Backup automatique de la BDD
□ README.md complet
□ Préparation dossier de soutenance CDA
□ Présentation du projet
```

### ✅ Critères de fin de phase 7
- [ ] Application déployée et accessible en ligne
- [ ] Aucun bug critique
- [ ] HTTPS activé
- [ ] Documentation à jour
- [ ] Dossier de soutenance prêt

---

## 📊 RÉCAPITULATIF

| Phase | Durée | Statut |
|-------|-------|--------|
| Phase 1 — Fondations | 3 semaines | ⏳ À faire |
| Phase 2 — Site Public | 3 semaines | ⏳ À faire |
| Phase 3 — Espace Parents | 4 semaines | ⏳ À faire |
| Phase 4 — Espace Admin | 3 semaines | ⏳ À faire |
| Phase 5 — Galerie & Absences | 2 semaines | ⏳ À faire |
| Phase 6 — App Mobile | 4 semaines | ⏳ À faire |
| Phase 7 — Finalisation | 2 semaines | ⏳ À faire |
| **TOTAL** | **21 semaines** | |
