// Point d'entrée React — Les Coccinelles
import React    from 'react';
import ReactDOM from 'react-dom/client';
import App      from './App';
import './i18n'; // Initialise les traductions FR / EN avant le premier rendu
import { enregistrer as enregistrerServiceWorker } from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA : rend le site installable et rapide (production uniquement)
enregistrerServiceWorker();
