import { useSyncExternalStore } from 'react'
import { achievements, type AchievementId } from '../content'

export type Settings = {
  music: boolean
  sound: boolean
  quality: 'fancy' | 'fast'
  cycle: boolean
  motion: 'system' | 'reduced' | 'full'
}

type Toast = { key: number; id: AchievementId }

type State = {
  settings: Settings
  earned: AchievementId[]
  toasts: Toast[]
  visited: string[]
}

const KEY = 'noel-world-v5'
const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

function load(): State {
  const base: State = {
    settings: { music: false, sound: true, quality: coarse ? 'fast' : 'fancy', cycle: true, motion: 'system' },
    earned: [],
    toasts: [],
    visited: [],
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<State>
    return { ...base, settings: { ...base.settings, ...saved.settings }, earned: saved.earned ?? [], visited: saved.visited ?? [] }
  } catch {
    return base
  }
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify({ settings: state.settings, earned: state.earned, visited: state.visited })) } catch { /* private mode */ }
  listeners.forEach(l => l())
}

export const store = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  setSettings(patch: Partial<Settings>) { commit({ ...state, settings: { ...state.settings, ...patch } }) },
  earn(id: AchievementId) {
    if (state.earned.includes(id)) return false
    const key = Date.now() + Math.random()
    commit({ ...state, earned: [...state.earned, id], toasts: [...state.toasts, { key, id }] })
    window.setTimeout(() => commit({ ...state, toasts: state.toasts.filter(t => t.key !== key) }), 5200)
    return true
  },
  visit(place: string) {
    if (state.visited.includes(place)) return state.visited.length
    commit({ ...state, visited: [...state.visited, place] })
    return state.visited.length
  },
  reset() { commit({ ...state, earned: [], visited: [], toasts: [] }) },
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(state), () => select(state))
}

export const totalAchievements = achievements.length

export function prefersReduced(settings: Settings) {
  if (settings.motion === 'reduced') return true
  if (settings.motion === 'full') return false
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
