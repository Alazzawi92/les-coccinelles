# 🎨 07 — COMPOSANTS UI & DESIGN SYSTEM
# Fichier : 07-COMPOSANTS-UI.md
# Description : Tous les composants React réutilisables du projet
# Design System — Les Coccinelles

---

## 🎯 PRINCIPE

Tous les composants utilisent :
- Les variables CSS du fichier `styles/variables.css`
- La police Fredoka pour les titres
- La police Nunito pour le texte
- La palette de couleurs Arc-en-Ciel Joyeux

---

## 🔘 BOUTON (components/common/Button/)

### Button.jsx
```jsx
// Composant Button réutilisable pour tout le projet
// Variantes : primary, secondary, outline, ghost, danger

const Button = ({
  children,           // Texte ou contenu du bouton
  variant = 'primary',// Style du bouton (primary par défaut)
  size    = 'md',     // Taille : sm | md | lg
  loading = false,    // Afficher un spinner si true
  disabled = false,   // Désactiver le bouton
  onClick,            // Fonction appelée au clic
  type    = 'button', // Type HTML : button | submit | reset
  className = '',     // Classes CSS supplémentaires
  ...props            // Autres attributs HTML
}) => {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading} // Désactiver aussi si chargement
      onClick={onClick}
      {...props}
    >
      {/* Spinner de chargement */}
      {loading && <span className="btn__spinner" aria-hidden="true" />}

      {/* Texte du bouton */}
      <span className={loading ? 'btn__text--hidden' : ''}>
        {children}
      </span>
    </button>
  );
};

export default Button;
```

### Button.css
```css
/* Styles de base communs à tous les boutons */
.btn {
  display:        inline-flex;
  align-items:    center;
  justify-content: center;
  gap:            var(--space-sm);
  font-family:    var(--font-body);
  font-weight:    700;
  border:         none;
  border-radius:  var(--radius-pill); /* Très arrondi */
  cursor:         pointer;
  transition:     var(--transition);
  text-decoration: none;
  white-space:    nowrap; /* Pas de retour à la ligne */
}

/* Tailles */
.btn--sm  { padding: var(--space-xs)  var(--space-md); font-size: 0.85rem; }
.btn--md  { padding: var(--space-sm)  var(--space-xl); font-size: 1rem;    }
.btn--lg  { padding: var(--space-md)  var(--space-2xl); font-size: 1.1rem; }

/* Variante Primary (orange) */
.btn--primary {
  background: var(--primary);
  color:      var(--white);
  box-shadow: var(--shadow-colored);
}
.btn--primary:hover {
  background:  var(--primary-dark);  /* Plus foncé au survol */
  transform:   translateY(-2px);     /* Légère élévation */
  box-shadow:  0 6px 20px rgba(255,152,0,0.4);
}

/* Variante Secondary (vert) */
.btn--secondary {
  background: var(--secondary);
  color:      var(--white);
}
.btn--secondary:hover {
  background: var(--secondary-dark);
  transform:  translateY(-2px);
}

/* Variante Outline (bordure orange) */
.btn--outline {
  background:  transparent;
  color:       var(--primary);
  border:      2px solid var(--primary);
}
.btn--outline:hover {
  background: var(--primary);
  color:      var(--white);
}

/* Variante Ghost (transparent discret) */
.btn--ghost {
  background: var(--primary-light);
  color:      var(--primary);
}
.btn--ghost:hover {
  background: var(--primary);
  color:      var(--white);
}

/* Variante Danger (rouge) */
.btn--danger {
  background: var(--error);
  color:      var(--white);
}

/* État désactivé */
.btn:disabled {
  opacity: 0.5;
  cursor:  not-allowed;
  transform: none;
}

/* Spinner de chargement */
.btn__spinner {
  width:  16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}
@keyframes spinner { to { transform: rotate(360deg); } }

/* Texte caché pendant chargement */
.btn__text--hidden { visibility: hidden; }
```

---

## 📝 INPUT (components/common/Input/)

### Input.jsx
```jsx
// Composant Input réutilisable avec label et messages d'erreur
const Input = ({
  label,          // Label affiché au-dessus
  name,           // Nom du champ (pour le formulaire)
  type = 'text',  // Type HTML : text | email | password | number...
  placeholder,    // Texte indicatif
  value,          // Valeur contrôlée
  onChange,       // Fonction au changement
  error,          // Message d'erreur à afficher
  success,        // Message de succès
  icon,           // Icône à gauche (optionnel)
  required = false,
  ...props
}) => {
  return (
    <div className="input-group">
      {/* Label */}
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      {/* Conteneur avec icône optionnelle */}
      <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''} ${success ? 'input-wrapper--success' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`input-field ${icon ? 'input-field--with-icon' : ''}`}
          required={required}
          {...props}
        />
      </div>

      {/* Messages erreur/succès */}
      {error   && <p className="input-message input-message--error">{error}</p>}
      {success && <p className="input-message input-message--success">{success}</p>}
    </div>
  );
};

export default Input;
```

### Input.css
```css
/* Groupe complet input + label + message */
.input-group { display: flex; flex-direction: column; gap: var(--space-xs); }

/* Label */
.input-label {
  font-family: var(--font-body);
  font-weight: 700;
  font-size:   0.9rem;
  color:       var(--text-dark);
}

/* Astérisque obligatoire */
.input-required { color: var(--error); margin-left: 2px; }

/* Conteneur du champ */
.input-wrapper {
  display:       flex;
  align-items:   center;
  border:        2px solid #E0E0E0;
  border-radius: var(--radius-md);
  background:    var(--white);
  transition:    var(--transition);
}

/* Focus sur le champ */
.input-wrapper:focus-within {
  border-color: var(--primary);     /* Bordure orange au focus */
  box-shadow:   0 0 0 3px rgba(255,152,0,0.15);
}

/* État erreur */
.input-wrapper--error        { border-color: var(--error); }
.input-wrapper--error:focus-within { box-shadow: 0 0 0 3px rgba(229,57,53,0.15); }

/* État succès */
.input-wrapper--success { border-color: var(--success); }

/* Champ input lui-même */
.input-field {
  flex:        1;
  padding:     var(--space-sm) var(--space-md);
  border:      none;
  outline:     none;
  font-family: var(--font-body);
  font-size:   1rem;
  color:       var(--text-dark);
  background:  transparent;
}

/* Champ avec icône (décalage à gauche) */
.input-field--with-icon { padding-left: var(--space-sm); }

/* Icône à gauche */
.input-icon {
  padding-left: var(--space-md);
  color:        var(--text-gray);
  font-size:    1.1rem;
}

/* Messages en dessous du champ */
.input-message         { font-size: 0.8rem; margin: 0; }
.input-message--error  { color: var(--error); }
.input-message--success { color: var(--success); }
```

---

## 🃏 CARD (components/common/Card/)

### Card.jsx
```jsx
// Composant Card générique
const Card = ({ children, className = '', padding = true, shadow = true, ...props }) => {
  return (
    <div
      className={`card ${padding ? 'card--padded' : ''} ${shadow ? 'card--shadow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Sous-composants pour structurer le contenu
Card.Header  = ({ children }) => <div className="card__header">{children}</div>;
Card.Body    = ({ children }) => <div className="card__body">{children}</div>;
Card.Footer  = ({ children }) => <div className="card__footer">{children}</div>;

export default Card;
```

### Card.css
```css
.card {
  background:    var(--white);
  border-radius: var(--radius-xl);     /* Arrondi généreux */
  overflow:      hidden;               /* Coins arrondis respectés */
  transition:    var(--transition);
}

.card--padded { padding: var(--space-xl); }
.card--shadow { box-shadow: var(--shadow-md); }
.card:hover   { box-shadow: var(--shadow-lg); transform: translateY(-2px); }

.card__header {
  border-bottom: 1px solid var(--bg-gray);
  padding-bottom: var(--space-md);
  margin-bottom:  var(--space-md);
  font-family:    var(--font-heading);
  font-size:      1.2rem;
  color:          var(--text-dark);
}

.card__footer {
  border-top:  1px solid var(--bg-gray);
  padding-top: var(--space-md);
  margin-top:  var(--space-md);
}
```

---

## 🏷️ BADGE (components/common/Badge/)

### Badge.jsx
```jsx
// Badge de statut (actif, en attente, etc.)
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {children}
    </span>
  );
};

export default Badge;
```

### Badge.css
```css
/* Style de base */
.badge {
  display:       inline-flex;
  align-items:   center;
  border-radius: var(--radius-pill);
  font-family:   var(--font-body);
  font-weight:   700;
  white-space:   nowrap;
}

/* Tailles */
.badge--sm { font-size: 0.7rem;  padding: 2px var(--space-sm); }
.badge--md { font-size: 0.8rem;  padding: 4px var(--space-md); }
.badge--lg { font-size: 0.9rem;  padding: 6px var(--space-lg); }

/* Variantes de couleur */
.badge--success  { background: #E8F5E9; color: var(--success); }  /* Vert pâle */
.badge--warning  { background: #FFF3E0; color: var(--warning); }  /* Orange pâle */
.badge--error    { background: #FFEBEE; color: var(--error);   }  /* Rouge pâle */
.badge--info     { background: #E3F2FD; color: var(--info);    }  /* Bleu pâle */
.badge--default  { background: var(--bg-gray); color: var(--text-gray); }
```

---

## 🚨 ALERT (components/common/Alert/)

### Alert.jsx
```jsx
// Alerte pour messages de succès, erreur, info, avertissement
const ICONES = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️'
};

const Alert = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`alert alert--${type}`} role="alert">
      <span className="alert__icon">{ICONES[type]}</span>
      <p className="alert__message">{message}</p>
      {onClose && (
        <button className="alert__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
```

### Alert.css
```css
.alert {
  display:       flex;
  align-items:   center;
  gap:           var(--space-md);
  padding:       var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  border-left:   4px solid;           /* Barre colorée à gauche */
}

.alert--success { background: #E8F5E9; border-color: var(--success); }
.alert--error   { background: #FFEBEE; border-color: var(--error);   }
.alert--warning { background: #FFF3E0; border-color: var(--warning); }
.alert--info    { background: #E3F2FD; border-color: var(--info);    }

.alert__message { flex: 1; margin: 0; font-family: var(--font-body); }
.alert__close   { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text-gray); }
```

---

## 🎴 COMPOSANT CARD ENFANT (métier)

### SuiviCard.jsx (composant métier)
```jsx
// Carte de suivi quotidien d'un enfant
// Affiche repas, sieste, activités et humeur du jour

const SuiviCard = ({ suivi }) => {
  // Convertir le statut repas en emoji
  const emojiRepas = (statut) => {
    const emojis = { tout: '😋', peu: '😐', rien: '😕', absent: '—' };
    return emojis[statut] || '—';
  };

  return (
    <Card className="suivi-card">
      <Card.Header>
        🗓️ Suivi du {new Date(suivi.date_suivi).toLocaleDateString('fr-FR')}
      </Card.Header>

      <Card.Body>
        {/* Section repas */}
        <div className="suivi-section">
          <h4 className="suivi-section__titre">🍽️ Repas</h4>
          <div className="suivi-repas">
            <div className="suivi-repas__item">
              <span>Matin</span>
              <span>{emojiRepas(suivi.repas_matin)}</span>
            </div>
            <div className="suivi-repas__item">
              <span>Midi</span>
              <span>{emojiRepas(suivi.repas_midi)}</span>
            </div>
            <div className="suivi-repas__item">
              <span>Goûter</span>
              <span>{emojiRepas(suivi.repas_gouter)}</span>
            </div>
          </div>
        </div>

        {/* Section sieste */}
        {suivi.sieste_debut && (
          <div className="suivi-section">
            <h4 className="suivi-section__titre">😴 Sieste</h4>
            <p>{suivi.sieste_debut} → {suivi.sieste_fin}</p>
          </div>
        )}

        {/* Note générale */}
        {suivi.note_generale && (
          <div className="suivi-note">
            <p>💬 {suivi.note_generale}</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SuiviCard;
```

---

## 📌 RÈGLES COMPOSANTS

1. **1 dossier par composant** : `Button/Button.jsx` + `Button/Button.css`
2. **Props documentées** : toujours commenter les props
3. **Valeurs par défaut** : chaque prop optionnelle a une valeur par défaut
4. **Pas de styles inline** : tout dans le fichier `.css` du composant
5. **Accessibilité** : `aria-label`, `role`, `alt` sur tous les éléments
6. **Export nommé** : `export default NomComposant` toujours en bas
