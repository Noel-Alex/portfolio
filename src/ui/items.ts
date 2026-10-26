/** 16px item sprites painted from shape masks, shaded the way vanilla items are: dark rim, lit top-left, shaded bottom-right. */
type Ramp = { o: string; a: string; b: string; c: string }
type Mask = (x: number, y: number) => boolean
type Detail = (put: (x: number, y: number, c: string) => void) => void

const S = 16
const cache = new Map<string, string>()

function paint(mask: Mask, ramp: Ramp, detail?: Detail) {
  const grid: (string | null)[] = new Array(S * S).fill(null)
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < S && y < S && mask(x, y)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!inside(x, y)) continue
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
    const lit = !inside(x - 1, y - 1) || !inside(x - 2, y - 1)
    const dim = !inside(x + 1, y + 1) || !inside(x + 1, y + 2)
    grid[y * S + x] = edge ? ramp.o : lit ? ramp.b : dim ? ramp.c : ramp.a
  }
  detail?.((x, y, c) => { if (x >= 0 && y >= 0 && x < S && y < S) grid[y * S + x] = c })
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')!
  grid.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(i % S, Math.floor(i / S), 1, 1) } })
  return canvas.toDataURL()
}

const circle = (cx: number, cy: number, r: number): Mask => (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r
const rect = (x0: number, y0: number, x1: number, y1: number): Mask => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
const or = (...ms: Mask[]): Mask => (x, y) => ms.some(m => m(x, y))
const minus = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && !b(x, y)

const ramp = (o: string, c: string, a: string, b: string): Ramp => ({ o, a, b, c })

type Shape = 'cog' | 'gem' | 'ingot' | 'potion' | 'dust' | 'torch' | 'book' | 'compass' | 'clock' | 'pearl' | 'crate' | 'chain' | 'paper' | 'wheel'

const SHAPES: Record<Shape, (r: Ramp, accent: string) => string> = {
  cog: r => paint(minus((x, y) => {
    const dx = x + 0.5 - 8; const dy = y + 0.5 - 8
    const a = Math.atan2(dy, dx)
    return Math.hypot(dx, dy) <= (Math.cos(a * 8) > 0.25 ? 7.4 : 5.6)
  }, circle(8, 8, 2)), r),
  wheel: (r, accent) => paint(minus(or(circle(8, 8, 7.2)), minus(circle(8, 8, 5.4), or(rect(7, 1, 8, 14), rect(1, 7, 14, 8), (x, y) => Math.abs(x - y) < 1, (x, y) => Math.abs(x + y - 15) < 1))), r, put => {
    put(7, 7, accent); put(8, 7, accent); put(7, 8, accent); put(8, 8, accent)
  }),
  gem: (r, accent) => paint((x, y) => Math.abs(x + 0.5 - 8) + Math.abs(y + 0.5 - 8.5) * 0.95 <= 7 && y >= 2, r, put => {
    for (let i = 0; i < 4; i++) put(5 + i, 4 + i, accent)
    put(6, 4, '#ffffff'); put(7, 4, '#ffffff')
  }),
  ingot: (r, accent) => paint((x, y) => y >= 5 && y <= 11 && x >= 1 + Math.max(0, 8 - y) && x <= 14 - Math.max(0, y - 9), r, put => {
    for (let x = 5; x < 12; x++) put(x, 6, accent)
  }),
  potion: (r, accent) => paint(or(rect(6, 2, 9, 6), circle(8, 10.5, 5.2)), ramp('#2b2b33', '#9fb0c6', '#cfdae8', '#ffffff'), put => {
    for (let y = 9; y < 15; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x + 0.5 - 8, y + 0.5 - 10.5) < 4.2 && y >= 9) put(x, y, y === 9 ? r.b : (x + y) % 5 === 0 ? r.b : y > 12 ? r.c : r.a)
    for (let x = 6; x < 10; x++) put(x, 1, '#7a5230')
    put(5, 9, '#ffffff'); put(5, 10, '#ffffff'); put(6, 4, '#ffffff')
    put(10, 12, accent)
  }),
  dust: r => paint((x, y) => {
    const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 9)
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return d < 6.5 && n - Math.floor(n) > (d < 3 ? 0.1 : 0.45)
  }, { ...r, o: r.c }),
  torch: (r, accent) => paint(or(rect(7, 6, 8, 15), rect(6, 2, 9, 5), rect(7, 1, 8, 1)), ramp('#3a2510', '#5c3b1a', '#7a5230', '#946a3e'), put => {
    put(7, 2, '#fff7b0'); put(8, 2, '#ffd34a'); put(7, 3, '#ffd34a'); put(8, 3, accent); put(6, 3, accent); put(9, 3, r.a)
    put(7, 4, accent); put(8, 4, r.a); put(6, 4, r.c); put(9, 4, r.c); put(7, 5, '#3a2510'); put(8, 5, '#3a2510')
    put(7, 1, '#fff7b0')
  }),
  book: (r, accent) => paint(rect(3, 1, 12, 14), r, put => {
    for (let y = 2; y < 14; y++) { put(12, y, '#e8dfc8'); put(11, y, '#cfc4a8') }
    for (let y = 1; y < 15; y++) put(3, y, r.o)
    for (let x = 5; x < 10; x++) { put(x, 5, accent); put(x, 7, accent) }
  }),
  compass: (r, accent) => paint(circle(8, 8, 7), r, put => {
    for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x + 0.5 - 8, y + 0.5 - 8) < 4.8) put(x, y, '#d8d8d8')
    put(8, 4, accent); put(8, 5, accent); put(7, 6, accent); put(7, 7, '#2b2b2b'); put(8, 8, '#2b2b2b'); put(8, 9, '#6a6a6a'); put(9, 10, '#6a6a6a')
  }),
  clock: (r, accent) => paint(circle(8, 8, 7), r, put => {
    for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x + 0.5 - 8, y + 0.5 - 8) < 4.8) put(x, y, y < 8 ? '#5ea0ff' : '#2c3a66')
    put(4, 8, '#ffe066'); put(5, 7, '#fff3b0'); put(11, 9, '#e8e8f0')
    put(8, 4, accent); put(8, 5, accent); put(8, 6, accent); put(8, 7, accent)
  }),
  pearl: (r, accent) => paint(circle(8, 8.5, 6.2), r, put => {
    put(5, 5, '#ffffff'); put(6, 5, accent); put(5, 6, accent)
    put(7, 8, accent); put(8, 9, accent); put(9, 8, r.c)
  }),
  crate: (r, accent) => paint(rect(1, 3, 14, 13), r, put => {
    for (let x = 2; x < 14; x += 3) for (let y = 4; y < 13; y++) put(x, y, r.c)
    for (let x = 2; x < 14; x++) { put(x, 4, r.b); put(x, 12, r.c) }
    put(12, 6, accent); put(12, 7, accent)
  }),
  chain: r => paint((x, y) => [[4, 11.5, 0], [8, 7.5, 1], [12, 3.5, 0]].some(([cx, cy, k]) => {
    const dx = x + 0.5 - cx; const dy = y + 0.5 - cy
    let u = (dx - dy) / Math.SQRT2; let v = (dx + dy) / Math.SQRT2
    if (k) [u, v] = [v * 0.9, u]
    const outer = (u / 3.1) ** 2 + (v / 2.1) ** 2 <= 1
    const inner = (u / 1.6) ** 2 + (v / 0.75) ** 2 <= 1
    return outer && !inner
  }), r),
  paper: (r, accent) => paint(rect(2, 2, 13, 13), r, put => {
    for (let y = 4; y < 12; y += 2) for (let x = 4; x < 12; x++) if ((x + y) % 7) put(x, y, accent)
    put(10, 9, '#e3262a'); put(11, 10, '#e3262a')
  }),
}

export type ItemId =
  | 'rust' | 'python' | 'typescript' | 'pytorch' | 'triton' | 'cranelift' | 'wasm' | 'lmdb' | 'react' | 'webgl'
  | 'docker' | 'kubernetes' | 'langchain' | 'llamaindex' | 'chromadb' | 'discord'
  | 'redstone' | 'compass' | 'clock' | 'diamond'

export type Item = { id: ItemId; name: string; lore: string; shape: Shape; ramp: Ramp; accent: string; rare?: boolean }

export const items: Item[] = [
  { id: 'rust', name: 'Rust', lore: 'HELIX · Sivana · Arachne', shape: 'cog', ramp: ramp('#3a1a0a', '#7a3412', '#b7521c', '#e08a4a'), accent: '#ffd0a0' },
  { id: 'python', name: 'Python', lore: 'AsterLM · Kargo · UltraChat', shape: 'potion', ramp: ramp('#1c3a66', '#2b5b9c', '#3776ab', '#5a9ad6'), accent: '#ffd43b' },
  { id: 'typescript', name: 'TypeScript', lore: 'Petra · Kargo · this world', shape: 'ingot', ramp: ramp('#122a4d', '#1f4f8f', '#3178c6', '#6aa6ea'), accent: '#a8d0ff' },
  { id: 'pytorch', name: 'PyTorch', lore: 'AsterLM Frontier', shape: 'torch', ramp: ramp('#5a1a00', '#c2410c', '#ee4c2c', '#ff9a5c'), accent: '#ff7a1a' },
  { id: 'triton', name: 'Triton', lore: 'AsterLM Frontier', shape: 'gem', ramp: ramp('#0b3b3b', '#13706b', '#1fa59a', '#6fe0d2'), accent: '#c8fff5' },
  { id: 'cranelift', name: 'Cranelift', lore: 'Native x86-64 codegen in HELIX', shape: 'ingot', ramp: ramp('#4a3108', '#9a6a14', '#d4a72c', '#f5d978'), accent: '#fff2b8' },
  { id: 'wasm', name: 'WebAssembly', lore: 'Sivana fingerprints in the browser', shape: 'pearl', ramp: ramp('#1d1550', '#3a2a9a', '#654ff0', '#9d8cff'), accent: '#c9c0ff' },
  { id: 'lmdb', name: 'LMDB', lore: 'Sivana', shape: 'gem', ramp: ramp('#2a0f4a', '#5b2a8f', '#8b45c9', '#c78bff'), accent: '#f0d8ff' },
  { id: 'react', name: 'React', lore: 'Petra · this world', shape: 'pearl', ramp: ramp('#0a3a4a', '#1c7a96', '#2fb3d6', '#8be6ff'), accent: '#e0faff' },
  { id: 'webgl', name: 'WebGL', lore: 'Petra · this world', shape: 'dust', ramp: ramp('#5a3a00', '#c7861a', '#f2c230', '#fff1a0'), accent: '#ffffff' },
  { id: 'docker', name: 'Docker', lore: 'Kargo · UltraChat', shape: 'crate', ramp: ramp('#0c2a4a', '#155a96', '#1d7cd1', '#5fb0f5'), accent: '#ffffff' },
  { id: 'kubernetes', name: 'Kubernetes', lore: 'Kargo deploys', shape: 'wheel', ramp: ramp('#0e2456', '#1f4aa8', '#326ce5', '#7aa3ff'), accent: '#ffffff' },
  { id: 'langchain', name: 'LangChain', lore: 'Kargo · UltraChat', shape: 'chain', ramp: ramp('#1e2a2a', '#4b5a5a', '#7a8c8c', '#b8c8c8'), accent: '#ffffff' },
  { id: 'llamaindex', name: 'LlamaIndex', lore: 'UltraChat retrieval', shape: 'book', ramp: ramp('#2a1240', '#5a2a7a', '#7d3fa8', '#a874d0'), accent: '#ffd34a' },
  { id: 'chromadb', name: 'ChromaDB', lore: 'UltraChat vector memory', shape: 'gem', ramp: ramp('#0a3a1a', '#147a3a', '#1fae55', '#7ce59d'), accent: '#dcffe6' },
  { id: 'discord', name: 'Discord API', lore: 'UltraChat · the school bot', shape: 'paper', ramp: ramp('#2a2f66', '#c9c4b0', '#e8e2cc', '#fffaf0'), accent: '#5865f2' },
  { id: 'redstone', name: 'Distributed systems', lore: 'Arachne · Stretchy', shape: 'dust', ramp: ramp('#3a0000', '#7a0a0a', '#c81414', '#ff5a5a'), accent: '#ffffff' },
  { id: 'compass', name: 'Search and retrieval', lore: 'Stretchy · Sivana · UltraChat', shape: 'compass', ramp: ramp('#2a2a2a', '#4a4a4a', '#6e6e6e', '#9a9a9a'), accent: '#e3262a' },
  { id: 'clock', name: 'Benchmarks', lore: 'Everything, measured', shape: 'clock', ramp: ramp('#4a3108', '#9a6a14', '#d4a72c', '#f5d978'), accent: '#2b2b2b' },
  { id: 'diamond', name: 'Diamond', lore: 'Click to copy my email', shape: 'gem', ramp: ramp('#0a3a40', '#1aa3b0', '#4ae0e8', '#a8fbff'), accent: '#e8ffff', rare: true },
]

export const itemById = Object.fromEntries(items.map(i => [i.id, i])) as Record<ItemId, Item>

export function itemUrl(id: ItemId) {
  let url = cache.get(id)
  if (!url) { const it = itemById[id]; url = SHAPES[it.shape](it.ramp, it.accent); cache.set(id, url) }
  return url
}

export type Recipe = { project: string; items: ItemId[]; sealed?: boolean }

export const recipes: Recipe[] = [
  { project: 'helix', items: ['rust', 'cranelift', 'clock'] },
  { project: 'sivana', items: ['rust', 'wasm', 'lmdb', 'compass'] },
  { project: 'aster', items: ['python', 'pytorch', 'triton', 'clock'] },
  { project: 'petra', items: ['typescript', 'react', 'webgl'] },
  { project: 'kargo', items: ['typescript', 'python', 'docker', 'kubernetes', 'langchain'] },
  { project: 'ultrachat', items: ['python', 'llamaindex', 'chromadb', 'langchain', 'docker', 'discord'] },
  { project: 'stretchy', items: [], sealed: true },
  { project: 'arachne', items: [], sealed: true },
  { project: 'polysafe', items: [], sealed: true },
]

/** Grid slots each recipe size fills, so a crafted shape looks deliberate rather than packed. */
export const LAYOUT: Record<number, number[]> = {
  1: [4], 2: [3, 5], 3: [1, 4, 7], 4: [1, 3, 5, 7], 5: [0, 2, 4, 6, 8], 6: [0, 1, 2, 6, 7, 8],
}
