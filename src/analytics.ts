import type { PostHog } from 'posthog-js'

/**
 * PostHog, loaded after the page is idle so it never delays first paint.
 * In local dev every call is a no-op.
 * Application links carry ?ref=<company>&role=<role>; the latest ref is a super property on every event,
 * the first one is kept on the person (first_ref), and the landing session also gets utm_* so
 * PostHog's channel and campaign reports see it. The params are stripped from the address bar so a
 * forwarded link doesn't inherit someone else's ref.
 * Event names and their properties are listed in `Events` below; docs/analytics.md explains how to use them.
 */
// A project key is public by design (it can only send events). Local dev stays quiet unless VITE_POSTHOG_DEV is set.
// Builds served from this machine (vite preview, the résumé printer) stay quiet too.
// A browser that once opened the site with ?notrack is still recorded but flagged as an internal user, so it
// drops out of every "filter test accounts" view (use it on your own devices; ?track undoes it).
const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
const internal = (() => {
  const q = new URLSearchParams(window.location.search)
  try {
    if (q.has('notrack')) localStorage.setItem('noel-notrack', '1')
    if (q.has('track')) localStorage.removeItem('noel-notrack')
    return localStorage.getItem('noel-notrack') === '1'
  } catch { return q.has('notrack') }
})()
const KEY = (import.meta.env.VITE_POSTHOG_KEY as string | undefined) || ((import.meta.env.PROD && !local) || import.meta.env.VITE_POSTHOG_DEV ? 'phc_ohrVH7HZ4i5VahUmm5wATzNeCB6wvvHbej5WWbzztPJT' : undefined)
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'
const BUILD = (import.meta.env.VITE_BUILD as string | undefined)?.slice(0, 7) || 'dev'
const REF_KEY = 'noel-ref'

type Value = string | number | boolean | undefined
type Props = Record<string, Value>

/** Every custom event and its properties. Keep docs/analytics.md and the PostHog event definitions in step. */
export type Events = {
  gate_choice: { to: 'portfolio' | 'world' }
  project_click: { id: string; from: string }
  project_link: { id: string; label: string }
  world_link: { from: string; id?: string }
  email_click: { from: string }
  email_copy: { from: string }
  resume_download: { from: string }
  section_view: { section: string }
  demo: { id: string } & Props
  world_ready: { ms: number; ok: boolean; reason?: 'no_webgl' | 'load_error'; quality: string }
  world_enter: Props
  book_open: { book: string }
  travel: { to: string }
  landmark_arrive: { id: string }
  advancement: { id: string; total: number }
  panel_open: { panel: string }
  view_change: { view: string }
  setting_change: { key: string; value: Value }
  command: { cmd: string }
  server_join: { server: string }
}
type Name = keyof Events

let ph: PostHog | null = null
const queue: [Name, Props | undefined, Date][] = []

export type Referral = { ref: string; role?: string; at: string }

const landing = new URLSearchParams(window.location.search)
const CAMPAIGN = ['ref', 'role', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

function readReferral(): Referral | null {
  const ref = (landing.get('ref') || landing.get('utm_source') || '').trim().toLowerCase().slice(0, 60)
  const role = (landing.get('role') || landing.get('utm_campaign') || '').trim().toLowerCase().slice(0, 60) || undefined
  let stored: Referral | null = null
  try { stored = JSON.parse(localStorage.getItem(REF_KEY) || 'null') } catch { /* storage blocked */ }
  if (ref) {
    const fresh = { ref, role, at: new Date().toISOString() }
    try { localStorage.setItem(REF_KEY, JSON.stringify(fresh)) } catch { /* storage blocked */ }
    const q = new URLSearchParams(landing)
    for (const k of CAMPAIGN) q.delete(k)
    const rest = q.toString()
    window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
    return fresh
  }
  return stored
}

export const referral = readReferral()

/** Campaign properties for the landing session, rebuilt from the URL as it arrived (PostHog loads after it is cleaned). */
function landingCampaign(): Props {
  const get = (k: string) => landing.get(k)?.trim().toLowerCase().slice(0, 100) || undefined
  const ref = get('ref')
  const out: Props = {
    utm_source: get('utm_source') ?? ref,
    utm_medium: get('utm_medium') ?? (ref ? (ref.startsWith('resume-') ? 'resume' : 'application') : undefined),
    utm_campaign: get('utm_campaign') ?? get('role'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined))
}

/** Stable facts about the visitor's device that explain how the site performed for them. */
function context(app: 'site' | 'game'): Props {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
  const mq = (q: string) => matchMedia(q).matches
  return {
    app,
    build: BUILD,
    ref: referral?.ref,
    role: referral?.role,
    color_scheme: mq('(prefers-color-scheme: dark)') ? 'dark' : 'light',
    reduced_motion: mq('(prefers-reduced-motion: reduce)'),
    pointer: mq('(pointer: coarse)') ? 'coarse' : 'fine',
    cpu_cores: nav.hardwareConcurrency,
    memory_gb: nav.deviceMemory,
    connection: nav.connection?.effectiveType,
  }
}

const loadedAt = new Date(performance.timeOrigin)

export function initAnalytics(app: 'site' | 'game') {
  if (!KEY) return
  const start = () => import('posthog-js').then(({ default: posthog }) => {
    let firstView = true
    posthog.init(KEY, {
      api_host: HOST,
      // snapshot of current SDK defaults: pageviews and page leaves on every in-app route change, scroll depth, etc.
      defaults: '2026-08-30',
      person_profiles: 'always',
      autocapture: { capture_copied_text: true },
      capture_heatmaps: true,
      capture_dead_clicks: true,
      capture_exceptions: true,
      session_recording: { maskAllInputs: true },
      // the SDK loads after the page is idle; date the first pageview to when the page actually started loading,
      // so it stays ahead of anything the visitor did in the meantime
      before_send: e => {
        if (e && firstView && e.event === '$pageview') { firstView = false; e.timestamp = loadedAt }
        return e
      },
      loaded: p => {
        p.register(context(app))
        const campaign = landingCampaign()
        if (Object.keys(campaign).length) p.register_for_session(campaign)
        if (referral) p.setPersonProperties({ ref: referral.ref, role: referral.role }, { first_ref: referral.ref, first_role: referral.role })
        if (internal) { p.register({ internal: true }); p.setInternalOrTestUser() }
      },
    })
    ph = posthog
    for (const [e, p, at] of queue.splice(0)) posthog.capture(e, p, { timestamp: at })
  }).catch(() => { /* blocked by an extension: fine */ })
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 })
  else setTimeout(start, 1200)
}

/** Record something a visitor did. Safe to call before PostHog has loaded; queued events keep their real time. */
export function track<N extends Name>(event: N, ...[props]: Record<never, never> extends Events[N] ? [Events[N]?] : [Events[N]]) {
  if (!KEY) return
  if (ph) ph.capture(event, props)
  else if (queue.length < 50) queue.push([event, props, new Date()])
}
