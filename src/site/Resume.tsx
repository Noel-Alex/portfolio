import { useEffect } from 'react'
import { referral } from '../analytics'
import { href } from '../ui/router'
import { certification, education, experience, leadership, me, skills } from './profile'

/**
 * The one-page résumé, rendered from the same data as the site and printed to
 * public/Noel-Alex-Resume.pdf by `npm run resume`. Opening /resume?ref=acme
 * prints a copy whose portfolio link carries that ref.
 */

type Item = { name: string; tag: string; when: string; points: string[] }

const projects: Item[] = [
  {
    name: 'Stretchy + HALO', tag: 'Evidence-grounded AI platform and embedding research', when: '2025–26',
    points: [
      'Led R&D on a fault-tolerant Python/Rust pipeline spanning document extraction, PostgreSQL orchestration, Qdrant retrieval and provenance-aware processing.',
      'Inventoried 862,917 files (130.26 GB) with zero scan errors via resumable bounded-memory scanning (~147 MiB near 747K files); HALO cut encoder-token input ~5.1× on 2,536 real edits versus a late-chunking baseline.',
    ],
  },
  {
    name: 'Arachne', tag: 'Configurable, high-performance web crawler in Rust', when: '2025–26',
    points: ['Built site, sitemap, list and forensic-capture crawling on NATS JetStream with SQLite and content-addressed storage, headless-Chrome rendering, SSRF-checked redirects and volunteer workers over Tailscale; collected 181,755 live captures.'],
  },
  {
    name: 'PhishGCN', tag: 'Phishing detection and label-quality research', when: '2026',
    points: ['Found 64.7% of phishing-reported live captures were stand-ins, not phishing pages; graph models trained with label-quality controls reached 0.724 PR-AUC (0.847 ROC-AUC) on 1,196 human-audited captures versus 0.614 on feed labels, under site/kit-disjoint evaluation.'],
  },
  {
    name: 'PolySafe / Vergil', tag: 'Reliable drug-interaction ML', when: '2026',
    points: ['Led GNN/Chemprop experiments on 63,472 drug pairs and 964 adverse-event classes; designed unseen-drug and scaffold-OOD splits and tested calibration, weak generalization and statistical abstention limits.'],
  },
  {
    name: 'VCAP / Living Review', tag: 'Faculty-gated AI code review', when: '2026',
    points: ['Co-developed versioned feedback, provenance and human-approval workflows; co-authoring research in preparation on code-comment relocation across 7,200 controlled edits and 2,073 real commit pairs.'],
  },
  {
    name: 'HELIX Lite', tag: 'Parallelizing compiler in Rust', when: '2026',
    points: ['Wrote the full pipeline (Pratt parser, SSA, dependence tests, Cranelift JIT) to prove loops safe before parallelizing them: 5.79× saxpy speedup on 8 threads, with unsafe loops refused and explained.'],
  },
  {
    name: 'Sivana', tag: 'Audio recognition and indexed matching', when: '2025–26',
    points: ['Built a fingerprint matching engine and browser-local WASM flow; calibrated to 76.7% gated recall versus 35% legacy recall at zero false accepts on a small degradation benchmark.'],
  },
]

export function Resume() {
  useEffect(() => { document.title = 'Noel Alex Samuel · Résumé' }, [])
  const ref = referral?.ref
  const site = `${me.site}${ref ? `?ref=${encodeURIComponent(`resume-${ref}`)}` : '?ref=resume'}`
  return (
    <div className="resume-page">
      <nav className="resume-tools" aria-label="Résumé">
        <a href={href({ screen: 'home' })}>← Portfolio</a>
        <a className="btn btn--primary" href={me.resume} download>Download PDF</a>
      </nav>
      <article className="resume">
        <header>
          <h1>{me.legalName}</h1>
          <p className="r-role">AI / ML engineering · Data science · Data systems</p>
          <p className="r-contact">
            <a href={`mailto:${me.email}`}>{me.email}</a>
            <a href={me.linkedin}>LinkedIn</a>
            <a href={me.github}>github.com/Noel-Alex</a>
            <a href={site}>Portfolio: noel-alex.github.io/portfolio</a>
          </p>
        </header>

        <section>
          <h2>Profile</h2>
          <p>AI engineer and final-year B.Tech CSE (Data Science) student with six months of professional experience building GPU-served document AI. Leads R&amp;D across graph ML, trustworthy evaluation and scalable data pipelines, from experiment design to deployment, performance optimization and mentoring.</p>
        </section>

        <section>
          <h2>Professional experience</h2>
          {experience.map(j => (
            <div key={j.org} className="r-item">
              <h3>{j.title} — {j.org}<span>{j.when}</span></h3>
              <ul>{j.points.map(p => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </section>

        <section>
          <h2>Selected projects &amp; research</h2>
          {projects.map(p => (
            <div key={p.name} className="r-item">
              <h3>{p.name} — <em>{p.tag}</em><span>{p.when}</span></h3>
              <ul>{p.points.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </section>

        <section>
          <h2>Education</h2>
          {education.map(e => <p key={e.school} className="r-line"><b>{e.school}</b> {e.detail} · {e.when}{e.note && ` · ${e.note}`}</p>)}
        </section>

        <section>
          <h2>Leadership &amp; achievements</h2>
          {leadership.map(l => <p key={l.title} className="r-line"><b>{l.title} ({l.when})</b> {l.body}</p>)}
        </section>

        <section>
          <h2>Technical skills &amp; certification</h2>
          {skills.map(([k, v]) => <p key={k} className="r-line"><b>{k}</b> {v}</p>)}
          <p className="r-line"><b>Certification</b> {certification}</p>
        </section>
      </article>
    </div>
  )
}
