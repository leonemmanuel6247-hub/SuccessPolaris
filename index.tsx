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

// Cette fonction assure que le loader disparaît dès que le script a fini de monter l'App
const removeLoader = () => {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    }
};

// Exécution de la suppression après un court délai pour assurer une transition fluide
if (document.readyState === 'complete') {
    removeLoader();
} else {
    window.addEventListener('load', removeLoader);
}

// Sécurité : suppression forcée après 4 secondes si le script est bloqué par autre chose
setTimeout(removeLoader, 4000);