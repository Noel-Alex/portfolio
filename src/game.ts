import { tileCanvas } from './engine/textures'
import './styles.css'

// The GUI's stone buttons wear the same painted stone tile as the world.
document.documentElement.style.setProperty('--tex-stone', `url(${tileCanvas('stone').toDataURL()})`)
document.documentElement.style.setProperty('--tex-dirt', `url(${tileCanvas('dirt').toDataURL()})`)
document.documentElement.classList.add('is-game')

export { default } from './App'
