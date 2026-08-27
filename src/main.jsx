import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Auto-register service worker and immediately activate updates for all clients
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});

// Periodically check for updates every 60s while the app is active
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
