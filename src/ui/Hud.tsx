import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type WheelEvent } from 'react'
import type { Engine, PickId } from '../engine/Engine'
import type { LandmarkId } from '../engine/world'
import { hotbar, landmarkName, links, projectById, landmarkBook } from '../content'
import { BlockIcon, McButton, PixelIcon } from './gui'
import { navigate } from './router'
import type { Line } from './chatLog'
import { sfx } from './sound'
import { store, totalAchievements, useStore } from './store'

// ------------------------------------------------------------------ hotbar
export function Hotbar({ at, onPick }: { at: LandmarkId | null; onPick: (id: LandmarkId) => void }) {
  const selected = hotbar.findIndex(h => h.landmark === at)
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => {
    if (selected < 0) return
    setShown(hotbar[selected].label)
    const t = window.setTimeout(() => setShown(null), 2400)
    return () => window.clearTimeout(t)
  }, [selected])
  const wheel = (e: WheelEvent) => {
    const from = selected < 0 ? 0 : selected
    onPick(hotbar[(from + (e.deltaY > 0 ? 1 : -1) + 9) % 9].landmark)
  }
  return (
    <div className="hotbar-wrap">
      <p className={`held-name ${shown ? 'is-on' : ''}`} aria-hidden="true">{shown}</p>
      <ol className="hotbar" aria-label="Builds" onWheel={wheel}>
        {hotbar.map((h, i) => (
          <li key={h.landmark}>
            <button type="button" className={`slot ${i === selected ? 'is-selected' : ''}`} onClick={() => onPick(h.landmark)} aria-label={`${i + 1}: ${h.label}`} aria-current={i === selected}>
              <BlockIcon icon={h.icon} size={32} />
              <span className="slot-key" aria-hidden="true">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Status({ hearts }: { hearts: number }) {
  const earned = useStore(s => s.earned.length)
  return (
    <div className="status" aria-label={`${earned} of ${totalAchievements} advancements`}>
      <div className="hearts" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <span key={i} className={`heart ${i < hearts ? '' : 'is-empty'}`}><PixelIcon name={i < hearts ? 'heart' : 'heartEmpty'} size={16} /></span>)}
      </div>
      <div className="xp" aria-hidden="true">
        <i style={{ width: `${(earned / totalAchievements) * 100}%` }} />
        {earned > 0 && <b>{earned}</b>}
      </div>
    </div>
  )
}

// ------------------------------------------------------- world-attached labels
export function WorldLabels({ engine, hovered }: { engine: Engine; hovered: PickId | null }) {
  const tag = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const out = { x: 0, y: 0, visible: false }
    return engine.onFrame(() => {
      const el = tag.current
      if (!el) return
      engine.screenPos('player', out)
      el.style.transform = `translate(${out.x}px, ${out.y}px) translate(-50%, -100%)`
      el.style.opacity = out.visible ? '1' : '0'
    })
  }, [engine])
  useEffect(() => {
    const move = (e: PointerEvent) => { if (tip.current) tip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY - 28}px)` }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  const book = hovered && hovered !== 'player' ? landmarkBook[hovered] : undefined
  const project = book ? projectById(book) : undefined
  return (
    <>
      <div ref={tag} className="nametag" aria-hidden="true">Noel Alex</div>
      <div ref={tip} className={`world-tip tip ${hovered ? 'is-on' : ''}`} aria-hidden="true">
        {hovered === 'player' ? <><strong>Noel Alex</strong><span>Click to open my player book</span></>
          : hovered ? <><strong>{landmarkName[hovered]}</strong>{project && <span>{project.summary}</span>}</> : null}
      </div>
    </>
  )
}

export function DebugOverlay({ engine }: { engine: Engine }) {
  const [d, setD] = useState(() => engine.debug())
  useEffect(() => { const t = window.setInterval(() => setD(engine.debug()), 250); return () => window.clearInterval(t) }, [engine])
  const hhmm = Math.floor(((d.time * 24 + 6) % 24) * 1000)
  return (
    <div className="f3" aria-hidden="true">
      <p>Noel Alex 1.0 (vanilla+create+ae2+twilight)</p>
      <p>{d.fps} fps · three.js r180</p>
      <p>XYZ: {d.x.toFixed(3)} / {d.y.toFixed(3)} / {d.z.toFixed(3)}</p>
      <p>Facing: {d.facing}</p>
      <p>Near: {d.at ? landmarkName[d.at] : 'wilderness'}</p>
      <p>Day time: {hhmm}</p>
      <p>Biome: floating_island</p>
    </div>
  )
}

// -------------------------------------------------------------------- chat

export type ChatApi = {
  engine: Engine
  openBook: (id: string) => void
  travel: (id: LandmarkId) => void
  setPanel: (p: 'inventory' | 'advancements') => void
}

const PLACES = Object.keys(landmarkName) as LandmarkId[]
const COMMANDS = ['/help', '/tp', '/time set', '/weather', '/summon creeper', '/give', '/seed', '/contact', '/resume', '/kill', '/gamemode', '/mods', '/advancements']

const Ext = ({ href: h, children }: { href: string; children: ReactNode }) => <a className="chat-link" href={h} target="_blank" rel="noreferrer">{children}</a>

function runCommand(raw: string, api: ChatApi, say: (n: ReactNode) => void) {
  const [cmd, ...args] = raw.trim().slice(1).split(/\s+/)
  const err = (m: string) => say(<span className="chat-err">{m}</span>)
  store.earn('command')
  switch (cmd?.toLowerCase()) {
    case 'help':
    case '?':
      say(<>Commands: {COMMANDS.join(', ')}</>)
      break
    case 'tp':
    case 'teleport': {
      const q = (args[args.length - 1] ?? '').toLowerCase()
      const id = PLACES.find(p => p === q || landmarkName[p].toLowerCase().startsWith(q))
      if (!q || !id) { err(`Unknown place. Try: ${PLACES.join(', ')}`); break }
      api.engine.teleport(id)
      say(<>Teleported Noel Alex to {landmarkName[id]}</>)
      break
    }
    case 'time': {
      const v = (args[1] ?? args[0] ?? '').toLowerCase()
      const named: Record<string, number> = { day: 0.04, sunrise: 0.0, noon: 0.25, sunset: 0.48, dusk: 0.5, night: 0.6, midnight: 0.75 }
      const n = named[v] ?? (/^\d+$/.test(v) ? Number(v) / 24000 : NaN)
      if (Number.isNaN(n)) { err('Usage: /time set <day|noon|sunset|night|midnight|0-24000>'); break }
      api.engine.setTime(n)
      say(<>Set the time to {v}</>)
      break
    }
    case 'weather': {
      const v = args[0]?.toLowerCase()
      if (v === 'rain' || v === 'thunder') { api.engine.setWeather('rain'); say(<>Changing to rain</>) }
      else if (v === 'clear') { api.engine.setWeather('clear'); say(<>Changing to clear weather</>) }
      else err('Usage: /weather <clear|rain>')
      break
    }
    case 'summon':
      if (args[0]?.replace('minecraft:', '') === 'creeper') { api.engine.summonCreeper(); say(<>Summoned new Creeper. Behind you.</>) }
      else err('Only creepers answer the summons here.')
      break
    case 'give':
      say(<>Gave [Guidebook] × 1 to Noel Alex</>)
      api.openBook('noel')
      break
    case 'seed':
      say(<>Seed: [<span className="chat-green">2027</span>]</>)
      break
    case 'contact':
    case 'msg':
    case 'tell':
      say(<>Email <Ext href={links.email}>{links.emailText}</Ext> · <Ext href={links.linkedin}>LinkedIn</Ext> · <Ext href={links.github}>GitHub</Ext></>)
      store.earn('diamonds')
      break
    case 'resume':
      say(<>Opening <Ext href={links.resume}>Noel-Alex-Resume.pdf</Ext></>)
      window.open(links.resume, '_blank', 'noopener')
      break
    case 'kill':
      say(<>Noel Alex fell out of the world</>)
      api.engine.teleport('spawn')
      break
    case 'gamemode':
      err('This world is locked to Adventure mode. No breaking the builds.')
      break
    case 'mods':
      navigate({ screen: 'mods' })
      break
    case 'advancements':
      api.setPanel('advancements')
      break
    default:
      err(`Unknown command “${cmd ?? ''}”. Type /help for a list.`)
  }
}

export function ChatInput({ initial, onClose, api, say }: { initial: string; onClose: () => void; api: ChatApi; say: (n: ReactNode) => void }) {
  const [value, setValue] = useState(initial)
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const key = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const v = value.trim()
      if (v) {
        history.current.unshift(v)
        if (v.startsWith('/')) runCommand(v, api, say)
        else say(<>&lt;Visitor&gt; {v}</>)
      }
      onClose()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (value.startsWith('/tp ')) {
        const q = value.slice(4).toLowerCase()
        const hit = PLACES.find(p => p.startsWith(q))
        if (hit) setValue(`/tp ${hit}`)
      } else {
        const hit = COMMANDS.find(c => c.startsWith(value))
        if (hit) setValue(`${hit} `)
      }
    } else if (e.key === 'ArrowUp' && history.current.length) {
      e.preventDefault()
      cursor.current = Math.min(cursor.current + 1, history.current.length - 1)
      setValue(history.current[cursor.current])
    }
  }
  const hint = value.startsWith('/') ? COMMANDS.filter(c => c.startsWith(value.split(' ')[0]) && c !== value.trim()).slice(0, 5) : []
  return (
    <div className="chat-input">
      {hint.length > 0 && <ul className="chat-hint">{hint.map(h => <li key={h}>{h}</li>)}</ul>}
      <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={key} aria-label="Chat" maxLength={120} spellCheck={false} autoComplete="off" />
    </div>
  )
}

export function ChatLog({ lines, open }: { lines: Line[]; open: boolean }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = window.setInterval(() => tick(n => n + 1), 1000); return () => window.clearInterval(t) }, [])
  const now = Date.now()
  const shown = open ? lines.slice(-12) : lines.filter(l => now - l.at < 9000).slice(-6)
  return (
    <ul className={`chat-log ${open ? 'is-open' : ''}`} aria-live="polite">
      {shown.map(l => <li key={l.id} className={!open && now - l.at > 7500 ? 'is-fading' : ''}>{l.node}</li>)}
    </ul>
  )
}

// ------------------------------------------------------------------- pause
export function PauseMenu({ onResume, onPanel }: { onResume: () => void; onPanel: (p: 'inventory' | 'advancements' | 'options') => void }) {
  return (
    <div className="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title" className="screen-title">Game Menu</h2>
      <div className="pause-grid">
        <McButton size="full" onClick={onResume} autoFocus>Back to Game</McButton>
        <McButton size="half" onClick={() => onPanel('advancements')}>Advancements</McButton>
        <McButton size="half" onClick={() => onPanel('inventory')}>Inventory</McButton>
        <McButton size="half" onClick={() => navigate({ screen: 'multiplayer' })}>Multiplayer</McButton>
        <McButton size="half" onClick={() => navigate({ screen: 'work' })}>Open to Work</McButton>
        <McButton size="half" onClick={() => navigate({ screen: 'world', book: 'noel' })}>Player Book</McButton>
        <McButton size="half" onClick={() => onPanel('options')}>Options…</McButton>
        <McButton size="full" onClick={() => navigate({ screen: 'title' })}>Save and Quit to Title</McButton>
      </div>
    </div>
  )
}

export function Tutorial({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false)
  useEffect(() => { if (done) { const t = window.setTimeout(() => setGone(true), 400); return () => window.clearTimeout(t) } }, [done])
  const touch = matchMedia('(pointer: coarse)').matches
  if (gone) return null
  return (
    <div className={`tutorial ${done ? 'is-done' : ''}`} role="status">
      {!touch && <span className="keys" aria-hidden="true"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>}
      <span><strong>Explore the island</strong><span>{touch ? 'Tap a build to walk there' : 'Click a build to walk there'}</span></span>
    </div>
  )
}

export function MobileControls({ onPause, onChat }: { onPause: () => void; onChat: () => void }) {
  return (
    <div className="mobile-controls">
      <button type="button" className="mc-btn mc-btn--icon" onClick={() => { sfx.click(); onChat() }} aria-label="Open chat"><PixelIcon name="chat" size={18} /></button>
      <button type="button" className="mc-btn mc-btn--icon" onClick={() => { sfx.click(); onPause() }} aria-label="Pause menu"><PixelIcon name="pause" size={18} /></button>
    </div>
  )
}
