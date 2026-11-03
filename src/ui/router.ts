import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Route =
  // the front door and the readable portfolio
  | { screen: 'gate' }
  | { screen: 'home' }
  | { screen: 'project'; id: string }
  | { screen: 'resume' }
  // the 3D client
  | { screen: 'title' }
  | { screen: 'world'; book?: string; overlay?: 'servers' | 'work'; server?: string }
  | { screen: 'mods'; book?: string }
  | { screen: 'multiplayer'; server?: string }
  | { screen: 'work' }
  | { screen: 'options' }

/** Which app a route belongs to. Crossing between them is a full page load, so the 3D client never ships to readers. */
export const groupOf = (r: Route) => (r.screen === 'gate' || r.screen === 'home' || r.screen === 'project' || r.screen === 'resume' ? 'site' : 'game')

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function parse(pathname: string): Route {
  const path = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname).replace(/\/+$/, '')
  const [, head, sub, third] = path.split('/')
  switch (head) {
    case 'home': return { screen: 'home' }
    case 'projects': return sub ? { screen: 'project', id: sub } : { screen: 'home' }
    case 'resume': return { screen: 'resume' }
    case 'play': return { screen: 'title' }
    case 'world':
      if (sub === 'work') return { screen: 'world', overlay: 'work' }
      if (sub === 'servers') return { screen: 'world', overlay: 'servers', server: third || undefined }
      return { screen: 'world', book: sub || undefined }
    case 'mods': return { screen: 'mods', book: sub || undefined }
    case 'multiplayer': return { screen: 'multiplayer', server: sub || undefined }
    case 'work': return { screen: 'work' }
    case 'options': return { screen: 'options' }
    default: return { screen: 'gate' }
  }
}

export function href(route: Route) {
  switch (route.screen) {
    case 'home': return `${base}/home`
    case 'project': return `${base}/projects/${route.id}`
    case 'resume': return `${base}/resume`
    case 'title': return `${base}/play`
    case 'world':
      if (route.overlay === 'work') return `${base}/world/work`
      if (route.overlay === 'servers') return `${base}/world/servers${route.server ? `/${route.server}` : ''}`
      return `${base}/world${route.book ? `/${route.book}` : ''}`
    case 'mods': return `${base}/mods${route.book ? `/${route.book}` : ''}`
    case 'multiplayer': return `${base}/multiplayer${route.server ? `/${route.server}` : ''}`
    case 'work': return `${base}/work`
    case 'options': return `${base}/options`
    default: return `${base}/`
  }
}

const listeners = new Set<() => void>()

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches
type Vt = Document & { startViewTransition?: (update: () => void) => unknown }

/** Where the reader was on each history entry, so Back returns to the same spot on the index. */
const scrolls = new Map<string, number>()
const spot = () => `${window.history.state?.depth ?? 0}${window.location.pathname}`

/** Lets a bundle register what a route needs, so a click never waits on a lazy chunk mid-transition. */
let preloader: ((r: Route) => Promise<unknown> | undefined) | undefined
export function setPreloader(fn: typeof preloader) { preloader = fn }
export const prefetch = (r: Route) => { preloader?.(r)?.catch(() => {}) }

/**
 * Run a same-site route change inside a cross-fade (View Transitions API), committing React synchronously
 * so the browser snapshots the finished page. Falls back to an instant swap where unsupported.
 */
function swap(update: () => void, scroll: () => number) {
  const d = document as Vt
  const run = () => { update(); window.scrollTo(0, scroll()) }
  if (!d.startViewTransition || calm()) { run(); return }
  d.startViewTransition(() => flushSync(run))
}

/** Page loads between the site and the 3D client: fade to the destination's backdrop first so nothing flashes. */
function cover(url: string, to: 'site' | 'game') {
  if (calm()) { window.location.assign(url); return }
  const veil = document.createElement('div')
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  veil.setAttribute('aria-hidden', 'true')
  veil.style.cssText = `position:fixed;inset:0;z-index:99999;opacity:0;pointer-events:none;background:${to === 'game' ? '#2b1d12' : dark ? '#111214' : '#f3efe4'};transition:opacity 220ms cubic-bezier(0.4,0,0.2,1)`
  document.body.appendChild(veil)
  requestAnimationFrame(() => { veil.style.opacity = '1' })
  window.setTimeout(() => window.location.assign(url), 230)
}

export function navigate(route: Route, replace = false) {
  const url = href(route)
  if (url === window.location.pathname) return
  const to = groupOf(route)
  if (to !== groupOf(parse(window.location.pathname))) { cover(url, to); return }
  const go = () => {
    scrolls.set(spot(), window.scrollY)
    const depth = (window.history.state?.depth ?? 0) + (replace ? 0 : 1)
    if (replace) window.history.replaceState({ depth }, '', url)
    else window.history.pushState({ depth }, '', url)
    const notify = () => listeners.forEach(l => l())
    if (to === 'site') swap(notify, () => 0)
    else notify()
  }
  // the site's project pages are lazy chunks; wait briefly for the one we are heading to
  const ready = to === 'site' ? preloader?.(route) : undefined
  if (!ready) { go(); return }
  Promise.race([ready.catch(() => {}), new Promise(r => window.setTimeout(r, 700))]).then(go)
}

/** Return to the previous in-app screen, or to the fallback when the visitor landed here directly. */
export function goBack(fallback: Route = { screen: 'title' }) {
  if ((window.history.state?.depth ?? 0) > 0) window.history.back()
  else navigate(fallback, true)
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.pathname))
  useEffect(() => {
    const update = () => setRoute(parse(window.location.pathname))
    // Back and Forward cross-fade too, and land where the reader left off
    const pop = () => (groupOf(parse(window.location.pathname)) === 'site' ? swap(update, () => scrolls.get(spot()) ?? 0) : update())
    listeners.add(update)
    window.addEventListener('popstate', pop)
    return () => { listeners.delete(update); window.removeEventListener('popstate', pop) }
  }, [])
  return route
}

/** Fires on every in-app route change (analytics listens here). */
export function onRouteChange(cb: () => void) { listeners.add(cb); window.addEventListener('popstate', cb); return () => { listeners.delete(cb); window.removeEventListener('popstate', cb) } }
