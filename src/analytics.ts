import type { PostHog } from 'posthog-js'
import { onRouteChange } from './ui/router'

/**
 * PostHog, loaded after the page is idle so it never delays first paint.
 * In local dev every call is a no-op.
 * Application links carry ?ref=<company>&role=<role>; the first ref a browser
 * arrives with is kept, so later visits from that recruiter stay attributed.
 */
// A project key is public by design (it can only send events). Local dev stays quiet unless VITE_POSTHOG_DEV is set.
// Builds served from this machine (vite preview, the résumé printer) stay quiet too, and so does
// any browser that once opened the site with ?notrack (use it on your own devices; ?track undoes it).
const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
const optedOut = (() => {
  const q = new URLSearchParams(window.location.search)
  try {
    if (q.has('notrack')) localStorage.setItem('noel-notrack', '1')
    if (q.has('track')) localStorage.removeItem('noel-notrack')
    return localStorage.getItem('noel-notrack') === '1'
  } catch { return q.has('notrack') }
})()
const KEY = optedOut ? undefined : (import.meta.env.VITE_POSTHOG_KEY as string | undefined) || ((import.meta.env.PROD && !local) || import.meta.env.VITE_POSTHOG_DEV ? 'phc_ohrVH7HZ4i5VahUmm5wATzNeCB6wvvHbej5WWbzztPJT' : undefined)
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'
const REF_KEY = 'noel-ref'

type Props = Record<string, string | number | boolean | undefined>
let ph: PostHog | null = null
const queue: [string, Props | undefined][] = []

export type Referral = { ref: string; role?: string; at: string }

function readReferral(): Referral | null {
  const q = new URLSearchParams(window.location.search)
  const ref = (q.get('ref') || q.get('utm_source') || '').trim().toLowerCase().slice(0, 60)
  const role = (q.get('role') || q.get('utm_campaign') || '').trim().toLowerCase().slice(0, 60) || undefined
  let stored: Referral | null = null
  try { stored = JSON.parse(localStorage.getItem(REF_KEY) || 'null') } catch { /* storage blocked */ }
  if (ref) {
    const fresh = { ref, role, at: new Date().toISOString() }
    try { localStorage.setItem(REF_KEY, JSON.stringify(fresh)) } catch { /* storage blocked */ }
    // keep shared URLs clean so a forwarded link doesn't inherit someone else's ref
    for (const k of ['ref', 'role', 'utm_source', 'utm_campaign', 'utm_medium']) q.delete(k)
    const rest = q.toString()
    window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
    return fresh
  }
  return stored
}

export const referral = readReferral()

export function initAnalytics(app: 'site' | 'game') {
  if (!KEY) return
  const start = () => import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'always',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      enable_heatmaps: true,
      session_recording: { maskAllInputs: true },
    })
    posthog.register({ app, ref: referral?.ref, role: referral?.role, viewport: `${window.innerWidth}x${window.innerHeight}` })
    if (referral) posthog.setPersonProperties({ ref: referral.ref, role: referral.role }, { first_ref: referral.ref, first_role: referral.role })
    ph = posthog
    const pageview = () => posthog.capture('$pageview')
    pageview()
    onRouteChange(pageview)
    for (const [e, p] of queue.splice(0)) posthog.capture(e, p)
  }).catch(() => { /* blocked by an extension: fine */ })
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 })
  else setTimeout(start, 1200)
}

/** Record something a visitor did. Safe to call before PostHog has loaded. */
export function track(event: string, props?: Props) {
  if (!KEY) return
  if (ph) ph.capture(event, props)
  else if (queue.length < 50) queue.push([event, props])
}
