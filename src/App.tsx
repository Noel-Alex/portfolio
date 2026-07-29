import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDot,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import { projects, sections, socialLinks, stretchySystems, type Project } from './content'

type Toast = { title: string; detail: string } | null

const achievements = [
  null,
  { title: 'Getting to know you', detail: 'Met the player behind the builds.' },
  { title: 'Deep dark expedition', detail: 'Entered Stretchy’s evidence city.' },
  { title: 'Acquire hardware', detail: 'Opened the collaborative workshop.' },
  { title: 'Into the depths', detail: 'Found the research below bedrock.' },
  { title: 'Hero of the village', detail: 'Reached the community that shaped the journey.' },
  { title: 'The End?', detail: 'A new connection is another beginning.' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

const worldImages = [
  'world-overworld-v2.webp',
  'world-overworld-v2.webp',
  'world-ancient-city-v2.webp',
  'world-workshop-v2.webp',
  'world-workshop-v2.webp',
  'world-village-portal-v2.webp',
  'world-village-portal-v2.webp',
]

function CinematicWorld({ active, reducedMotion }: { active: number; reducedMotion: boolean }) {
  const image = `${import.meta.env.BASE_URL}assets/${worldImages[active] ?? worldImages[0]}`
  return (
    <div className="cinematic-world" aria-hidden="true">
      <AnimatePresence mode="sync">
        <motion.img
          key={image}
          src={image}
          alt=""
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 1.1, ease: 'easeOut' }}
        />
      </AnimatePresence>
      <div className="world-vignette" />
      <div className="world-grain" />
      <div className="world-embers"><i /><i /><i /><i /><i /><i /></div>
    </div>
  )
}

function ProjectArtifact({ project, className = '' }: { project: Pick<Project, 'title' | 'artifact'>; className?: string }) {
  return (
    <img
      className={`project-artifact ${className}`}
      src={`${import.meta.env.BASE_URL}assets/${project.artifact}`}
      alt=""
      aria-hidden="true"
    />
  )
}

function StatusTag({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'purple' }) {
  return <span className={`status-tag status-tag--${tone}`}><span className="status-pip" />{children}</span>
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

const workbenchProjects = [
  {
    slug: 'stretchy',
    title: 'Stretchy',
    artifact: 'artifact-stretchy.webp',
    itemName: 'Evidence chest',
    target: 'stretchy',
    label: 'SOLO · ACTIVE WORLD',
    summary: 'A local-first investigation system where every useful answer has to survive a walk back to its source.',
    contribution: 'Rust scanning, typed Python services, durable Temporal investigations, hybrid retrieval, bounded evidence graphs, review, reporting, security, and the editorial interface.',
    steps: ['Inventory sources', 'Bind provenance', 'Retrieve evidence', 'Human review'],
    result: 'OUTPUT · an inspectable finding with a source trail',
  },
  {
    slug: 'ultrachat',
    title: 'UltraChat',
    artifact: 'artifact-ultrachat.webp',
    itemName: 'Memory book',
    target: 'ultrachat-dossier',
    label: 'GDG VIT · COLLABORATIVE',
    summary: 'A Discord knowledge companion that turns noisy server history into summaries and searchable context.',
    contribution: 'Collection and commands, long-text summarisation, vector storage, RAG queries, prompts, backend integration, Docker—and a later personal Go + DynamoDB variant.',
    steps: ['Collect messages', 'Compact history', 'Index context', 'Retrieve answer'],
    result: 'OUTPUT · the server remembers what people actually said',
  },
  {
    slug: 'kargo',
    title: 'Kargo',
    artifact: 'artifact-kargo.webp',
    itemName: 'Copper cargo cart',
    target: 'kargo-dossier',
    label: 'GDG VIT · COLLABORATIVE',
    summary: 'A deployment platform that carries a repository toward container configuration and managed infrastructure.',
    contribution: 'Bounded cloning, extension-aware source selection, repository mapping, code summarisation, port discovery, and persistent-volume signal extraction.',
    steps: ['Clone repository', 'Map codebase', 'Find runtime clues', 'Propose config'],
    result: 'OUTPUT · Docker configuration backed by repository evidence',
  },
  {
    slug: 'arachne',
    title: 'Arachne',
    artifact: 'artifact-arachne.webp',
    itemName: 'Crawler charm',
    target: 'research',
    label: 'SOLO · SYSTEMS EXPERIMENT',
    summary: 'A horizontally scalable Rust crawler that became the collection instrument for a phishing-site graph experiment.',
    contribution: 'Coordinator and worker boundaries, Kafka queues, ScyllaDB persistence, DOM collection, graph construction, and the honest evaluation of where the detector failed.',
    steps: ['Queue URLs', 'Dispatch workers', 'Persist DOMs', 'Score graphs'],
    result: 'OUTPUT · 68,175 examples and a very important caveat',
  },
] as const

function ProjectWorkbench({ onTravel }: { onTravel: (id: string) => void }) {
  const [selected, setSelected] = useState(0)
  const [machineStep, setMachineStep] = useState(-1)
  const current = workbenchProjects[selected]

  useEffect(() => {
    if (machineStep < 0 || machineStep >= current.steps.length) return
    const timer = window.setTimeout(() => setMachineStep((step) => step + 1), 460)
    return () => window.clearTimeout(timer)
  }, [current.steps.length, machineStep])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1
      if (index >= 0 && index < workbenchProjects.length) {
        setSelected(index)
        setMachineStep(-1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const selectProject = (index: number) => {
    setSelected(index)
    setMachineStep(-1)
  }

  return (
    <div className="project-workbench">
      <div className="workbench-inventory" aria-label="Choose a project artifact">
        <span className="workbench-label">SELECT ITEM</span>
        {workbenchProjects.map((project, index) => (
          <button
            key={project.slug}
            className={selected === index ? 'is-selected' : ''}
            onClick={() => selectProject(index)}
            aria-pressed={selected === index}
          >
            <span className="slot-key">{index + 1}</span>
            <img src={`${import.meta.env.BASE_URL}assets/${project.artifact}`} alt="" />
            <span>{project.title}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className={`workbench-scene workbench-scene--${current.slug}`}
          key={current.slug}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24 }}
        >
          <div className="artifact-pedestal">
            <span className="artifact-pedestal__beam" />
            <motion.img
              src={`${import.meta.env.BASE_URL}assets/${current.artifact}`}
              alt={`${current.itemName}, representing ${current.title}`}
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="artifact-pedestal__base"><span>ITEM</span><strong>{current.itemName}</strong></div>
          </div>

          <div className="workbench-dossier">
            <span className="eyebrow">{current.label}</span>
            <h3>{current.title}</h3>
            <p className="workbench-summary">{current.summary}</p>
            <div className="workbench-contribution"><span>NOEL BUILT / CONTRIBUTED</span><p>{current.contribution}</p></div>
            <div className="workbench-actions">
              <button className="primary-button primary-button--compact" onClick={() => setMachineStep(0)} disabled={machineStep >= 0 && machineStep < current.steps.length}>
                <Play />{machineStep >= 0 && machineStep < current.steps.length ? 'Machine running…' : 'Use item'}
              </button>
              <button className="text-link" onClick={() => onTravel(current.target)}>Open full case study<ArrowDown /></button>
            </div>
          </div>

          <div className={`workbench-machine ${machineStep >= 0 ? 'is-running' : ''}`} aria-live="polite">
            {current.steps.map((step, index) => (
              <div className={machineStep >= index ? 'is-powered' : ''} key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong><i />
              </div>
            ))}
            <p className={machineStep >= current.steps.length ? 'is-visible' : ''}>{current.result}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="workbench-hint"><kbd>1–4</kbd> Swap the artifact. <span>Use it to watch the system reveal its real work.</span></p>
    </div>
  )
}

function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, project])

  return (
    <AnimatePresence>
      {project && (
        <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className="item-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="icon-button item-dialog__close" onClick={onClose} aria-label="Close project details"><X /></button>
            <div className="item-dialog__icon"><ProjectArtifact project={project} /></div>
            <div className="eyebrow">{project.number}</div>
            <h2 id="project-dialog-title">{project.title}</h2>
            <StatusTag tone={project.slug === 'kermit' ? 'amber' : 'green'}>{project.status}</StatusTag>
            <p className="item-dialog__summary">{project.summary}</p>
            <div className="detail-block"><span>NOEL’S PART</span><p>{project.contribution}</p></div>
            <div className="tag-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
            {project.links.length > 0 ? (
              <div className="dialog-actions">
                {project.links.map((link) => (
                  <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={15} /></a>
                ))}
              </div>
            ) : <p className="private-note">Private memory — story shared, source kept off the internet.</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Inventory({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (project: Project) => void }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'e') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="inventory-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div className="inventory" role="dialog" aria-modal="true" aria-labelledby="inventory-title" initial={{ y: 36, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventory__header">
              <div><span className="eyebrow">PLAYER INVENTORY</span><h2 id="inventory-title">Everything Noel carries</h2></div>
              <button className="icon-button" onClick={onClose} aria-label="Close inventory"><X /></button>
            </div>
            <div className="inventory__grid">
              {projects.map((project) => (
                <button key={project.slug} className="inventory-slot" onClick={() => { onSelect(project); onClose() }}>
                  <ProjectArtifact project={project} /><span>{project.title}</span>
                </button>
              ))}
              <div className="inventory-slot inventory-slot--passive"><span className="inventory-rune">L</span><span>Leadership</span></div>
              <div className="inventory-slot inventory-slot--passive"><span className="inventory-rune">?</span><span>Curiosity</span></div>
              <div className="inventory-slot inventory-slot--passive"><span className="inventory-rune">Σ</span><span>Systems</span></div>
              <div className="inventory-slot inventory-slot--passive"><span className="inventory-rune">+</span><span>Community</span></div>
            </div>
            <p className="inventory__hint"><kbd>E</kbd> closes inventory · Some items unlock only by exploring.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Achievement({ toast }: { toast: Toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div className="achievement" role="status" initial={{ y: -90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -90, opacity: 0 }}>
          <div className="achievement__icon"><Sparkles /></div>
          <div><span>ADVANCEMENT MADE!</span><strong>{toast.title}</strong><small>{toast.detail}</small></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [active, setActive] = useState(0)
  const [sound, setSound] = useState(false)
  const [creative, setCreative] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stretchyNode, setStretchyNode] = useState(0)
  const [toast, setToast] = useState<Toast>(null)
  const [eyes, setEyes] = useState<Set<number>>(new Set())
  const visited = useRef(new Set([0]))
  const sequence = useRef<string[]>([])
  const typed = useRef('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.16
    if (sound) {
      void audio.play().catch(() => setSound(false))
    } else {
      audio.pause()
    }
  }, [sound])

  const showToast = useCallback((next: Exclude<Toast, null>) => {
    setToast(next)
    window.setTimeout(() => setToast(null), 4200)
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-world-section]'))
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      const index = Number((visible.target as HTMLElement).dataset.worldSection)
      setActive(index)
      if (!visited.current.has(index)) {
        visited.current.add(index)
        const achievement = achievements[index]
        if (achievement) showToast(achievement)
      }
    }, { threshold: [0.18, 0.34, 0.56] })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [showToast])

  useEffect(() => {
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    const handleKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key.toLowerCase() === 'e' && !selectedProject) setInventoryOpen((value) => !value)
      sequence.current = [...sequence.current, event.key].slice(-konami.length)
      if (sequence.current.join('|').toLowerCase() === konami.join('|').toLowerCase()) {
        setCreative(true)
        showToast({ title: 'Creative mode', detail: 'Flight enabled. Imagination was already unlimited.' })
      }
      if (event.key.length === 1) {
        typed.current = (typed.current + event.key).slice(-12)
        if (typed.current.toLowerCase().endsWith('/seed')) showToast({ title: 'Seed: 79050483', detail: 'A world built from curiosity, people, and unreasonable projects.' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedProject, showToast])

  const collectEye = (number: number) => {
    if (eyes.has(number)) return
    const next = new Set(eyes)
    next.add(number)
    setEyes(next)
    showToast(next.size === 3 ? { title: 'Eye spy', detail: 'All three Eyes found. The portal remembers.' } : { title: `Eye of Ender ${next.size}/3`, detail: 'Something watches from between the blocks.' })
  }

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  const currentSection = sections[active]
  const progress = `${Math.round((active / (sections.length - 1)) * 100)}%`
  const selectedSystem = stretchySystems[stretchyNode]

  return (
    <div className={`app-shell biome-${active} ${creative ? 'creative-mode' : ''}`}>
      <CinematicWorld active={active} reducedMotion={reducedMotion} />
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}assets/into-the-caves.mp3`} loop preload="none" />
      <div className="scroll-progress" style={{ '--progress': progress } as React.CSSProperties} />
      <Achievement toast={toast} />

      <header className="top-hud">
        <button className="brand" onClick={() => jumpTo('spawn')} aria-label="Return to spawn">
          <span className="brand-avatar"><span className="brand-hair" /><span className="brand-face" /></span>
          <span><strong>NOEL ALEX</strong><small><span className="online-dot" /> nooeeellll123</small></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {sections.map((section, index) => <button key={section.id} className={active === index ? 'is-active' : ''} onClick={() => jumpTo(section.id)}>{section.short}</button>)}
        </nav>
        <div className="hud-actions">
          <button className="hud-control" onClick={() => setSound((value) => !value)} aria-pressed={sound} aria-label={sound ? 'Mute ambient sound' : 'Play ambient sound'}>
            {sound ? <Volume2 /> : <VolumeX />}<span>{sound ? 'Music on' : 'Music off'}</span>
          </button>
          <button className="hud-control inventory-trigger" onClick={() => setInventoryOpen(true)}><kbd>E</kbd><span>Inventory</span></button>
        </div>
      </header>

      <aside className="coordinates" aria-label="Current location"><span>BIOME</span><strong>{currentSection.label}</strong><small>Y {64 - active * 14} · {active < 2 ? 'OVERWORLD' : active < 5 ? 'DEEPSLATE' : active < 6 ? 'VILLAGE' : 'THE END'}</small></aside>

      <main id="main">
        <section id="spawn" className="world-section hero-section" data-world-section="0">
          <div className="section-inner hero-layout">
            <div className="hero-copy">
              <motion.div className="eyebrow" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>PLAYER ONE · VIT VELLORE · GRADUATING 2027</motion.div>
              <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>Noel builds worlds<br /><span>worth exploring.</span></motion.h1>
              <motion.p className="hero-lede" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>Data science student building ambitious research systems, developer tools, and the communities that make difficult work feel possible.</motion.p>
              <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <button className="primary-button" onClick={() => jumpTo('stretchy')}>Begin expedition<ArrowDown /></button>
                <a className="secondary-button" href={socialLinks.github} target="_blank" rel="noreferrer"><Github />GitHub<ArrowUpRight /></a>
              </motion.div>
              <div className="availability-line"><span className="online-dot" /> Open to remote work and opportunities across Riyadh, Abu Dhabi, Dubai, and the US.</div>
            </div>
            <aside className="spawn-card pixel-panel">
              <span className="spawn-card__label">CURRENT QUEST</span>
              <strong>Build systems people can trust.</strong>
              <p>Research, retrieval, distributed infrastructure, and tools that stay honest when the real world gets complicated.</p>
              <div className="quest-list"><span><Check /> Evidence first</span><span><Check /> People always</span><span><Check /> Learn by building</span></div>
            </aside>
          </div>
          <button className="scroll-cue" onClick={() => jumpTo('story')}><span>Scroll to travel</span><ChevronDown /></button>
        </section>

        <section id="story" className="world-section story-section story-section--extended" data-world-section="1">
          <div className="section-inner">
            <Reveal className="split-layout">
              <div className="story-copy content-panel">
                <div className="eyebrow">THE PLAYER BEHIND THE ARMOUR</div>
                <h2>Curiosity starts the build.<br />People make it matter.</h2>
                <p className="large-copy">Noel grew up in Riyadh and now studies Computer Science with a specialization in Data Science at VIT Vellore.</p>
                <p>He gravitates toward projects with too many moving parts: distributed crawlers, evidence systems, AI tools, deployment infrastructure, and modded survival servers. The thread connecting them is human—learn deeply, bring people together, and build something useful enough that others want to join.</p>
                <div className="story-grid">
                  <div><strong>People first</strong><span>Head Boy in Grade 12; now a Senior Core Member helping lead GDG VIT’s AI/ML domain.</span></div>
                  <div><strong>Always exploring</strong><span>Sports, strength training, philosophy, debates, unfamiliar research, games, and very large Minecraft builds.</span></div>
                </div>
              </div>
              <figure className="memory-card memory-card--portal">
                <img src={`${import.meta.env.BASE_URL}assets/minecraft-end-portal.webp`} alt="Noel and friends in a Minecraft stronghold before fighting the Ender Dragon" />
                <figcaption><span>MEMORY 01</span><strong>Before the Ender Dragon</strong><small>Survival is better with a party.</small></figcaption>
              </figure>
            </Reveal>
            <Reveal className="minecraft-log">
              <div className="minecraft-log__copy">
                <span className="eyebrow">SERVER LOG · JAVA EDITION</span>
                <h3>Engineering, but with dragons.</h3>
                <p>Noel and his friends build huge survival structures, explore modpacks with bosses and dragons, and automate absurd production lines with Create-style machinery. He even tuned a Raspberry Pi to host a modded server, using Tailscale so the group could join locally or over the internet.</p>
                <div className="tag-row"><span>Java Edition</span><span>Modded survival</span><span>Create automation</span><span>Raspberry Pi</span><span>Tailscale</span></div>
              </div>
              <figure><img src={`${import.meta.env.BASE_URL}assets/minecraft-cave.webp`} alt="A huge modded Minecraft cave from Noel's survival world" /><figcaption>A cave from one of Noel’s worlds · the builds are coming later</figcaption></figure>
            </Reveal>
          </div>
          <button className="ender-eye ender-eye--one" onClick={() => collectEye(1)} aria-label="Collect hidden Eye of Ender one"><span className="ender-eye-glyph">◈</span></button>
        </section>

        <section id="stretchy" className="world-section stretchy-section" data-world-section="2">
          <div className="section-inner section-inner--wide">
            <Reveal className="stretchy-hero">
              <div>
                <div className="eyebrow">MAIN QUEST · ACTIVE WORLD</div>
                <h2>Stretchy is an evidence city,<br /><span>not a chatbot.</span></h2>
                <p className="large-copy">A local-first investigation platform designed to turn enormous mixed-media archives into source-verifiable research—without pretending a model’s confidence is evidence.</p>
              </div>
              <div className="stretchy-hero__actions">
                <StatusTag>active build · public preview</StatusTag>
                <a className="text-link" href="https://noel-alex.github.io/stretchy/" target="_blank" rel="noreferrer">Enter command centre<ArrowUpRight /></a>
                <a className="text-link text-link--muted" href="https://github.com/Noel-Alex/stretchy" target="_blank" rel="noreferrer">Read the source<Github size={15} /></a>
              </div>
            </Reveal>

            <Reveal className="stretchy-atlas">
              <div className="atlas-map" aria-label="Stretchy system map">
                <div className="atlas-map__core"><ProjectArtifact project={projects[0]} /><span>STRETCHY</span><small>canonical state</small></div>
                <div className="atlas-path" aria-hidden="true" />
                {stretchySystems.map((system, index) => (
                  <button key={system.id} className={stretchyNode === index ? 'is-active' : ''} onClick={() => setStretchyNode(index)} aria-pressed={stretchyNode === index}>
                    <span>{system.icon}</span><strong>{system.room}</strong><small>{system.status}</small>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.article key={selectedSystem.id} className="atlas-detail" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.26 }}>
                  <div className="atlas-detail__top"><span>{selectedSystem.icon} / 06</span><StatusTag>{selectedSystem.status}</StatusTag></div>
                  <div className="eyebrow">{selectedSystem.room}</div>
                  <h3>{selectedSystem.title}</h3>
                  <p>{selectedSystem.copy}</p>
                  <ul>{selectedSystem.details.map((detail) => <li key={detail}><CircleDot />{detail}</li>)}</ul>
                  <div className="atlas-detail__hint">Select another room to continue the tour <ArrowRight /></div>
                </motion.article>
              </AnimatePresence>
            </Reveal>

            <Reveal className="stretchy-pipeline">
              <div className="pipeline-label"><span>THE EVIDENCE PATH</span><small>every arrow leaves a receipt</small></div>
              {['Source folders', 'Canonical units', 'Search + graph', 'Durable inquiry', 'Human review', 'Published report'].map((label, index) => (
                <div className="pipeline-step" key={label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong>{index < 5 && <ArrowRight />}</div>
              ))}
            </Reveal>

            <Reveal className="truth-ledger">
              <div className="truth-ledger__intro"><ShieldCheck /><div><span className="eyebrow">TRUTH LEDGER</span><h3>The boundary is part of the product.</h3><p>Stretchy makes verified software, provisional model choices, empty states, and external acceptance gates visibly different.</p></div></div>
              <div className="truth-ledger__cards">
                <article><StatusTag>verified foundation</StatusTag><p>Ingestion, provenance, retrieval machinery, bounded evidence graphs, durable workflows, telemetry, review, security, and reporting are implemented and tested.</p></article>
                <article><StatusTag tone="amber">provisional</StatusTag><p>Dense model selection and promotion remain tied to a human-authored golden retrieval set. The system refuses to disguise sparse-only search as hybrid.</p></article>
                <article><StatusTag tone="purple">external gate</StatusTag><p>A real remote-worker field run and an owner-approved full-corpus campaign remain outside the public demonstration boundary.</p></article>
              </div>
            </Reveal>

            <Reveal className="stretchy-scale">
              <article><strong>Rust + Python</strong><p>Fast read-only scanning at the edge; a typed control plane and capability-bound workers above it.</p></article>
              <article><strong>PostgreSQL + Qdrant + FalkorDB</strong><p>Canonical state, production retrieval, and a rebuildable graph—each with a sharply different job.</p></article>
              <article><strong>Temporal + Chronicle</strong><p>Investigations can pause, recover, compact, branch, and resume with provenance intact.</p></article>
              <article><strong>Editorial command centre</strong><p>A living interface where every decorative room remains subordinate to canonical data.</p></article>
            </Reveal>
          </div>
        </section>

        <section id="builds" className="world-section builds-section" data-world-section="3">
          <div className="section-inner section-inner--wide">
            <Reveal className="section-heading">
              <div><div className="eyebrow">THE REDSTONE WORKSHOP</div><h2>Two collaborative systems,<br />opened all the way up.</h2></div>
              <p>The most interesting work is in the flow between components. Pull a lever and follow the signal.</p>
            </Reveal>

            <Reveal><ProjectWorkbench onTravel={jumpTo} /></Reveal>

            <Reveal className="build-dossier build-dossier--ultra" >
              <div className="dossier-copy">
                <div className="dossier-number" id="ultrachat-dossier">BUILD 01 · GDG VIT</div><ProjectArtifact project={projects[1]} />
                <h3>UltraChat</h3>
                <p className="dossier-lede">A Discord server remembers a lot. UltraChat was built to turn that noisy history into something members could summarize, search, and ask questions about.</p>
                <div className="contribution-callout"><span>NOEL’S BUILD PATH</span><p>Collection and commands → large-text summarization → vector storage and RAG querying → backend integration and containerization. A later personal AWS variant explored a Go backend with DynamoDB.</p></div>
                <div className="tag-row">{projects[1].stack.map((item) => <span key={item}>{item}</span>)}</div>
                <div className="dialog-actions">{projects[1].links.map((link) => <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight /></a>)}</div>
              </div>
              <div className="signal-machine signal-machine--chat" aria-label="UltraChat architecture">
                <div className="machine-title"><span>KNOWLEDGE LOOP</span><small>Discord → context → answer</small></div>
                {[
                  ['01', 'COLLECT', 'Channel messages become server-scoped knowledge.'],
                  ['02', 'COMPACT', 'Long histories are chunked and summarized.'],
                  ['03', 'INDEX', 'Embeddings enter vector-backed collections.'],
                  ['04', 'QUERY', 'Commands retrieve context for grounded answers.'],
                  ['05', 'STORE', 'Backend integration keeps summaries and state usable.'],
                ].map(([number, title, copy], index) => <div className="machine-node" key={title}><span>{number}</span><div><strong>{title}</strong><small>{copy}</small></div>{index < 4 && <i />}</div>)}
              </div>
            </Reveal>

            <Reveal className="build-dossier build-dossier--kargo">
              <div className="signal-machine signal-machine--kargo" aria-label="Kargo repository analysis pipeline">
                <div className="machine-title"><span>REPOSITORY SCAN</span><small>from GitHub URL to deployable clues</small></div>
                <div className="repo-terminal"><span>$ kargo inspect github.com/you/app</span><b>✓ shallow clone complete</b><b>✓ source extensions selected</b><b>✓ port candidates extracted</b><b>✓ persistence paths normalized</b><strong>ready for Docker proposal_</strong></div>
                <div className="kargo-output"><span>OUTPUT SLOTS</span><div><span className="output-rune">DF</span><strong>Dockerfile</strong></div><div><span className="output-rune">DC</span><strong>Compose</strong></div></div>
              </div>
              <div className="dossier-copy">
                <div className="dossier-number" id="kargo-dossier">BUILD 02 · GDG VIT</div><ProjectArtifact project={projects[2]} />
                <h3>Kargo</h3>
                <p className="dossier-lede">A deployment platform that connects repositories, container configuration, resource choices, and Kubernetes-backed application management.</p>
                <div className="contribution-callout"><span>NOEL’S BUILD PATH</span><p>Noel contributed to repository inspection and the AI Dockerization path: cloning bounded repositories, selecting relevant code, mapping folder structure, extracting port clues, and finding persistent-volume signals across Dockerfiles, Compose, databases, uploads, and filesystem paths.</p></div>
                <p className="collab-note"><Check /> Built collaboratively. Much of the planning and shared implementation happened beyond what individual commit history captures.</p>
                <div className="tag-row">{projects[2].stack.map((item) => <span key={item}>{item}</span>)}</div>
                <div className="dialog-actions">{projects[2].links.map((link) => <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight /></a>)}</div>
              </div>
            </Reveal>

            <Reveal className="first-build">
              <ProjectArtifact project={projects[3]} /><div><span className="eyebrow">THE FIRST REDSTONE CONTRAPTION</span><h3>A Discord bot built one command at a time.</h3><p>In Grade 11, before Noel properly knew Python, an experiment became the bot his friends used for music, games, moderation, and online-class reminders with the right links. It is private, imperfect, and still one of his favorite builds because people actually loved using it.</p></div><button className="text-link" onClick={() => setSelectedProject(projects[3])}>Open memory<ArrowUpRight /></button>
            </Reveal>
          </div>
        </section>

        <section id="research" className="world-section research-section research-section--deep" data-world-section="4">
          <div className="section-inner section-inner--wide">
            <Reveal className="research-intro">
              <div className="research-copy content-panel content-panel--dark">
                <div className="eyebrow">BELOW BEDROCK · ARACHNE → PHISHGUARD</div>
                <h2>A systems experiment<br />became a research instrument.</h2>
                <p className="large-copy">Arachne began as Noel’s first serious systems-design project: a Rust crawler that separated coordination, crawling, queueing, and persistence so work could scale horizontally.</p>
                <p>The crawler was later used to gather DOM structure from phishing and legitimate sites. Those pages became graphs for a model combining DOM topology with URL features. The immediate dataset never approached the crawler’s intended ceiling; learning the architecture was part of the point.</p>
                <a className="text-link" href="https://github.com/Noel-Alex/Arachne" target="_blank" rel="noreferrer">Inspect Arachne source<ArrowUpRight /></a>
              </div>
              <div className="arachne-diagram" aria-label="Arachne crawler architecture">
                <div className="web-node"><span>SEEDS</span><small>URL frontier</small></div><ArrowDown />
                <div className="kafka-bus"><span>KAFKA</span><strong>urls-to-crawl</strong></div><ArrowDown />
                <div className="worker-fleet"><span>RUST WORKER FLEET</span><div>{['fetch', 'parse', 'discover', 'return'].map((x) => <b key={x}>{x}</b>)}</div></div><ArrowDown />
                <div className="kafka-bus"><span>KAFKA</span><strong>crawl-results</strong></div><ArrowDown />
                <div className="db-node"><span>COORDINATOR + SCYLLADB</span><small>batch · deduplicate · enqueue</small></div>
              </div>
            </Reveal>

            <Reveal className="phishguard-case">
              <div className="phishguard-copy">
                <div className="eyebrow">EXPERIMENT LOG · PRIVATE MODEL</div>
                <h3>PhishGuard: topology meets URL signals.</h3>
                <p>The model work is not published, and the internal paper is not offered for download. The results below come from Noel’s held-out evaluation; the caveat is shown beside them because it matters as much as the score.</p>
                <div className="metric-rack metric-rack--large"><div><span>68,175</span><small>collected examples</small></div><div><span>13,635</span><small>held-out examples</small></div><div><span>0.99</span><small>phishing recall</small></div><div><span>0.94</span><small>phishing precision</small></div></div>
              </div>
              <div className="model-viz" aria-label="DOM graph model illustration">
                <span className="model-viz__label">DOM GRAPH</span><img className="model-viz__artifact" src={`${import.meta.env.BASE_URL}assets/artifact-arachne.webp`} alt="" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((node) => <i key={node} style={{ '--node': node } as React.CSSProperties} />)}
                <div className="model-viz__core"><Zap /><strong>GAT</strong><small>topology + URL features</small></div>
                <div className="model-output"><span>SAFE</span><b>or</b><span>PHISHING</span></div>
              </div>
              <div className="caveat"><strong>THE IMPORTANT FAILURE MODE</strong><p>The legitimate class leaned heavily on globally popular, high-quality sites. That made rough but legitimate pages underrepresented, so bare-minimum HTML could be misclassified as phishing. These numbers validate an experiment—not a production detector.</p></div>
            </Reveal>
          </div>
          <button className="ender-eye ender-eye--two" onClick={() => collectEye(2)} aria-label="Collect hidden Eye of Ender two"><span className="ender-eye-glyph">◈</span></button>
        </section>

        <section id="community" className="world-section community-section community-section--long" data-world-section="5">
          <div className="section-inner section-inner--wide">
            <Reveal className="section-heading section-heading--light"><div><div className="eyebrow">HERO OF THE VILLAGE</div><h2>The best builds are multiplayer.</h2></div><p>Senior Core Member, AI/ML lead in practice, event organizer, technical judge, recruiter, curriculum designer, and friend.</p></Reveal>
            <Reveal className="community-grid community-grid--gallery">
              <div className="event-gallery">
                <figure className="event-photo event-photo--landscape"><img src={`${import.meta.env.BASE_URL}assets/devjams-team-srgb.jpg`} alt="Noel and the GDG VIT DevJams team wearing matching Hello Kitty pyjamas" /><div className="thats-noel"><span>Noel</span><span className="thats-noel__arrow">↙</span></div><figcaption><span>DEVJAMS ’25</span> A late-night memory with the team.</figcaption></figure>
                <figure className="event-photo event-photo--portrait"><img src={`${import.meta.env.BASE_URL}assets/devjams-portrait-srgb.jpg`} alt="Noel with GDG VIT teammates during DevJams 2025" /><figcaption>Hackathons are serious. The uniform did not have to be.</figcaption></figure>
              </div>
              <div className="community-ledger community-ledger--rich">
                <article><span className="ledger-number">4,700</span><div><strong>The first doorway</strong><p>Applicants in the selection process through which Noel joined as the only new AI/ML junior core member.</p></div></article>
                <article><span className="ledger-number">≈5,000</span><div><strong>Building the next party</strong><p>Applicants helped evaluate in a later recruitment cycle; Noel personally assessed about 256 through tests, projects, and interviews.</p></div></article>
                <article><span className="ledger-number">400+</span><div><strong>One room, difficult ideas</strong><p>Students reached as sole speaker and curriculum designer for a session on transformer architecture and AlphaFold.</p></div></article>
                <a className="watch-talk" href={socialLinks.talk} target="_blank" rel="noreferrer"><Play />Watch “Inside Google’s DeepMind”<ArrowUpRight /></a>
              </div>
            </Reveal>
            <Reveal className="gdg-timeline">
              <div className="timeline-line" />
              <article><span>2023</span><strong>Joined the guild</strong><p>Selected into AI/ML and helped ship UltraChat plus three major events.</p></article>
              <article><span>2024–25</span><strong>Built the next season</strong><p>DevJams, Women Techies, and Hexathon again; Kargo; judging, planning, and recruitment.</p></article>
              <article><span>NOW</span><strong>Senior Core</strong><p>Helping lead AI/ML and recruiting the next cohort to carry the community forward.</p></article>
            </Reveal>
            <div className="event-row"><span>DEVJAMS</span><span>WOMEN TECHIES</span><span>HEXATHON</span><small>Planning · operations · technical work · judging</small></div>
          </div>
          <button className="ender-eye ender-eye--three" onClick={() => collectEye(3)} aria-label="Collect hidden Eye of Ender three"><span className="ender-eye-glyph">◈</span></button>
        </section>

        <section id="contact" className="world-section contact-section" data-world-section="6">
          <div className="section-inner contact-layout">
            <div className="contact-copy">
              <div className="eyebrow">THE PORTAL IS OPEN</div>
              <h2>Let’s build something<br /><span>unreasonably good.</span></h2>
              <p>For remote work, ambitious research, systems that need careful thinking, or a very serious conversation about Minecraft server optimization.</p>
              <div className="contact-actions"><a className="primary-button" href={socialLinks.email}><Mail />Send Noel an email<ArrowUpRight /></a><a className="secondary-button" href={`${import.meta.env.BASE_URL}Noel-Alex-Resume.pdf`} target="_blank" rel="noreferrer">View résumé<ExternalLink /></a></div>
              <div className="social-row"><a href={socialLinks.github} target="_blank" rel="noreferrer"><Github />GitHub</a><a href={socialLinks.linkedin} target="_blank" rel="noreferrer"><Linkedin />LinkedIn</a><a href={socialLinks.email}><Mail />Email</a></div>
            </div>
            <aside className="portal-card pixel-panel"><span className="portal-rune">◈</span><span>PLAYER CARD</span><strong>Noel Alex</strong><p>B.Tech Computer Science<br />Data Science specialization<br />VIT Vellore · 2027</p><div><MapPin />Vellore / Riyadh / online</div>{eyes.size === 3 && <div className="secret-unlocked"><Sparkles />Portal stabilized — secret found.</div>}</aside>
          </div>
          <footer><span>Built with React, motion, and far too many blocks. Music: “Into the Caves” by Umplix, CC0.</span><span>© {new Date().getFullYear()} Noel Alex · Not affiliated with Mojang or Microsoft.</span></footer>
        </section>
      </main>

      <div className="hotbar" aria-label="World navigation">
        {sections.map((section, index) => <button key={section.id} className={active === index ? 'is-selected' : ''} onClick={() => jumpTo(section.id)} aria-label={`Go to ${section.short}`}><span className="hotbar-number">{index + 1}</span><span className="hotbar-glyph">{section.short.slice(0, 2).toUpperCase()}</span><small>{section.short}</small></button>)}
      </div>
      <button className="creeper-whisper" onClick={() => showToast({ title: 'That’sssss enough clicking', detail: 'No portfolios were exploded.' })} aria-label="A suspicious creeper"><span className="creeper-face">▪ ▪<br /> ▀ </span><small>psst…</small></button>
      {creative && <div className="creative-badge"><Sparkles />CREATIVE MODE</div>}
      <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
      <Inventory open={inventoryOpen} onClose={() => setInventoryOpen(false)} onSelect={setSelectedProject} />
    </div>
  )
}
