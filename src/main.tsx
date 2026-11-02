import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { initAnalytics } from './analytics'
import { groupOf, parse } from './ui/router'

// The readable portfolio and the 3D client are separate bundles; a reader never downloads three.js.
const app = groupOf(parse(window.location.pathname))
initAnalytics(app)
// two separate import() calls: inside one ternary, Vite's preload wrapper attaches the game's CSS to both
const loadSite = () => import('./site/Site')
const loadGame = () => import('./game')
const load: Promise<{ default: ComponentType }> = app === 'site' ? loadSite() : loadGame()
const root = createRoot(document.getElementById('root')!)
load.then(({ default: App }) => root.render(<StrictMode><App /></StrictMode>))
