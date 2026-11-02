import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import './phishgcn.css'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { track } from '../../analytics'
import type { Case } from '../cases'
import { Count, Go, ProjectEnd, Sealed, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

/** 1,000 cells, one per 0.1% of phishing-reported captures; the stand-ins light up first. */
function Waffle() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.35)
  return (
    <div ref={ref} className={`pg-waffle ${seen ? 'is-on' : ''}`} role="img" aria-label="647 of every 1,000 phishing-reported captures were stand-ins">
      {Array.from({ length: 1000 }, (_, i) => <i key={i} className={i < 647 ? 'is-hit' : ''} style={{ '--d': `${(i % 40) * 18 + Math.floor(i / 40) * 6}ms` } as CSSProperties} />)}
    </div>
  )
}

type Page = { label: string; host: string; body: ReactNode; real?: boolean }
const PAGES: Page[] = [
  { label: 'Hosting warning', host: 'secure-login-verify.example', body: <><h5>Account suspended</h5><p>This site has been disabled by the hosting provider.</p></> },
  { label: 'Parked domain', host: 'acc0unt-update.example', body: <><h5>This domain may be for sale</h5><p>Related searches · Web hosting · Cheap domains</p></> },
  { label: 'Shortener notice', host: 'sho.rt/x9Ak2', body: <><h5>Link disabled</h5><p>This link was reported for abuse and has been removed.</p></> },
  { label: 'Bot challenge', host: 'wallet-claim.example', body: <><h5><span className="pg-spin" /> Checking your browser…</h5><p>This only takes a few seconds.</p></> },
  { label: 'Redirect to the real brand', host: 'bank.example', body: <><h5>Welcome to Bank</h5><p>Personal · Business · Help</p></> },
  { label: 'An actual phishing page', host: 'bank-example.verify-id.example', real: true, body: <><h5>Sign in to continue</h5><div className="pg-form"><i /><i /><b>Continue</b></div></> },
]

function Triage() {
  const [shown, setShown] = useState(false)
  return (
    <div className={`pg-triage ${shown ? 'is-shown' : ''}`}>
      <div className="pg-triage-head">
        <p>Six URLs, every one labelled <b>phishing</b> by a feed.</p>
        <button onClick={() => { setShown(s => !s); track('demo', { id: 'phishgcn', open: !shown }) }} aria-pressed={shown}>
          {shown ? 'Show the feed labels' : 'Fetch the pages'}
        </button>
      </div>
      <ul className="pg-pages">
        {PAGES.map((p, i) => (
          <li key={p.label} className={p.real ? 'is-real' : ''} style={{ '--i': i } as CSSProperties}>
            <div className="pg-win">
              <div className="pg-url"><i /><i /><i /><span>{p.host}</span></div>
              <div className="pg-body">{p.body}</div>
            </div>
            <p className="pg-verdict">
              <span className="pg-feed">phishing</span>
              <span className="pg-truth">{p.real ? 'phishing ✓' : p.label}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Two numbers joined: where a score started and where it went. */
function Slope({ from, to, max = 1, labels, note, ci }: { from: number; to: number; max?: number; labels: [string, string]; note?: string; ci?: [number, number] }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.5)
  const y = (v: number) => 180 - (v / max) * 160
  return (
    <div ref={ref} className={`pg-slope ${seen ? 'is-on' : ''}`}>
      <svg viewBox="0 0 320 200" role="img" aria-label={`${labels[0]} ${from}, ${labels[1]} ${to}`}>
        {[0.25, 0.5, 0.75, 1].map(t => <line key={t} className="pg-grid" x1={40} x2={280} y1={y(t * max)} y2={y(t * max)} />)}
        {ci && <rect className="pg-ci" x={272} width={16} y={y(ci[1])} height={y(ci[0]) - y(ci[1])} />}
        <line className="pg-slope-line" x1={40} y1={y(from)} x2={280} y2={y(to)} pathLength={1} />
        <circle className="pg-dot pg-dot--a" cx={40} cy={y(from)} r={7} />
        <circle className="pg-dot pg-dot--b" cx={280} cy={y(to)} r={7} />
        <text x={40} y={y(from) - 16} textAnchor="middle">{from.toFixed(3)}</text>
        <text x={280} y={y(to) - 16} textAnchor="middle" className="pg-strong">{to.toFixed(3)}</text>
      </svg>
      <div className="pg-slope-labels"><span>{labels[0]}</span><span>{labels[1]}</span></div>
      {note && <p className="pg-slope-note">{note}</p>}
    </div>
  )
}

/** Random split vs domain split: the same domains turning up on both sides. */
function Leak() {
  const [split, setSplit] = useState<'random' | 'domain'>('random')
  const domains = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
  const train = split === 'random' ? domains.slice(0, 10) : domains.slice(0, 8)
  const test = split === 'random' ? ['a', 'c', 'e', 'g', 'i', 'k'] : domains.slice(8)
  return (
    <div className="pg-leak">
      <div className="pg-leak-tabs" role="tablist" aria-label="Split">
        <button role="tab" aria-selected={split === 'random'} onClick={() => setSplit('random')}>Random split</button>
        <button role="tab" aria-selected={split === 'domain'} onClick={() => setSplit('domain')}>Split by domain</button>
      </div>
      <div className="pg-leak-body">
        <div><h4>Train</h4><ul>{train.map(d => <li key={d} className={test.includes(d) ? 'is-dup' : ''}>{d}.example</li>)}</ul></div>
        <div><h4>Test</h4><ul>{test.map(d => <li key={d} className={train.includes(d) ? 'is-dup' : ''}>{d}.example</li>)}</ul></div>
        <p className="pg-leak-score">
          <b>{split === 'random' ? '0.977' : '0.793'}</b>
          <span>PR-AUC</span>
          <small>{split === 'random' ? '96.9% of test domains were also in training' : 'no domain on both sides'}</small>
        </p>
      </div>
    </div>
  )
}

export default function PhishGCN({ c }: { c: Case }) {
  usePage('PhishGCN · Noel Alex')
  return (
    <div className="pg">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="pg-hero">
          <p className="pg-case">Case file · {c.year} · {c.role}</p>
          <h1>PhishGCN</h1>
          <p className="pg-claim"><b><Count to={64.7} decimals={1} suffix="%" ms={1600} /></b> of phishing reports weren’t phishing pages.</p>
          <div className="pg-hero-grid">
            <Waffle />
            <div className="pg-hero-text">
              <p>{c.lede}</p>
              <p className="pg-fine">87,306 of 134,974 live captures of phishing-reported URLs. For legitimate sites the same check flags 12.0% (5,626 of 46,781).</p>
              <Go to={{ screen: 'project', id: 'arachne' }} className="pg-src">Captured with Arachne →</Go>
            </div>
          </div>
        </header>

        <section className="pg-sec">
          <h2>Feeds label URLs. Models see pages.</h2>
          <p className="pg-p">By the time a reported URL is fetched it might be a hosting provider’s warning, a parked domain, a link-shortener notice, a bot challenge or a redirect to the real brand. A model trained on the feed’s label learns all of those as “phishing”.</p>
          <Triage />
        </section>

        <section className="pg-sec pg-sec--results">
          <div>
            <h2>Training around bad labels</h2>
            <p className="pg-p">Measured on a hand-audited test set, taking label quality seriously moved the detector from 0.614 to 0.724 PR-AUC with the same model family.</p>
            <dl className="pg-op">
              <div><dt>Recall</dt><dd>61.4%</dd></div>
              <div><dt>Precision</dt><dd>79.4%</dd></div>
              <div><dt>At false alarms</dt><dd>0.5%</dd></div>
              <div><dt>ROC-AUC</dt><dd>0.847</dd></div>
            </dl>
          </div>
          <Slope from={0.614} to={0.724} labels={['Feed labels', 'Label-quality work']} ci={[0.668, 0.78]} note="PR-AUC on ~1,200 audited pages · bar shows the 95% interval, 0.668–0.780" />
        </section>

        <section className="pg-sec pg-sec--results">
          <div>
            <h2>The first lesson: splits lie</h2>
            <p className="pg-p">An earlier version scored beautifully on a random split. Then I checked which domains were on each side. Every result since is reported on group-aware splits.</p>
          </div>
          <Leak />
        </section>

        <section className="pg-sec"><Sealed c={c} /></section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
