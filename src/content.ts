import type { LandmarkId } from './engine/world'

export type Link = { label: string; href: string }
export type Stat = { value: string; label: string }
export type Demo = 'helix' | 'sivana' | 'kargo' | 'ultrachat' | 'phishgcn' | 'polysafe' | 'aster'
/** An isometric block icon: top, left and right face tiles. */
export type Icon = [string, string, string?]

export type Project = {
  id: string
  name: string
  version: string
  summary: string
  credit: string
  year: string
  landmark?: LandmarkId
  icon: Icon
  lede: string
  body: string[]
  stats: Stat[]
  stack?: string[]
  limits?: string
  links: Link[]
  demo?: Demo
  /** Patent-sensitive: outcomes only. */
  sealed?: boolean
}

export const projects: Project[] = [
  {
    id: 'stretchy',
    name: 'Stretchy',
    version: 'active · private',
    summary: 'An evidence archive for huge mixed-media collections',
    credit: 'Solo',
    year: '2026',
    landmark: 'stretchy',
    icon: ['me_side', 'me_drive', 'me_drive'],
    lede: 'A local-first system for investigating enormous piles of documents, images, audio and video, where every conclusion traces back to the exact source it came from.',
    body: [
      'Investigations that run for weeks shouldn’t forget what they found yesterday. Stretchy keeps long inquiries resumable, and keeps every finding tied to where it was found.',
      'I’m building it alone. The source and design stay private for now, so this page sticks to measured results.',
    ],
    stats: [
      { value: '862,917', label: 'files inventoried in one run, 130.26 GB, without copying the source and with zero read errors' },
      { value: '288 /s', label: 'units embedded in the dense retrieval run, at 2.25 GiB peak VRAM' },
      { value: '0', label: 'fabricated records: empty states render empty, and demo data never poses as real' },
    ],
    limits: 'Dense retrieval stays unpromoted until a human-written golden set exists, and remote workers still need field testing.',
    links: [],
    sealed: true,
  },
  {
    id: 'arachne',
    name: 'Arachne',
    version: 'active · private',
    summary: 'A configurable, high-performance web crawler in Rust',
    credit: 'Solo',
    year: '2025–26',
    landmark: 'arachne',
    icon: ['hedge', 'hedge', 'hedge'],
    lede: 'A general-purpose crawler and page-capture platform. Point it at a site, a sitemap or a list of URLs, and it fetches over HTTP or renders in headless Chrome, keeping each page as raw HTML, rendered DOM, screenshot and network log.',
    body: [
      'It runs on one laptop with SQLite, a content-addressed blob store and a bundled NATS JetStream queue. Friends add capacity by running capture workers over Tailscale, and workers never touch the owner’s database.',
      'Safety is part of the design: robots rules, per-job scope and budgets, and SSRF checks that re-run on every redirect hop.',
    ],
    stats: [
      { value: '203,367', label: 'page captures in the October 2026 study snapshot behind PhishGCN' },
      { value: '4', label: 'crawl modes: whole site, sitemap, URL list, forensic capture' },
      { value: '5', label: 'artifacts per capture: raw HTML, rendered DOM, screenshot, network log, favicon' },
    ],
    stack: ['Rust', 'NATS JetStream', 'SQLite', 'Headless Chrome', 'zstd', 'Tailscale'],
    limits: 'The scale tier (Postgres, ScyllaDB, S3) is designed and partly built, not finished. I don’t quote pages per second until it’s measured end to end.',
    links: [],
  },
  {
    id: 'phishgcn',
    name: 'PhishGCN',
    version: 'research · private',
    summary: 'Phishing detection that starts by checking the labels',
    credit: 'Solo',
    year: '2026',
    landmark: 'phishgcn',
    icon: ['sculk', 'sculk', 'sculk'],
    lede: 'A phishing-page detector trained on Arachne’s captures. The biggest finding came before any model: most pages reported as phishing aren’t phishing pages by the time anyone looks.',
    body: [
      'A feed says a URL is phishing; the page you fetch is often a takedown notice, a parked domain or a redirect. Train on those labels and the model learns the wrong thing, so I measured how wrong they are and trained around it.',
      'The methods are in an invention disclosure under review, so this page sticks to results.',
    ],
    stats: [
      { value: '64.7%', label: 'of live captures of phishing-reported URLs flagged as stand-ins, not phishing pages' },
      { value: '0.724', label: 'PR-AUC on a hand-audited test set, up from 0.614 trained on feed labels alone' },
      { value: '61.4%', label: 'recall at a 0.5% false-alarm target, at 79.4% audited precision' },
    ],
    stack: ['Python', 'PyTorch', 'Graph neural networks', 'Evaluation design'],
    limits: 'The audited set is about 1,200 pages, so the interval is wide (PR-AUC 0.668–0.780), and it hasn’t been validated on fresh traffic yet.',
    links: [],
    demo: 'phishgcn',
    sealed: true,
  },
  {
    id: 'helix',
    name: 'HELIX Lite',
    version: '1.0 · public',
    summary: 'A parallelizing compiler that shows its proof',
    credit: 'Solo',
    year: '2026',
    landmark: 'helix',
    icon: ['brass_casing', 'andesite_casing', 'andesite_casing'],
    lede: 'Write plain sequential loops. HELIX proves which ones are safe to spread across your CPU cores, runs them in parallel when it pays off, and prints the evidence for every verdict.',
    body: [
      'The whole pipeline is mine: lexer, Pratt parser, type checker, SSA, the usual optimizations, a battery of dependence tests, and Cranelift for native x86-64.',
      'When it can’t prove a loop is safe, it refuses, and tells you exactly which dependence stopped it.',
    ],
    stats: [
      { value: '5.79×', label: 'saxpy speedup on 8 threads over 16M doubles, peaking at 7.84× on 32' },
      { value: '204×', label: 'matmul 128², interpreter to native code (1199 ms to 5.9 ms)' },
      { value: '2 of 9', label: 'benchmark kernels refused on purpose, because their loops carry a dependence' },
    ],
    stack: ['Rust', 'Cranelift', 'SSA', 'Dependence analysis'],
    limits: 'Parallel code still loses to optimized sequential code on mid-size multi-array kernels; the per-access dispatch overhead is documented.',
    links: [
      { label: 'Run it in your browser', href: 'https://noel-alex.github.io/helix-compiler/' },
      { label: 'Source', href: 'https://github.com/Noel-Alex/helix-compiler' },
    ],
    demo: 'helix',
  },
  {
    id: 'sivana',
    name: 'Sivana',
    version: 'phase 10 · public',
    summary: 'Audio recognition in Rust, fingerprinted in your browser',
    credit: 'Solo',
    year: '2025–26',
    landmark: 'sivana',
    icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'],
    lede: 'Hear it, name it. A Rust audio-recognition engine with streaming fingerprints, a custom memory-mapped index, and a WASM build, so the browser fingerprints locally and raw audio never leaves the page.',
    body: [
      'I rebuilt my first prototype phase by phase and kept the old one frozen as a control. Every change had to beat it on the same degradation grid.',
      'There’s also a Chrome extension that names whatever is playing in a tab, using the same engine.',
    ],
    stats: [
      { value: '76.7%', label: 'of degraded clips recognised with zero false accepts, against 35% for the prototype' },
      { value: '0.4 ms', label: 'per match, against 9.0 ms for the prototype on the same machine' },
      { value: '10', label: 'build phases, from benchmark platform to scale-out' },
    ],
    stack: ['Rust', 'WASM', 'LMDB', 'Axum'],
    limits: 'The benchmark grid is small (a few tracks, 10 out-of-catalog probes), so these are development numbers, not field accuracy.',
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/Sivana' }],
    demo: 'sivana',
  },
  {
    id: 'polysafe',
    name: 'PolySafe',
    version: 'research · private',
    summary: 'Drug-pair side-effect prediction, and knowing when to trust it',
    credit: 'Research lead',
    year: '2026',
    landmark: 'polysafe',
    icon: ['bricks', 'stone_bricks', 'stone_bricks'],
    lede: 'Research on predicting the side effects of taking two drugs together, and on knowing when those predictions are safe to act on.',
    body: [
      'Most work in this area reports one impressive number. I care more about where that number holds up and where it falls apart.',
      'It stays private for now, so this page sticks to results.',
    ],
    stats: [
      { value: '964', label: 'side-effect classes scored for every drug pair' },
      { value: '63,472', label: 'drug pairs in the evaluation set' },
      { value: '≈2.5×', label: 'how much random splits inflate scores compared with testing on drugs the model never saw' },
    ],
    limits: 'Cold-split numbers are development benchmarks until the frozen holdout set lands.',
    links: [],
    demo: 'polysafe',
    sealed: true,
  },
  {
    id: 'aster',
    name: 'AsterLM Frontier',
    version: 'research · public',
    summary: 'The best language model a 12 GiB laptop GPU can train',
    credit: 'Solo',
    year: '2026',
    landmark: 'aster',
    icon: ['beacon', 'beacon', 'beacon'],
    lede: 'A complete research and training stack for finding the strongest language model that can actually be trained on one RTX 4080 Laptop GPU.',
    body: [
      'The lead candidate is a hybrid mixture-of-experts. It has to beat a matched dense model on quality, speed, memory and stability before I call it the winner, and so far it hasn’t earned that.',
      'Everything is measured: VRAM, throughput, exact checkpoints, evaluations.',
    ],
    stats: [
      { value: '890M', label: 'parameters in the main candidate' },
      { value: '482M', label: 'of them active per token' },
      { value: '12 GiB', label: 'of VRAM to fit it all in' },
    ],
    stack: ['Python', 'PyTorch', 'MoE', 'Triton'],
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/AsterLM-Frontier' }],
    demo: 'aster',
  },
  {
    id: 'petra',
    name: 'Petra',
    version: 'in progress · public',
    summary: 'A petri dish you can play, running a real model',
    credit: 'Solo',
    year: '2026',
    landmark: 'petra',
    icon: ['mycelium_top', 'mycelium_side', 'mycelium_side'],
    lede: 'An interactive petri-dish lab in the browser. Change nutrients and antibiotics and watch E. coli grow, collapse and evolve resistance, driven by a seeded simulation rather than canned video.',
    body: [
      'The flagship scenario pits E. coli against ciprofloxacin, with literature-backed resistance data, mutation, spatial competition and exact replays from a seed.',
      'It should feel like a game and behave like a model, so every parameter shows where it came from.',
    ],
    stats: [],
    stack: ['TypeScript', 'React', 'Web Workers', 'WebGL'],
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/Petra' }],
  },
  {
    id: 'kargo',
    name: 'Kargo',
    version: 'GDG VIT · team',
    summary: 'Repository in, running app out',
    credit: 'GDG VIT team',
    year: '2024–25',
    landmark: 'kargo',
    icon: ['copper_roof', 'copper_block', 'copper_block'],
    lede: 'A GDG VIT platform that takes a Git repository, writes its Docker setup, deploys it to Kubernetes, and keeps watching it once it’s live.',
    body: [
      'My part was the AI path that reads a codebase: shallow cloning, picking which files matter, summarizing them, and pulling out ports and persistent volumes so the generated Docker config actually runs.',
      'A team build. Plenty of the shared work never shows up in anyone’s commit history.',
    ],
    stats: [],
    stack: ['TypeScript', 'Python', 'Docker', 'Kubernetes', 'LangChain'],
    links: [
      { label: 'Visit Kargo', href: 'https://kargo.dscvit.com/' },
      { label: 'Backend', href: 'https://github.com/GDGVIT/kargo-backend' },
      { label: 'Frontend', href: 'https://github.com/GDGVIT/kargo-frontend' },
    ],
    demo: 'kargo',
  },
  {
    id: 'ultrachat',
    name: 'UltraChat',
    version: 'GDG VIT · team',
    summary: 'A Discord server that remembers',
    credit: 'GDG VIT team',
    year: '2023–24',
    landmark: 'ultrachat',
    icon: ['oak_planks', 'bookshelf', 'bookshelf'],
    lede: 'A Discord bot that turns a server’s history into summaries and searchable memory, so answers stop disappearing up the channel.',
    body: [
      'My first project at GDG. I worked on message collection, long-text summarization, vector storage, retrieval, the Discord commands and the Docker setup.',
      'It’s old and I’d build it differently today. It stays because it’s where I learned to ship with a team.',
    ],
    stats: [],
    stack: ['Python', 'LlamaIndex', 'LangChain', 'ChromaDB', 'Discord API', 'Docker'],
    links: [{ label: 'Source', href: 'https://github.com/GDGVIT/ultrachat' }],
    demo: 'ultrachat',
  },
  {
    id: 'firstbot',
    name: 'The school Discord bot',
    version: 'grade 11 · private',
    summary: 'The first thing I built that people used',
    credit: 'Solo',
    year: 'Grade 11',
    icon: ['jukebox_top', 'note_block', 'note_block'],
    lede: 'In Grade 11 I learned Python by building a Discord bot for my friends during remote school: music, games, moderation, and reminders that posted the right online-class links.',
    body: ['The code is private and a little embarrassing. It’s here because this is where it started.'],
    stats: [],
    stack: ['Python', 'discord.py', 'FFmpeg'],
    links: [],
  },
]

export const projectById = (id: string) => projects.find(p => p.id === id)

export const landmarkBook: Partial<Record<LandmarkId, string>> = {
  spawn: 'noel', stretchy: 'stretchy', arachne: 'arachne', phishgcn: 'phishgcn', helix: 'helix', sivana: 'sivana', polysafe: 'polysafe',
  aster: 'aster', petra: 'petra', kargo: 'kargo', ultrachat: 'ultrachat',
}

export const hotbar: { landmark: LandmarkId; label: string; icon: Icon }[] = [
  { landmark: 'stretchy', label: 'Stretchy', icon: ['me_side', 'me_drive', 'me_drive'] },
  { landmark: 'arachne', label: 'Arachne', icon: ['hedge', 'hedge', 'hedge'] },
  { landmark: 'phishgcn', label: 'PhishGCN', icon: ['sculk', 'sculk', 'sculk'] },
  { landmark: 'helix', label: 'HELIX Lite', icon: ['brass_casing', 'andesite_casing', 'andesite_casing'] },
  { landmark: 'sivana', label: 'Sivana', icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'] },
  { landmark: 'polysafe', label: 'PolySafe', icon: ['bricks', 'stone_bricks', 'stone_bricks'] },
  { landmark: 'aster', label: 'AsterLM Frontier', icon: ['beacon', 'beacon', 'beacon'] },
  { landmark: 'petra', label: 'Petra', icon: ['mycelium_top', 'mycelium_side', 'mycelium_side'] },
  { landmark: 'kargo', label: 'Kargo', icon: ['copper_roof', 'copper_block', 'copper_block'] },
]

export const landmarkName: Record<LandmarkId, string> = {
  spawn: 'Noel', stretchy: 'Stretchy', arachne: 'Arachne', phishgcn: 'PhishGCN', helix: 'HELIX Lite', sivana: 'Sivana', polysafe: 'PolySafe',
  aster: 'AsterLM Frontier', petra: 'Petra', kargo: 'Kargo', ultrachat: 'UltraChat', gdg: 'GDG VIT', portal: 'Open to work',
}

export const links = {
  email: 'mailto:noelalex404@gmail.com',
  emailText: 'noelalex404@gmail.com',
  github: 'https://github.com/Noel-Alex',
  linkedin: 'https://www.linkedin.com/in/noel-alex-b1731128b/',
  talk: 'https://www.youtube.com/watch?v=SGLh-A3z4yI',
  resume: `${import.meta.env.BASE_URL}Noel-Alex-Resume.pdf`,
}

export const player = {
  name: 'Noel Alex',
  lede: 'I build systems that can explain themselves, then I benchmark them far past the point where a normal person would have stopped.',
  facts: [
    ['Studying', 'B.Tech Computer Science, Data Science specialization, VIT Vellore. Graduating 2027.'],
    ['Grew up', 'Riyadh, where I was Head Boy at school.'],
    ['Community', 'Senior Core Member at GDG VIT, helping lead AI/ML.'],
    ['Open to', 'A full-semester internship from January 2027, onsite in Bengaluru or Riyadh.'],
  ] as [string, string][],
  cares: [
    ['Evidence-grounded AI', 'Retrieval, knowledge graphs, agent workflows, conclusions that cite their source.'],
    ['Distributed systems', 'Queues, workers, durable state, recovery, performance that survives real load.'],
    ['Search and retrieval', 'Crawling, indexing, ranking, and the plumbing that makes them useful.'],
    ['Scientific tooling', 'Reproducible experiments, careful benchmarks, honest limits.'],
  ] as [string, string][],
  offClock: 'Modded Minecraft on hardware it has no business running on (a Raspberry Pi, over Tailscale), strength training, philosophy, debate, and research rabbit holes.',
}

export type Server = {
  id: string
  name: string
  motd: [string, string]
  players: string
  icon: Icon
  ping: number
  photo?: { src: string; alt: string }
  body: string[]
  link?: Link
}

export const servers: Server[] = [
  {
    id: 'gdg',
    name: 'GDG VIT',
    motd: ['Senior Core · AI/ML', 'Picked in 2023 as the only new AI/ML junior core'],
    players: '1/4700',
    icon: ['grass_top', 'grass_side', 'grass_side'],
    ping: 5,
    body: [
      'I joined Google Developer Groups at VIT in 2023 through a process with about 4,700 applicants, as the only new junior core member in AI/ML.',
      'Since then: UltraChat and Kargo, technical planning, judging, recruitment, and now helping lead the AI/ML domain as a Senior Core Member.',
    ],
  },
  {
    id: 'devjams',
    name: "DevJams '25",
    motd: ['Organiser · two seasons', 'DevJams, Women Techies and Hexathon'],
    players: '12/12',
    icon: ['jukebox_top', 'note_block', 'note_block'],
    ping: 5,
    photo: { src: 'devjams-team-srgb.jpg', alt: 'The GDG VIT DevJams 2025 organising team on stage in matching Hello Kitty pyjama trousers' },
    body: [
      'Two seasons organising GDG VIT’s three big events: DevJams, Women Techies and Hexathon, across operations, technical work and judging.',
      'Good events feel like worlds people enter together. Also, yes, those are matching pyjamas.',
    ],
  },
  {
    id: 'deepmind',
    name: 'Inside Google’s DeepMind',
    motd: ['Sole speaker and curriculum designer', 'From transformers to AlphaFold'],
    players: '400/400',
    icon: ['bookshelf', 'bookshelf', 'bookshelf'],
    ping: 4,
    body: [
      'I designed and gave a session for more than 400 students, walking from transformers through to AlphaFold.',
    ],
    link: { label: 'Watch the session', href: 'https://www.youtube.com/watch?v=SGLh-A3z4yI' },
  },
  {
    id: 'recruitment',
    name: 'Recruitment 2025',
    motd: ['~5,000 applicants, 256 on my AI/ML shortlist', '~80 interviewed, each with a project'],
    players: '80/256',
    icon: ['oak_log_top', 'crafting_side', 'crafting_side'],
    ping: 3,
    body: [
      'Picking the next cohort over three rounds. About 5,000 applicants took the main quiz and 256 made the AI/ML shortlist, which I ran end to end. My domain quiz cut that to about 80; I gave each of them a project and interviewed them.',
    ],
  },
  {
    id: 'smp',
    name: 'The friends SMP',
    motd: ['Java survival, modded', 'Party of four, dragon down'],
    players: '4/4',
    icon: ['end_frame_top', 'end_frame_side', 'end_frame_side'],
    ping: 5,
    photo: { src: 'minecraft-end-portal.webp', alt: 'My friends in netherite armour in a mossy stronghold corridor, just before we fought the Ender Dragon' },
    body: [
      'A real night in a world my friends and I built together, right before the Ender Dragon fight.',
      'I run modded servers on hardware that shouldn’t manage it. Create is non-negotiable.',
    ],
  },
  {
    id: 'riyadh',
    name: 'Riyadh',
    motd: ['Where I grew up', 'Head Boy, back at school'],
    players: '1/1',
    icon: ['sand', 'sand', 'sand'],
    ping: 2,
    body: ['I grew up in Riyadh and served as Head Boy, which taught me most of what I know about earning trust and making a group work better.'],
  },
]

export type Advancement = { id: string; title: string; desc: string; icon: Icon; x: number; y: number; parent?: string; frame?: 'task' | 'goal' | 'challenge'; locked?: boolean; date?: string; book?: string }

export const advancementTabs: { id: string; title: string; icon: Icon; items: Advancement[] }[] = [
  {
    id: 'story',
    title: 'Story',
    icon: ['grass_top', 'grass_side', 'grass_side'],
    items: [
      { id: 'riyadh', title: 'Spawn Point', desc: 'Grew up in Riyadh', icon: ['sand', 'sand', 'sand'], x: 0, y: 1 },
      { id: 'headboy', title: 'Head Boy', desc: 'Elected Head Boy at school', icon: ['gold_block', 'gold_block', 'gold_block'], x: 1, y: 0, parent: 'riyadh', frame: 'goal' },
      { id: 'bot', title: 'Hello, World', desc: 'Grade 11: a Discord bot my friends actually used', icon: ['jukebox_top', 'note_block', 'note_block'], x: 1, y: 2, parent: 'riyadh', book: 'firstbot' },
      { id: 'vit', title: 'New World', desc: 'B.Tech CSE (Data Science), VIT Vellore', icon: ['bookshelf', 'bookshelf', 'bookshelf'], x: 2, y: 1, parent: 'bot' },
      { id: 'gdg', title: 'Guild Joined', desc: 'GDG VIT AI/ML, the only new junior core from ~4,700 applicants', icon: ['grass_top', 'grass_side', 'grass_side'], x: 3, y: 1, parent: 'vit', frame: 'goal', date: '2023' },
      { id: 'deepmind', title: 'Full House', desc: 'Taught 400+ students how DeepMind’s models work', icon: ['beacon', 'beacon', 'beacon'], x: 4, y: 0, parent: 'gdg', frame: 'challenge' },
      { id: 'events', title: 'Party Host', desc: 'Organised DevJams, Women Techies and Hexathon, twice', icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'], x: 4, y: 2, parent: 'gdg' },
      { id: 'senior', title: 'Senior Core', desc: 'Helping lead AI/ML and choosing the next cohort', icon: ['diamond_block', 'diamond_block', 'diamond_block'], x: 5, y: 1, parent: 'gdg', frame: 'goal' },
      { id: 'grad', title: 'Graduate', desc: 'Class of 2027', icon: ['iron_block', 'iron_block', 'iron_block'], x: 6, y: 1, parent: 'senior', locked: true },
      { id: 'team', title: '???', desc: 'Your move', icon: ['end_frame_top', 'end_frame_side', 'end_frame_side'], x: 7, y: 1, parent: 'grad', frame: 'challenge', locked: true },
    ],
  },
  {
    id: 'builds',
    title: 'Builds',
    icon: ['brass_casing', 'andesite_casing', 'andesite_casing'],
    items: [
      { id: 'ultrachat', title: 'First Commit', desc: 'UltraChat, my first GDG build', icon: ['oak_planks', 'bookshelf', 'bookshelf'], x: 0, y: 1, date: '2023', book: 'ultrachat' },
      { id: 'kargo', title: 'Ship It', desc: 'Kargo: repository in, running app out', icon: ['copper_roof', 'copper_block', 'copper_block'], x: 1, y: 1, parent: 'ultrachat', date: '2024', book: 'kargo' },
      { id: 'sivana', title: 'Name That Tune', desc: 'Sivana, audio recognition in Rust', icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'], x: 2, y: 0, parent: 'kargo', date: '2025', book: 'sivana' },
      { id: 'arachne', title: 'Caught in the Web', desc: 'Arachne, a crawler in Rust', icon: ['hedge', 'hedge', 'hedge'], x: 2, y: 2, parent: 'kargo', date: '2025', book: 'arachne', frame: 'goal' },
      { id: 'phishgcn', title: 'Trust Issues', desc: 'PhishGCN: most phishing reports aren’t phishing', icon: ['sculk', 'sculk', 'sculk'], x: 3, y: 3, parent: 'arachne', date: '2026', book: 'phishgcn', frame: 'goal' },
      { id: 'stretchy', title: 'Total Recall', desc: 'Stretchy, the evidence archive', icon: ['me_side', 'me_drive', 'me_drive'], x: 3, y: 2, parent: 'arachne', date: '2026', book: 'stretchy', frame: 'challenge' },
      { id: 'helix', title: 'Proof of Work', desc: 'HELIX Lite, a compiler that shows its proof', icon: ['brass_casing', 'andesite_casing', 'andesite_casing'], x: 3, y: 0, parent: 'sivana', date: '2026', book: 'helix', frame: 'goal' },
      { id: 'aster', title: 'Beaconator', desc: 'AsterLM Frontier on a laptop GPU', icon: ['beacon', 'beacon', 'beacon'], x: 4, y: 0, parent: 'helix', date: '2026', book: 'aster' },
      { id: 'petra', title: 'Fungus Among Us', desc: 'Petra, a playable petri dish', icon: ['mycelium_top', 'mycelium_side', 'mycelium_side'], x: 4, y: 1, parent: 'helix', date: '2026', book: 'petra' },
      { id: 'polysafe', title: 'Local Brewery', desc: 'PolySafe, drug-pair safety research', icon: ['bricks', 'stone_bricks', 'stone_bricks'], x: 4, y: 2, parent: 'stretchy', date: '2026', book: 'polysafe', frame: 'challenge' },
    ],
  },
]

export const splashes = [
  'Benchmarked past the point of reason!',
  '5.79× on 8 threads!',
  'Now with honest error bars!',
  'Also try Petra!',
  'Create is non-negotiable!',
  '1 of 4,700!',
  'Head Boy edition!',
  'Runs on a Raspberry Pi!',
  'Zero fabricated records!',
  'Raw audio never leaves the page!',
  'Proves its loops!',
  '400+ students!',
  'Class of 2027!',
  'Fan-made with love!',
  'From Riyadh to Vellore!',
  'Now 96.9% less leaky!',
]

/** Things a visitor can discover. Earned ones persist in this browser only. */
export const achievements = [
  { id: 'world', title: 'Hello, World', desc: 'Enter the world', icon: ['grass_top', 'grass_side', 'grass_side'] as Icon },
  { id: 'book', title: 'Bookworm', desc: 'Open a guidebook', icon: ['oak_planks', 'bookshelf', 'bookshelf'] as Icon },
  { id: 'helix', title: 'Benchmark Enjoyer', desc: 'Read the HELIX guidebook', icon: ['brass_casing', 'andesite_casing', 'andesite_casing'] as Icon },
  { id: 'maze', title: 'Caught in the Web', desc: 'Reach the heart of the hedge maze', icon: ['hedge', 'hedge', 'hedge'] as Icon },
  { id: 'music', title: 'Sound of Music', desc: 'Visit the jukebox studio', icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'] as Icon },
  { id: 'inventory', title: 'Taking Inventory', desc: 'Open your inventory', icon: ['crafting_top', 'crafting_side', 'crafting_side'] as Icon },
  { id: 'craft', title: 'Benchmarking', desc: 'Craft a project from its parts', icon: ['crafting_top', 'crafting_side', 'crafting_side'] as Icon },
  { id: 'multiplayer', title: 'Multiplayer', desc: 'Join a server', icon: ['grass_top', 'grass_side', 'grass_side'] as Icon },
  { id: 'command', title: 'Cheats Enabled', desc: 'Run a command', icon: ['me_controller', 'me_side', 'me_side'] as Icon },
  { id: 'creeper', title: 'Monster Hunter', desc: 'Survive a creeper', icon: ['colony_green', 'colony_green', 'colony_green'] as Icon },
  { id: 'void', title: 'Out of This World', desc: 'Fall off the island', icon: ['obsidian', 'obsidian', 'obsidian'] as Icon },
  { id: 'splash', title: 'Splash Collector', desc: 'Read five splash texts', icon: ['gold_block', 'gold_block', 'gold_block'] as Icon },
  { id: 'explorer', title: 'Adventuring Time', desc: 'Visit every build', icon: ['grass_top', 'path', 'path'] as Icon },
  { id: 'diamonds', title: 'Diamonds!', desc: 'Get in touch', icon: ['diamond_block', 'diamond_block', 'diamond_block'] as Icon },
]
export type AchievementId = (typeof achievements)[number]['id']
