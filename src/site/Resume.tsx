import { useEffect } from 'react'
import { referral } from '../analytics'
import { Go } from './kit'
import { certification, education, experience, me, skills } from './profile'

/**
 * The one-page résumé, rendered from the same data as the site and printed to
 * public/Noel-Alex-Resume.pdf by `npm run resume`. Opening /resume?ref=acme
 * prints a copy whose portfolio link carries that ref.
 */

type Item = { name: string; tag: string; when: string; points: string[] }

const projects: Item[] = [
  {
    name: 'Arachne + PhishGCN', tag: 'Distributed web capture and phishing detection', when: '2025–26',
    points: [
      'Built a Rust crawler and capture platform on NATS JetStream, SQLite and content-addressed zstd storage, with headless Chrome, per-hop SSRF checks and volunteer workers over Tailscale; 203,367 captures in the Oct 2026 snapshot.',
      'Showed most phishing-feed URLs no longer serve a phishing page when fetched (64.7% rule-flagged as stand-ins); training on hand-audited labels lifted PR-AUC from 0.614 to 0.724 (95% CI 0.668–0.780) on 1,196 audited captures, with 61.4% recall at 0.5% false alarms (site/kit-disjoint folds).',
    ],
  },
  {
    name: 'Stretchy + HALO', tag: 'Evidence-grounded retrieval platform and embedding research', when: '2025–26',
    points: [
      'Leading a fault-tolerant Python/Rust pipeline: extraction, PostgreSQL/Temporal orchestration, Qdrant retrieval, provenance.',
      'Inventoried 862,917 files (130.26 GB) in one run with zero read errors; chose the dense embedder by benchmark (288 units/s at 2.25 GiB peak VRAM); HALO re-encoded 5.1× fewer tokens than late chunking on 2,536 real document edits.',
    ],
  },
  {
    name: 'HELIX Lite', tag: 'Parallelizing compiler in Rust (public, runs in the browser)', when: '2026',
    points: ['Wrote the whole pipeline (Pratt parser, type checker, SSA, dependence tests, Cranelift x86-64) to prove loops safe before parallelizing: 5.79× saxpy speedup on 8 threads; unsafe loops are refused, naming the dependence.'],
  },
  {
    name: 'Sivana', tag: 'Audio recognition in Rust and WASM (public)', when: '2025–26',
    points: ['Built a fingerprint engine with a memory-mapped index and in-browser WASM fingerprinting; a calibrated gate recognises 76.7% of degraded clips at zero false accepts (prototype: 35%), at 0.4 ms per match.'],
  },
  {
    name: 'PolySafe / Vergil', tag: 'Reliable drug-interaction ML', when: '2026',
    points: ['Led GNN and Chemprop experiments on 63,472 drug pairs and 964 side-effect classes; built drug-disjoint and scaffold splits, leakage gates and calibration checks, and reported where abstention guarantees failed.'],
  },
  {
    name: 'Living Review / VCAP', tag: 'Code-review comments that survive resubmission', when: '2026',
    points: ['Co-authoring a manuscript: across 7,200 controlled edits and 15,064 real-history observations, missed re-checks fell from 12 to 1 of 2,780 changed targets versus CodeMapper.'],
  },
  {
    name: 'PPLC', tag: 'Privacy layer for LLM context', when: '2026',
    points: ['Co-developed pseudonymization that keeps personal data out of LLM calls and restores it safely in responses: 0 leaks versus 11,052 for global replacement on an authored 11,792-attack benchmark, with all 4,422 benign responses restored.'],
  },
]

export function Resume() {
  useEffect(() => { document.title = 'Noel Alex Samuel · Résumé' }, [])
  const ref = referral?.ref
  const site = `${me.site}${ref ? `?ref=${encodeURIComponent(`resume-${ref}`)}` : '?ref=resume'}`
  return (
    <div className="resume-page">
      <nav className="resume-tools" aria-label="Résumé">
        <Go to={{ screen: 'home' }}>← Portfolio</Go>
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
          <p className="r-contact"><span>Work authorization: India (OCI), Saudi Arabia (Premium Residency)</span><span>Available Jan 2027 for a full-semester onsite internship</span></p>
        </header>

        <section>
          <h2>Profile</h2>
          <p>Final-year CSE (Data Science) student with six months of paid AI engineering in retrieval, evaluation and data systems.</p>
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
          <p className="r-line"><b>GDG on Campus VIT · Senior Technical Member, AI/ML (2023–26)</b> Ran AI/ML recruitment: my domain quiz cut a 256-person shortlist to about 80, each set a project and interviewed by me; helped run DevJams and Women Techies.</p>
          <p className="r-line"><b>Inside Google’s DeepMind (Nov 2024)</b> Gave a recorded session for 400+ students, from transformers to AlphaFold.</p>
          <p className="r-line"><b>Head Boy (2022–23)</b> Led student welfare and represented the school at a regional CBSE principals’ conference.</p>
          <p className="r-line"><b>Invention disclosures (2026)</b> Five collaborative disclosures submitted through VIT’s IPR process.</p>
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
