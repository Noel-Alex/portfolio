import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { initAnalytics } from './analytics'
import { startBoot } from './ui/boot'
import { groupOf, parse } from './ui/router'

// The readable portfolio and the 3D client are separate bundles; a reader never downloads three.js.
const app = groupOf(parse(window.location.pathname))
initAnalytics(app)
if (app === 'game') startBoot()
// two separate import() calls: inside one ternary, Vite's preload wrapper attaches the game's CSS to both
const loadSite = () => import('./site/Site')
const loadGame = () => import('./game')
const load: Promise<{ default: ComponentType }> = app === 'site' ? loadSite() : loadGame()
const mount = document.getElementById('root')!
const root = createRoot(mount)
load.then(({ default: App }) => {
  root.render(<StrictMode><App /></StrictMode>)
  // the readable site fades in over its backdrop instead of popping in
  if (app === 'site') mount.classList.add('arrive')
})
