import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { links, player, projectById, type Project } from '../content'
import { paintSkin } from '../engine/skin'
import { DemoView } from './demos'
import { BlockIcon, McButton, PixelIcon } from './gui'
import { sfx } from './sound'
import { store } from './store'

type Page = { key: string; mark?: string; node: ReactNode }

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

function Face({ size = 64 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const skin = paintSkin()
    const ctx = c.getContext('2d')!
    c.width = 8; c.height = 8
    ctx.drawImage(skin, 8, 8, 8, 8, 0, 0, 8, 8)
  }, [])
  return <canvas ref={ref} className="face" style={{ width: size, height: size }} role="img" aria-label="Noel's player head" />
}

function projectPages(p: Project, reduced: boolean): Page[] {
  const pages: Page[] = [{
    key: 'cover', mark: 'Overview',
    node: (
      <>
        <div className="page-cover">
          <BlockIcon icon={p.icon} size={72} />
          <h2>{p.name}</h2>
          <p className="page-meta">{p.credit} · {p.year}{p.sealed && <PixelIcon name="lock" size={12} title="Source private" />}</p>
        </div>
        <hr className="page-rule" />
        <p className="page-lede">{p.lede}</p>
      </>
    ),
  }]
  if (p.stats.length) pages.push({
    key: 'stats', mark: 'Numbers',
    node: (
      <>
        <h3>By the numbers</h3>
        <ul className="page-stats">{p.stats.map(s => <li key={s.value}><strong>{s.value}</strong><span>{s.label}</span></li>)}</ul>
      </>
    ),
  })
  pages.push({
    key: 'story', mark: 'Story',
    node: (
      <>
        <h3>The story</h3>
        {p.body.map(b => <p key={b}>{b}</p>)}
        {p.stack && <ul className="chips">{p.stack.map(s => <li key={s}>{s}</li>)}</ul>}
      </>
    ),
  })
  if (p.demo) pages.push({
    key: 'demo', mark: 'Try it',
    node: (
      <>
        <h3>Try it</h3>
        <DemoView demo={p.demo} reduced={reduced} />
      </>
    ),
  })
  pages.push({
    key: 'end', mark: 'Links',
    node: (
      <>
        {p.limits && <><h3>Honest limits</h3><p>{p.limits}</p></>}
        {p.links.length > 0
          ? <div className="page-links">{p.links.map(l => <McButton key={l.href} size="auto" href={l.href} external>{l.label} <PixelIcon name="link" size={12} /></McButton>)}</div>
          : <p className="page-sealed"><PixelIcon name="lock" size={14} /> The source is private for now. Happy to walk through it in person.</p>}
      </>
    ),
  })
  return pages
}

function noelPages(): Page[] {
  return [
    {
      key: 'cover', mark: 'Player',
      node: (
        <>
          <div className="page-cover">
            <Face size={72} />
            <h2>{player.name}</h2>
            <p className="page-meta">CS (Data Science) · VIT Vellore · ’27</p>
          </div>
          <hr className="page-rule" />
          <p className="page-lede">{player.lede}</p>
        </>
      ),
    },
    {
      key: 'facts', mark: 'Stats',
      node: (
        <>
          <h3>Player stats</h3>
          <dl className="page-facts">{player.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </>
      ),
    },
    {
      key: 'cares', mark: 'Interests',
      node: (
        <>
          <h3>What I build toward</h3>
          <dl className="page-facts">{player.cares.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </>
      ),
    },
    {
      key: 'off', mark: 'Off the clock',
      node: (
        <>
          <h3>Off the clock</h3>
          <figure className="page-photo">
            <img src={asset('minecraft-cave.webp')} alt="A vast lush cave opening onto a jungle, in my own modded Minecraft world" loading="lazy" />
          </figure>
          <p>{player.offClock}</p>
        </>
      ),
    },
    {
      key: 'contact', mark: 'Contact',
      node: (
        <>
          <h3>Say hello</h3>
          <p>Open to remote roles, and to roles in Riyadh, Abu Dhabi, Dubai and the US.</p>
          <div className="page-links">
            <McButton size="auto" href={links.email} onClick={() => store.earn('diamonds')}><PixelIcon name="mail" size={14} /> {links.emailText}</McButton>
            <McButton size="auto" href={links.linkedin} external>LinkedIn <PixelIcon name="link" size={12} /></McButton>
            <McButton size="auto" href={links.github} external>GitHub <PixelIcon name="link" size={12} /></McButton>
            <McButton size="auto" href={links.resume} external>Resume (PDF) <PixelIcon name="link" size={12} /></McButton>
          </div>
        </>
      ),
    },
  ]
}

const useWide = () => {
  const query = '(min-width: 900px)'
  const [wide, setWide] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

type Turn = { dir: 1 | -1; to: number }

export function Book({ id, onClose, reduced }: { id: string; onClose: () => void; reduced: boolean }) {
  const project = id === 'noel' ? undefined : projectById(id)
  const pages = useMemo(() => (project ? projectPages(project, reduced) : noelPages()), [project, reduced])
  const wide = useWide()
  const per = wide ? 2 : 1
  const padded = useMemo<Page[]>(() => (wide && pages.length % 2 ? [...pages, { key: 'blank', node: <div className="page-blank" aria-hidden="true" /> }] : pages), [pages, wide])
  const count = Math.ceil(padded.length / per)
  const [spread, setSpread] = useState(0)
  const [turn, setTurn] = useState<Turn | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const swipe = useRef<number | null>(null)

  useEffect(() => {
    store.earn('book')
    if (id === 'helix') store.earn('helix')
    closeRef.current?.focus()
  }, [id])
  useEffect(() => { setSpread(0); setTurn(null) }, [id, wide])

  const go = useCallback((to: number) => {
    if (to < 0 || to >= count || to === spread || turn) return
    sfx.page()
    if (reduced) { setSpread(to); return }
    setTurn({ dir: to > spread ? 1 : -1, to })
  }, [count, spread, turn, reduced])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); go(spread + 1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(spread - 1) }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [go, spread, onClose])

  const page = (i: number, side: 'left' | 'right' | 'single') => {
    const p = padded[i]
    if (!p) return <div className={`page page--${side}`} />
    return (
      <div className={`page page--${side}`} key={p.key}>
        <div className="page-inner">{p.node}</div>
        <span className="page-num" aria-hidden="true">{i + 1}</span>
      </div>
    )
  }

  // While a leaf turns, the base shows the pages it will reveal; the leaf carries the pages it hides and uncovers.
  const settle = () => { if (turn) { setSpread(turn.to); setTurn(null) } }
  let base: ReactNode
  let leaf: ReactNode = null
  if (wide) {
    const L = spread * 2
    if (turn) {
      const T = turn.to * 2
      base = turn.dir === 1 ? <>{page(L, 'left')}{page(T + 1, 'right')}</> : <>{page(T, 'left')}{page(L + 1, 'right')}</>
      leaf = (
        <div className={`leaf leaf--${turn.dir === 1 ? 'fwd' : 'back'}`} onAnimationEnd={settle} aria-hidden="true">
          <div className="leaf-face leaf-front">{turn.dir === 1 ? page(L + 1, 'right') : page(L, 'left')}</div>
          <div className="leaf-face leaf-back">{turn.dir === 1 ? page(T, 'left') : page(T + 1, 'right')}</div>
        </div>
      )
    } else base = <>{page(L, 'left')}{page(L + 1, 'right')}</>
  } else {
    const shown = turn ? turn.to : spread
    base = <div key={shown} className={`single ${turn ? `single--${turn.dir === 1 ? 'fwd' : 'back'}` : ''}`} onAnimationEnd={settle}>{page(shown, 'single')}</div>
  }

  const marks = padded.map((p, i) => ({ mark: p.mark, spread: Math.floor(i / per) })).filter(m => m.mark)
  const title = project?.name ?? player.name

  return (
    <div className="book-layer" role="dialog" aria-modal="true" aria-label={`${title} guidebook`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`book ${wide ? 'book--wide' : 'book--single'}`}>
        <div
          className="book-pages"
          onPointerDown={e => { swipe.current = e.pointerType === 'mouse' ? null : e.clientX }}
          onPointerUp={e => {
            if (swipe.current === null) return
            const dx = e.clientX - swipe.current
            swipe.current = null
            if (Math.abs(dx) > 48) go(spread + (dx < 0 ? 1 : -1))
          }}
        >
          {base}
          {leaf}
        </div>
        <nav className="ribbons" aria-label="Sections">
          {marks.map((m, i) => (
            <button key={m.mark} type="button" className={`ribbon ribbon--${i % 4} ${m.spread === spread ? 'is-on' : ''}`} onClick={() => go(m.spread)} aria-current={m.spread === spread}>
              {m.mark}
            </button>
          ))}
        </nav>
        <button type="button" className="book-turn book-turn--prev" onClick={() => go(spread - 1)} disabled={spread === 0} aria-label="Previous page"><PixelIcon name="left" size={18} /></button>
        <button type="button" className="book-turn book-turn--next" onClick={() => go(spread + 1)} disabled={spread >= count - 1} aria-label="Next page"><PixelIcon name="right" size={18} /></button>
        <button ref={closeRef} type="button" className="book-close" onClick={() => { sfx.click(); onClose() }} aria-label="Close guidebook"><PixelIcon name="close" size={14} /></button>
      </div>
    </div>
  )
}
