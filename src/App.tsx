import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type MouseEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookOpen, Box, Compass, ExternalLink, Github, Mail, MapPin, Music2, Play, Volume2, VolumeX, X } from 'lucide-react'
import { projects, socialLinks, stretchySystems } from './content'

const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '')

type RouterValue = { pathname: string; navigate: (to: string) => void }
const RouterContext = createContext<RouterValue | null>(null)

function windowRoute() {
  const raw = window.location.pathname.startsWith(routerBase) ? window.location.pathname.slice(routerBase.length) : window.location.pathname
  return raw || '/'
}

function PortfolioRouter({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(windowRoute)
  useEffect(() => {
    const pop = () => setPathname(windowRoute())
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  const navigate = (to: string) => {
    const [path, hash] = to.split('#')
    window.history.pushState({}, '', `${routerBase}${path === '/' ? '/' : path}${hash ? `#${hash}` : ''}`)
    setPathname(path || '/')
    if (hash) window.setTimeout(() => document.getElementById(hash)?.scrollIntoView(), 80)
  }
  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>
}

function useRouter() {
  const value = useContext(RouterContext)
  if (!value) throw new Error('Router missing')
  return value
}

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

const routes = [
  ['/', 'Spawn', 'Overworld'],
  ['/projects', 'Expeditions', 'Builds'],
  ['/projects/stretchy', 'Stretchy', 'Ancient city'],
  ['/projects/ultrachat', 'UltraChat', 'Enchanted library'],
  ['/projects/kargo', 'Kargo', 'Create factory'],
  ['/research', 'Arachne', 'Deep dark'],
  ['/community', 'GDG VIT', 'Village'],
  ['/player', 'Noel', 'Player'],
  ['/contact', 'Contact', 'End portal'],
] as const

const landmarks = [
  { to: '/projects/stretchy', name: 'Stretchy', biome: 'Ancient city', x: 69, y: 27, icon: 'artifact-stretchy.webp', tone: 'sculk' },
  { to: '/projects/ultrachat', name: 'UltraChat', biome: 'Enchanted library', x: 35, y: 24, icon: 'artifact-ultrachat.webp', tone: 'amethyst' },
  { to: '/projects/kargo', name: 'Kargo', biome: 'Create factory', x: 23, y: 67, icon: 'artifact-kargo.webp', tone: 'copper' },
  { to: '/research', name: 'Arachne', biome: 'Below bedrock', x: 75, y: 69, icon: 'artifact-arachne.webp', tone: 'deep' },
  { to: '/community', name: 'GDG Village', biome: 'Multiplayer', x: 50, y: 52, icon: 'artifact-kermit.webp', tone: 'village' },
] as const

function Artifact({ file, alt = '' }: { file: string; alt?: string }) {
  return <img className="artifact" src={asset(file)} alt={alt} />
}

let worldLoaded = false

function WorldGenerationLoader() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(() => {
    try { return !worldLoaded && sessionStorage.getItem('noel-world-v4') !== 'loaded' } catch { return !worldLoaded }
  })

  useEffect(() => {
    if (!visible || !canvas.current) return
    const context = canvas.current.getContext('2d')
    if (!context) return
    context.imageSmoothingEnabled = false
    let frame = 0
    let animation = 0
    const start = performance.now()
    const duration = reduced ? 250 : 2450
    const draw = (now: number) => {
      const ratio = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - ratio, 2.1)
      const percent = Math.min(100, Math.floor(eased * 100))
      if (percent !== frame) { frame = percent; setProgress(percent) }
      context.fillStyle = '#050505'
      context.fillRect(0, 0, 256, 256)
      const radius = 3 + eased * 45
      for (let gy = 0; gy < 64; gy += 1) {
        for (let gx = 0; gx < 64; gx += 1) {
          const dx = gx - 32
          const dy = gy - 32
          const distance = Math.sqrt(dx * dx + dy * dy)
          const noise = Math.sin(gx * 1.71 + gy * .39) * 2.4 + Math.cos(gy * 1.17 - gx * .22) * 1.8
          if (distance > radius + noise) continue
          const value = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233))
          context.fillStyle = value > .82 ? '#c5c5c5' : value > .44 ? '#a6a6a6' : '#8d8d8d'
          context.fillRect(gx * 4, gy * 4, 4, 4)
        }
      }
      context.fillStyle = '#51318f'; context.fillRect(124, 124, 12, 12)
      context.fillStyle = '#3db84a'; context.fillRect(126, 126, 8, 8)
      context.fillStyle = '#1c63ce'; context.fillRect(128, 128, 4, 4)
      context.fillStyle = '#fff'; context.fillRect(129, 129, 2, 2)
      if (ratio < 1) animation = requestAnimationFrame(draw)
      else {
        window.setTimeout(() => {
          worldLoaded = true
          try { sessionStorage.setItem('noel-world-v4', 'loaded') } catch { /* no-op */ }
          setVisible(false)
        }, reduced ? 50 : 420)
      }
    }
    animation = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animation)
  }, [reduced, visible])

  return <AnimatePresence>{visible && (
    <motion.div className="worldgen" exit={{ opacity: 0 }} transition={{ duration: .45 }}>
      <div className="dirt-field" aria-hidden="true" />
      <div className="worldgen-centre" role="status">
        <strong>{progress}%</strong>
        <canvas ref={canvas} width="256" height="256" aria-label="Minecraft-style world generation map" />
        <span>Loading terrain...</span>
      </div>
    </motion.div>
  )}</AnimatePresence>
}

function WorldAtlas({ compact = false, close }: { compact?: boolean; close?: () => void }) {
  return (
    <div className={`world-atlas ${compact ? 'world-atlas--compact' : ''}`}>
      <svg className="atlas-terrain" viewBox="0 0 1000 680" aria-hidden="true">
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeOpacity=".13" /></pattern>
          <filter id="atlas-shadow"><feDropShadow dx="8" dy="10" stdDeviation="0" floodColor="#183126" floodOpacity=".28" /></filter>
        </defs>
        <rect width="1000" height="680" fill="#83cae6" />
        <path className="atlas-land" d="M50 116H134V76H266V100H352V64H459V108H530V82H650V118H757V82H907V129H963V248H931V326H963V449H910V561H803V626H668V598H558V640H438V610H321V636H191V584H84V508H44V399H67V294H40Z" filter="url(#atlas-shadow)" />
        <path className="atlas-sand" d="M58 388H179V340H277V369H343V473H276V535H167V510H76Z" />
        <path className="atlas-deep" d="M650 430H890V570H828V621H680L610 570Z" />
        <path className="atlas-snow" d="M623 103H764V81H905V132H941V226H820V195H708V226H622Z" />
        <path className="atlas-river" d="M471 71C430 169 533 201 494 286C457 368 371 371 402 458C429 533 527 522 507 638" fill="none" stroke="#54a9d4" strokeWidth="42" />
        <path className="atlas-path" d="M221 455C278 395 337 387 457 360C584 332 681 283 743 184M458 363C540 425 630 480 754 514" fill="none" stroke="#d7b775" strokeWidth="12" strokeDasharray="18 10" />
        <g className="forest forest-a">{Array.from({ length: 15 }, (_, i) => <rect key={i} x={95 + (i % 5) * 30} y={135 + Math.floor(i / 5) * 34} width="18" height="24" />)}</g>
        <g className="forest forest-b">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={540 + (i % 4) * 34} y={470 + Math.floor(i / 4) * 31} width="18" height="24" />)}</g>
        <g className="mountains"><path d="M659 174L705 107L747 174Z" /><path d="M705 174L773 80L834 174Z" /><path d="M789 174L844 111L892 174Z" /></g>
        <g className="village-map"><rect x="439" y="306" width="38" height="33"/><path d="M432 307L458 286L484 307Z"/><rect x="493" y="331" width="31" height="38"/><path d="M487 332L508 313L530 332Z"/><rect x="427" y="357" width="29" height="29"/><path d="M422 358L441 342L461 358Z"/></g>
        <rect width="1000" height="680" fill="url(#map-grid)" />
      </svg>
      <div className="atlas-coordinate">SEED / NOOEEELLLL123 <span>XYZ 2027 / 79 / 404</span></div>
      {landmarks.map((place, index) => (
        <Link className={`landmark landmark--${place.tone}`} style={{ '--x': `${place.x}%`, '--y': `${place.y}%`, '--order': index } as CSSProperties} to={place.to} key={place.to} onClick={close}>
          <span className="landmark-beacon"><Artifact file={place.icon} /></span>
          <span className="landmark-label"><small>{place.biome}</small><strong>{place.name}</strong><em>Enter world <ArrowRight /></em></span>
        </Link>
      ))}
      <div className="atlas-player" aria-hidden="true"><i /><span>YOU ARE HERE</span></div>
    </div>
  )
}

function WorldMenu({ open, close }: { open: boolean; close: () => void }) {
  return <AnimatePresence>{open && (
    <motion.div className="map-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="map-overlay-inner" initial={{ scale: .94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .97, y: 10 }}>
        <header><span>World map</span><small>Choose a landmark</small><button onClick={close} aria-label="Close world map"><X /></button></header>
        <WorldAtlas compact close={close} />
        <nav>{routes.map(([to, label, biome]) => <Link to={to} onClick={close} key={to}><span>{label}</span><small>{biome}</small></Link>)}</nav>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>
}

function HUD({ sound, toggle }: { sound: boolean; toggle: () => void }) {
  const [map, setMap] = useState(false)
  const { pathname } = useRouter()
  useEffect(() => { setMap(false) }, [pathname])
  return <>
    <header className="hud">
      <Link className="hud-name" to="/"><span className="skin-face"><i /><b /></span><span><strong>Noel Alex</strong><small>builder / researcher / people person</small></span></Link>
      <div className="hud-location"><i />{routes.find(([to]) => to === pathname)?.[2] ?? 'Unknown biome'}</div>
      <div className="hud-actions">
        <button onClick={toggle} aria-label={sound ? 'Mute ambient music' : 'Play ambient music'}>{sound ? <Volume2 /> : <VolumeX />}<span>{sound ? 'Sound on' : 'Sound off'}</span></button>
        <button onClick={() => setMap(true)} aria-label="Open world map"><Compass /><span>World map</span></button>
      </div>
    </header>
    <WorldMenu open={map} close={() => setMap(false)} />
  </>
}

function Page({ className, children }: { className: string; children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return <motion.main id="main-content" className={`page ${className}`} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: reduced ? .15 : .55, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main>
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-70px' }} transition={{ duration: .72, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

function Back({ label = 'All expeditions' }: { label?: string }) {
  return <Link className="back" to="/projects"><ArrowLeft />{label}</Link>
}

function HomePage() {
  return <Page className="home-page">
    <section className="home-atlas">
      <div className="home-intro">
        <span className="kicker">PLAYER ONE / DATA SCIENCE / VIT VELLORE</span>
        <h1>Noel builds the machine.<br /><em>Then invites everyone in.</em></h1>
        <p>Systems, research tools, communities, and survival worlds built with equal parts curiosity and stubbornness.</p>
        <div className="intro-actions"><Link className="block-button" to="/projects">Begin expedition <ArrowRight /></Link><Link className="quiet-link" to="/player">Open player log</Link></div>
        <small><i />Open to remote work and opportunities across Riyadh, Abu Dhabi, Dubai, and the US.</small>
      </div>
      <WorldAtlas />
      <div className="atlas-help"><span>Hover a landmark</span><i />The map is the portfolio.</div>
    </section>
    <section className="home-manifesto">
      <Reveal><span className="kicker">HOW I PLAY</span><h2>Go deep.<br />Ship honestly.<br /><em>Bring people.</em></h2></Reveal>
      <Reveal className="manifesto-copy" delay={.1}><p>I like projects with too many moving parts: distributed crawlers, evidence systems, AI tools, deployment infrastructure, and the communities that make the work matter.</p><div><span>01 / EXPLORE</span><p>Understand the terrain before naming the solution.</p><span>02 / BUILD</span><p>Turn uncertainty into a system you can test.</p><span>03 / SHARE</span><p>Teach what you learned and make the party stronger.</p></div></Reveal>
    </section>
  </Page>
}

function PlayerPage() {
  return <Page className="player-page">
    <div className="shell">
      <header className="editorial-hero"><span className="kicker">PLAYER LOG / NOOEEELLLL123</span><h1>Curiosity starts the build.<br /><em>People make it matter.</em></h1><p>Noel grew up in Riyadh and studies Computer Science with a specialization in Data Science at VIT Vellore, graduating in 2027.</p></header>
      <section className="player-memory">
        <Reveal className="memory-photo"><img src={asset('minecraft-end-portal.webp')} alt="Noel and friends in a stronghold before fighting the Ender Dragon" /><div><span>JAVA SURVIVAL / PARTY OF FOUR</span><strong>Before the Ender Dragon.</strong><p>No HUD crop, no invented scene - just a real night in a world Noel and his friends built together.</p></div></Reveal>
        <Reveal className="player-sheet" delay={.1}><span className="kicker">THE CHARACTER SHEET</span><h2>Engineer,<br />organiser,<br /><em>world-builder.</em></h2><p>He enjoys systems design, unfamiliar research, sport, philosophy, debate, and making modded Minecraft run on hardware it probably should not.</p><div className="inventory-tags"><span>Java Edition</span><span>Create</span><span>Raspberry Pi</span><span>Tailscale</span><span>Strength training</span><span>Research rabbit holes</span></div></Reveal>
      </section>
      <section className="player-principles">{[
        ['SYSTEMS', 'Drawn to hard problems with many moving parts and visible operational boundaries.'],
        ['LEADERSHIP', 'Former Head Boy; now a Senior Core Member helping lead GDG VIT\'s AI/ML domain.'],
        ['CURIOSITY', 'Learns by exploring deeply, then builds the first working version and improves it in the real world.'],
        ['PEOPLE', 'Earn trust, make the group work better, and create room for other people to grow.'],
      ].map(([title, copy]) => <Reveal className="principle" key={title}><strong>{title}</strong><p>{copy}</p></Reveal>)}</section>
    </div>
  </Page>
}

function ProjectsPage() {
  const entries = [
    { project: projects[0], to: '/projects/stretchy', className: 'stretchy', scene: 'hero-stretchy-v2.webp', statement: 'Make every conclusion answerable to the source.' },
    { project: projects[1], to: '/projects/ultrachat', className: 'ultra', scene: 'hero-ultrachat-v2.webp', statement: 'Give a Discord community a memory it can actually use.' },
    { project: projects[2], to: '/projects/kargo', className: 'kargo', scene: 'hero-kargo-v2.webp', statement: 'Carry a repository all the way to a running application.' },
  ]
  return <Page className="projects-page">
    <div className="shell">
      <header className="editorial-hero projects-hero"><span className="kicker">EXPEDITION LOG / THREE MAJOR BUILDS</span><h1>Not cards.<br /><em>Places worth entering.</em></h1><p>Each expedition opens into its architecture, purpose, Noel's actual contribution, and the parts that remain imperfect.</p></header>
      <section className="expedition-list">{entries.map(({ project, to, className, scene, statement }, index) => <Reveal className={`expedition expedition--${className}`} key={project.slug}>
        <div className="expedition-art"><span>0{index + 1}</span><img className="hero-artifact" src={asset(scene)} alt="" /><i /><i /><i /></div>
        <div className="expedition-copy"><span>{project.status}</span><h2>{project.title}</h2><strong>{statement}</strong><p>{project.summary}</p><div className="tech-line">{project.stack.map(item => <span key={item}>{item}</span>)}</div><Link to={to}>Enter expedition <ArrowRight /></Link></div>
      </Reveal>)}</section>
      <Reveal className="first-tool"><Artifact file="artifact-kermit.webp" /><div><span className="kicker">FIRST TOOL / PRIVATE ARCHIVE</span><h2>A Discord bot that made remote school less lonely.</h2><p>Built in Grade 11 while Noel was still learning Python: music, games, moderation, and online-class reminders his friends genuinely used. The code remains private; the memory belongs here.</p></div></Reveal>
    </div>
  </Page>
}

function StretchyPage() {
  const [room, setRoom] = useState(0)
  const current = stretchySystems[room]
  return <Page className="stretchy-page case-page">
    <div className="case-shell">
      <Back />
      <section className="stretchy-cover">
        <div className="stretchy-title"><span className="kicker">LOCAL FIRST / SOLO BUILD / ACTIVE WORLD</span><h1>STRET<span>CHY</span></h1><p>A living evidence archive for enormous mixed-media corpora.</p><div><a href="https://noel-alex.github.io/stretchy/" target="_blank" rel="noreferrer">Open the actual UI <ExternalLink /></a><a href="https://github.com/Noel-Alex/stretchy" target="_blank" rel="noreferrer"><Github /> Repository</a></div></div>
        <div className="evidence-orbit"><span className="orbit-core"><img src={asset('hero-stretchy-v2.webp')} alt="A voxel evidence archive with separated provenance, graph, and investigation layers" /></span>{stretchySystems.map((system, index) => <button className={room === index ? 'is-active' : ''} style={{ '--room': index } as CSSProperties} onClick={() => setRoom(index)} key={system.id}><span>{system.icon}</span><strong>{system.room}</strong></button>)}</div>
      </section>
      <section className="stretchy-instrument">
        <nav>{stretchySystems.map((system, index) => <button className={room === index ? 'is-active' : ''} onClick={() => setRoom(index)} key={system.id}><span>{system.icon}</span>{system.room}</button>)}</nav>
        <AnimatePresence mode="wait"><motion.article key={current.id} initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}><span>IMPLEMENTED SYSTEM / {current.icon}</span><h2>{current.title}</h2><p>{current.copy}</p><ul>{current.details.map(item => <li key={item}><i />{item}</li>)}</ul></motion.article></AnimatePresence>
      </section>
      <section className="architecture-spine"><header><span className="kicker">THE WHOLE MACHINE</span><h2>Much more than retrieval.</h2><p>A source-preserving system stretched across ingestion, durable investigations, reviewed knowledge, and publication.</p></header><div>{['Rust scanner', 'Python control plane', 'PostgreSQL records', 'Qdrant retrieval', 'FalkorDB graph', 'Temporal workflows', 'Agent dossiers', 'Human review', 'PDF publication'].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div></section>
      <section className="truth-gates"><header><span className="kicker">ACCEPTANCE BOUNDARY</span><h2>No fake green lights.</h2></header><div><article><strong>Verified foundation</strong><p>Ingestion, provenance, retrieval machinery, bounded graphs, durable workflows, telemetry, review, security, and reporting are implemented and tested.</p></article><article><strong>Provisional</strong><p>Dense model promotion still depends on a human-authored golden retrieval set. Sparse-only search is not relabelled as hybrid.</p></article><article><strong>External gate</strong><p>Remote-worker field acceptance and an owner-approved full-corpus campaign remain outside the public demonstration boundary.</p></article></div></section>
    </div>
  </Page>
}

const ultraSteps = [
  ['Collect', 'Server messages become scoped source material.'],
  ['Compact', 'Long histories are summarised without losing the thread.'],
  ['Index', 'Embeddings enter vector-backed collections.'],
  ['Retrieve', 'A command recovers the relevant conversation context.'],
  ['Answer', 'Useful memory returns to the Discord channel.'],
] as const

function UltraChatPage() {
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (step < 0 || step >= ultraSteps.length) return
    const timer = window.setTimeout(() => setStep(value => value + 1), 650)
    return () => window.clearTimeout(timer)
  }, [step])
  return <Page className="ultra-page case-page"><div className="case-shell"><Back />
    <section className="ultra-cover"><div><span className="kicker">GDG VIT / COLLABORATIVE BUILD</span><h1>A community<br />that can <em>remember.</em></h1><p>UltraChat turns Discord conversation history into summaries and searchable context, so useful knowledge does not disappear up the channel.</p></div><div className="book-scene"><img src={asset('hero-ultrachat-v2.webp')} alt="A voxel enchanted archive connecting conversation fragments to a central book" />{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--rune': i } as CSSProperties} />)}</div></section>
    <section className="memory-demo"><div className="chat-window"><header># project-help <span>knowledge companion online</span></header><p><b>N</b><span><strong>Noel</strong>Where did we decide the deployment approach?</span></p><p className={step >= 4 ? 'is-visible' : ''}><b>U</b><span><strong>UltraChat</strong>I found the relevant discussion across four channel summaries.</span></p><small>{step >= 0 && step < ultraSteps.length ? `${ultraSteps[Math.min(step, 4)][0]} in progress...` : 'Pull the lever to follow the memory path.'}</small></div><div className="memory-path">{ultraSteps.map(([title, copy], index) => <article className={step >= index ? 'is-active' : ''} key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{copy}</p></article>)}</div><button className="lever-button" onClick={() => setStep(0)}><i /><span>{step >= 0 && step < ultraSteps.length ? 'Processing' : 'Pull to replay'}</span></button></section>
    <section className="case-story"><header><span className="kicker">WHAT NOEL BUILT</span><h2>From Discord events to useful context.</h2></header><div><p>Work spanned message collection, Discord commands, long-text summarisation, vector storage, RAG querying, prompts, backend integration, and Docker setup. A later personal AWS version explored a separate Go backend with DynamoDB.</p><div className="source-links">{projects[1].links.map(link => <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>{link.label}<ExternalLink /></a>)}</div></div></section>
  </div></Page>
}

const kargoFlow = [
  ['Connect repository', 'Authenticate and select a GitHub codebase.'],
  ['Understand the app', 'Map languages, source files, ports, uploads, databases, and persistence.'],
  ['Generate configuration', 'Propose Dockerfile and Docker Compose configuration from repository evidence.'],
  ['Deploy to Kubernetes', 'Create and manage a cluster-backed application deployment.'],
  ['Observe it live', 'Track application state, runtime health, and metrics after launch.'],
] as const

function KargoPage() {
  const [stage, setStage] = useState(-1)
  useEffect(() => {
    if (stage < 0 || stage >= kargoFlow.length) return
    const timer = window.setTimeout(() => setStage(value => value + 1), 700)
    return () => window.clearTimeout(timer)
  }, [stage])
  return <Page className="kargo-page case-page"><div className="case-shell"><Back />
    <section className="kargo-cover"><div><span className="kicker">GDG VIT / COLLABORATIVE PLATFORM</span><h1>Repository in.<br /><em>Running app out.</em></h1><p>Kargo is an AI-augmented deployment platform that helps developers turn Git repositories into Docker-based applications, deploy them to Kubernetes, and monitor them from one place.</p><div className="source-links"><a href="https://kargo.dscvit.com/" target="_blank" rel="noreferrer">Open Kargo <ExternalLink /></a><a href="https://github.com/GDGVIT/kargo-backend" target="_blank" rel="noreferrer"><Github /> Backend</a><a href="https://github.com/GDGVIT/kargo-frontend" target="_blank" rel="noreferrer"><Github /> Frontend</a></div></div><div className="factory-tower"><img src={asset('hero-kargo-v2.webp')} alt="A voxel copper deployment factory with a server core, minecart, cogs, and redstone" /><i /><i /><i /><i /></div></section>
    <section className="deployment-line"><header><span>DEPLOYMENT LINE / INTERACTIVE</span><button onClick={() => setStage(0)}><Play />Run the line</button></header><div className="factory-rail"><motion.div className="minecart" animate={{ left: stage < 0 ? '2%' : `${Math.min(stage, 4) * 22.5 + 2}%` }} transition={{ type: 'spring', stiffness: 82, damping: 18 }}><Artifact file="artifact-kargo.webp" /></motion.div></div><div className="factory-flow">{kargoFlow.map(([title, copy], index) => <article className={stage >= index ? 'is-powered' : ''} key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{copy}</p><i /></article>)}</div></section>
    <section className="kargo-platform"><header><span className="kicker">THE PLATFORM, NOT JUST THE AI STEP</span><h2>Setup, orchestration,<br />identity, and observability.</h2></header><div><article><Box /><strong>AI-powered setup</strong><p>Automatic Dockerfile and Compose proposals derived from repository structure.</p></article><article><Compass /><strong>Kubernetes-native</strong><p>Secure cluster management, application deployment, and scaling.</p></article><article><Github /><strong>Multi-provider identity</strong><p>Google OAuth, GitHub OAuth, and local authentication paths.</p></article><article><Music2 /><strong>Live monitoring</strong><p>Application status and metrics remain visible after deployment.</p></article></div></section>
    <section className="case-story kargo-contribution"><header><span className="kicker">NOEL'S CONTRIBUTION</span><h2>The repository-analysis path.</h2></header><div><p>Noel worked on the AI Dockerisation path: shallow cloning, extension-aware source selection, folder mapping, codebase summarisation, port discovery, and persistent-volume signals used to propose container configuration. Kargo was collaborative, and much of the shared work happened beyond individual commit history.</p></div></section>
  </div></Page>
}

const crawlerNodes = ['URL frontier', '160 Redpanda shards', 'Rust / Tokio workers', 'DOM skeleton', 'ScyllaDB', 'Snapshot merger']
const modelLayers = ['Semantic tag tokens', 'DOM graph edges', '6 x TransformerConv', 'SAGPooling / 50%', 'Jumping Knowledge', '10 URL features', 'Late fusion', 'Safe / phishing']

function ResearchPage() {
  const [crawl, setCrawl] = useState(0)
  const [scan, setScan] = useState(false)
  useEffect(() => {
    if (!crawl || crawl >= crawlerNodes.length) return
    const timer = window.setTimeout(() => setCrawl(value => value + 1), 560)
    return () => window.clearTimeout(timer)
  }, [crawl])
  return <Page className="research-page"><div className="research-shell">
    <section className="research-cover"><div className="research-title"><span className="kicker">ARACHNE + PHISHGUARD / SOLO RESEARCH</span><h1>The crawler caught the page.<br /><em>The graph read its skeleton.</em></h1><p>A systems experiment became a research instrument for collecting live DOM structure and testing whether phishing pages reveal themselves through topology, not just text.</p><a href="https://github.com/Noel-Alex/Arachne" target="_blank" rel="noreferrer">Arachne source <ExternalLink /></a></div><div className="spider-field"><img src={asset('hero-arachne-v2.webp')} alt="A voxel mechanical cave spider above a network of DOM nodes and a graph core" />{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ '--web': i } as CSSProperties} />)}<span>STRUCTURE<br />OVER CONTENT</span></div></section>
    <section className="crawler-instrument"><header><div><span className="kicker">INSTRUMENT I / DISTRIBUTED CRAWLING</span><h2>Catch the site before it disappears.</h2></div><button onClick={() => setCrawl(1)}><Play /> Release crawler</button></header><div className="crawler-track">{crawlerNodes.map((node, index) => <article className={crawl > index ? 'is-live' : ''} key={node}><span>{String(index + 1).padStart(2, '0')}</span><strong>{node}</strong><i /></article>)}</div><div className="crawler-facts"><article><strong>10,000</strong><span>configured requests in flight per worker</span></article><article><strong>500</strong><span>URL queue ceiling per site to reduce bias and spider traps</span></article><article><strong>1,024</strong><span>domains processed concurrently by the snapshot merger</span></article><p>These are design and configuration targets from the experiment, not a claim that the research dataset saturated the system's intended ceiling.</p></div></section>
    <section className="dataset-field"><header><span className="kicker">INSTRUMENT II / THE DATASET</span><h2>URLs became labelled structural graphs.</h2><p>Arachne joined live page skeletons with safe/phishing labels, then produced a versioned training snapshot.</p></header><div className="dataset-map"><div className="safe-mass">{Array.from({ length: 70 }, (_, i) => <i key={i} style={{ '--cell': i } as CSSProperties} />)}</div><div className="phish-mass">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--cell': i } as CSSProperties} />)}</div><span className="dataset-player"><Artifact file="artifact-arachne.webp" /></span></div><div className="dataset-ledger"><article><span>SAFE</span><strong>57,206</strong></article><article><span>PHISHING</span><strong>10,969</strong></article><article><span>TOTAL</span><strong>68,175</strong></article><article><span>HELD OUT</span><strong>13,635</strong></article></div></section>
    <section className="model-observatory"><header><span className="kicker">INSTRUMENT III / HYBRID GRAPH TRANSFORMER</span><h2>Follow one page through the model.</h2><p>Click scan to animate an illustrative structural pass. This is an explanatory visualization, not a live detector.</p><button onClick={() => { setScan(false); window.setTimeout(() => setScan(true), 30) }}><Play /> Scan DOM graph</button></header><div className={`model-pipeline ${scan ? 'is-scanning' : ''}`}>{modelLayers.map((layer, index) => <article style={{ '--layer': index } as CSSProperties} key={layer}><span>{String(index + 1).padStart(2, '0')}</span><strong>{layer}</strong><i /></article>)}</div><div className="model-result"><span>HELD-OUT EXPERIMENT</span><article><strong>0.99</strong><p>phishing recall</p></article><article><strong>0.94</strong><p>phishing precision</p></article><article><strong>0.96</strong><p>phishing F1</p></article></div></section>
    <section className="research-warning"><div><span className="kicker">WHERE THE RESULT BREAKS</span><h2>A strong score can still hide a weak world model.</h2></div><p>The legitimate class leaned heavily on globally popular, high-quality sites. Rough but legitimate pages were underrepresented, so very small or bare-minimum HTML pages could be misclassified as phishing. The experiment supports the structural approach; it does not establish a production-ready detector.</p></section>
  </div></Page>
}

function CommunityPage() {
  return <Page className="community-page"><div className="shell"><header className="editorial-hero"><span className="kicker">GDG VIT / MULTIPLAYER</span><h1>Good events feel like<br /><em>worlds people enter together.</em></h1><p>Senior Core Member, AI/ML lead in practice, organiser, technical judge, recruiter, curriculum designer, and friend.</p></header><section className="community-story"><Reveal className="team-photo"><img src={asset('devjams-team-srgb.jpg')} alt="Noel and the GDG VIT DevJams team wearing matching Hello Kitty pyjamas" /><span className="noel-arrow"><strong>Noel</strong><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M170 8C125 20 65 52 12 106"/><path d="M12 106L17 87M12 106L32 103"/></svg></span><div><span>DEVJAMS '25</span><strong>A late-night memory with the team.</strong></div></Reveal><Reveal className="community-ledger" delay={.1}><article><strong>4,700</strong><p>applicants in the process through which Noel joined as the only new AI/ML junior core member.</p></article><article><strong>~5,000</strong><p>applicants helped evaluate later; about 256 personally assessed through tests, projects, and interviews.</p></article><article><strong>400+</strong><p>students reached as sole speaker and curriculum designer for "Inside Google's DeepMind."</p></article><a href={socialLinks.talk} target="_blank" rel="noreferrer"><Play /> Watch the session <ExternalLink /></a></Reveal></section><section className="guild-timeline">{[
      ['2023', 'Joined AI/ML', 'Selected through the club process, helped build UltraChat, and organised DevJams, Women Techies, and Hexathon.'],
      ['2024-25', 'Built another season', 'The three major events again, Kargo, technical planning, judging, and recruitment.'],
      ['NOW', 'Senior Core', 'Helping lead the AI/ML domain and selecting the next cohort to carry the community forward.'],
    ].map(([year, title, copy]) => <Reveal key={year}><span>{year}</span><strong>{title}</strong><p>{copy}</p></Reveal>)}</section></div></Page>
}

function ContactPage() {
  return <Page className="contact-page"><div className="portal-scene" aria-hidden="true"><i /><i /><i /><i /><span /></div><section className="contact-card"><span className="kicker">END PORTAL / OPEN CHANNEL</span><h1>Build something<br /><em>worth entering.</em></h1><p>For remote work, ambitious research, complex systems, or a serious conversation about modded Minecraft server optimisation.</p><div><a className="block-button" href={socialLinks.email}><Mail />Email Noel <ArrowRight /></a><a href={socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn <ExternalLink /></a><a href={socialLinks.github} target="_blank" rel="noreferrer"><Github /> GitHub</a></div><a className="resume" href={`${import.meta.env.BASE_URL}Noel-Alex-Resume.pdf`} target="_blank" rel="noreferrer"><BookOpen />Open resume</a><small><MapPin />Remote / Riyadh / Abu Dhabi / Dubai / US</small></section></Page>
}

function NotFound() { return <Page className="not-found"><section><span className="kicker">CHUNK NOT FOUND</span><h1>You walked beyond the loaded world.</h1><Link className="block-button" to="/">Return to spawn <ArrowRight /></Link></section></Page> }

function RouteView() {
  const { pathname } = useRouter()
  const view = (() => {
    switch (pathname) {
      case '/': return <HomePage />
      case '/player': return <PlayerPage />
      case '/projects': return <ProjectsPage />
      case '/projects/stretchy': return <StretchyPage />
      case '/projects/ultrachat': return <UltraChatPage />
      case '/projects/kargo': return <KargoPage />
      case '/research': return <ResearchPage />
      case '/community': return <CommunityPage />
      case '/contact': return <ContactPage />
      default: return <NotFound />
    }
  })()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return <AnimatePresence mode="wait"><div key={pathname}>{view}</div></AnimatePresence>
}

function RoutedApp() {
  const [sound, setSound] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    if (!audio.current) return
    audio.current.volume = .18
    if (sound) void audio.current.play().catch(() => setSound(false))
    else audio.current.pause()
  }, [sound])
  return <><audio ref={audio} src={asset('into-the-caves.mp3')} loop preload="none"/><HUD sound={sound} toggle={() => setSound(value => !value)}/><WorldGenerationLoader/><RouteView/></>
}

export default function App() { return <PortfolioRouter><RoutedApp /></PortfolioRouter> }
