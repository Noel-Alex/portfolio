import { useEffect, useState } from 'react'

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

export function navigate(route: Route, replace = false) {
  const url = href(route)
  if (url === window.location.pathname) return
  if (groupOf(route) !== groupOf(parse(window.location.pathname))) { window.location.assign(url); return }
  const depth = (window.history.state?.depth ?? 0) + (replace ? 0 : 1)
  if (replace) window.history.replaceState({ depth }, '', url)
  else window.history.pushState({ depth }, '', url)
  listeners.forEach(l => l())
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
    listeners.add(update)
    window.addEventListener('popstate', update)
    return () => { listeners.delete(update); window.removeEventListener('popstate', update) }
  }, [])
  return route
}

/** Fires on every in-app route change (analytics listens here). */
export function onRouteChange(cb: () => void) { listeners.add(cb); window.addEventListener('popstate', cb); return () => { listeners.delete(cb); window.removeEventListener('popstate', cb) } }
