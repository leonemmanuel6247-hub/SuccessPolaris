
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enregistrement du Service Worker pour la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

const removeLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) {
        // On s'assure que le contenu est bien chargé avant de retirer le voile
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 1200);
    }
};

// On laisse le loader au moins 3.5 secondes pour l'effet d'immersion
window.addEventListener('load', () => {
    setTimeout(removeLoader, 3500);
});

// Sécurité au cas où l'événement load tarde trop
setTimeout(removeLoader, 6000);
