import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './petra.css'
import { useEffect, useRef, useState } from 'react'
import { track } from '../../analytics'
import type { Case } from '../cases'
import { Diorama, ProjectEnd, SiteBar } from '../kit'
import { reduced, usePage } from '../util'

const S = 150 // grid cells across the dish
const EMPTY = 0; const SUS = 1; const RES = 2

function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/**
 * A toy dish in a few dozen lines, to show the idea: colonies grow, an
 * antibiotic disc clears a zone, and rare resistant mutants move into it.
 * The same seed always replays the same run.
 */
function Dish() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(0x2f1a)
  const [drug, setDrug] = useState(true)
  const [run, setRun] = useState(0)
  const [stats, setStats] = useState({ t: 0, sus: 0, res: 0 })
  useEffect(() => {
    const cv = ref.current!
    const g = cv.getContext('2d')!
    const img = g.createImageData(S, S)
    const rnd = mulberry32(seed)
    const grid = new Uint8Array(S * S)
    const inside = (x: number, y: number) => (x - S / 2) ** 2 + (y - S / 2) ** 2 < (S / 2 - 2) ** 2
    const dose = (x: number, y: number) => (drug ? Math.max(0, 1 - Math.hypot(x - S / 2, y - S / 2) / (S * 0.36)) : 0)
    const live: number[] = []
    for (let k = 0; k < 40; k++) {
      const x = Math.floor(rnd() * S); const y = Math.floor(rnd() * S)
      if (inside(x, y) && !grid[y * S + x]) { grid[y * S + x] = SUS; live.push(y * S + x) }
    }
    let t = 0; let raf = 0; let alive = true
    const step = () => {
      const n = Math.ceil(live.length * 0.6)
      for (let k = 0; k < n && live.length; k++) {
        const j = Math.floor(rnd() * live.length); const i = live[j]; const c = grid[i]
        const x = i % S; const y = (i / S) | 0
        const d = dose(x, y)
        // susceptible cells die where the drug is strong; resistant ones shrug most of it off
        if ((c === SUS && d > 0.18 && rnd() < d * 0.5) || (c === RES && d > 0.85 && rnd() < 0.05)) {
          grid[i] = EMPTY; live[j] = live[live.length - 1]; live.pop(); continue
        }
        const dir = Math.floor(rnd() * 4)
        const nx = x + [1, -1, 0, 0][dir]; const ny = y + [0, 0, 1, -1][dir]
        if (!inside(nx, ny) || grid[ny * S + nx]) continue
        if (rnd() > (c === RES ? 0.55 : 0.8)) continue // resistance costs a little fitness
        grid[ny * S + nx] = c === SUS && rnd() < 0.002 ? RES : c
        live.push(ny * S + nx)
      }
      t++
    }
    const paint = () => {
      let sus = 0; let res = 0
      for (let i = 0; i < S * S; i++) {
        const x = i % S; const y = (i / S) | 0; const o = i * 4
        if (!inside(x, y)) { img.data[o + 3] = 0; continue }
        const c = grid[i]; const d = dose(x, y)
        let r = 22 + d * 70; let gg = 42 + d * 18; let b = 52 + d * 30
        if (c === SUS) { r = 196; gg = 226; b = 214; sus++ }
        if (c === RES) { r = 241; gg = 182; b = 80; res++ }
        img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255
      }
      g.putImageData(img, 0, 0)
      setStats({ t, sus, res })
    }
    const END = 420
    if (reduced()) { while (t < END) step(); paint(); return }
    const tick = () => {
      if (!alive) return
      step()
      if (t % 2 === 0 || t >= END) paint()
      if (t < END) raf = requestAnimationFrame(tick)
    }
    paint(); raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [seed, drug, run])
  const hex = `0x${seed.toString(16).toUpperCase()}`
  return (
    <div className="pe-lab">
      <div className="pe-dish">
        <canvas ref={ref} width={S} height={S} role="img" aria-label="A simulated petri dish: colonies growing around an antibiotic disc" />
        {drug && <span className="pe-disc" aria-hidden="true" />}
      </div>
      <div className="pe-panel">
        <dl className="pe-read">
          <div><dt>Seed</dt><dd>{hex}</dd></div>
          <div><dt>Hours</dt><dd>{Math.round(stats.t / 17.5)}</dd></div>
          <div className="is-sus"><dt>Susceptible</dt><dd>{stats.sus.toLocaleString()}</dd></div>
          <div className="is-res"><dt>Resistant</dt><dd>{stats.res.toLocaleString()}</dd></div>
        </dl>
        <div className="pe-controls">
          <button onClick={() => { setDrug(d => !d); track('demo', { id: 'petra', drug: !drug }) }} aria-pressed={drug}>{drug ? 'Remove antibiotic' : 'Add antibiotic'}</button>
          <button onClick={() => { setRun(r => r + 1); track('demo', { id: 'petra', replay: true }) }}>Replay seed</button>
          <button onClick={() => { setSeed(Math.floor(Math.random() * 0xffff)); track('demo', { id: 'petra', reseed: true }) }}>New seed</button>
        </div>
        <p className="pe-note">A toy written for this page. Replay gives the same run every time; that determinism is the core idea behind Petra’s real model.</p>
      </div>
    </div>
  )
}

export default function Petra({ c }: { c: Case }) {
  usePage('Petra · Noel Alex')
  return (
    <div className="pe">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="pe-hero">
          <div>
            <p className="pe-chip">{c.status}</p>
            <h1>Petra</h1>
            <p className="pe-sum">{c.summary}.</p>
            <p className="pe-lede">{c.lede}</p>
          </div>
          <Diorama id="petra" className="pe-art" eager />
        </header>
        <section className="pe-sec">
          <Dish />
        </section>
        <section className="pe-sec pe-cards">
          <article><h2>E. coli vs ciprofloxacin</h2><p>The flagship scenario, with literature-backed resistance data, mutation and spatial competition.</p></article>
          <article><h2>Every parameter shows its source</h2><p>Nothing is tuned to look good. Each number in the model links back to where it came from.</p></article>
          <article><h2>Exact replays from a seed</h2><p>Share a seed and someone else sees the same colonies, the same collapse, the same resistant breakout.</p></article>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
