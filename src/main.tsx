import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Guarded Vite chunk preload error handler:
// If a deployment updates chunk hashes and a client tries to lazy load an old hash,
// reload once from the network to fetch the new HTML and hashes.
window.addEventListener('vite:preloadError', (event) => {
  const PRELOAD_KEY = 'f1_vite_preload_reloaded';
  if (!sessionStorage.getItem(PRELOAD_KEY)) {
    sessionStorage.setItem(PRELOAD_KEY, 'true');
    window.location.reload();
  } else {
    // Already reloaded once; do not loop infinitely
    sessionStorage.removeItem(PRELOAD_KEY);
    console.error('Critical dynamic chunk preload failure:', event);
  }
});

import { registerSW } from 'virtual:pwa-register';

// Register Service Worker in production only, with ?no-sw opt-out escape hatch
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  !window.location.search.includes('no-sw')
) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
