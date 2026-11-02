import './polysafe.css'
import { type CSSProperties } from 'react'
import type { Case } from '../cases'
import { Count, Diorama, ProjectEnd, Sealed, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

/** Two drug-like ring systems joined by a bond: the linework the project's UI is built from. */
function Molecule() {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i + Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}` }).join(' ')
  return (
    <svg className="ps-mol" viewBox="0 0 420 300" aria-hidden="true">
      <g className="ps-orbit"><circle cx={210} cy={150} r={132} /><circle cx={210} cy={150} r={104} /></g>
      <g className="ps-ring ps-ring--a">
        <polygon points={hex(140, 150, 46)} pathLength={1} />
        <polyline points="122,128 158,128" /><polyline points="113,166 131,184" />
        <line x1={180} y1={127} x2={222} y2={104} pathLength={1} />
        <circle cx={94} cy={150} r={5} className="ps-atom ps-atom--mint" />
      </g>
      <g className="ps-ring ps-ring--b">
        <polygon points={hex(262, 104, 46)} pathLength={1} />
        <polyline points="250,82 282,82" />
        <line x1={302} y1={127} x2={340} y2={150} pathLength={1} />
        <line x1={262} y1={150} x2={262} y2={196} pathLength={1} />
        <circle cx={342} cy={152} r={5} className="ps-atom ps-atom--amber" />
        <circle cx={262} cy={200} r={5} className="ps-atom ps-atom--coral" />
      </g>
    </svg>
  )
}

/** Four evaluation regimes as specimen wells; only the two published numbers are filled. */
function Wells() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.35)
  const wells = [
    { name: 'Warm', sub: 'both drugs seen in training', v: 0.30, label: '0.30', tone: 'amber' },
    { name: 'One unseen', sub: 'one drug new', tone: 'dim' },
    { name: 'Two unseen', sub: 'both drugs new', v: 0.12, label: '0.12', tone: 'mint' },
    { name: 'Out of distribution', sub: 'new chemistry', tone: 'dim' },
  ]
  return (
    <div ref={ref} className={`ps-wells ${seen ? 'is-on' : ''}`}>
      {wells.map((w, i) => (
        <figure key={w.name} className={`ps-well ps-well--${w.tone}`} style={{ '--fill': `${((w.v ?? 0) / 0.35) * 100}%`, '--i': i } as CSSProperties}>
          <div className="ps-dish"><i /><span>{w.label ?? '···'}</span></div>
          <figcaption><b>{w.name}</b><small>{w.sub}</small></figcaption>
        </figure>
      ))}
    </div>
  )
}

function Abstain() {
  const rows = [
    { pair: 'Pair A', conf: 0.91, out: 'answers' },
    { pair: 'Pair B', conf: 0.74, out: 'answers' },
    { pair: 'Pair C', conf: 0.38, out: 'abstains' },
  ]
  return (
    <ul className="ps-abstain" aria-label="How a prediction reads">
      {rows.map(r => (
        <li key={r.pair} className={r.out === 'abstains' ? 'is-refuse' : ''}>
          <span className="ps-pair">{r.pair}</span>
          <span className="ps-meter"><i style={{ width: `${r.conf * 100}%` }} /><b style={{ left: '55%' }} /></span>
          <span className="ps-out">{r.out}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PolySafe({ c }: { c: Case }) {
  usePage('PolySafe · Noel Alex')
  return (
    <div className="ps">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="ps-hero">
          <div className="ps-hero-text">
            <p className="ps-plate">Specimen PS-01 · {c.year} · {c.role}</p>
            <h1>PolySafe</h1>
            <p className="ps-q">Two drugs, taken together. Which of 964 side effects follow, and when should you trust the answer?</p>
            <p className="ps-lede">{c.lede}</p>
          </div>
          <div className="ps-hero-art"><Molecule /><Diorama id="polysafe" className="ps-art" eager /></div>
        </header>

        <dl className="ps-readout">
          <div><dt>Drug pairs</dt><dd><Count to={63472} /></dd></div>
          <div><dt>Side-effect classes</dt><dd><Count to={964} /></dd></div>
          <div><dt>Split regimes</dt><dd>4</dd></div>
          <div><dt>Random-split inflation</dt><dd>≈2.5×</dd></div>
        </dl>

        <section className="ps-sec">
          <h2>Evaluation first</h2>
          <p className="ps-p">Most work here reports one number on random drug pairs. On random pairs a model has already met both drugs, so the score measures memory as much as pharmacology. I evaluate four regimes, keep the negative results, and track evidence before claims.</p>
          <Wells />
          <p className="ps-cap">Micro-AUPRC. Random pairs score about 2.5× what the model manages when both drugs are new; that second number is the honest one, and its per-effect AUROC of 0.51 is barely better than chance. Development benchmarks; the other two regimes are held for the paper.</p>
        </section>

        <section className="ps-sec ps-sec--two">
          <div>
            <h2>Knowing when not to answer</h2>
            <p className="ps-p">A side-effect predictor that is confidently wrong is worse than none. PolySafe is built for selective prediction: below a confidence it can defend, it abstains and says so, instead of returning a number someone might act on.</p>
          </div>
          <Abstain />
        </section>

        <section className="ps-sec"><Sealed c={c} /></section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
