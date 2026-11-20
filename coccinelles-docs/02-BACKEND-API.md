# 🔧 02 — BACKEND API (Node.js + Express)
# Fichier : 02-BACKEND-API.md
# Description : Architecture réelle du backend — structure en couches,
# chaîne de middlewares, 102 routes, services, dépendances

---

## 🏗️ ARCHITECTURE EN COUCHES

```
Requête HTTP
   │
   ▼
server.js ── middlewares globaux (helmet, CORS, JSON, logs, Cache-Control)
   │
   ▼
routes/*.routes.js ── middlewares de route :
   │                   verifierToken → verifierRole → limites de débit
   │                   → Turnstile → validation (express-validator) → upload (multer)
   ▼
controllers/*Controller.js ── logique métier, vérification « ce parent a-t-il le droit ? »
   │
   ├──► services/ ── emails, notifications, 2FA, réglages, nettoyage automatique
   │
   ▼
models/ (Sequelize) ── accès aux données, requêtes paramétrées
   │
   ▼
MySQL / MariaDB
```

Chaque couche a un rôle unique : les routes **déclarent** qui a le droit, les
contrôleurs **appliquent** les règles métier, les modèles **accèdent** aux données.

---

## 📁 STRUCTURE DU BACKEND

```
backend/
├── server.js                  # Point d'entrée : middlewares globaux, routes, démarrage
├── package.json
├── Dockerfile                 # Image Node 20 Alpine (développement sous Docker)
├── assets/
│   └── guide-inscription.pdf  # Guide d'inscription par défaut
├── scripts/                   # Outils en ligne de commande (maintenance)
│   ├── code-secours-connexion.js  # Affiche un code 2FA si les emails ne partent plus
│   ├── verifier-photos.js     # Vérifie que les fichiers des photos existent sur le disque
│   ├── migrer-notifications.js    # Reprise des anciennes notifications (migration 004)
│   └── corriger-noms.js       # Correction ponctuelle prénom / nom
├── uploads/                   # Fichiers envoyés (servis via /uploads)
│   ├── equipe/ actualites/ avatars/        # Publics
│   └── photos/ documents/ messages/ justificatifs/   # Privés : lien signé obligatoire
├── stockage/                  # Jamais servi en statique
│   ├── justificatifs/         # Pièces justificatives d'inscription
│   └── guide/                 # Guide d'inscription remplacé par le super admin
└── src/
    ├── config/
    │   ├── database.js        # Connexion Sequelize
    │   ├── jwt.js             # Création / vérification des jetons (15 min / 7 j)
    │   ├── mail.js            # Transport Nodemailer
    │   └── limites.js         # Tailles maximales des fichiers
    ├── middlewares/
    │   ├── auth.middleware.js         # verifierToken (+ version optionnelle)
    │   ├── role.middleware.js         # verifierRole('admin', 'super_admin'…)
    │   ├── turnstile.middleware.js    # Anti-robot Cloudflare (vérifié côté serveur)
    │   ├── validate.middleware.js     # Renvoie les erreurs express-validator
    │   ├── upload.middleware.js       # Multer : types MIME, tailles, noms de fichiers sûrs
    │   ├── inscription.middleware.js  # Réserve suivi / galerie / absences aux familles inscrites
    │   └── parametres.middleware.js   # Espace parents ou création de comptes fermés
    ├── controllers/           # 18 contrôleurs (un par domaine)
    ├── models/                # 19 modèles Sequelize + index.js (associations)
    ├── routes/                # 18 fichiers de routes + index.js (montage sous /api)
    ├── services/
    │   ├── mail.service.js            # Tous les emails (confirmation, code 2FA, réinitialisation…)
    │   ├── notification.service.js    # Création des notifications dans l'application
    │   ├── deuxFacteurs.service.js    # Codes de connexion, jeton d'étape, empreintes HMAC
    │   ├── parametres.service.js      # Lecture des interrupteurs du super admin
    │   └── nettoyage.service.js       # Suppression des comptes non confirmés (24 h)
    ├── utils/
    │   ├── response.js        # Format de réponse standard (succes / erreur)
    │   ├── fichiersSignes.js  # Liens signés HMAC pour les fichiers privés
    │   └── joursOuvres.js     # Calcul des jours ouvrés (absences, présences)
    └── validators/
        └── inscription.validator.js
```

---

## 🚀 SERVER.JS — CE QUI SE PASSE À CHAQUE REQUÊTE

1. **Préfixe d'hébergement** : sur Alwaysdata l'API vit sous `/api-coccinelles` ;
   `MOUNT_PREFIX` retire ce préfixe avant les routes (vide en local).
2. **helmet** : en-têtes de sécurité (HSTS 1 an, CSP stricte, `nosniff`,
   suppression de `X-Powered-By`) — corrections issues d'un scan **OWASP ZAP**.
3. **Cache-Control `no-store`** sur toute l'API : les réponses contiennent des
   données personnelles, aucun navigateur ni proxy ne doit les garder.
4. **CORS** : seule l'adresse du frontend (`FRONTEND_URL`) est autorisée
   (+ réseau local en développement pour tester sur téléphone).
5. **`/uploads`** : les dossiers privés exigent un **lien signé** valide
   (`protegerUploads`), sinon 403 ; fichier absent → 404 JSON propre.
6. **`/api`** : `signerReponsesApi` ajoute automatiquement une signature
   temporaire aux chemins de fichiers privés présents dans les réponses.
7. **Gestion d'erreurs** : origine CORS refusée → 403 JSON ; fichier trop lourd
   ou type refusé → 400 JSON et suppression des fichiers déjà reçus.
8. **Démarrage** : connexion BDD, écoute sur `PORT` (et `IP` imposée par
   Alwaysdata), lancement du **nettoyage automatique** des comptes non confirmés.
9. **`/health`** : route de santé pour vérifier que le serveur répond.

---

## 📤 FORMAT DE RÉPONSE STANDARD (utils/response.js)

```javascript
// Succès
{ "success": true,  "data": { ... }, "message": "Connexion réussie" }
// Erreur
{ "success": false, "message": "Code incorrect" }
```
Toutes les routes passent par `succes(res, data, message, status)` et
`erreur(res, message, status)` : le frontend traite toujours la même forme.

---

## 🔒 MIDDLEWARES DE SÉCURITÉ

| Middleware | Rôle |
|---|---|
| `verifierToken` | Lit `Authorization: Bearer <jeton>`, vérifie le JWT, recharge l'utilisateur en base (compte supprimé ou désactivé → refus), refuse un parent si l'espace parents est fermé |
| `verifierRole(...roles)` | Refuse (403) si le rôle n'est pas dans la liste |
| `verifierJetonEtape` | Étape 2FA : accepte uniquement le jeton temporaire délivré après le mot de passe (clé dédiée, jamais un jeton de session) |
| `rateLimit` | Connexion, connexion Google, création de compte : 10 requêtes / 15 min ; code 2FA : 30 / 15 min ; contact : 5 / heure |
| `verifierTurnstile` | Vérifie auprès de Cloudflare le jeton anti-robot : connexion, création de compte, mot de passe oublié, contact |
| `validate` + express-validator | Contrôle et nettoie chaque champ reçu (longueurs, formats, caractères autorisés) |
| `upload` (multer) | Liste blanche de types MIME, taille max (documents 5 Mo, photos 10 Mo, avatars 2 Mo), nom de fichier aléatoire et extension déduite du type |
| `verifierInscriptionAcceptee` | Suivi, galerie, absences, consentement : réservés aux parents dont un enfant est inscrit |
| `verifierCreationComptesOuverte` / `verifierEspaceParentsOuvert` | Appliquent les interrupteurs du super admin |

**Règle d'or :** en plus des middlewares, chaque contrôleur filtre par
`req.user.id` : un parent ne lit et ne modifie **que les données de ses enfants**
(enfants, absences, documents, suivi, inscriptions, messages, galerie).

---

## 🔑 AUTHENTIFICATION — PARCOURS COMPLET

```
1. POST /api/auth/login  (email + mot de passe)      ou  POST /api/auth/google (jeton Google vérifié côté serveur)
      → mot de passe vérifié (bcrypt) / jeton Google vérifié (google-auth-library)
      → AUCUNE session ouverte : un code à 6 chiffres est envoyé par email
      → réponse : jeton d'étape (20 min) + email masqué (s***@gmail.com)
2. POST /api/auth/2fa/verifier  (jeton d'étape + code)
      → code comparé à son empreinte HMAC en temps constant, dans une transaction verrouillée
      → 5 codes faux sur le compte = blocage 15 min (compteur non remis à zéro par un nouveau code)
      → réponse : accessToken (15 min) + refreshToken (7 j, stocké en base)
3. Requêtes suivantes : en-tête Authorization: Bearer <accessToken>
4. accessToken expiré → POST /api/auth/refresh-token (le jeton doit correspondre à celui en base)
5. POST /api/auth/logout → refreshToken effacé en base (session révoquée)
```
Autres parcours : création de compte (Turnstile + validation + email de
confirmation valable 24 h), mot de passe oublié (réponse identique que l'email
existe ou non : pas d'énumération des comptes), réinitialisation (toutes les
sessions sont fermées).

---

## 🗺️ TOUTES LES ROUTES API (102)

Légende accès : **Public** = sans connexion · **Connecté** = tout utilisateur
connecté (le contrôleur limite un parent à ses propres données) · **parent /
admin / super_admin** = rôles exigés · **Jeton 2FA** = étape du code de connexion.

### Authentification — /api/auth
| Verbe | Route | Accès |
|---|---|---|
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/google` | Public |
| `POST` | `/api/auth/2fa/verifier` | Jeton 2FA |
| `POST` | `/api/auth/2fa/renvoyer` | Jeton 2FA |
| `POST` | `/api/auth/logout` | Connecté |
| `POST` | `/api/auth/refresh-token` | Public |
| `POST` | `/api/auth/forgot-password` | Public |
| `POST` | `/api/auth/reset-password` | Public |
| `GET` | `/api/auth/verify-email/:token` | Public |

### Utilisateurs — /api/users
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/users/me` | Connecté |
| `PUT` | `/api/users/me` | Connecté |
| `PUT` | `/api/users/me/password` | Connecté |
| `PUT` | `/api/users/me/avatar` | Connecté |
| `GET` | `/api/users/admins` | Connecté |
| `GET` | `/api/users` | admin, super_admin |
| `GET` | `/api/users/equipe` | super_admin (comptes admin / super admin) |
| `POST` | `/api/users/equipe` | super_admin (crée un compte admin / super admin + invitation par email) |
| `GET` | `/api/users/:id` | super_admin |
| `PUT` | `/api/users/:id/activer` | super_admin |
| `DELETE` | `/api/users/:id` | super_admin |

### Enfants — /api/enfants
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/enfants` | Connecté |
| `POST` | `/api/enfants` | Connecté |
| `GET` | `/api/enfants/:id` | Connecté |
| `PUT` | `/api/enfants/:id` | Connecté |
| `PATCH` | `/api/enfants/:id/jours-presence` | super_admin |
| `DELETE` | `/api/enfants/:id` | super_admin |

### Inscriptions — /api/inscriptions
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/inscriptions` | Connecté |
| `GET` | `/api/inscriptions/acces` | Connecté |
| `GET` | `/api/inscriptions/mes-documents` | parent |
| `GET` | `/api/inscriptions/stats` | admin, super_admin |
| `POST` | `/api/inscriptions` | Connecté |
| `GET` | `/api/inscriptions/:id` | Connecté |
| `PUT` | `/api/inscriptions/:id` | Connecté |
| `PATCH` | `/api/inscriptions/:id/statut` | super_admin |
| `POST` | `/api/inscriptions/:id/documents` | Connecté |
| `GET` | `/api/inscriptions/:id/documents/:docId/fichier` | Connecté |
| `GET` | `/api/inscriptions/:id/documents` | Connecté |

### Absences — /api/absences
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/absences/presences/:date` | admin, super_admin |
| `GET` | `/api/absences/presences-mois` | admin, super_admin |
| `GET` | `/api/absences` | Connecté |
| `POST` | `/api/absences` | Connecté |
| `GET` | `/api/absences/:id` | Connecté |
| `PUT` | `/api/absences/:id` | Connecté |
| `PATCH` | `/api/absences/:id/valider` | admin, super_admin |
| `DELETE` | `/api/absences/:id` | Connecté |

### Suivi quotidien — /api/suivi
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/suivi/:enfant_id` | Connecté |
| `GET` | `/api/suivi/:enfant_id/:date` | Connecté |
| `POST` | `/api/suivi` | admin, super_admin |
| `PUT` | `/api/suivi/:id` | admin, super_admin |

### Émargement — /api/emargements
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/emargements/:date` | admin, super_admin |
| `POST` | `/api/emargements` | admin, super_admin |
| `PATCH` | `/api/emargements/:id` | admin, super_admin |
| `DELETE` | `/api/emargements/:id` | admin, super_admin |

### Documents — /api/documents
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/documents` | Connecté |
| `POST` | `/api/documents` | Connecté |
| `GET` | `/api/documents/:id` | Connecté |
| `DELETE` | `/api/documents/:id` | Connecté |

### Messagerie — /api/messages
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/messages` | Connecté |
| `POST` | `/api/messages` | Connecté |
| `GET` | `/api/messages/:id` | Connecté |
| `PATCH` | `/api/messages/:id/lu` | Connecté |
| `DELETE` | `/api/messages/:id` | Connecté |

### Notifications — /api/notifications
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/notifications` | Connecté |
| `PATCH` | `/api/notifications/:id/lue` | Connecté |
| `PATCH` | `/api/notifications/tout-lire` | Connecté |
| `DELETE` | `/api/notifications/:id` | Connecté |

### Actualités — /api/actualites
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/actualites` | Public |
| `GET` | `/api/actualites/:id` | Public |
| `POST` | `/api/actualites` | super_admin |
| `PUT` | `/api/actualites/:id` | super_admin |
| `PATCH` | `/api/actualites/:id/publier` | super_admin |
| `DELETE` | `/api/actualites/:id` | super_admin |

### Menus — /api/menus
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/menus` | Public |
| `GET` | `/api/menus/cycle` | super_admin |
| `PUT` | `/api/menus/cycle/:numero` | super_admin |
| `GET` | `/api/menus/jour/:date` | Public |
| `GET` | `/api/menus/:semaine` | Public |

### Galerie et consentement photo — /api/galerie
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/galerie/albums` | Connecté |
| `POST` | `/api/galerie/albums` | super_admin |
| `GET` | `/api/galerie/albums/:id` | Connecté |
| `PUT` | `/api/galerie/albums/:id` | super_admin |
| `DELETE` | `/api/galerie/albums/:id` | super_admin |
| `POST` | `/api/galerie/albums/:id/photos` | super_admin |
| `DELETE` | `/api/galerie/photos/:id` | super_admin |
| `PUT` | `/api/galerie/photos/:id/enfants` | super_admin |
| `GET` | `/api/galerie/photos/:id/download` | Connecté |
| `GET` | `/api/galerie/consentement` | Connecté |
| `POST` | `/api/galerie/consentement` | Connecté |

### Pages CMS — /api/cms
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/cms/pages` | super_admin |
| `GET` | `/api/cms/pages/:slug` | Public |
| `PUT` | `/api/cms/pages/:slug` | super_admin |

### Équipe — /api/equipe
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/equipe` | Public |
| `GET` | `/api/equipe/tous` | super_admin |
| `POST` | `/api/equipe` | super_admin |
| `PUT` | `/api/equipe/:id` | super_admin |
| `DELETE` | `/api/equipe/:id` | super_admin |

### Contact — /api/contact
| Verbe | Route | Accès |
|---|---|---|
| `POST` | `/api/contact` | Public |

### Rapports — /api/rapports
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/rapports` | super_admin |

### Paramètres (super admin) — /api/parametres
| Verbe | Route | Accès |
|---|---|---|
| `GET` | `/api/parametres/public` | Public |
| `GET` | `/api/parametres/guide-inscription` | Public |
| `POST` | `/api/parametres/guide-inscription` | super_admin |
| `GET` | `/api/parametres` | super_admin |
| `PUT` | `/api/parametres` | super_admin |

> Total : 102 routes. Les routes « Public » de lecture (actualités, menus,
> équipe, pages CMS, paramètres publics) alimentent le site vitrine.

---

## 📦 DÉPENDANCES NPM (backend/package.json)

| Paquet | Rôle |
|---|---|
| express 4 | Serveur HTTP et routage |
| sequelize 6 + mysql2 | ORM et pilote MySQL / MariaDB |
| jsonwebtoken | Jetons d'accès, de rafraîchissement et d'étape 2FA |
| bcryptjs | Hachage des mots de passe (coût 12) |
| google-auth-library | Vérification côté serveur du jeton « Se connecter avec Google » |
| helmet | En-têtes de sécurité HTTP |
| cors | Autorisation du seul frontend |
| express-rate-limit | Limitation du nombre de tentatives |
| express-validator | Validation et nettoyage des données reçues |
| multer | Réception des fichiers |
| sharp | Compression des photos en 3 tailles (WebP) |
| nodemailer | Envoi des emails |
| morgan | Journal des requêtes |
| dotenv | Variables d'environnement |
| nodemon, cross-env (dev) | Rechargement automatique, variables multiplateformes |

Scripts : `npm start` (production), `npm run dev` (nodemon), `npm run seed`
(données de test, fichier `database/seeds/index.js`).

---

## 📌 RÈGLES BACKEND IMPORTANTES

1. Toute route protégée : `verifierToken` puis `verifierRole` si un rôle est exigé.
2. Un parent n'accède **qu'à ses données** : filtre `req.user.id` dans le contrôleur.
3. Toute route POST / PUT : validation **express-validator** + `validerDonnees`.
4. Toute opération en base dans un `try / catch` ; message générique au client,
   détail de l'erreur uniquement dans les logs du serveur.
5. Réponses toujours au format `{ success, data, message }`.
6. Jamais de `password`, `refresh_token` ou code 2FA dans une réponse.
7. Tout fichier privé est rangé dans un dossier protégé et servi par **lien signé**.
8. Commentaires en français sur chaque ligne importante.
