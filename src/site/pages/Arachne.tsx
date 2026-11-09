import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import './arachne.css'
import { useState, type CSSProperties } from 'react'
import { track } from '../../analytics'
import type { Case } from '../cases'
import { Count, Diorama, Go, ProjectEnd, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

// a small site for the crawl demo: [x, y, label, depth]; 8 is off-site, 13 is past the depth budget
const N: [number, number, string][] = [
  [70, 160, '/'], [220, 70, '/docs'], [220, 160, '/blog'], [220, 250, '/about'],
  [370, 40, '/docs/api'], [370, 100, '/docs/faq'], [370, 160, '/blog/1'], [370, 215, '/blog/2'], [370, 275, 'cdn.other.net'],
  [520, 40, '/docs/api/v2'], [520, 160, '/blog/1/notes'], [520, 215, '/blog/2/talk'],
  [70, 40, 'sitemap.xml'], [640, 160, '/blog/1/notes/old'],
]
const E: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [4, 9], [6, 10], [7, 11], [10, 13]]

type Mode = 'site' | 'sitemap' | 'list' | 'capture'
const MODES: Record<Mode, { visit: number[]; skip: [number, string][]; via?: [number, number][]; text: string }> = {
  site: {
    visit: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
    skip: [[8, 'out of scope'], [13, 'depth 4 > 3']],
    text: 'Follows in-scope links breadth-first, inside the depth and page budgets.',
  },
  sitemap: {
    visit: [12, 1, 5, 7, 3, 9],
    skip: [],
    via: [[12, 1], [12, 5], [12, 7], [12, 3], [12, 9]],
    text: 'Reads the sitemap, and any nested sitemaps, then fetches every listed page.',
  },
  list: {
    visit: [2, 6, 9],
    skip: [],
    via: [],
    text: 'Fetches exactly the URLs it was given. No link expansion.',
  },
  capture: {
    visit: [6],
    skip: [],
    via: [],
    text: 'Forensic fetch: rendered in headless Chrome, every artifact kept.',
  },
}

function CrawlMap() {
  const [mode, setMode] = useState<Mode>('site')
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const m = MODES[mode]
  const order = new Map(m.visit.map((n, i) => [n, i]))
  const skipped = new Map(m.skip)
  const log = [
    ...m.visit.map(n => ({ n, line: `GET  ${N[n][2]}`, tag: mode === 'capture' ? 'RENDER' : '200', at: order.get(n)! })),
    ...m.skip.map(([n, why], i) => ({ n, line: `SKIP ${N[n][2]}`, tag: why, at: m.visit.length + i })),
  ]
  const edges = m.via ?? E.filter(([a, b]) => order.has(a) && order.has(b))
  return (
    <div className="ar-crawl" ref={ref}>
      <div className="ar-tabs" role="tablist" aria-label="Crawl mode">
        {(Object.keys(MODES) as Mode[]).map(k => (
          <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? 'is-on' : ''} onClick={() => { setMode(k); track('demo', { id: 'arachne', mode: k }) }}>{k}</button>
        ))}
      </div>
      <p className="ar-crawl-text">{m.text}</p>
      <div className={`ar-crawl-body ${seen ? 'is-run' : ''}`} key={mode}>
        <svg viewBox="0 0 720 310" className="ar-graph" role="img" aria-label={`Crawl order in ${mode} mode`}>
          {E.map(([a, b]) => <line key={`${a}-${b}`} className="ar-edge-faint" x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} />)}
          {edges.map(([a, b]) => (
            <line key={`v${a}-${b}`} className="ar-edge" pathLength={1} style={{ '--d': `${order.get(b)! * 0.22}s` } as CSSProperties}
              x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} />
          ))}
          {N.map(([x, y, label], i) => {
            if (i === 12 && mode !== 'sitemap') return null
            const v = order.get(i)
            const cls = v !== undefined ? 'is-v' : skipped.has(i) ? 'is-skip' : ''
            const d = v ?? (m.visit.length + m.skip.findIndex(s => s[0] === i))
            return (
              <g key={i} className={`ar-node ${cls}`} style={{ '--d': `${d * 0.22}s` } as CSSProperties} transform={`translate(${x} ${y})`}>
                <rect x={-9} y={-9} width={18} height={18} />
                <text y={-16} textAnchor="middle">{label}</text>
                {skipped.has(i) && <path d="M-6 -6 L6 6 M6 -6 L-6 6" />}
              </g>
            )
          })}
        </svg>
        <ol className="ar-log" aria-label="Frontier log">
          {log.map(l => (
            <li key={l.line} className={l.line.startsWith('SKIP') ? 'is-skip' : ''} style={{ '--d': `${l.at * 0.22}s` } as CSSProperties}>
              <span>{l.line}</span><b>{l.tag}</b>
            </li>
          ))}
        </ol>
      </div>
      <dl className="ar-budget">
        <div><dt>Pages</dt><dd>1,000</dd></div>
        <div><dt>Depth</dt><dd>3</dd></div>
        <div><dt>Gap</dt><dd>1 s</dd></div>
        <div><dt>Timeout</dt><dd>30 s</dd></div>
        <div><dt>Body cap</dt><dd>5 MiB</dd></div>
      </dl>
    </div>
  )
}

const ARTIFACTS = [
  { name: 'Raw HTML', body: <pre>{'<html lang="en">\n  <head>\n    <title>Sign in</title>\n  <form action="/v">'}</pre> },
  { name: 'Rendered DOM', body: <pre>{'html\n└ body\n  ├ div#app\n  │ └ form\n  └ script ×14'}</pre> },
  { name: 'Screenshot', body: <div className="ar-shot"><i /><i /><i /><b /></div> },
  { name: 'Network log', body: <pre>{'200 GET  /\n302 GET  /go\n200 GET  /app.js\n204 POST /beacon'}</pre> },
  { name: 'Favicon', body: <div className="ar-fav" /> },
]

function Artifacts() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  return (
    <div ref={ref} className={`ar-stack ${seen ? 'is-fanned' : ''}`}>
      {ARTIFACTS.map((a, i) => (
        <article key={a.name} className="ar-card" style={{ '--i': i, '--c': `var(--c${i + 1})` } as CSSProperties}>
          <h4>{a.name}</h4>
          {a.body}
        </article>
      ))}
    </div>
  )
}

/** The lite tier: sources feed the owner's node, work fans out over NATS to local and friends' workers. */
function Topology() {
  return (
    <div className="ar-topo">
      <section className="ar-col" aria-label="Inputs">
        <h4>Inputs</h4>
        <ul><li>Sites</li><li>Sitemaps</li><li>URL lists</li><li>Phishing feeds</li></ul>
      </section>
      <span className="ar-pipe" aria-hidden="true" />
      <section className="ar-col ar-owner" aria-label="Owner’s node">
        <h4>Owner’s node</h4>
        <div className="ar-pair">
          <div><b>harvest</b><small>supplies URLs</small></div>
          <div><b>serve</b><small>dispatches, stores, dashboard</small></div>
        </div>
        <div className="ar-pair">
          <div><b>SQLite</b><small>jobs, URLs, captures</small></div>
          <div><b>Blob store</b><small>content-addressed, zstd</small></div>
        </div>
        <div className="ar-bus"><b>NATS JetStream</b><small>bundled · durable work queue</small></div>
      </section>
      <span className="ar-pipe ar-pipe--both" aria-hidden="true" />
      <section className="ar-col" aria-label="Workers">
        <h4>Workers</h4>
        <div><b>Local workers</b><small>HTTP fetch · headless Chrome</small></div>
        <div className="is-friend"><b>Friends’ workers</b><small>over Tailscale · signed updates · no database access</small></div>
      </section>
    </div>
  )
}

export default function Arachne({ c }: { c: Case }) {
  usePage('Arachne · Noel Alex')
  return (
    <div className="ar">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="ar-hero">
          <svg className="ar-web" viewBox="0 0 200 200" aria-hidden="true">
            {[40, 80, 120, 160, 200].map(r => <path key={r} d={`M0 ${r} Q ${r * 0.42} ${r * 0.42} ${r} 0`} />)}
            {[0, 22, 45, 68, 90].map(a => <line key={a} x1={0} y1={0} x2={200 * Math.cos((a * Math.PI) / 180)} y2={200 * Math.sin((a * Math.PI) / 180)} />)}
          </svg>
          <p className="ar-kicker">Rust · {c.year} · {c.role}</p>
          <h1>Arachne</h1>
          <p className="ar-summary">{c.summary}.</p>
          <div className="ar-hero-grid">
            <div className="ar-counter">
              <b><Count to={203367} ms={1800} /></b>
              <span>page captures in one study snapshot</span>
            </div>
            <p className="ar-lede">{c.lede}</p>
            <Diorama id="arachne" className="ar-art" eager />
          </div>
          <ul className="ar-stack-list" aria-label="Stack">{c.stack.map(s => <li key={s}>{s}</li>)}</ul>
        </header>

        <section className="ar-sec">
          <h2><span>01</span> One crawler, four jobs</h2>
          <p className="ar-p">Every crawl is a job with its own scope, budget and politeness, and every job can pause, resume and export. Pick a mode.</p>
          <CrawlMap />
        </section>

        <section className="ar-sec ar-sec--split">
          <div>
            <h2><span>02</span> Five copies of every page</h2>
            <p className="ar-p">A page isn’t one thing. What the server sent, what the browser built, what a person saw and what the page called out to can all disagree, and that disagreement is often the evidence. Each artifact is stored once by hash, zstd-compressed.</p>
          </div>
          <Artifacts />
        </section>

        <section className="ar-sec">
          <h2><span>03</span> Runs on a laptop, scales out to friends</h2>
          <p className="ar-p">The owner’s node runs two long-lived processes over one data directory. A bundled NATS JetStream server carries work to capture workers. Friends add capacity by running a worker over Tailscale; workers only ever talk to the queue, never the owner’s database, and they update themselves from signed releases.</p>
          <Topology />
          <p className="ar-note">This is the lite tier as it runs today. A scale tier (PostgreSQL control plane, ScyllaDB page state, S3 artifacts, a NATS cluster) is designed and partly built.</p>
        </section>

        <section className="ar-sec ar-sec--split">
          <div>
            <h2><span>04</span> Hostile input, by assumption</h2>
            <p className="ar-p">A crawler that collects phishing pages has to assume every page is trying something. Arachne follows robots rules, enforces scope and size limits per job, and re-checks every redirect hop against private and internal addresses, so a page can’t bounce it into the network it runs on.</p>
          </div>
          <ol className="ar-hops" aria-label="A redirect chain, checked hop by hop">
            <li><code>GET  http://promo.example/</code><b>302</b></li>
            <li><code>GET  https://promo.example/go</code><b>302</b></li>
            <li className="is-block"><code>GET  http://169.254.169.254/</code><b>blocked · link-local</b></li>
          </ol>
          <dl className="ar-rules">
            <div><dt>Known gap</dt><dd>DNS can change between the check and the connect. That race is documented, not something I claim to have closed.</dd></div>
            <div><dt>Measurement rule</dt><dd>No pages-per-second from component benchmarks. Throughput is reported end to end, under a stated workload, or not at all.</dd></div>
          </dl>
        </section>

        <section className="ar-sec">
          <Go to={{ screen: 'project', id: 'phishgcn' }} className="ar-feeds" onClick={() => track('project_click', { id: 'phishgcn', from: 'arachne' })}>
            <span className="ar-feeds-k">What it collected first</span>
            <span className="ar-feeds-n"><b>134,974</b> phishing-reported captures</span>
            <span className="ar-feeds-n"><b>46,781</b> legitimate captures</span>
            <span className="ar-feeds-go">The dataset behind PhishGCN →</span>
          </Go>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
