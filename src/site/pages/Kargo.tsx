import '@fontsource/chakra-petch/latin-500.css'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/chakra-petch/latin-700.css'
import './kargo.css'
import { type CSSProperties } from 'react'
import type { Case } from '../cases'
import { Diorama, ProjectEnd, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

const STATIONS = [
  { name: 'Read', out: 'shallow clone · pick the files that matter · summarize', mine: true },
  { name: 'Extract', out: 'ports · persistent volumes', mine: true },
  { name: 'Generate', out: 'Dockerfile · manifests' },
  { name: 'Run', out: 'Kubernetes · monitoring' },
]

/** A repository crate riding the line, lighting each machine as it passes. */
function Line() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className={`kg-line ${seen ? 'is-on' : ''}`}>
      <div className="kg-machines">
        {STATIONS.map((s, i) => (
          <div key={s.name} className={`kg-machine ${s.mine ? 'is-mine' : ''}`} style={{ '--i': i } as CSSProperties}>
            <div className="kg-cog" aria-hidden="true" />
            <h3>{s.name}</h3>
            <p>{s.out}</p>
            {s.mine && <span className="kg-mine">My part</span>}
          </div>
        ))}
      </div>
      <div className="kg-belt" aria-hidden="true">
        <span className="kg-crate">repo</span>
      </div>
    </div>
  )
}

export default function Kargo({ c }: { c: Case }) {
  usePage('Kargo · Noel Alex')
  return (
    <div className="kg">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="kg-hero">
          <div>
            <p className="kg-plate">{c.role} · {c.year}</p>
            <h1>Kargo</h1>
            <p className="kg-sum">{c.summary}.</p>
            <p className="kg-lede">{c.lede}</p>
          </div>
          <Diorama id="kargo" className="kg-art" eager />
        </header>
        <section className="kg-sec">
          <h2>The line</h2>
          <Line />
        </section>
        <section className="kg-sec kg-sec--two">
          <div>
            <h2>My part: reading the codebase</h2>
            <p className="kg-p">I built the AI path that reads a repository: cloning it shallowly, choosing which files matter, summarizing them, and pulling out ports and persistent volumes so the generated Docker config actually runs.</p>
          </div>
          <figure className="kg-out">
            <figcaption>Dockerfile <span>example output</span></figcaption>
            <pre>{'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\n'}<mark>{'EXPOSE 3000'}</mark>{'\n'}<mark>{'VOLUME /data'}</mark>{'\nCMD ["npm", "start"]'}</pre>
          </figure>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
