import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Compass,
  ExternalLink,
  Github,
  Mail,
  MapPin,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { projects, socialLinks, stretchySystems } from './content'

const baseAsset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '')

type RouterValue = { pathname: string; navigate: (to: string) => void }
const RouterContext = createContext<RouterValue | null>(null)

function routeFromWindow() {
  const raw = window.location.pathname.startsWith(routerBase) ? window.location.pathname.slice(routerBase.length) : window.location.pathname
  return raw || '/'
}

function PortfolioRouter({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(routeFromWindow)
  useEffect(() => {
    const onPopState = () => setPathname(routeFromWindow())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const navigate = (to: string) => {
    const [nextPath, hash] = to.split('#')
    window.history.pushState({}, '', `${routerBase}${nextPath === '/' ? '/' : nextPath}${hash ? `#${hash}` : ''}`)
    setPathname(nextPath || '/')
    if (hash) window.setTimeout(() => document.getElementById(hash)?.scrollIntoView(), 40)
  }
  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>
}

function useRouter() {
  const router = useContext(RouterContext)
  if (!router) throw new Error('Portfolio router is missing')
  return router
}

function useLocation() { return { pathname: useRouter().pathname } }
function useNavigate() { return useRouter().navigate }

type LinkProps = Omit<ComponentProps<'a'>, 'href'> & { to: string }
function Link({ to, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter()
  const href = `${routerBase}${to === '/' ? '/' : to}`
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return <a {...props} href={href} onClick={follow} />
}

function NavLink({ to, end = false, className = '', ...props }: LinkProps & { end?: boolean }) {
  const { pathname } = useRouter()
  const active = end ? pathname === to : pathname.startsWith(to)
  return <Link {...props} to={to} className={`${className} ${active ? 'active' : ''}`.trim()} />
}

const worlds = [
  { to: '/projects/stretchy', eyebrow: 'ACTIVE WORLD', title: 'Stretchy', note: 'An evidence city', artifact: 'artifact-stretchy.webp', tone: 'moss' },
  { to: '/projects', eyebrow: '4 BUILDS', title: 'The Workshop', note: 'Systems and tools', artifact: 'artifact-kargo.webp', tone: 'copper' },
  { to: '/research', eyebrow: 'EXPERIMENT', title: 'Below Bedrock', note: 'Arachne + PhishGuard', artifact: 'artifact-arachne.webp', tone: 'sculk' },
  { to: '/community', eyebrow: 'MULTIPLAYER', title: 'GDG Village', note: 'Events and people', artifact: 'artifact-kermit.webp', tone: 'sun' },
] as const

const navigation = [
  ['/', 'Spawn', 'A sunlit introduction'],
  ['/player', 'Player', 'The person behind the builds'],
  ['/projects', 'Workshop', 'Projects and case studies'],
  ['/research', 'Below bedrock', 'Crawler and graph research'],
  ['/community', 'GDG village', 'Teaching, events, community'],
  ['/contact', 'The portal', 'Start a conversation'],
] as const

function Artifact({ file, alt = '' }: { file: string; alt?: string }) {
  return <img className="artifact" src={baseAsset(file)} alt={alt} />
}

let loadedInThisVisit = false

function TerrainLoader() {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(() => {
    try {
      return !loadedInThisVisit && sessionStorage.getItem('noel-world-loaded') !== 'yes'
    } catch {
      return !loadedInThisVisit
    }
  })

  useEffect(() => {
    if (!visible) return
    const timeout = window.setTimeout(() => {
      loadedInThisVisit = true
      try { sessionStorage.setItem('noel-world-loaded', 'yes') } catch { /* storage can be unavailable */ }
      setVisible(false)
    }, reduced ? 350 : 1950)
    return () => window.clearTimeout(timeout)
  }, [reduced, visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="terrain-loader" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <div className="dirt-noise" aria-hidden="true" />
          <div className="terrain-status" role="status">
            <strong>Loading terrain...</strong>
            <div className="terrain-progress"><motion.i initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: reduced ? 0.2 : 1.65, ease: 'linear' }} /></div>
            <span>Preparing Noel's world</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function PixelAtmosphere({ count = 16 }: { count?: number }) {
  return <div className="pixel-atmosphere" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}</div>
}

function CompassMenu({ open, close }: { open: boolean; close: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="compass-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="compass-menu__map" initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="menu-heading"><span>WORLD MAP</span><button onClick={close} aria-label="Close world map"><X /></button></div>
            <div className="map-route" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <nav aria-label="Portfolio worlds">
              {navigation.map(([to, title, note], index) => (
                <NavLink to={to} key={to} end={to === '/'} onClick={close} style={{ '--route': index } as CSSProperties}>
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><small>{note}</small><ArrowRight />
                </NavLink>
              ))}
            </nav>
            <p>Tip: use W / S on the spawn screen to choose a world.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FloatingHUD({ sound, onSound }: { sound: boolean; onSound: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <Link className="floating-name" to="/" aria-label="Noel Alex, back to spawn">
        <span className="avatar-block"><i /><b /></span>
        <span><strong>NOEL ALEX</strong><small><i /> open to opportunities</small></span>
      </Link>
      <div className="floating-controls">
        <button onClick={onSound} aria-label={sound ? 'Mute ambient music' : 'Play ambient music'} title={sound ? 'Mute ambient music' : 'Play ambient music'}>
          {sound ? <Volume2 /> : <VolumeX />}<span>{sound ? 'Ambient on' : 'Ambient off'}</span>
        </button>
        <button className="compass-button" onClick={() => setMenuOpen(true)} aria-label="Open world map"><Compass /><span>World map</span></button>
      </div>
      <CompassMenu open={menuOpen} close={() => setMenuOpen(false)} />
    </>
  )
}

function PageFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.main
      id="main-content"
      className={`page ${className}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 8% 0)', y: 12 }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: reduced ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

function Scene({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty('--mx', `${x}`)
    event.currentTarget.style.setProperty('--my', `${y}`)
  }
  return <section className={`scene ${className}`} onPointerMove={handlePointer}>{children}</section>
}

function HomePage() {
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (['w', 'a', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
        event.preventDefault(); setSelected((value) => (value + worlds.length - 1) % worlds.length)
      }
      if (['s', 'd', 'ArrowDown', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); setSelected((value) => (value + 1) % worlds.length)
      }
      if (event.key === 'Enter') navigate(worlds[selected].to)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate, selected])

  return (
    <PageFrame className="spawn-page">
      <Scene className="spawn-scene">
        <div className="sky-glow" aria-hidden="true" />
        <div className="block-cloud cloud-one" aria-hidden="true"><i /><i /><i /></div>
        <div className="block-cloud cloud-two" aria-hidden="true"><i /><i /></div>
        <PixelAtmosphere count={22} />
        <div className="spawn-landscape" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="spawn-copy">
          <motion.span className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>JAVA EDITION / VIT VELLORE / 2027</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            I build curious<br /><em>worlds for people.</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
            I'm Noel Alex: data science student, systems builder, researcher, community leader, and enthusiastic over-engineer of Minecraft servers.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Link className="primary-action" to="/projects"><span>Explore my builds</span><ArrowRight /></Link>
            <Link className="text-action" to="/player">Meet the player <ArrowRight /></Link>
          </motion.div>
          <motion.small className="availability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}><i /> Remote / Riyadh / Abu Dhabi / Dubai / US</motion.small>
        </div>

        <motion.div className="cave-window" initial={{ opacity: 0, scale: 0.93, rotate: 1.5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.35, duration: 0.9 }}>
          <div className="window-image"><img src={baseAsset('minecraft-cave.webp')} alt="A vast, sunlit cave in Noel's Minecraft world" /></div>
          <div className="window-tag"><span>NOEL'S SURVIVAL WORLD</span><strong>Some ideas need a bigger cave.</strong></div>
          <i className="window-depth" aria-hidden="true" />
        </motion.div>

        <div className="world-dock" aria-label="Choose a world">
          <div className="dock-intro"><span>SELECT WORLD</span><small><kbd>W</kbd><kbd>S</kbd> then Enter</small></div>
          <div className="world-cards">
            {worlds.map((world, index) => (
              <Link
                className={`world-card world-card--${world.tone} ${selected === index ? 'is-selected' : ''}`}
                to={world.to}
                key={world.to}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
              >
                <span className="world-number">0{index + 1}</span>
                <Artifact file={world.artifact} />
                <span className="world-card__copy"><small>{world.eyebrow}</small><strong>{world.title}</strong><em>{world.note}</em></span>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
        <a className="scroll-cue" href="#spawn-after"><span>Continue the journey</span><ChevronDown /></a>
      </Scene>

      <section id="spawn-after" className="spawn-after">
        <Reveal className="manifesto">
          <span className="eyebrow">THE PLAY STYLE</span>
          <h2>Systems thinking.<br />Research instincts.<br /><em>Multiplayer energy.</em></h2>
          <p>I like hard problems with real moving parts. The work gets technical; the reason for doing it stays human.</p>
        </Reveal>
        <Reveal className="spawn-trail" delay={0.12}>
          <article><span>01</span><strong>Explore</strong><p>Go deep enough to understand the terrain, not just name it.</p></article>
          <article><span>02</span><strong>Build</strong><p>Turn uncertainty into a working system and learn from what breaks.</p></article>
          <article><span>03</span><strong>Bring people</strong><p>Teach, organise, collaborate, and make the party stronger.</p></article>
        </Reveal>
      </section>
    </PageFrame>
  )
}

function SectionIntro({ kicker, title, copy }: { kicker: string; title: React.ReactNode; copy: string }) {
  return <header className="section-intro"><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{copy}</p></header>
}

function PlayerPage() {
  return (
    <PageFrame className="player-page">
      <PixelAtmosphere count={12} />
      <div className="page-shell">
        <SectionIntro kicker="PLAYER PROFILE / NOOEEELLLL123" title={<>Curiosity starts the build.<br /><em>People make it matter.</em></>} copy="Noel grew up in Riyadh and now studies Computer Science with a specialization in Data Science at VIT Vellore, graduating in 2027." />
        <section className="player-story">
          <Reveal className="portal-memory">
            <img src={baseAsset('minecraft-end-portal.webp')} alt="Noel and friends in a stronghold before fighting the Ender Dragon" />
            <figcaption><span>PARTY MEMORY / JAVA SURVIVAL</span><strong>Before the Ender Dragon.</strong><p>The best worlds are the ones friends build together.</p></figcaption>
          </Reveal>
          <Reveal className="player-note" delay={0.1}>
            <span className="note-pin" aria-hidden="true" />
            <p className="hand-note">Builder. Researcher. People person. Frequently distracted by a very good cave.</p>
            <h2>Engineering,<br /><em>but with dragons.</em></h2>
            <p>Noel and his friends create huge survival builds, explore modpacks with bosses and dragons, and automate gloriously unnecessary production lines.</p>
            <p>He even tuned a Raspberry Pi to host a modded Java server over Tailscale.</p>
            <div className="tag-row"><span>Java Edition</span><span>Create</span><span>Raspberry Pi</span><span>Tailscale</span></div>
          </Reveal>
        </section>
        <section className="player-traits">
          {[
            ['01', 'Systems', 'Drawn to projects with too many moving parts: distributed crawlers, evidence systems, AI tools, and infrastructure.'],
            ['02', 'Leadership', 'A former Head Boy and now Senior Core Member helping lead GDG VIT\'s AI/ML domain.'],
            ['03', 'Curiosity', 'Sports, strength training, philosophy, debate, unfamiliar research, games, and ambitious builds.'],
            ['04', 'People', 'Earn trust, make the group work better, and create room for other people to grow.'],
          ].map(([number, title, copy], index) => <Reveal className="trait" delay={index * 0.06} key={title}><span>{number}</span><strong>{title}</strong><p>{copy}</p></Reveal>)}
        </section>
      </div>
    </PageFrame>
  )
}

const workshopProjects = [projects[0], projects[1], projects[2], projects[3]]
const projectRoutes = ['/projects/stretchy', '/projects/ultrachat', '/projects/kargo', '/projects#first-build']

function ProjectIndexPage() {
  const [selected, setSelected] = useState(0)
  const project = workshopProjects[selected]
  return (
    <PageFrame className="workshop-page">
      <div className="workshop-sun" aria-hidden="true" />
      <PixelAtmosphere count={18} />
      <div className="page-shell">
        <SectionIntro kicker="THE WORKSHOP / FOUR BUILDS" title={<>Every project is<br /><em>a world of its own.</em></>} copy="Pick up an artifact. Each opens into the decisions, architecture, contribution boundary, and honest caveats behind the build." />
        <section className="artifact-shelf" aria-label="Project artifacts">
          {workshopProjects.map((item, index) => (
            <button key={item.slug} className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)}>
              <span className="shelf-index">0{index + 1}</span><span className="artifact-plinth"><Artifact file={item.artifact} /></span><strong>{item.title}</strong><small>{item.number}</small>
            </button>
          ))}
        </section>
        <AnimatePresence mode="wait">
          <motion.section className="artifact-story" key={project.slug} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.38 }}>
            <div className="artifact-story__title"><span>{project.status}</span><h2>{project.title}</h2><p>{project.summary}</p></div>
            <div className="artifact-story__role"><span>NOEL'S PART</span><p>{project.contribution}</p><div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div>
            {selected < 3 ? <Link className="primary-action" to={projectRoutes[selected]}><span>Enter case study</span><ArrowRight /></Link> : <a className="primary-action" href="#first-build"><span>Open memory</span><ArrowRight /></a>}
          </motion.section>
        </AnimatePresence>
        <Reveal className="first-build" delay={0.1}>
          <div className="jukebox-glow"><Artifact file="artifact-kermit.webp" /><i /><i /><i /></div>
          <div id="first-build"><span className="eyebrow">THE FIRST CONTRAPTION / GRADE 11</span><h2>A Discord bot built<br />one command at a time.</h2><p>Before Noel properly knew Python, an experiment became the bot his friends genuinely used for music, games, moderation, and online-class reminders. Private, imperfect, and still a favourite because it made a difficult year more fun.</p></div>
        </Reveal>
      </div>
    </PageFrame>
  )
}

function BackToWorkshop() {
  return <Link className="back-link" to="/projects"><ArrowLeft /> Back to workshop</Link>
}

function StretchyPage() {
  const [room, setRoom] = useState(0)
  const current = stretchySystems[room]
  return (
    <PageFrame className="stretchy-page case-page">
      <div className="ancient-haze" aria-hidden="true" /><PixelAtmosphere count={22} />
      <div className="case-shell">
        <BackToWorkshop />
        <header className="case-hero stretchy-hero">
          <div><span className="eyebrow">ACTIVE WORLD / SOLO BUILD</span><h1>Stretchy</h1><p>A local-first investigation platform for enormous, mixed-media archives. Evidence enters with identity and leaves with receipts.</p><div className="case-actions"><a href="https://noel-alex.github.io/stretchy/" target="_blank" rel="noreferrer">Open preview <ExternalLink /></a><a href="https://github.com/Noel-Alex/stretchy" target="_blank" rel="noreferrer"><Github /> Source</a></div></div>
          <div className="stretchy-core"><Artifact file="artifact-stretchy.webp" /><span>CANONICAL<br />EVIDENCE CORE</span>{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ '--beam': index } as CSSProperties} />)}</div>
        </header>

        <section className="evidence-journey">
          <div className="journey-rail" aria-label="Stretchy system rooms">
            {stretchySystems.map((system, index) => <button className={room === index ? 'is-active' : ''} onClick={() => setRoom(index)} key={system.id}><span>{system.icon}</span><strong>{system.room}</strong><i /></button>)}
          </div>
          <AnimatePresence mode="wait">
            <motion.article className="journey-copy" key={current.id} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.4 }}>
              <span>ROOM {current.icon} / 06 <i /> VERIFIED</span><h2>{current.title}</h2><p>{current.copy}</p><ul>{current.details.map((detail) => <li key={detail}><i />{detail}</li>)}</ul>
            </motion.article>
          </AnimatePresence>
          <div className="receipt-stream" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ '--receipt': index } as CSSProperties} />)}</div>
        </section>

        <Reveal className="stretchy-scale">
          <span className="eyebrow">WHY IT BECAME A CITY</span><h2>One crawler was never the project.</h2>
          <p>Stretchy spans a Rust scanner, Python control plane and workers, PostgreSQL canonical records, Qdrant retrieval, a bounded evidence graph, durable Temporal investigations, source-bound agent dossiers, telemetry, review workflows, security boundaries, and an editorial command centre.</p>
          <div><span>RUST SCANNER</span><span>DURABLE WORKFLOWS</span><span>HYBRID RETRIEVAL</span><span>EVIDENCE GRAPH</span><span>AGENT LINEAGE</span><span>REPORTING</span></div>
        </Reveal>

        <section className="truth-boundary">
          <header><span className="eyebrow">HONEST WORLD BOUNDARY</span><h2>Built, provisional,<br />and still outside the gate.</h2></header>
          <div>
            <article><span>01 / VERIFIED</span><strong>The foundation exists.</strong><p>Ingestion, provenance, retrieval machinery, bounded graphs, durable workflows, telemetry, review, security, and reporting are implemented and tested.</p></article>
            <article><span>02 / PROVISIONAL</span><strong>Models still need promotion evidence.</strong><p>Dense model selection remains tied to a human-authored golden retrieval set. Sparse-only search is never relabelled as hybrid.</p></article>
            <article><span>03 / EXTERNAL GATE</span><strong>Field acceptance is not a demo.</strong><p>A real remote-worker field run and an owner-approved full-corpus campaign remain outside the public demonstration boundary.</p></article>
          </div>
        </section>
      </div>
    </PageFrame>
  )
}

const ultraSteps = [
  ['Collect', 'Server-scoped messages enter the knowledge path.'],
  ['Compact', 'Long histories become useful summaries.'],
  ['Index', 'Embeddings enter vector-backed collections.'],
  ['Retrieve', 'Commands recover the relevant context.'],
  ['Answer', 'A useful response returns to Discord.'],
] as const

function UltraChatPage() {
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (step < 0 || step >= ultraSteps.length) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), 600)
    return () => window.clearTimeout(timer)
  }, [step])
  return (
    <PageFrame className="ultra-page case-page">
      <PixelAtmosphere count={24} />
      <div className="case-shell">
        <BackToWorkshop />
        <header className="case-hero ultra-hero"><div><span className="eyebrow">GDG VIT / COLLABORATIVE</span><h1>UltraChat</h1><p>A Discord companion that helps a community remember, summarise, and retrieve its own conversations.</p></div><div className="enchanted-book"><Artifact file="artifact-ultrachat.webp" /><i /><i /><i /><i /></div></header>
        <section className="chat-enchantment">
          <div className="discord-scroll">
            <header><i /> # project-help <span>3 adventurers online</span></header>
            <p><b>N</b><span><strong>Noel</strong>Can someone find the deployment discussion from last week?</span></p>
            <p className={step >= 4 ? 'bot-message is-visible' : 'bot-message'}><b>U</b><span><strong>UltraChat</strong>I found the relevant context across four channel summaries.</span></p>
            <small>{step >= 0 && step < 5 ? `UltraChat is ${ultraSteps[Math.min(step, 4)][0].toLowerCase()}ing...` : 'Pull the lever to replay the knowledge path.'}</small>
          </div>
          <div className="enchantment-path">
            {ultraSteps.map(([title, copy], index) => <article className={step >= index ? 'is-lit' : ''} key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{copy}</p><i /></article>)}
          </div>
          <button className="redstone-lever" onClick={() => setStep(0)}><span><i /></span><strong>{step >= 0 && step < ultraSteps.length ? 'WORKING...' : 'PULL TO REPLAY'}</strong></button>
        </section>
        <section className="case-contribution"><div><span className="eyebrow">NOEL'S BUILD PATH</span><h2>From messages to memory.</h2></div><div><p>Collection and Discord commands, long-text summarisation, vector storage and RAG querying, backend integration, prompts, and containerisation. A later personal AWS variant explored a separate Go backend with DynamoDB.</p><div className="source-links">{projects[1].links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink /></a>)}</div></div></section>
      </div>
    </PageFrame>
  )
}

const kargoSteps = [
  ['Shallow clone', 'Bound the repository before inspection.'],
  ['Source map', 'Select relevant extensions and structure.'],
  ['Runtime clues', 'Find ports, persistence, uploads, and paths.'],
  ['Docker proposal', 'Turn repository evidence into configuration.'],
] as const

function KargoPage() {
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (step < 0 || step >= kargoSteps.length) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), 650)
    return () => window.clearTimeout(timer)
  }, [step])
  return (
    <PageFrame className="kargo-page case-page">
      <PixelAtmosphere count={16} />
      <div className="case-shell">
        <BackToWorkshop />
        <header className="case-hero kargo-hero"><div><span className="eyebrow">GDG VIT / COLLABORATIVE</span><h1>Kargo</h1><p>A platform for carrying repositories through container configuration and into managed application deployments.</p></div><div className="copper-cog" aria-hidden="true"><i /><Artifact file="artifact-kargo.webp" /></div></header>
        <section className="kargo-factory">
          <div className="repo-ticket"><span>REPOSITORY INPUT</span><code>github.com/you/app</code><button onClick={() => setStep(0)}>Start inspection <Play /></button></div>
          <div className="rail-line"><i /><motion.div className="cargo-cart" animate={{ left: step < 0 ? '2%' : `${Math.min(step, 3) * 30 + 7}%` }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}><Artifact file="artifact-kargo.webp" /></motion.div></div>
          <div className="factory-stations">{kargoSteps.map(([title, copy], index) => <article className={step >= index ? 'is-powered' : ''} key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{copy}</p><i /></article>)}</div>
          <div className={step >= kargoSteps.length ? 'factory-crate is-ready' : 'factory-crate'}><span>OUTPUT CRATE</span><strong>Dockerfile + Compose proposal</strong><small>backed by repository signals, ready for review</small></div>
        </section>
        <section className="case-contribution"><div><span className="eyebrow">NOEL'S CONTRIBUTION</span><h2>The repository inspection path.</h2></div><div><p>Bounded cloning, extension-aware source selection, folder mapping, codebase summarisation, port discovery, and persistent-volume signals used by the Dockerisation flow. Kargo was collaborative, and much of that work happened beyond individual commit history.</p><div className="source-links">{projects[2].links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink /></a>)}</div></div></section>
      </div>
    </PageFrame>
  )
}

function ResearchPage() {
  const [mode, setMode] = useState<'crawler' | 'model'>('crawler')
  const [pulse, setPulse] = useState(0)
  return (
    <PageFrame className="research-page">
      <PixelAtmosphere count={28} />
      <div className="page-shell">
        <SectionIntro kicker="BELOW BEDROCK / SOLO EXPERIMENT" title={<>A crawler became<br /><em>a research instrument.</em></>} copy="Arachne was Noel's first serious systems-design experiment. It later collected DOM structure for a graph model that distinguishes phishing pages from legitimate ones." />
        <div className="research-switch"><button className={mode === 'crawler' ? 'is-active' : ''} onClick={() => setMode('crawler')}>01 / Crawler</button><button className={mode === 'model' ? 'is-active' : ''} onClick={() => setMode('model')}>02 / PhishGuard</button></div>
        <AnimatePresence mode="wait">
          {mode === 'crawler' ? (
            <motion.section className="research-lab crawler-lab" key="crawler" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <div className="web-viz" onClick={() => setPulse((value) => value + 1)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setPulse((value) => value + 1)}>
                <span>CLICK TO SEND A URL</span><Artifact file="artifact-arachne.webp" />
                {Array.from({ length: 14 }, (_, index) => <i key={`${pulse}-${index}`} style={{ '--node': index } as CSSProperties} />)}
              </div>
              <div className="lab-copy"><span className="eyebrow">SYSTEMS DESIGN FIRST</span><h2>A horizontally scalable crawler.</h2><p>Arachne separated coordination, crawling, queueing, and persistence so work could scale horizontally. The immediate research dataset never approached its intended ceiling; learning the architecture was part of the point.</p><a href="https://github.com/Noel-Alex/Arachne" target="_blank" rel="noreferrer">Inspect source <ExternalLink /></a></div>
              <div className="crawler-route">{['URL frontier', 'Kafka queue', 'Rust workers', 'Result queue', 'Coordinator + ScyllaDB'].map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong>{index < 4 && <ArrowRight />}</div>)}</div>
            </motion.section>
          ) : (
            <motion.section className="research-lab model-lab" key="model" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <div className="graph-orb"><strong>GAT</strong><span>DOM topology<br />+ URL features</span>{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--node': index } as CSSProperties} />)}</div>
              <div className="model-stat"><span>COLLECTED EXAMPLES</span><strong>68,175</strong><small>57,206 safe / 10,969 phishing</small></div>
              <div className="model-stat"><span>HELD-OUT SET</span><strong>13,635</strong><small>evaluated examples</small></div>
              <div className="model-stat"><span>PHISHING RECALL</span><strong>0.99</strong><small>experimental result</small></div>
              <div className="model-stat"><span>PHISHING PRECISION</span><strong>0.94</strong><small>experimental result</small></div>
              <aside><span>THE FAILURE MODE MATTERS</span><p>The legitimate class leaned heavily on globally popular, high-quality sites. Rough but legitimate pages were underrepresented, so bare-minimum HTML could be misclassified as phishing. These numbers validate an experiment, not a production detector.</p></aside>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </PageFrame>
  )
}

function CommunityPage() {
  return (
    <PageFrame className="community-page">
      <PixelAtmosphere count={16} />
      <div className="page-shell">
        <SectionIntro kicker="GDG VIT / MULTIPLAYER WORLD" title={<>The best builds<br /><em>are multiplayer.</em></>} copy="Senior Core Member, AI/ML lead in practice, event organiser, technical judge, recruiter, curriculum designer, and friend." />
        <section className="community-photo">
          <Reveal className="event-frame"><img src={baseAsset('devjams-team-srgb.jpg')} alt="Noel and the GDG VIT DevJams team wearing matching Hello Kitty pyjamas" /><span className="noel-pointer"><strong>Noel</strong><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M170 8 C 125 20, 65 52, 12 106" /><path d="M12 106 L 17 87 M 12 106 L 32 103" /></svg></span><figcaption><span>DEVJAMS '25</span><strong>A late-night memory with the team.</strong></figcaption></Reveal>
          <Reveal className="community-ledger" delay={0.12}>
            <span className="eyebrow">THE SERVER LEDGER</span>
            <article><strong>4,700</strong><p>applicants in the process through which Noel joined as the only new AI/ML junior core member.</p></article>
            <article><strong>~5,000</strong><p>applicants helped evaluate later; Noel personally assessed about 256 through tests, projects, and interviews.</p></article>
            <article><strong>400+</strong><p>students reached as sole speaker and curriculum designer for "Inside Google's DeepMind."</p></article>
            <a href={socialLinks.talk} target="_blank" rel="noreferrer"><Play /> Watch the session <ExternalLink /></a>
          </Reveal>
        </section>
        <section className="community-timeline">
          {[
            ['2023', 'Joined the guild', 'Selected into AI/ML, helped build UltraChat, and organised DevJams, Women Techies, and Hexathon.'],
            ['2024-25', 'Built the next season', 'The three major events again, Kargo, judging, technical planning, and recruitment.'],
            ['NOW', 'Senior Core', 'Helping lead AI/ML and selecting the next cohort to carry the community forward.'],
          ].map(([year, title, copy], index) => <Reveal className="timeline-stop" delay={index * 0.08} key={year}><span>{year}</span><strong>{title}</strong><p>{copy}</p><i /></Reveal>)}
        </section>
      </div>
    </PageFrame>
  )
}

function ContactPage() {
  return (
    <PageFrame className="contact-page">
      <PixelAtmosphere count={34} />
      <div className="portal-rings" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="contact-copy">
        <span className="eyebrow">THE PORTAL IS OPEN</span>
        <h1>Let's build something<br /><em>unreasonably good.</em></h1>
        <p>For remote work, ambitious research, systems that need careful thinking, or a serious conversation about Minecraft server optimisation.</p>
        <div className="contact-actions"><a className="primary-action" href={socialLinks.email}><span><Mail /> Email Noel</span><ArrowRight /></a><a href={socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn <ExternalLink /></a><a href={socialLinks.github} target="_blank" rel="noreferrer"><Github /> GitHub</a></div>
        <a className="resume-link" href={`${import.meta.env.BASE_URL}Noel-Alex-Resume.pdf`} target="_blank" rel="noreferrer">Open creative resume <ExternalLink /></a>
        <small><MapPin /> Open to remote work and opportunities in Riyadh, Abu Dhabi, Dubai, and the US.</small>
      </section>
    </PageFrame>
  )
}

function NotFound() {
  return <PageFrame className="not-found"><div><span className="eyebrow">WORLD NOT FOUND</span><h1>You fell out of the map.</h1><Link className="primary-action" to="/"><span>Respawn</span><ArrowRight /></Link></div></PageFrame>
}

function RouteStage() {
  const location = useLocation()
  const page = (() => {
    switch (location.pathname) {
      case '/': return <HomePage />
      case '/player': return <PlayerPage />
      case '/projects': return <ProjectIndexPage />
      case '/projects/stretchy': return <StretchyPage />
      case '/projects/ultrachat': return <UltraChatPage />
      case '/projects/kargo': return <KargoPage />
      case '/research': return <ResearchPage />
      case '/community': return <CommunityPage />
      case '/contact': return <ContactPage />
      default: return <NotFound />
    }
  })()
  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>{page}</div>
    </AnimatePresence>
  )
}

function RoutedApp() {
  const [sound, setSound] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    if (!audio.current) return
    audio.current.volume = 0.18
    if (sound) void audio.current.play().catch(() => setSound(false))
    else audio.current.pause()
  }, [sound])
  return (
    <>
      <audio ref={audio} src={baseAsset('into-the-caves.mp3')} loop preload="none" />
      <FloatingHUD sound={sound} onSound={() => setSound((value) => !value)} />
      <ScrollToTop />
      <TerrainLoader />
      <RouteStage />
    </>
  )
}

export default function App() {
  return <PortfolioRouter><RoutedApp /></PortfolioRouter>
}
