// UBICACION: src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './fonts.css'
import './i18n'
import './index.css'
import App from './App'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontro el elemento #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
