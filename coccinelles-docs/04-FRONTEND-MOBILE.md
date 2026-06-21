# 📱 04 — FRONTEND MOBILE (React Native Expo)
# Fichier : 04-FRONTEND-MOBILE.md
# Description : Architecture de l'application mobile React Native avec Expo
# iOS + Android depuis un seul code

---

## 🎯 OBJECTIF

Application mobile complémentaire à la plateforme web.
Les parents peuvent :
- Consulter le suivi quotidien de leur enfant
- Déclarer une absence rapidement
- Recevoir des notifications push
- Envoyer et recevoir des messages
- Voir la galerie photos

---

## 📁 STRUCTURE DE L'APPLICATION

```
frontend-mobile/
├── app/                         # Expo Router (navigation basée sur les fichiers)
│   ├── _layout.jsx              # Layout racine (providers globaux)
│   ├── index.jsx                # Page d'accueil / redirection
│   ├── auth/
│   │   ├── _layout.jsx          # Layout des pages auth
│   │   ├── connexion.jsx        # Page connexion
│   │   └── mot-de-passe.jsx     # Page réinitialisation mot de passe
│   └── (tabs)/                  # Navigation par onglets (connecté)
│       ├── _layout.jsx          # Configuration des onglets
│       ├── index.jsx            # Accueil / tableau de bord
│       ├── suivi.jsx            # Suivi quotidien enfant
│       ├── absences.jsx         # Gestion absences
│       ├── messages.jsx         # Messagerie
│       ├── galerie.jsx          # Galerie photos
│       └── profil.jsx           # Mon profil
├── components/
│   ├── common/
│   │   ├── Button.jsx           # Bouton réutilisable
│   │   ├── Input.jsx            # Champ texte
│   │   ├── Card.jsx             # Carte
│   │   ├── Badge.jsx            # Badge statut
│   │   └── Avatar.jsx           # Photo de profil
│   └── screens/                 # Composants spécifiques aux écrans
│       ├── SuiviCard.jsx        # Carte suivi journalier
│       ├── AbsenceItem.jsx      # Ligne d'absence
│       └── MessageBubble.jsx    # Bulle de message
├── hooks/
│   ├── useAuth.js               # Authentification
│   └── useApi.js                # Appels API
├── services/
│   └── api.js                   # Axios configuré pour mobile
├── context/
│   └── AuthContext.jsx          # Contexte auth global
├── constants/
│   ├── colors.js                # Palette de couleurs (design system)
│   ├── fonts.js                 # Polices
│   └── api.js                   # URLs de l'API
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json                     # Configuration Expo
└── package.json
```

---

## ⚙️ CONFIGURATION EXPO (app.json)

```json
{
  "expo": {
    "name": "Les Coccinelles",
    "slug": "les-coccinelles",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "coccinelles",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF9800"
    },
    "ios": {
      "bundleIdentifier": "fr.lescoccinelles.app",
      "supportsTablet": false
    },
    "android": {
      "package": "fr.lescoccinelles.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FF9800"
      }
    },
    "plugins": [
      "expo-router",
      "expo-notifications",
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Fredoka-Regular.ttf",
            "./assets/fonts/Nunito-Regular.ttf",
            "./assets/fonts/Nunito-Bold.ttf"
          ]
        }
      ]
    ]
  }
}
```

---

## 🎨 CONSTANTES DESIGN (constants/colors.js)

```javascript
// Palette de couleurs du design system Les Coccinelles
// Identique au frontend web pour cohérence visuelle

export const COLORS = {
  // Couleurs principales
  primary:      '#FF9800',   // Orange principal
  primaryDark:  '#E65100',   // Orange foncé
  primaryLight: '#FFF3E0',   // Orange très clair
  secondary:    '#66BB6A',   // Vert nature
  accent1:      '#4FC3F7',   // Bleu ciel
  accent2:      '#F06292',   // Rose doux
  accent3:      '#BA68C8',   // Violet tendre
  accent4:      '#FFEB3B',   // Jaune soleil

  // Textes et fonds
  bgLight:   '#FFFDF7',      // Fond blanc chaud
  bgGray:    '#F5F5F5',      // Fond gris clair
  textDark:  '#2D3436',      // Texte principal
  textGray:  '#636e72',      // Texte secondaire
  white:     '#FFFFFF',

  // États
  error:   '#E53935',        // Rouge erreur
  success: '#43A047',        // Vert succès
  warning: '#FB8C00'         // Orange avertissement
};
```

---

## 📱 ÉCRANS PRINCIPAUX

### 1. Layout racine (app/_layout.jsx)
```jsx
// Layout principal — enveloppe toute l'application
import { Stack } from 'expo-router';            // Navigation Expo Router
import { useFonts } from 'expo-font';           // Chargement des fonts
import { AuthProvider } from '../context/AuthContext'; // Contexte auth
import * as SplashScreen from 'expo-splash-screen'; // Écran de démarrage
import { useEffect } from 'react';

// Garder le splash screen visible pendant le chargement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Charger les fonts Google
  const [fontsLoaded] = useFonts({
    'Fredoka': require('../assets/fonts/Fredoka-Regular.ttf'),
    'Nunito':  require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf')
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync(); // Cacher le splash quand fonts chargées
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // Attendre les fonts

  return (
    // Envelopper dans le provider d'authentification
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />           {/* Accueil / redirection */}
        <Stack.Screen name="auth" />            {/* Pages connexion */}
        <Stack.Screen name="(tabs)" />          {/* Onglets principal */}
      </Stack>
    </AuthProvider>
  );
}
```

### 2. Navigation onglets (app/(tabs)/_layout.jsx)
```jsx
// Configuration de la navigation par onglets
import { Tabs } from 'expo-router';         // Navigation onglets
import { COLORS } from '../../constants/colors'; // Couleurs

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor:   COLORS.primary,   // Onglet actif en orange
      tabBarInactiveTintColor: COLORS.textGray,  // Onglet inactif gris
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 0,
        elevation: 10,                           // Ombre Android
        shadowOpacity: 0.1,                      // Ombre iOS
        height: 65,                              // Hauteur de la barre
        paddingBottom: 10
      },
      tabBarLabelStyle: {
        fontFamily: 'Nunito-Bold',               // Police des labels
        fontSize: 11
      },
      headerShown: false                         // Pas de header par défaut
    }}>
      {/* Onglet Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />
        }}
      />

      {/* Onglet Suivi */}
      <Tabs.Screen
        name="suivi"
        options={{
          title: 'Mon enfant',
          tabBarIcon: ({ color }) => <TabIcon name="child" color={color} />
        }}
      />

      {/* Onglet Messages */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithBadge name="message" color={color} />
          )
        }}
      />

      {/* Onglet Galerie */}
      <Tabs.Screen
        name="galerie"
        options={{
          title: 'Photos',
          tabBarIcon: ({ color }) => <TabIcon name="photo" color={color} />
        }}
      />

      {/* Onglet Profil */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />
        }}
      />
    </Tabs>
  );
}
```

### 3. Tableau de bord (app/(tabs)/index.jsx)
```jsx
// Écran d'accueil : résumé pour le parent
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors'; // Palette couleurs
import { useAuth } from '../../hooks/useAuth';   // Hook auth

export default function AccueilScreen() {
  const { user } = useAuth(); // Récupérer l'utilisateur connecté

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* En-tête avec bonjour */}
      <View style={styles.header}>
        <Text style={styles.bonjour}>
          Bonjour {user?.prenom} ! 👋
        </Text>
        <Text style={styles.sousTitre}>
          Que souhaitez-vous faire aujourd'hui ?
        </Text>
      </View>

      {/* Cartes d'accès rapide */}
      <View style={styles.cartes}>
        <CarteAcces
          icon="🍽️"
          titre="Suivi du jour"
          sousTitre="Repas, sieste, activités"
          couleur={COLORS.primary}
          route="/(tabs)/suivi"
        />
        <CarteAcces
          icon="📅"
          titre="Absences"
          sousTitre="Déclarer une absence"
          couleur={COLORS.secondary}
          route="/(tabs)/absences"
        />
        <CarteAcces
          icon="💬"
          titre="Messages"
          sousTitre="Contacter la crèche"
          couleur={COLORS.accent1}
          route="/(tabs)/messages"
        />
        <CarteAcces
          icon="📸"
          titre="Photos"
          sousTitre="Galerie de mon enfant"
          couleur={COLORS.accent2}
          route="/(tabs)/galerie"
        />
      </View>

    </ScrollView>
  );
}

// Styles avec StyleSheet (obligatoire React Native)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight  // Fond blanc chaud
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.primary, // Bandeau orange en haut
    paddingTop: 60                    // Espace pour la barre de statut
  },
  bonjour: {
    fontFamily: 'Fredoka',
    fontSize: 28,
    color: COLORS.white
  },
  sousTitre: {
    fontFamily: 'Nunito',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4
  },
  cartes: {
    padding: 16,
    flexDirection: 'row',            // En ligne
    flexWrap: 'wrap',                // Retour à la ligne si besoin
    gap: 12
  }
});
```

---

## 🔔 NOTIFICATIONS PUSH

```javascript
// Configuration des notifications push avec Expo
import * as Notifications from 'expo-notifications'; // Module notifications
import * as Device from 'expo-device';               // Vérifier si c'est un appareil

// Configurer le comportement des notifications reçues
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Afficher une alerte même si l'app est ouverte
    shouldPlaySound: true,  // Jouer un son
    shouldSetBadge: true    // Mettre à jour le badge de l'icône
  })
});

// Enregistrer l'appareil pour les notifications push
export const enregistrerNotifications = async () => {
  if (!Device.isDevice) {
    // Les notifications push ne marchent pas sur émulateur
    console.log('Utilisez un vrai appareil pour les notifications');
    return null;
  }

  // Demander la permission à l'utilisateur
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission notifications refusée');
    return null;
  }

  // Récupérer le token unique de l'appareil
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data; // Ce token est envoyé au backend pour cibler l'appareil
};
```

---

## 📦 DÉPENDANCES NPM

```json
{
  "dependencies": {
    "expo":                     "~51.0.0",
    "expo-router":              "~3.5.0",
    "expo-font":                "~12.0.0",
    "expo-notifications":       "~0.28.0",
    "expo-splash-screen":       "~0.27.0",
    "expo-status-bar":          "~1.12.0",
    "react":                    "18.2.0",
    "react-native":             "0.74.0",
    "axios":                    "^1.4.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

---

## 🚀 COMMANDES UTILES

```bash
# Démarrer l'application
npx expo start

# Démarrer avec tunnel (si problème réseau)
npx expo start --tunnel

# Build APK Android (pour tester)
eas build --platform android --profile preview

# Build iOS (nécessite compte Apple Developer)
eas build --platform ios --profile preview
```

---

## 📌 RÈGLES MOBILE IMPORTANTES

1. **StyleSheet.create()** toujours — jamais de styles inline
2. **COLORS** : toujours utiliser les constantes, pas de valeurs en dur
3. **ScrollView** sur tous les écrans avec contenu long
4. **KeyboardAvoidingView** sur les formulaires (évite le clavier qui cache)
5. **SafeAreaView** pour les appareils avec encoche (iPhone X+)
6. **AsyncStorage** pour stocker le token JWT localement
7. **Tester sur vrai appareil** pour les notifications push
