# 🔐 05 — SÉCURITÉ & RGPD
# Fichier : 05-SECURITE-RGPD.md
# Description : Mesures de sécurité réellement en place, correspondance avec
# l'OWASP Top 10, conformité RGPD, limites connues

---

## 🎯 POURQUOI C'EST CRITIQUE

La plateforme traite des **données de mineurs** : identité, santé (allergies,
médicaments, médecin), photos, présence quotidienne, échanges avec les familles.
Pour le RGPD, les données de santé sont des **données sensibles** (article 9).
Une fuite toucherait des enfants : la sécurité est donc traitée à **chaque
couche** (navigateur, réseau, API, base de données, fichiers, téléphone).

---

## 🔑 AUTHENTIFICATION

### Connexion en deux étapes (obligatoire pour tous)
```
Étape 1 : email + mot de passe (bcrypt)   ou   compte Google (jeton vérifié par le serveur)
          → aucune session ouverte ; code à 6 chiffres envoyé par email
          → jeton d'étape signé avec une clé dédiée, valable 20 min
Étape 2 : saisie du code → session ouverte (accessToken + refreshToken)
```
| Mesure | Détail |
|---|---|
| Code 2FA | Tiré par `crypto.randomInt`, valable **10 min**, un seul renvoi par minute |
| Stockage du code | **Empreinte HMAC-SHA256** (clé dérivée de `JWT_SECRET` par HKDF) ; jamais le code en clair |
| Comparaison | `crypto.timingSafeEqual` (temps constant) dans une **transaction avec verrou** : un code ne sert qu'une fois, pas de contournement par requêtes parallèles |
| Anti force brute | **5 codes faux sur le compte = blocage 15 min** ; le compteur n'est **pas** remis à zéro par l'envoi d'un nouveau code |
| Table dédiée | `deux_facteurs`, séparée de `users` |
| Secours | Script `code-secours-connexion.js` (accès serveur requis) si les emails ne partent plus |

### Jetons JWT
| Jeton | Durée | Rôle |
|---|---|---|
| accessToken | **15 min** | Envoyé à chaque requête (`Authorization: Bearer`) |
| refreshToken | **7 jours** | Renouvelle l'accessToken ; **stocké en base** pour pouvoir le révoquer |
| Jeton d'étape 2FA | 20 min | Clé séparée : jamais accepté comme jeton de session, et inversement |

- Déconnexion → refreshToken effacé en base.
- Réinitialisation du mot de passe → **toutes les sessions** sont fermées.
- `verifierToken` recharge l'utilisateur à chaque requête : un compte désactivé
  ou supprimé perd l'accès immédiatement, même avec un jeton encore valide.

### Mots de passe
- **bcrypt, coût 12**.
- Règles : 8 caractères minimum, au moins **une majuscule** et **un chiffre**
  (vérifiées côté serveur ; affichées en temps réel côté client).
- « Mot de passe oublié » : **même réponse** que l'email existe ou non (pas
  d'énumération des comptes) ; lien de réinitialisation à durée limitée.

### Création de compte
- Anti-robot **Cloudflare Turnstile** vérifié côté serveur.
- Email de confirmation valable **24 h** ; compte non confirmé **supprimé
  automatiquement** après 24 h (tâche planifiée toutes les heures).
- Activation du compte par l'équipe avant l'accès à l'espace parents.

---

## 🚦 AUTORISATIONS (RÔLES ET PROPRIÉTÉ DES DONNÉES)

| Rôle | Accès |
|---|---|
| `parent` | Son profil, **ses** enfants, **ses** inscriptions, documents, absences, messages ; suivi / galerie / absences seulement si un enfant est inscrit |
| `admin` | Partie « Quotidien » : émargement, suivi, absences, calendrier, messagerie |
| `super_admin` | Tout : familles, inscriptions, contenus du site, galerie, statistiques, rapports, paramètres |

Trois niveaux de contrôle :
1. **Route** : `verifierToken` puis `verifierRole(...)` (refus 401 / 403).
2. **Contrôleur** : filtre systématique par `req.user.id` → un parent ne peut pas
   lire les données d'un autre en changeant un identifiant dans l'URL
   (protection contre l'**IDOR**).
3. **Interface** : gardes de routes React (confort uniquement, jamais la seule barrière).

---

## 🛡️ PROTECTIONS TECHNIQUES

| Menace | Protection en place |
|---|---|
| Force brute sur la connexion | Rate limiting : 10 tentatives / 15 min (connexion, Google, création de compte) ; 30 / 15 min sur le code 2FA ; blocage du compte après 5 codes faux |
| Robots / spam | Turnstile sur connexion, création de compte, mot de passe oublié, contact ; contact limité à 5 messages / heure |
| Injection SQL | ORM Sequelize : requêtes **paramétrées** uniquement |
| XSS | React échappe tout l'affichage ; **CSP** stricte sur le site (Vercel) et sur l'API (helmet) ; validation et nettoyage des entrées (express-validator) |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Fuite par cache | `Cache-Control: no-store` sur toute l'API ; la PWA ne met **jamais** l'API ni les fichiers privés en cache |
| CORS | Seule l'adresse du site est autorisée à appeler l'API |
| Transport | **HTTPS** partout (Vercel, Alwaysdata) + **HSTS** 1 an |
| En-têtes | helmet : `nosniff`, `X-Powered-By` retiré, `Referrer-Policy`, `Permissions-Policy` (caméra, micro, géolocalisation désactivés) |
| Fichiers envoyés | Liste blanche de types **MIME**, tailles max (documents 5 Mo, photos 10 Mo, avatars 2 Mo), **nom aléatoire**, extension déduite du type (jamais du nom fourni) |
| Accès direct aux fichiers privés | **Liens signés HMAC-SHA256 à durée limitée** pour photos, documents, messages, justificatifs ; pièces justificatives dans un dossier **jamais servi** en statique |
| Secrets | Variables d'environnement (`.env` jamais versionné) |
| Erreurs | Message générique au client, détail uniquement dans les logs serveur |

### Liens signés (utils/fichiersSignes.js)
Une balise `<img>` ne peut pas envoyer de jeton JWT. Les fichiers privés sont
donc protégés autrement :
1. quand l'API renvoie un chemin de fichier privé à un utilisateur qui a le
   droit de le voir, elle ajoute `?exp=<expiration>&sig=<signature>` ;
2. le serveur de fichiers refuse toute demande sans signature valide ou expirée ;
3. **liste blanche** des dossiers publics (`equipe`, `actualites`, `avatars`) :
   tout autre dossier est privé par défaut.

### Audit OWASP ZAP
Un scan **OWASP ZAP** a été réalisé ; ses alertes ont été corrigées dans
`server.js` (HSTS, CSP stricte, `nosniff`, suppression de `X-Powered-By`,
`Cache-Control` sur l'API).

---

## 📊 CORRESPONDANCE OWASP TOP 10 (2021)

| Risque OWASP | Réponse dans le projet |
|---|---|
| A01 — Contrôle d'accès défaillant | Rôles vérifiés sur chaque route, filtre par propriétaire dans les contrôleurs, liens signés pour les fichiers |
| A02 — Défaillances cryptographiques | bcrypt 12, HMAC-SHA256, HTTPS + HSTS, secrets hors du code |
| A03 — Injection | Sequelize paramétré, express-validator, React (échappement) |
| A04 — Conception non sécurisée | 2FA obligatoire, séparation des rôles, données minimales, lancement en deux temps |
| A05 — Mauvaise configuration | helmet, CSP, CORS restreint, scan ZAP, messages d'erreur génériques |
| A06 — Composants vulnérables | Dépendances maintenues (`npm audit` à surveiller) |
| A07 — Identification et authentification | 2FA, rate limiting, blocage, révocation des sessions, pas d'énumération des comptes |
| A08 — Intégrité des données | Jetons signés (JWT, liens de fichiers), vérification serveur des jetons Google et Turnstile |
| A09 — Journalisation | Logs serveur (morgan + erreurs) ; journal d'audit des actions sensibles : **à améliorer** |
| A10 — SSRF | L'API n'appelle que des adresses fixes (Google, Cloudflare) |

---

## 📋 RGPD

### Données collectées et finalité
*(Bases légales proposées, à valider avec la direction de la crèche, responsable de traitement.)*

| Donnée | Finalité | Base légale |
|---|---|---|
| Identité et contact du parent | Compte, communication avec la crèche | Exécution du contrat d'accueil |
| Identité de l'enfant, jours de présence | Accueil, organisation, facturation | Contrat |
| Santé de l'enfant (allergies, médicaments, médecin) | Sécurité de l'enfant | Intérêt vital / consentement du parent |
| Suivi quotidien, émargement | Information des parents, obligations de la crèche | Contrat |
| Photos | Partage avec les familles | **Consentement** explicite, par enfant |
| Messages, documents | Échanges et dossier d'inscription | Contrat |

### Principes appliqués
- **Minimisation** : comptes non confirmés supprimés après 24 h ; le code 2FA
  n'est jamais stocké en clair ; aucune donnée personnelle dans le cache du
  téléphone (PWA) ni dans les notifications.
- **Consentement photo** par enfant (page « Consentement » de l'espace parents),
  enregistré avec **date et adresse IP** comme preuve, retirable à tout moment.
  Sans consentement, l'API **remplace l'adresse de la photo** par une image
  floutée : la vraie photo n'est jamais envoyée au navigateur.
- **Cookies** : bannière de consentement (tout accepter / tout refuser /
  personnaliser) ; seuls les cookies et stockages essentiels sans accord.
- **Effacement** : la suppression d'un compte supprime en cascade enfants,
  messages, notifications et données liées.
- **Mentions légales** : page dédiée (responsable de traitement, finalités,
  durées, droits, cookies), modifiable par le CMS.

### Droits des personnes
| Droit | Comment il s'exerce aujourd'hui |
|---|---|
| Accès | Le parent consulte ses données dans son espace (profil, enfants, documents, suivi) |
| Rectification | Modification du profil et des fiches enfants depuis l'espace parents |
| Effacement | Sur demande à la crèche : le super admin supprime le compte (suppression en cascade) |
| Opposition (photos) | Retrait du consentement en un clic |
| Portabilité | Sur demande à la crèche (pas d'export automatique) |

---

## ⚠️ LIMITES CONNUES ET AMÉLIORATIONS PRÉVUES

À présenter honnêtement au jury, avec la solution envisagée :

| Limite | Amélioration envisagée |
|---|---|
| Jetons stockés dans `localStorage` (exposés en cas de faille XSS ; risque réduit par la CSP et l'échappement React) | Refresh token en cookie `HttpOnly` + `SameSite` |
| Pas de suppression de compte ni d'export de données en libre-service | Boutons « Télécharger mes données » et « Supprimer mon compte » dans le profil |
| « Mot de passe oublié » protégé par Turnstile mais sans limite de débit | Ajouter `rateLimit` comme sur la connexion |
| Pas de journal d'audit des actions sensibles | Table d'audit (connexions, suppressions, changements de statut) |
| Pas de tests automatisés de sécurité | Tests d'API (droits par rôle, IDOR) intégrés à une CI |
| Ancien script `backend/creer_admin.js` contenant un mot de passe de test (présent dans l'historique Git) | Supprimer le fichier ; vérifier qu'aucun compte en ligne n'utilise ce mot de passe |

---

## 📌 CHECKLIST AVANT MISE EN PRODUCTION

```
✅ Mots de passe bcrypt (coût 12)
✅ Double authentification par email
✅ JWT_SECRET long et aléatoire, hors du code
✅ Rate limiting sur la connexion, Google, la création de compte, le code 2FA, le contact
✅ HTTPS + HSTS
✅ .env dans .gitignore
✅ Validation de toutes les données entrantes
✅ Types et tailles de fichiers contrôlés, noms aléatoires
✅ Fichiers privés uniquement par liens signés
✅ Photos conditionnées au consentement RGPD
✅ Page mentions légales + bannière cookies
✅ En-têtes de sécurité (helmet + vercel.json)
□  Vraies clés Cloudflare Turnstile en production (vérifier qu'il ne reste pas les clés de test)
□  Suppression de compte et export des données en libre-service
□  Journal d'audit des actions sensibles
```
