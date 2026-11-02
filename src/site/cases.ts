import type { Icon } from '../content'

/**
 * The readable portfolio's project facts. Every number comes from the project's own
 * measurements; patent-sensitive projects show results only. Each project page
 * (pages/*.tsx) tells its own story around these; the 3D world reads content.ts.
 */

export type Case = {
  id: string
  name: string
  summary: string
  role: string
  year: string
  status: string
  icon: Icon
  accent: string
  /** One result a recruiter should remember, shown on the index. */
  headline: [string, string]
  lede: string
  stack: string[]
  limits?: string
  links: { label: string; href: string }[]
  /** Results only: the method is held back (patent work or an unpublished paper). */
  sealed?: string
  team?: boolean
}

export const cases: Case[] = [
  {
    id: 'arachne',
    name: 'Arachne',
    summary: 'A configurable, high-performance web crawler and page-capture platform in Rust',
    role: 'Solo',
    year: '2025–26',
    status: 'Active · private source',
    icon: ['hedge', 'hedge', 'hedge'],
    accent: '#2f6fd8',
    headline: ['181,755', 'live page captures collected'],
    lede: 'Point Arachne at a site, a sitemap or a list of URLs. It fetches over HTTP or renders in headless Chrome, and keeps each page as raw HTML, rendered DOM, a screenshot and a network log, with every job pausable, resumable and exportable.',
    stack: ['Rust', 'NATS JetStream', 'SQLite (WAL)', 'Content-addressed zstd blobs', 'Headless Chrome / Edge', 'Tailscale'],
    limits: 'The scale tier isn’t finished, and the older Scylla-based services are being retired rather than presented as a production deployment.',
    links: [],
  },
  {
    id: 'phishgcn',
    name: 'PhishGCN',
    summary: 'Phishing-page detection that starts by checking whether the labels are true',
    role: 'Solo research',
    year: '2026',
    status: 'Research · private',
    icon: ['sculk', 'sculk', 'sculk'],
    accent: '#d4541f',
    headline: ['64.7%', 'of phishing reports weren’t phishing pages'],
    lede: 'A detector trained on Arachne’s captures. The most important result came before any model: when you actually fetch a URL that a feed calls phishing, most of the time you get something else.',
    stack: ['Python', 'PyTorch', 'Graph neural networks', 'Evaluation design', 'Arachne'],
    sealed: 'The methods are part of a patent filing I’m preparing, so this page shows results, not how they were reached.',
    limits: 'The audited test set is about 1,200 pages, so intervals are wide, and the detector hasn’t been validated on fresh incoming traffic yet.',
    links: [],
  },
  {
    id: 'stretchy',
    name: 'Stretchy + HALO',
    summary: 'An evidence-grounded AI platform, and the embedding research inside it',
    role: 'Solo',
    year: '2026',
    status: 'Active · private',
    icon: ['me_side', 'me_drive', 'me_drive'],
    accent: '#087561',
    headline: ['862,917', 'files inventoried, zero read errors'],
    lede: 'A system for investigating enormous piles of documents, images, audio and video, where every conclusion traces back to the exact source it came from, and long inquiries can stop and resume without losing their place.',
    stack: ['Python', 'Rust', 'PostgreSQL', 'Temporal', 'Qdrant', 'FalkorDB'],
    sealed: 'The design is part of a patent filing in preparation, so this page sticks to measured results.',
    limits: 'Dense retrieval stays unpromoted until a human-written golden set exists, and remote workers still need field testing.',
    links: [],
  },
  {
    id: 'helix',
    name: 'HELIX Lite',
    summary: 'A parallelizing compiler in Rust that proves which loops are safe, and shows the proof',
    role: 'Solo',
    year: '2026',
    status: 'v1.0 · open source',
    icon: ['brass_casing', 'andesite_casing', 'andesite_casing'],
    accent: '#1fb5b0',
    headline: ['5.79×', 'saxpy speedup on 8 threads'],
    lede: 'Write plain sequential loops. HELIX proves which ones are safe to spread across CPU cores, runs them in parallel when it pays off, and prints the evidence for every verdict.',
    stack: ['Rust', 'Cranelift', 'SSA', 'Dependence analysis', 'WebAssembly playground'],
    limits: 'Parallel code still loses to optimized sequential code on mid-size multi-array kernels; the per-access dispatch overhead is documented.',
    links: [
      { label: 'Run it in your browser', href: 'https://noel-alex.github.io/helix-compiler/' },
      { label: 'Source', href: 'https://github.com/Noel-Alex/helix-compiler' },
    ],
  },
  {
    id: 'polysafe',
    name: 'PolySafe',
    summary: 'Predicting drug-pair side effects, and knowing when to trust the prediction',
    role: 'Research lead',
    year: '2026',
    status: 'Research · private',
    icon: ['bricks', 'stone_bricks', 'stone_bricks'],
    accent: '#8fbf2e',
    headline: ['≈2.5×', 'score inflation from random splits'],
    lede: 'Research on predicting the side effects of taking two drugs together across 964 side-effect classes, with the emphasis on where a score holds up and where it falls apart.',
    stack: ['Python', 'PyTorch', 'Graph learning', 'Selective prediction'],
    sealed: 'The method is unpublished, so this page shows results only.',
    limits: 'Cold-split numbers are development benchmarks until the frozen holdout set lands.',
    links: [],
  },
  {
    id: 'sivana',
    name: 'Sivana',
    summary: 'Audio recognition in Rust, fingerprinted in the browser',
    role: 'Solo',
    year: '2025–26',
    status: 'Phase 10 · open source',
    icon: ['jukebox_top', 'jukebox_side', 'jukebox_side'],
    accent: '#ff4a1c',
    headline: ['0.4 ms', 'per match, down from 9.0 ms'],
    lede: 'Hear it, name it. A Rust audio-recognition engine with streaming fingerprints and a custom memory-mapped index. A WASM build fingerprints in the browser, so raw audio never leaves the page.',
    stack: ['Rust', 'WebAssembly', 'LMDB', 'Axum', 'Chrome extension'],
    limits: 'Offset accuracy trails the prototype (60% vs 78%). Offset-tolerant voting is next.',
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/Sivana' }],
  },
  {
    id: 'aster',
    name: 'AsterLM Frontier',
    summary: 'The strongest language model a 12 GiB laptop GPU can train',
    role: 'Solo',
    year: '2026',
    status: 'Research · open source',
    icon: ['beacon', 'beacon', 'beacon'],
    accent: '#a5422d',
    headline: ['890M', 'parameters in 12 GiB of VRAM'],
    lede: 'A research and training stack for finding the best language model that can actually be trained on one RTX 4080 Laptop GPU, with VRAM, throughput, checkpoints and evaluations measured at every step.',
    stack: ['Python', 'PyTorch', 'Mixture of experts', 'Triton'],
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/AsterLM-Frontier' }],
  },
  {
    id: 'petra',
    name: 'Petra',
    summary: 'A petri dish you can play, driven by a real simulation',
    role: 'Solo',
    year: '2026',
    status: 'In progress · open source',
    icon: ['mycelium_top', 'mycelium_side', 'mycelium_side'],
    accent: '#62b7b6',
    headline: ['1 seed', 'replays any experiment exactly'],
    lede: 'An interactive petri-dish lab in the browser. Change nutrients and antibiotics and watch E. coli grow, collapse and evolve resistance, from a seeded simulation rather than canned video.',
    stack: ['TypeScript', 'React', 'Web Workers', 'WebGL'],
    links: [{ label: 'Source', href: 'https://github.com/Noel-Alex/Petra' }],
  },
  {
    id: 'kargo',
    name: 'Kargo',
    summary: 'Repository in, running app out',
    role: 'GDG VIT team · repository analysis',
    year: '2024–25',
    status: 'Shipped',
    icon: ['copper_roof', 'copper_block', 'copper_block'],
    accent: '#d27a44',
    headline: ['Repo → K8s', 'with generated Docker config'],
    lede: 'A GDG VIT platform that takes a Git repository, writes its Docker setup, deploys it to Kubernetes and keeps watching it once it’s live.',
    stack: ['TypeScript', 'Python', 'Docker', 'Kubernetes', 'LangChain'],
    team: true,
    links: [
      { label: 'Visit Kargo', href: 'https://kargo.dscvit.com/' },
      { label: 'Backend', href: 'https://github.com/GDGVIT/kargo-backend' },
    ],
  },
  {
    id: 'ultrachat',
    name: 'UltraChat',
    summary: 'A Discord server that remembers',
    role: 'GDG VIT team',
    year: '2023–24',
    status: 'Shipped',
    icon: ['oak_planks', 'bookshelf', 'bookshelf'],
    accent: '#5865f2',
    headline: ['First', 'team project I shipped'],
    lede: 'A Discord bot that turns a server’s history into summaries and searchable memory, so answers stop disappearing up the channel.',
    stack: ['Python', 'LlamaIndex', 'LangChain', 'ChromaDB', 'Discord API', 'Docker'],
    team: true,
    links: [{ label: 'Source', href: 'https://github.com/GDGVIT/ultrachat' }],
  },
]

export const caseById = (id: string) => cases.find(c => c.id === id)
