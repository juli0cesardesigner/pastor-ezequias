import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './utils/pwaService'

// Registra o Service Worker do PWA da Agenda apenas em produção
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  registerServiceWorker();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
