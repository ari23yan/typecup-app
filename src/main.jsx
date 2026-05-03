import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/orbitron/700.css'
import App from './App.jsx'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
