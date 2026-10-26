import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { tileCanvas } from './engine/textures'
import './styles.css'

// The GUI's stone buttons wear the same painted stone tile as the world.
document.documentElement.style.setProperty('--tex-stone', `url(${tileCanvas('stone').toDataURL()})`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
