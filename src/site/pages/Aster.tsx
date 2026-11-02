import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import './aster.css'
import { useState } from 'react'
import type { Case } from '../cases'
import { Count, Diorama, ProjectEnd, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

// candidates in millions of parameters: [name, total, active per token]
const MODELS: [string, number, number][] = [
  ['Dense challenger', 661, 661],
  ['MoE small', 670, 364],
  ['MoE main', 890, 482],
  ['MoE large', 1500, 620],
  ['MoE max', 1900, 764],
]

function Plot() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const [hover, setHover] = useState<string | null>('MoE main')
  const X = (v: number) => 60 + (v / 2000) * 500
  const Y = (v: number) => 300 - (v / 800) * 260
  return (
    <div ref={ref} className={`as-plot ${seen ? 'is-on' : ''}`}>
      <svg viewBox="0 0 600 340" role="img" aria-label="Total versus active parameters for five candidate models">
        {[0, 500, 1000, 1500, 2000].map(v => <g key={v}><line className="as-grid" x1={X(v)} x2={X(v)} y1={40} y2={300} /><text x={X(v)} y={322} textAnchor="middle">{v}</text></g>)}
        {[0, 200, 400, 600, 800].map(v => <g key={v}><line className="as-grid" x1={60} x2={560} y1={Y(v)} y2={Y(v)} /><text x={50} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
        <line className="as-diag" x1={X(0)} y1={Y(0)} x2={X(800)} y2={Y(800)} />
        <text className="as-note" x={X(760)} y={Y(800) - 8}>active = total</text>
        <polyline className="as-front" points={MODELS.slice(1).map(m => `${X(m[1])},${Y(m[2])}`).join(' ')} pathLength={1} />
        {MODELS.map(([name, total, active], i) => (
          <g key={name} className={`as-pt ${i === 0 ? 'is-dense' : ''} ${hover === name ? 'is-on' : ''}`} style={{ transitionDelay: `${i * 120}ms` }}
            onMouseEnter={() => setHover(name)} onFocus={() => setHover(name)} tabIndex={0}>
            <circle cx={X(total)} cy={Y(active)} r={i === 2 ? 9 : 7} />
            <text x={X(total) + 14} y={Y(active) + 5}>{name}</text>
          </g>
        ))}
        <text className="as-axis" x={310} y={338} textAnchor="middle">total parameters (M)</text>
        <text className="as-axis" x={14} y={170} textAnchor="middle" transform="rotate(-90 14 170)">active per token (M)</text>
      </svg>
      <p className="as-read" aria-live="polite">
        {hover && (() => { const m = MODELS.find(x => x[0] === hover)!; return <><b>{m[0]}</b> {m[1].toLocaleString()}M total · {m[2]}M active per token</> })()}
      </p>
    </div>
  )
}

export default function Aster({ c }: { c: Case }) {
  usePage('AsterLM Frontier · Noel Alex')
  return (
    <div className="as">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="as-hero">
          <p className="as-entry">Notebook · {c.year} · {c.status}</p>
          <h1>AsterLM <em>Frontier</em></h1>
          <p className="as-q">What is the strongest language model one 12 GiB laptop GPU can actually train?</p>
          <div className="as-hero-grid">
            <p className="as-lede">{c.lede}</p>
            <Diorama id="aster" className="as-art" eager />
          </div>
        </header>

        <dl className="as-figs">
          <div><dt>Lead candidate</dt><dd><Count to={890} />M</dd><small>parameters, 482M active</small></div>
          <div><dt>Card</dt><dd>12 GiB</dd><small>RTX 4080 Laptop</small></div>
          <div><dt>Pretraining text prepared</dt><dd>≈<Count to={84} />B</dd><small>tokens, not all trained on</small></div>
        </dl>

        <section className="as-sec as-sec--two">
          <div>
            <h2>A mixture of experts has to earn it</h2>
            <p className="as-p">A mixture of experts carries far more parameters than it uses on any one token. The lead candidate is a hybrid MoE, and it has to beat a matched dense model on quality, speed, memory and stability before I call it the winner.</p>
            <p className="as-verdict">So far, it hasn’t.</p>
          </div>
          <Plot />
        </section>

        <section className="as-sec">
          <h2>Measured at every step</h2>
          <ul className="as-checks">
            <li><b>VRAM</b> against the 12 GiB ceiling</li>
            <li><b>Throughput</b> measured, not estimated</li>
            <li><b>Checkpoints</b> so long runs survive and can be compared</li>
            <li><b>Evaluations</b> with dense and MoE on equal terms</li>
          </ul>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
