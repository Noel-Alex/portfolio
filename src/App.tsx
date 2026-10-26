import { useCallback, useEffect, useRef, useState } from 'react'
import type { Engine, PickId } from './engine/Engine'
import type { LandmarkId } from './engine/world'
import { hotbar, landmarkBook, landmarkName, projectById } from './content'
import { tileCanvas } from './engine/textures'
import { Advancements } from './ui/Advancements'
import { Book } from './ui/Book'
import { Toasts } from './ui/gui'
import { ChatInput, ChatLog, DebugOverlay, Hotbar, MobileControls, PauseMenu, Status, Tutorial, WorldLabels, type ChatApi } from './ui/Hud'
import { useChatLog } from './ui/chatLog'
import { Inventory } from './ui/Inventory'
import { ModsScreen } from './ui/ModsScreen'
import { goBack, navigate, useRoute } from './ui/router'
import { OptionsScreen, ServersScreen, WorkScreen } from './ui/Screens'
import { sfx } from './ui/sound'
import { prefersReduced, store, useStore } from './ui/store'
import { TitleScreen } from './ui/TitleScreen'

type Panel = null | 'pause' | 'inventory' | 'advancements' | 'options' | 'chat'
type Status = 'loading' | 'ready' | 'failed'

const PLACES: LandmarkId[] = ['stretchy', 'arachne', 'helix', 'sivana', 'polysafe', 'aster', 'petra', 'kargo', 'ultrachat', 'gdg', 'portal']
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

function useReducedMotion() {
  const motion = useStore(s => s.settings.motion)
  const [system, setSystem] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setSystem(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return motion === 'system' ? system : prefersReduced(store.get().settings)
}

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

export default function App() {
  const route = useRoute()
  const settings = useStore(s => s.settings)
  const reduced = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const [engine, setEngine] = useState<Engine | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [panel, setPanel] = useState<Panel>(null)
  const [chatSeed, setChatSeed] = useState('')
  const [at, setAt] = useState<LandmarkId | null>(null)
  const [hovered, setHovered] = useState<PickId | null>(null)
  const [hearts, setHearts] = useState(10)
  const [debug, setDebug] = useState(false)
  const [moved, setMoved] = useState(false)
  const [announce, setAnnounce] = useState('')
  const { lines, say } = useChatLog()
  const openOnArrive = useRef(false)
  const inWorld = route.screen === 'world'
  const book = route.screen === 'world' || route.screen === 'mods' ? route.book : undefined

  // ------------------------------------------------------------ engine boot
  useEffect(() => {
    if (!hasWebGL()) { setStatus('failed'); return }
    let disposed = false
    let made: Engine | null = null
    const canvas = document.createElement('canvas')
    canvas.className = 'world-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    host.current?.appendChild(canvas)
    import('./engine/Engine').then(({ Engine }) => {
      if (disposed) return
      const s = store.get().settings
      made = new Engine(canvas, { reduced: prefersReduced(s), quality: s.quality })
      setEngine(made)
      setStatus('ready')
    }).catch(() => { if (!disposed) setStatus('failed') })
    return () => { disposed = true; made?.dispose(); canvas.remove() }
  }, [])

  useEffect(() => { engine?.setReduced(reduced); document.documentElement.dataset.motion = reduced ? 'reduced' : 'full' }, [engine, reduced])
  useEffect(() => { engine?.setQuality(settings.quality) }, [engine, settings.quality])
  useEffect(() => { engine?.setCycle(settings.cycle) }, [engine, settings.cycle])

  // ------------------------------------------------------------ route → world
  useEffect(() => {
    if (!engine) return
    if (inWorld && book) {
      const lm = projectById(book)?.landmark ?? (book === 'noel' ? 'spawn' : undefined)
      if (lm && engine.debug().at !== lm && engine.mode === 'title') engine.teleport(lm)
    }
    engine.setMode(inWorld ? 'world' : 'title')
  }, [engine, inWorld, book])

  const joined = useRef(false)
  useEffect(() => {
    if (!inWorld) { setPanel(null); joined.current = false; return }
    store.earn('world')
    if (!joined.current) say(<span className="chat-yellow">Noel Alex joined the game</span>)
    joined.current = true
  }, [inWorld, say])

  useEffect(() => { if (engine) engine.keyboardEnabled = inWorld && !book && !panel }, [engine, inWorld, book, panel])

  const travel = useCallback((id: LandmarkId) => {
    if (!engine) return
    openOnArrive.current = true
    setMoved(true)
    engine.travelTo(id)
  }, [engine])

  // ------------------------------------------------------------ engine events
  useEffect(() => {
    if (!engine) return
    return engine.on({
      hover: setHovered,
      select: id => {
        sfx.click()
        if (id === 'player') navigate({ screen: 'world', book: 'noel' })
        else travel(id)
      },
      depart: () => setAt(null),
      arrive: id => {
        setAt(id)
        setAnnounce(`Arrived at ${landmarkName[id]}`)
        if (id === 'arachne') store.earn('maze')
        if (id === 'sivana') store.earn('music')
        if (PLACES.includes(id)) {
          store.visit(id)
          if (PLACES.every(p => store.get().visited.includes(p))) store.earn('explorer')
        }
        if (!openOnArrive.current || engine.mode !== 'world') return
        openOnArrive.current = false
        if (id === 'gdg') navigate({ screen: 'multiplayer', server: 'gdg' })
        else if (id === 'portal') navigate({ screen: 'work' })
        else { const b = landmarkBook[id]; if (b) navigate({ screen: 'world', book: b }) }
      },
      event: name => {
        if (name === 'walk' || name === 'jump') setMoved(true)
        if (name === 'creeper') {
          sfx.boom()
          store.earn('creeper')
          setHearts(3)
          say(<>Noel Alex survived a Creeper. Barely.</>)
        }
        if (name === 'void') {
          store.earn('void')
          setHearts(0)
          say(<>Noel Alex fell out of the world</>)
        }
      },
    })
  }, [engine, travel, say])

  useEffect(() => {
    if (hearts >= 10) return
    const t = window.setTimeout(() => setHearts(h => Math.min(10, h + 1)), hearts === 0 ? 900 : 500)
    return () => window.clearTimeout(t)
  }, [hearts])

  // ------------------------------------------------------------ keyboard
  useEffect(() => {
    if (!inWorld || book) return
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (e.key === 'F3') { e.preventDefault(); setDebug(d => !d); return }
      if (panel === 'chat') return
      if (e.key === 'Escape') { e.preventDefault(); setPanel(p => (p === 'options' ? 'pause' : p ? null : 'pause')); return }
      if (panel) return
      const k = e.key.toLowerCase()
      if (k === 'e') { e.preventDefault(); setPanel('inventory') }
      else if (k === 'l') { e.preventDefault(); setPanel('advancements') }
      else if (k === 't' || k === '/') { e.preventDefault(); setChatSeed(k === '/' ? '/' : ''); setPanel('chat') }
      else if (/^[1-9]$/.test(k)) travel(hotbar[Number(k) - 1].landmark)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [inWorld, book, panel, travel])

  // ------------------------------------------------------------ music
  const music = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const a = music.current
    if (!a) return
    a.volume = 0.3
    if (!settings.music) { a.pause(); return }
    const tryPlay = () => { a.play().catch(() => { /* waits for a gesture */ }) }
    tryPlay()
    window.addEventListener('pointerdown', tryPlay, { once: true })
    return () => window.removeEventListener('pointerdown', tryPlay)
  }, [settings.music])

  const openBook = useCallback((id: string) => { setPanel(null); navigate({ screen: 'world', book: id }) }, [])
  const closeBook = useCallback(() => navigate({ screen: route.screen === 'mods' ? 'mods' : 'world' }), [route.screen])
  const peek = useCallback((id: LandmarkId | null) => engine?.peek(id), [engine])
  const toTitle = useCallback(() => goBack({ screen: 'title' }), [])

  const api: ChatApi | null = engine ? { engine, openBook, travel, setPanel } : null
  const backdrop = route.screen === 'world' ? '' : route.screen === 'title' ? 'is-title' : route.screen === 'mods' && !book ? 'is-peek' : 'is-menu'

  return (
    <div className={`app app--${route.screen}`}>
      <div ref={host} className={`world-layer ${backdrop} ${status === 'failed' ? 'is-failed' : ''}`} style={status === 'failed' ? { backgroundImage: `url(${tileCanvas('dirt').toDataURL()})` } : undefined} />

      {route.screen === 'title' && <TitleScreen reduced={reduced} status={status} />}
      {route.screen === 'mods' && <ModsScreen onPeek={peek} />}
      {route.screen === 'multiplayer' && <ServersScreen server={route.server} back={toTitle} />}
      {route.screen === 'work' && <WorkScreen back={toTitle} />}
      {route.screen === 'options' && <OptionsScreen back={toTitle} time={engine?.getTime() ?? 0} setTime={t => engine?.setTime(t)} />}

      {inWorld && (
        <main id="main-content" className="hud" aria-label="World">
          <h1 className="sr-only">Noel Alex’s world</h1>
          <p className="sr-only" aria-live="polite">{announce}</p>
          {engine && <WorldLabels engine={engine} hovered={hovered} />}
          {engine && debug && <DebugOverlay engine={engine} />}
          {!panel && !book && <Tutorial done={moved} />}
          <ChatLog lines={lines} open={panel === 'chat'} />
          {panel === 'chat' && api && <ChatInput initial={chatSeed} api={api} say={say} onClose={() => setPanel(null)} />}
          {!panel && <MobileControls onPause={() => setPanel('pause')} onChat={() => { setChatSeed(''); setPanel('chat') }} />}
          <div className="hud-bottom">
            <Status hearts={hearts} />
            <Hotbar at={at} onPick={travel} />
          </div>
          {panel === 'pause' && <PauseMenu onResume={() => setPanel(null)} onPanel={setPanel} />}
          {panel === 'inventory' && <Inventory onClose={() => setPanel(null)} openBook={openBook} reduced={reduced} />}
          {panel === 'advancements' && <Advancements onClose={() => setPanel(null)} openBook={openBook} />}
          {panel === 'options' && <OptionsScreen back={() => setPanel('pause')} time={engine?.getTime() ?? 0} setTime={t => engine?.setTime(t)} />}
        </main>
      )}

      {book && (book === 'noel' || projectById(book)) && <Book id={book} onClose={closeBook} reduced={reduced} />}

      <Toasts />
      <audio ref={music} src={asset('into-the-caves.mp3')} loop preload="none" />
    </div>
  )
}
