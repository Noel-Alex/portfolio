import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/libre-baskerville/latin-400-italic.css'
import '@fontsource/libre-baskerville/latin-700.css'
import './stretchy.css'
import { useState, type CSSProperties } from 'react'
import { track } from '../../analytics'
import type { Case } from '../cases'
import { Count, Diorama, ProjectEnd, Sealed, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

// an illustration of the evidence view: every clause of a finding points at the exact span it came from
const CLAIMS = [
  { text: 'The supplier contract was renewed in March', src: 'minutes-2024-03.pdf', where: 'p. 14 · ¶ 3', quote: ['…the board ', 'approved renewal of the supplier agreement', ' effective 1 March…'] },
  { text: 'at a higher rate', src: 'invoice-0419.png', where: 'OCR · line 7', quote: ['Unit rate: ', '₹ 1,840', ' (prev. ₹ 1,520)'] },
  { text: 'after the audit had flagged the supplier', src: 'audit-call.m4a', where: '00:41:12 – 00:41:30', quote: ['“…and we ', 'flagged them in the Q4 audit', ', so…”'] },
]

function Evidence() {
  const [at, setAt] = useState(0)
  const s = CLAIMS[at]
  return (
    <figure className="st-ev">
      <p className="st-ev-claim">
        {CLAIMS.map((c, i) => (
          <span key={c.src}>
            <button className={i === at ? 'is-on' : ''} onClick={() => { setAt(i); track('demo', { id: 'stretchy', claim: i }) }} aria-pressed={i === at}>
              {c.text}<sup>{i + 1}</sup>
            </button>{i < CLAIMS.length - 1 ? ' ' : '.'}
          </span>
        ))}
      </p>
      <div className="st-ev-src" key={at}>
        <p className="st-ev-file"><span>{at + 1}</span>{s.src}<small>{s.where}</small></p>
        <blockquote>{s.quote[0]}<mark>{s.quote[1]}</mark>{s.quote[2]}</blockquote>
      </div>
      <figcaption>An illustration of the evidence view. Choose a clause.</figcaption>
    </figure>
  )
}

function Tokens() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  return (
    <div ref={ref} className={`st-tok ${seen ? 'is-on' : ''}`}>
      <div className="st-tok-row">
        <span>Late chunking</span>
        <div className="st-tok-bar">{Array.from({ length: 51 }, (_, i) => <i key={i} style={{ '--d': `${i * 18}ms` } as CSSProperties} />)}</div>
      </div>
      <div className="st-tok-row st-tok-row--halo">
        <span>HALO</span>
        <div className="st-tok-bar">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--d': `${i * 18}ms` } as CSSProperties} />)}</div>
      </div>
      <p>Encoder tokens to re-embed after an edit, measured on 2,536 real edits. One square ≈ the same share of tokens.</p>
    </div>
  )
}

const RUNS: { n: number; d?: number; unit: string; what: string; sub: string }[] = [
  { n: 862917, unit: 'files', what: 'Inventoried', sub: '130.26 GB, source never copied, zero read errors' },
  { n: 13307, unit: 'pages', what: 'Document pilot', sub: '2,000 PDFs, zero native parse errors' },
  { n: 288, unit: 'units / s', what: 'Dense retrieval', sub: 'embedded at 2.25 GiB peak VRAM' },
  { n: 147, unit: 'MiB', what: 'Bounded memory', sub: 'resident while scanning near 747K files, resumable' },
]

export default function Stretchy({ c }: { c: Case }) {
  usePage('Stretchy + HALO · Noel Alex')
  return (
    <div className="st">
      <SiteBar c={c} />
      <div className="st-folio">
        <nav className="st-rail" aria-label="On this page">
          <p className="st-rail-mark">S</p>
          <ol>
            <li><a href="#st-evidence">Evidence</a></li>
            <li><a href="#st-ledger">Ledger</a></li>
            <li><a href="#st-halo">HALO</a></li>
          </ol>
          <p className="st-rail-meta">{c.year}<br />{c.role}<br />{c.status}</p>
        </nav>
        <main id="main-content">
          <header className="st-hero">
            <h1>Stretchy <em>+ HALO</em></h1>
            <p className="st-summary">{c.summary}.</p>
            <div className="st-hero-grid">
              <p className="st-lede"><span className="st-drop">A</span>{c.lede.slice(1)}</p>
              <Diorama id="stretchy" className="st-art" eager />
            </div>
          </header>

          <section id="st-evidence" className="st-sec">
            <h2>Every conclusion keeps its source</h2>
            <p className="st-p">Investigations die in the gap between “the system says” and “where does it say that?”. Stretchy closes it: a finding is assembled from spans of documents, images, audio and video, and each span stays attached, down to the page, line or second.</p>
            <Evidence />
          </section>

          <section id="st-ledger" className="st-sec">
            <h2>Measured, not promised</h2>
            <p className="st-p">The house rule: nothing on screen may be fabricated. Empty states render empty, demo data never poses as real, and every number here comes from a run I can replay.</p>
            <ol className="st-ledger">
              {RUNS.map(r => (
                <li key={r.what}>
                  <span className="st-ledger-what">{r.what}</span>
                  <span className="st-ledger-n"><Count to={r.n} ms={1600} /><small>{r.unit}</small></span>
                  <span className="st-ledger-sub">{r.sub}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="st-halo" className="st-sec">
            <h2>HALO: re-embed the edit, not the document</h2>
            <p className="st-p">Long documents change a little at a time. HALO is the embedding research inside Stretchy that keeps long-range context while re-encoding far less after each edit.</p>
            <p className="st-big">≈5.1× <span>fewer encoder tokens than a late-chunking baseline</span></p>
            <p className="st-p">Measured on 2,536 real Wikipedia edits. Against a stronger positional-window control the saving is about 1.65×, and HALO isn’t in Stretchy’s production indexing yet.</p>
            <Tokens />
          </section>

          <section className="st-sec"><Sealed c={c} /></section>
        </main>
      </div>
      <ProjectEnd c={c} />
    </div>
  )
}
