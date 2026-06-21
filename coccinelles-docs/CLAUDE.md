# 🤖 CLAUDE.md — Guide pour Claude Code
# Projet : Les Coccinelles — Plateforme web crèche
# Développeur : Sabah Al-Azzawi (CDA — AFEC La Rochelle)
# Ce fichier aide Claude Code à comprendre et coder le projet

---

## 🎯 QU'EST-CE QUE CE PROJET ?

**Les Coccinelles** est une plateforme web complète pour une crèche.
Elle remplace deux outils séparés par une seule application moderne.

### 3 espaces distincts
1. **Site public** — informations crèche, accessible à tous
2. **Espace parents** — sécurisé, gestion dossiers/suivi enfant
3. **Espace admin** — gestion interne pour l'équipe de la crèche

---

## 🛠️ STACK TECHNIQUE

| Couche | Technologie |
|--------|-------------|
| Frontend Web | React 18 + React Router 6 |
| Frontend Mobile | React Native + Expo SDK 51 |
| Styles | CSS Modules + Variables CSS (PAS de Tailwind) |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Base de données | MySQL 8 / MariaDB |
| Auth | JWT (access 15min + refresh 7j) |
| Upload | Multer + Sharp (compression images) |
| Email | Nodemailer |
| DevOps | Docker + Docker Compose |

---

## 📁 STRUCTURE DU PROJET

```
projet-coccinelles/
├── docs/              # Toute la documentation .md
├── database/          # schema.sql + seeds + migrations
├── backend/           # Node.js Express API
├── frontend-web/      # React 18
├── frontend-mobile/   # React Native Expo
├── docker-compose.yml
└── CLAUDE.md          # Ce fichier
```

---

## 🗄️ BASE DE DONNÉES — 15 TABLES

```
users               → Tous les utilisateurs (parents, admin)
enfants             → Enfants de la crèche
inscriptions        → Dossiers d'inscription
absences            → Déclarations d'absences
suivi_quotidien     → Repas, sieste, activités du jour
documents           → Fichiers uploadés
messages            → Messagerie crèche ↔ parents
actualites          → Actualités du site public
menus               → Menus de la semaine
notifications       → Notifications système
galerie_albums      → Albums photos
galerie_photos      → Photos dans les albums
photo_enfants       → Pivot photo ↔ enfant
consentements_photo → Consentements RGPD pour les photos
cms_pages           → Contenu dynamique des pages (CMS)
```

---

## 👥 RÔLES UTILISATEURS

```
public      → Visiteur non connecté (site public uniquement)
parent      → Parent d'enfant inscrit (espace parents)
admin       → Équipe crèche (espace admin)
super_admin → Directrice (tout + configuration)
```

**Règle absolue** : Un parent ne voit QUE les données de SES enfants.

---

## 🔑 AUTHENTIFICATION JWT

```javascript
// Access Token  : 15 minutes (dans chaque requête API)
// Refresh Token : 7 jours    (pour renouveler l'access token)
// Header attendu : Authorization: Bearer <access_token>
```

---

## 🎨 DESIGN SYSTEM

### Couleurs CSS (toujours utiliser ces variables)
```css
--primary:     #FF9800    /* Orange — couleur principale */
--secondary:   #66BB6A    /* Vert nature */
--accent-1:    #4FC3F7    /* Bleu ciel */
--accent-2:    #F06292    /* Rose doux */
--accent-3:    #BA68C8    /* Violet tendre */
--accent-4:    #FFEB3B    /* Jaune soleil */
--bg-light:    #FFFDF7    /* Fond blanc chaud */
--text-dark:   #2D3436    /* Texte principal */
```

### Polices (Google Fonts)
```css
--font-heading: 'Fredoka', sans-serif;  /* Titres */
--font-body:    'Nunito', sans-serif;   /* Corps */
```

### CSS par Layout — OBLIGATOIRE
```
PublicLayout → frontend-web/src/layouts/PublicLayout/PublicLayout.css
ParentLayout → frontend-web/src/layouts/ParentLayout/ParentLayout.css
AdminLayout  → frontend-web/src/layouts/AdminLayout/AdminLayout.css
```

---

## 📝 CONVENTIONS DE CODE

### Commentaires (OBLIGATOIRE)
```javascript
// Toujours commenter en français chaque ligne importante
// Format : // Ce que fait cette ligne
const token = jwt.sign({ id: userId }, process.env.JWT_SECRET); // Générer le JWT
```

### Nommage
```
Variables JS    : camelCase       (monNom, dateDebut)
Fichiers React  : PascalCase      (MonComposant.jsx)
Classes CSS     : kebab-case      (ma-classe, btn--primary)
Variables CSS   : kebab-case      (--ma-variable)
Tables SQL      : snake_case      (suivi_quotidien, galerie_albums)
Commits Git     : français        (feat: ajouter la page contact)
```

### Structure des réponses API
```javascript
// Réponse succès
res.status(200).json({
  success: true,
  data:    { ... },          // Les données retournées
  message: 'Succès'          // Message optionnel
});

// Réponse erreur
res.status(400).json({
  success: false,
  message: 'Description de l\'erreur'
});
```

---

## ⚠️ POINTS D'ATTENTION CRITIQUES

### 1. JAMAIS stocker les mots de passe en clair
```javascript
// ✅ CORRECT
const hash = await bcrypt.hash(password, 12);

// ❌ INTERDIT
user.password = password; // Ne jamais faire ça
```

### 2. TOUJOURS vérifier que le parent accède à SES données
```javascript
// ✅ CORRECT — vérifier que l'enfant appartient au parent
const enfant = await Enfant.findOne({
  where: { id: req.params.id, user_id: req.user.id } // user_id = parent connecté
});

// ❌ DANGEREUX — n'importe qui peut voir n'importe quel enfant
const enfant = await Enfant.findByPk(req.params.id);
```

### 3. Consentement RGPD pour les photos
```javascript
// Avant d'afficher une photo, toujours vérifier le consentement
// Si pas de consentement → image floue ou masquée
```

### 4. CSS uniquement via variables
```css
/* ✅ CORRECT */
color: var(--primary);

/* ❌ ÉVITER */
color: #FF9800; /* Valeur en dur */
```

### 5. Ne jamais exposer le mot de passe dans les réponses
```javascript
// ✅ CORRECT — exclure le mot de passe
const user = await User.findByPk(id, {
  attributes: { exclude: ['password', 'refresh_token'] }
});
```

### 6. Valider toutes les données entrantes
```javascript
// Toujours utiliser express-validator sur les routes POST/PUT
```

### 7. Gestion des erreurs avec try/catch
```javascript
// Toujours entourer les opérations BDD d'un try/catch
try {
  const data = await Model.findAll();
  res.json({ success: true, data });
} catch (err) {
  console.error('Erreur :', err);
  res.status(500).json({ success: false, message: 'Erreur serveur' });
}
```

### 8. Variables d'environnement
```javascript
// ✅ CORRECT
const secret = process.env.JWT_SECRET;

// ❌ INTERDIT — jamais en dur dans le code
const secret = 'ma_cle_secrete_123';
```

---

## 🐳 COMMANDES DOCKER

```bash
docker-compose up -d          # Démarrer le projet
docker-compose down           # Arrêter le projet
docker-compose logs -f backend # Voir les logs
docker-compose exec backend sh # Terminal container
```

---

## 🌿 GIT — BRANCHES ET COMMITS

```bash
# Branches
main            # Production stable
develop         # Développement en cours
feature/nom     # Nouvelle fonctionnalité
fix/nom         # Correction bug

# Format commits (en français)
feat: ajouter authentification JWT
fix: corriger erreur upload fichier
docs: mettre à jour README
```

---

## ✅ CHECKLIST AVANT CHAQUE COMMIT

```
□ Mots de passe hashés (bcrypt)
□ Variables sensibles dans .env
□ Commentaires en français sur le code important
□ Variables CSS utilisées (pas de valeurs en dur)
□ Gestion des erreurs (try/catch)
□ Validation des données entrantes
□ Vérification des droits (parent → ses données seulement)
□ .env dans .gitignore
```

---

## 🔧 AIDE RAPIDE POUR CLAUDE CODE

### Si tu crées un fichier React :
1. Importer les dépendances
2. Commenter chaque section en français
3. Utiliser les variables CSS du design system
4. Gérer les états de chargement et d'erreur

### Si tu crées une route API :
1. Ajouter verifierToken si route protégée
2. Ajouter verifierRole si rôle requis
3. Valider les données entrantes
4. Utiliser try/catch
5. Retourner le format standard { success, data, message }

### Si tu crées un composant :
1. Créer `ComponentName/ComponentName.jsx`
2. Créer `ComponentName/ComponentName.css`
3. Documenter toutes les props
4. Utiliser les variables CSS du design system
