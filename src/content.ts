export type ProjectLink = {
  label: string
  href: string
}

export type Project = {
  slug: string
  number: string
  title: string
  item: 'moss' | 'book' | 'minecart' | 'jukebox'
  status: string
  summary: string
  contribution: string
  stack: string[]
  links: ProjectLink[]
}

export const sections = [
  { id: 'spawn', label: 'Spawn point', short: 'Home', item: 'grass' },
  { id: 'story', label: 'The player', short: 'Player', item: 'map' },
  { id: 'stretchy', label: 'Ancient city', short: 'Stretchy', item: 'moss' },
  { id: 'builds', label: 'The workshop', short: 'Builds', item: 'chest' },
  { id: 'research', label: 'Below bedrock', short: 'Research', item: 'crystal' },
  { id: 'community', label: 'The village', short: 'GDG', item: 'lantern' },
  { id: 'contact', label: 'The portal', short: 'Contact', item: 'eye' },
] as const

export const projects: Project[] = [
  {
    slug: 'stretchy',
    number: 'ACTIVE WORLD',
    title: 'Stretchy',
    item: 'moss',
    status: 'Active build · public preview',
    summary: 'A local-first evidence and investigation system built for very large, mixed-media corpora.',
    contribution: 'Built solo across the Rust scanner, Python control plane and workers, durable Temporal investigations, retrieval, evidence graph, telemetry, security boundaries, and editorial command centre.',
    stack: ['Python', 'Rust', 'Temporal', 'PostgreSQL', 'Qdrant', 'FalkorDB'],
    links: [
      { label: 'Explore source', href: 'https://github.com/Noel-Alex/stretchy' },
      { label: 'Open public preview', href: 'https://noel-alex.github.io/stretchy/' },
    ],
  },
  {
    slug: 'ultrachat',
    number: 'GDG BUILD',
    title: 'UltraChat',
    item: 'book',
    status: 'Collaborative · GDG VIT',
    summary: 'A Discord knowledge companion that turns a server’s conversation history into summaries and searchable context.',
    contribution: 'Worked across collection, long-text summarisation, RAG queries, vector storage, Discord commands, Docker setup, prompts, and backend integration; later explored a separate Go + DynamoDB backend for an AWS project.',
    stack: ['Python', 'LlamaIndex', 'LangChain', 'ChromaDB', 'Discord API', 'Docker'],
    links: [
      { label: 'Combined repository', href: 'https://github.com/GDGVIT/ultrachat' },
      { label: 'Original bot history', href: 'https://github.com/GDGVIT/ultra-chat-bot' },
    ],
  },
  {
    slug: 'kargo',
    number: 'GDG BUILD',
    title: 'Kargo',
    item: 'minecart',
    status: 'Collaborative · GDG VIT',
    summary: 'A platform for taking repositories through container configuration and into managed application deployments.',
    contribution: 'Contributed to the AI repository-analysis path: shallow cloning, extension-aware source selection, codebase summarisation, and extraction of ports and persistent-volume signals used to propose Docker configuration.',
    stack: ['TypeScript', 'Python', 'Docker', 'Kubernetes', 'GitHub', 'LangChain'],
    links: [
      { label: 'Visit Kargo', href: 'https://kargo.dscvit.com/' },
      { label: 'Backend', href: 'https://github.com/GDGVIT/kargo-backend' },
      { label: 'Frontend', href: 'https://github.com/GDGVIT/kargo-frontend' },
    ],
  },
  {
    slug: 'kermit',
    number: 'FIRST TOOL',
    title: 'The school Discord bot',
    item: 'jukebox',
    status: 'Personal · private archive',
    summary: 'A Grade 11 experiment that became the bot Noel and his friends actually used during remote school.',
    contribution: 'Learned Python through music commands, games, moderation, and reminders that posted the correct online-class links. The code stays private; the memory matters more than the repository.',
    stack: ['Python', 'Discord.py', 'FFmpeg', 'APIs', 'Experimentation'],
    links: [],
  },
]

export const stretchySystems = [
  {
    id: 'ingest',
    icon: '01',
    room: 'THE FOUNDRY',
    title: 'Evidence enters without losing its identity.',
    status: 'verified',
    copy: 'A Rust scanner inventories source folders in place. Progressive campaigns, stable hashes, extractor receipts, and project isolation preserve where every unit came from while PDFs and bounded media derivatives move through the pipeline.',
    details: ['Read-only source inventory', 'Positioned PDF text + selective OCR', 'Hash-bound media derivatives', 'Incremental watched-folder campaigns'],
  },
  {
    id: 'retrieve',
    icon: '02',
    room: 'THE ARCHIVE',
    title: 'Search returns evidence, not vibes.',
    status: 'verified',
    copy: 'Sparse BM25 and accepted dense vectors can be fused through Qdrant, then diversity-reranked. Every result carries exact source pointers, page spans, content-unit identity, hashes, and previews.',
    details: ['Production BM25 in Qdrant', 'Identity-bound dense projections', 'Hybrid RRF + diversity reranking', 'Exact source and span references'],
  },
  {
    id: 'graph',
    icon: '03',
    room: 'CONSTELLATION',
    title: 'The graph only says what the sources observed.',
    status: 'verified',
    copy: 'High-precision signals—emails, URLs, identifiers, dates, money expressions, and phones—are recorded with exact spans and projected into a bounded FalkorDB graph. Identity, guilt, and relationships are never inferred by decoration.',
    details: ['Observed signals with character spans', 'Bounded evidence projection', 'Supports / contradicts / qualifies review edges', 'Rebuildable from canonical records'],
  },
  {
    id: 'agents',
    icon: '04',
    room: 'THE AGENT BUREAU',
    title: 'Long investigations survive longer than a chat window.',
    status: 'verified',
    copy: 'Temporal workflows persist objectives, task lineage, contradictions, compact frontiers, tool receipts, and restart state. Agents are created by real runs and carry evidence-backed dossiers; an empty bureau stays empty.',
    details: ['Durable pause / resume / recovery', 'Dynamic specialists, never fake staff', 'Token, call, evidence, and error telemetry', 'Branchable investigation memory'],
  },
  {
    id: 'chronicle',
    icon: '05',
    room: 'THE CHRONICLE',
    title: 'Memory is versioned, attributable, and reviewable.',
    status: 'verified',
    copy: 'Agent-visible history can move into content-hashed Parquet/Zstandard partitions and remain searchable through DuckDB. Reusable procedures require human review and retain exact source-investigation lineage.',
    details: ['Immutable trace segments', 'Cold archival with receipts', 'Human-reviewed procedural memory', 'Same-project isolation'],
  },
  {
    id: 'publish',
    icon: '06',
    room: 'TRIBUNAL + SCRIPTORIUM',
    title: 'Findings are reviewed before they become a report.',
    status: 'verified',
    copy: 'Evidence-backed proposals, objections, review decisions, deterministic report manifests, and human publication attestations make the path from source to conclusion inspectable instead of magical.',
    details: ['Evidence-bound finding proposals', 'Objection and contradiction review', 'Deterministic PDF report artifacts', 'Human publication attestation'],
  },
] as const

export const socialLinks = {
  email: 'mailto:noelalex404@gmail.com',
  github: 'https://github.com/Noel-Alex',
  linkedin: 'https://www.linkedin.com/in/noel-alex-b1731128b/',
  talk: 'https://www.youtube.com/watch?v=SGLh-A3z4yI',
}
