import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import './sivana.css'
import { useEffect, useRef } from 'react'
import type { Case } from '../cases'
import { Diorama, ProjectEnd, SiteBar } from '../kit'
import { reduced, usePage } from '../util'

/**
 * A drifting fingerprint: spectral peaks scroll past like stars, and each new
 * peak pairs with a few recent ones, the way landmark hashes are formed.
 */
function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const g = cv.getContext('2d')!
    let w = 0; let h = 0; let raf = 0; let running = true
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    type P = { x: number; y: number; r: number; links: P[]; born: number }
    let peaks: P[] = []
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const spawn = (x: number, t: number) => {
      const n = rnd() < 0.55 ? 1 : rnd() < 0.5 ? 2 : 0
      for (let k = 0; k < n; k++) {
        // bias peaks toward a few "harmonic" bands, like real music
        const band = [0.22, 0.38, 0.52, 0.66, 0.8][Math.floor(rnd() * 5)]
        const p: P = { x, y: h * (band + (rnd() - 0.5) * 0.12), r: 1 + rnd() * 2.2, links: [], born: t }
        const near = peaks.filter(q => x - q.x > 30 && x - q.x < 160 && Math.abs(q.y - p.y) < h * 0.22)
        for (let j = 0; j < Math.min(2, near.length); j++) p.links.push(near[Math.floor(rnd() * near.length)])
        peaks.push(p)
      }
    }
    resize()
    for (let x = 0; x < w; x += 9) spawn(x, -1e6)
    let last = performance.now(); let acc = 0
    const draw = (t: number) => {
      g.clearRect(0, 0, w, h)
      for (const p of peaks) {
        const age = Math.min(1, (t - p.born) / 900)
        for (const q of p.links) {
          g.strokeStyle = `rgba(255, 74, 28, ${0.08 + 0.32 * age * (p.x / w)})`
          g.lineWidth = 1
          g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke()
        }
      }
      for (const p of peaks) {
        g.fillStyle = `rgba(243, 237, 227, ${0.35 + 0.65 * (p.x / w)})`
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill()
      }
    }
    const tick = (t: number) => {
      const dt = Math.min(64, t - last); last = t
      const dx = dt * 0.035
      for (const p of peaks) p.x -= dx
      peaks = peaks.filter(p => p.x > -200)
      acc += dx
      while (acc > 9) { acc -= 9; spawn(w + 4, t) }
      draw(t)
      if (running) raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting && !reduced()
      cancelAnimationFrame(raf)
      if (running) { last = performance.now(); raf = requestAnimationFrame(tick) } else draw(performance.now())
    })
    io.observe(cv)
    const ro = new ResizeObserver(() => { resize(); draw(performance.now()) })
    ro.observe(cv)
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect() }
  }, [])
  return <canvas ref={ref} className="sv-sky" aria-hidden="true" />
}

export default function Sivana({ c }: { c: Case }) {
  usePage('Sivana · Noel Alex')
  return (
    <div className="sv">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="sv-hero">
          <Constellation />
          <div className="sv-hero-text">
            <p className="sv-kicker">Audio recognition · Rust · WebAssembly</p>
            <h1>Sivana</h1>
          </div>
        </header>

        <section className="sv-intro">
          <p className="sv-lede">{c.lede}</p>
          <Diorama id="sivana" className="sv-art" />
        </section>

        <section className="sv-latency" aria-label="Match latency">
          <p className="sv-old"><s>9.0</s><span>ms per match, prototype</span></p>
          <p className="sv-new">0.4<span>ms</span></p>
          <p className="sv-cap">Same 60-case degradation grid, same machine. More than twenty times faster.</p>
        </section>

        <section className="sv-sec">
          <h2>Rebuilt against a frozen control</h2>
          <p className="sv-p">I rebuilt my first prototype in ten phases and kept the original frozen beside it. Every change had to beat it on the same grid, or it didn’t ship.</p>
          <ol className="sv-path">
            <li><b>I</b><span>Capture</span><small>Tab or microphone audio, fingerprinted in the browser through WebAssembly. Raw audio never leaves the page.</small></li>
            <li><b>II</b><span>Fingerprint</span><small>Streaming landmark hashes.</small></li>
            <li><b>III</b><span>Index</span><small>A custom memory-mapped index beside LMDB.</small></li>
            <li><b>IV</b><span>Match</span><small>Votes on time offsets, served by an Axum API.</small></li>
          </ol>
        </section>

        <section className="sv-sec">
          <h2>Against the prototype</h2>
          <div className="sv-duel">
            <div className="sv-up">
              <p className="sv-metric">Track recall</p>
              <p className="sv-move"><span>86.7%</span><b>96.7%</b></p>
            </div>
            <div className="sv-down">
              <p className="sv-metric">Offset accuracy</p>
              <p className="sv-move"><span>78%</span><b>60%</b></p>
            </div>
          </div>
          <p className="sv-p">Recall went up and latency fell, but offset accuracy got worse. I report it rather than hide it, and offset-tolerant voting is the next fix.</p>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
