import { useEffect, useState } from 'react'

export type Route =
  | { screen: 'title' }
  | { screen: 'world'; book?: string }
  | { screen: 'mods'; book?: string }
  | { screen: 'multiplayer'; server?: string }
  | { screen: 'work' }
  | { screen: 'options' }

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function parse(pathname: string): Route {
  const path = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname).replace(/\/+$/, '')
  const [, head, sub] = path.split('/')
  switch (head) {
    case 'world': return { screen: 'world', book: sub || undefined }
    case 'mods': return { screen: 'mods', book: sub || undefined }
    case 'multiplayer': return { screen: 'multiplayer', server: sub || undefined }
    case 'work': return { screen: 'work' }
    case 'options': return { screen: 'options' }
    default: return { screen: 'title' }
  }
}

export function href(route: Route) {
  switch (route.screen) {
    case 'world': return `${base}/world${route.book ? `/${route.book}` : ''}`
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
  const depth = (window.history.state?.depth ?? 0) + (replace ? 0 : 1)
  if (replace) window.history.replaceState({ depth }, '', url)
  else window.history.pushState({ depth }, '', url)
  listeners.forEach(l => l())
}

/** Return to the previous in-app screen, or to the title when the visitor landed here directly. */
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
