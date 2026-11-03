import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/400-italic.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans-condensed/500.css'
import '@fontsource/ibm-plex-sans-condensed/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
// each project's name is set in its own typeface on the index
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/chakra-petch/latin-700.css'
import './site.css'
import { lazy, Suspense, useEffect, useState, type ComponentType, type CSSProperties, type LazyExoticComponent } from 'react'
import { track } from '../analytics'
import { setPreloader, useRoute } from '../ui/router'
import { caseById, cases, type Case } from './cases'
import { Arrow, Diorama, Go, SiteBar } from './kit'
import { mail, resumeClick, useSectionViews } from './util'
import { certification, education, experience, leadership, me, openTo, skills } from './profile'
import { Resume } from './Resume'

// each project page is its own small world, loaded on demand
type PageModule = { default: ComponentType<{ c: Case }> }
const loaders: Record<string, () => Promise<PageModule>> = {
  arachne: () => import('./pages/Arachne'),
  phishgcn: () => import('./pages/PhishGCN'),
  stretchy: () => import('./pages/Stretchy'),
  helix: () => import('./pages/Helix'),
  polysafe: () => import('./pages/PolySafe'),
  sivana: () => import('./pages/Sivana'),
  aster: () => import('./pages/Aster'),
  petra: () => import('./pages/Petra'),
  kargo: () => import('./pages/Kargo'),
  ultrachat: () => import('./pages/UltraChat'),
}
const pages: Record<string, LazyExoticComponent<ComponentType<{ c: Case }>>> = Object.fromEntries(Object.entries(loaders).map(([id, load]) => [id, lazy(load)]))
// a route change waits for (at most) the page it is heading to, so the cross-fade never captures a blank screen
setPreloader(r => (r.screen === 'project' ? loaders[r.id]?.() : undefined))

function OpenBar() {
  return (
    <aside className="openbar" aria-label="Availability">
      <p><b>Open to work</b> <span>{openTo.roles.join(' · ')}</span> <span className="openbar-where">{openTo.places} · {openTo.when}</span></p>
      <p className="openbar-actions">
        <a href={`mailto:${me.email}`} onClick={mail('openbar')}>Email</a>
        <a href={me.resume} target="_blank" rel="noreferrer" onClick={resumeClick('openbar')}>Résumé</a>
      </p>
    </aside>
  )
}

// ------------------------------------------------------------------- gate
function Gate() {
  useEffect(() => { document.title = 'Noel Alex' }, [])
  const choose = (to: 'portfolio' | 'world') => () => track('gate_choice', { to })
  return (
    <div className="gate">
      <OpenBar />
      <main id="main-content" className="doors">
        <Go to={{ screen: 'home' }} className="door door--read" onClick={choose('portfolio')}>
          <h1>Noel Alex</h1>
          <p className="door-role">{me.role}</p>
          <ol className="door-index" aria-hidden="true">
            {cases.filter(c => !c.team).map(c => <li key={c.id} className={`face face--${c.id}`}>{c.name}</li>)}
          </ol>
          <span className="door-cta">Read the portfolio <Arrow /></span>
        </Go>
        <Go to={{ screen: 'title' }} className="door door--world" onClick={choose('world')}>
          <Diorama id="spawn" className="door-isle" eager />
          <span className="door-cta door-cta--mc">Enter the world <Arrow /></span>
        </Go>
      </main>
    </div>
  )
}

// ------------------------------------------------------------------- home
function WorkIndex() {
  const [active, setActive] = useState(cases[0].id)
  return (
    <div className="index">
      <ol className="index-list">
        {cases.map((c, i) => (
          <li key={c.id} style={{ '--tone': c.accent } as CSSProperties} onMouseEnter={() => setActive(c.id)} onFocus={() => setActive(c.id)}>
            <Go
              to={{ screen: 'project', id: c.id }}
              className={`index-row ${active === c.id ? 'is-active' : ''}`}
              onClick={() => track('project_click', { id: c.id, from: 'index' })}
            >
              <span className="index-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="index-main">
                <span className={`index-name face face--${c.id}`}>{c.name}</span>
                <span className="index-summary">{c.summary}</span>
              </span>
              <span className="index-result"><b>{c.headline[0]}</b> {c.headline[1]}</span>
              <Diorama id={c.id} className="index-thumb" />
            </Go>
          </li>
        ))}
      </ol>
      <div className="index-stage" aria-hidden="true">
        {cases.map(c => <Diorama key={c.id} id={c.id} className={active === c.id ? 'is-on' : ''} />)}
      </div>
    </div>
  )
}

function Home() {
  useEffect(() => { document.title = 'Noel Alex · Portfolio' }, [])
  useSectionViews()
  return (
    <div className="home-page">
      <OpenBar />
      <SiteBar />
      <main id="main-content" className="home">
        <section className="hero">
          <div className="hero-text">
            <h1 className="hero-name">Noel Alex</h1>
            <p className="hero-intro">{me.intro}</p>
            <ul className="hero-facts">
              <li>AI Engineer (contract), Blackridge / Stravah · 2026</li>
              <li>B.Tech CSE (Data Science), VIT Vellore ’27</li>
              <li>Senior Technical Member, GDG VIT AI/ML</li>
            </ul>
            <p className="hero-actions">
              <a className="btn btn--primary" href={`mailto:${me.email}`} onClick={mail('hero')}>Email me</a>
              <a className="btn" href={me.resume} target="_blank" rel="noreferrer" onClick={resumeClick('hero')}>Résumé (PDF)</a>
              <a className="btn btn--quiet" href={me.github} target="_blank" rel="noreferrer">GitHub</a>
              <a className="btn btn--quiet" href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </p>
          </div>
          <Go to={{ screen: 'title' }} className="hero-isle" onClick={() => track('world_link', { from: 'hero' })} label="Walk the portfolio as a 3D world">
            <Diorama id="spawn" eager />
            <span>Walk it in 3D <Arrow /></span>
          </Go>
        </section>

        <section id="work" className="section" aria-labelledby="work-h">
          <h2 id="work-h" className="section-h">Work</h2>
          <WorkIndex />
        </section>

        <section id="experience" className="section" aria-labelledby="exp-h">
          <h2 id="exp-h" className="section-h">Experience</h2>
          {experience.map(j => (
            <article key={j.org} className="job">
              <header><h3>{j.title}</h3><p>{j.org} · {j.when}</p></header>
              <ul>{j.points.map(p => <li key={p}>{p}</li>)}</ul>
            </article>
          ))}
        </section>

        <section id="about" className="section about" aria-labelledby="about-h">
          <h2 id="about-h" className="section-h">About</h2>
          <div className="about-grid">
            <div className="about-prose">
              <p>I grew up in Riyadh and I’m finishing Computer Science with a Data Science specialization at VIT Vellore. The thread through my work is evidence: systems that keep the source of every claim, benchmarks that report their limits, and evaluations designed so a good number can’t come from a leaky split.</p>
              <p>Off the clock: modded Minecraft on hardware that has no business running it, strength training, philosophy and debate. That’s why this site also comes as a Minecraft world.</p>
              <figure className="photo">
                <img src={`${import.meta.env.BASE_URL}assets/devjams-team-srgb.jpg`} alt="The GDG VIT DevJams 2025 organising team on stage in matching pyjama trousers" loading="lazy" />
                <figcaption>DevJams ’25 with the GDG VIT team.</figcaption>
              </figure>
            </div>
            <div className="about-side">
              <h3>Leadership</h3>
              <dl className="ledger">
                {leadership.map(l => (
                  <div key={l.title}><dt>{l.title}<span>{l.when}</span></dt><dd>{l.body}{l.link && <> <a href={l.link.href} target="_blank" rel="noreferrer">{l.link.label}</a></>}</dd></div>
                ))}
              </dl>
              <h3>Education</h3>
              <dl className="ledger">
                {education.map(e => <div key={e.school}><dt>{e.school}<span>{e.when}</span></dt><dd>{e.detail}{e.note && ` · ${e.note}`}</dd></div>)}
              </dl>
              <h3>Skills</h3>
              <dl className="ledger">
                {skills.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                <div><dt>Certified</dt><dd>{certification}</dd></div>
              </dl>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer" id="contact">
        <h2>Let’s talk.</h2>
        <a className="footer-mail" href={`mailto:${me.email}`} onClick={mail('footer')}>{me.email}</a>
        <p className="footer-links">
          <a href={me.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={me.resume} target="_blank" rel="noreferrer" onClick={resumeClick('footer')}>Résumé (PDF)</a>
          <Go to={{ screen: 'title' }}>Walk the island in 3D</Go>
        </p>
        <p className="footer-fine">Anonymous analytics (PostHog) help me improve this site. Minecraft fan art; not affiliated with Mojang or Microsoft.</p>
      </footer>
    </div>
  )
}

function NotFound() {
  useEffect(() => { document.title = 'Not found · Noel Alex' }, [])
  return (
    <div className="home-page">
      <SiteBar />
      <main id="main-content" className="lost">
        <h1>That page doesn’t exist.</h1>
        <Go to={{ screen: 'home' }} className="btn">See all work <Arrow /></Go>
      </main>
    </div>
  )
}

function Project({ id }: { id: string }) {
  const c = caseById(id)
  const Page = pages[id]
  if (!c || !Page) return <NotFound />
  return <Suspense fallback={<div className="page-loading" />}><Page c={c} /></Suspense>
}

export default function Site() {
  const route = useRoute()
  // page changes restore their own scroll position (see ui/router.ts)
  useEffect(() => { window.history.scrollRestoration = 'manual' }, [])
  // in-page anchors after a client-side navigation
  useEffect(() => {
    if (route.screen === 'home' && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
  }, [route])
  switch (route.screen) {
    case 'gate': return <Gate />
    case 'home': return <Home />
    case 'project': return <Project id={route.id} />
    case 'resume': return <Resume />
    default: return <NotFound />
  }
}
