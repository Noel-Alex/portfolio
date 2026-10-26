import { mulberry32 } from './rng'

// Every texture here is painted from code: an original 16px resource pack for the world.
const T = 16

type Px = {
  rng: () => number
  set: (x: number, y: number, c: string | null) => void
  rect: (x: number, y: number, w: number, h: number, c: string) => void
  noise: (colors: string[], weights?: number[], x?: number, y?: number, w?: number, h?: number) => void
  pick: (colors: string[], weights?: number[]) => string
}

type Painter = (p: Px) => void

function pickWeighted(rng: () => number, colors: string[], weights?: number[]) {
  if (!weights) return colors[Math.floor(rng() * colors.length)]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < colors.length; i++) {
    r -= weights[i]
    if (r <= 0) return colors[i]
  }
  return colors[colors.length - 1]
}

const bevel = (p: Px, light: string, dark: string) => {
  p.rect(0, 0, T, 1, light); p.rect(0, 0, 1, T, light)
  p.rect(0, T - 1, T, 1, dark); p.rect(T - 1, 0, 1, T, dark)
}

const framed = (center: string[], frame: string, frameDark: string, bolt: string) => (p: Px) => {
  p.noise(center, [4, 3, 2])
  p.rect(0, 0, T, 2, frame); p.rect(0, 0, 2, T, frame)
  p.rect(0, T - 2, T, 2, frameDark); p.rect(T - 2, 0, 2, T, frameDark)
  for (const [x, y] of [[0, 0], [14, 0], [0, 14], [14, 14]]) p.rect(x, y, 2, 2, bolt)
}

const metal = (base: string[], light: string, dark: string) => (p: Px) => {
  p.noise(base, [5, 2, 1])
  bevel(p, light, dark)
  p.rect(2, 2, 3, 1, light); p.rect(2, 2, 1, 3, light)
}

const ore = (spots: string[]) => (p: Px) => {
  TILES.stone(p)
  for (let i = 0; i < 5; i++) {
    const x = 1 + Math.floor(p.rng() * 12)
    const y = 1 + Math.floor(p.rng() * 12)
    p.rect(x, y, 2, 2, spots[0]); p.set(x + 2, y + 1, spots[1]); p.set(x, y, spots[2] ?? spots[0])
  }
}

const cross = (stem: string, head: string[], tall = 9) => (p: Px) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
  for (let y = T - tall; y < T; y++) p.set(7 + (y % 3 === 0 ? 1 : 0), y, stem)
  p.set(6, T - 4, stem); p.set(5, T - 5, stem); p.set(9, T - 3, stem); p.set(10, T - 4, stem)
  const top = T - tall - 3
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!(x % 3 === 0 && y % 3 === 0)) p.set(6 + x, top + y, head[(x + y) % head.length])
}

export const TILES: Record<string, Painter> = {
  grass_top: p => p.noise(['#5d9e3c', '#69ad45', '#4f8e33', '#78bb4f'], [4, 3, 2, 1]),
  dirt: p => p.noise(['#866043', '#6f4c33', '#9a6f4e', '#5c3f2a'], [4, 3, 2, 1]),
  grass_side: p => {
    TILES.dirt(p)
    for (let x = 0; x < T; x++) {
      const h = 3 + Math.floor(p.rng() * 2.4)
      for (let y = 0; y < h; y++) p.set(x, y, p.pick(['#5d9e3c', '#69ad45', '#4f8e33']))
      if (p.rng() < 0.3) p.set(x, h, '#4f8e33')
    }
  },
  stone: p => {
    p.noise(['#7d7d7d', '#888888', '#727272', '#939393'], [4, 3, 2, 1])
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(p.rng() * 12); const y = Math.floor(p.rng() * T)
      p.rect(x, y, 2 + Math.floor(p.rng() * 3), 1, '#666666')
    }
  },
  cobblestone: p => {
    p.noise(['#555555', '#4b4b4b'])
    const seeds = Array.from({ length: 8 }, () => [p.rng() * T, p.rng() * T, Math.floor(p.rng() * 4)] as const)
    const shades = ['#8d8d8d', '#7a7a7a', '#9b9b9b', '#6c6c6c']
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      let best = 99; let second = 99; let id = 0
      for (const [sx, sy, s] of seeds) {
        const dx = Math.min(Math.abs(x - sx), T - Math.abs(x - sx)); const dy = Math.min(Math.abs(y - sy), T - Math.abs(y - sy))
        const d = Math.hypot(dx, dy)
        if (d < best) { second = best; best = d; id = s } else if (d < second) second = d
      }
      if (second - best > 1.1) p.set(x, y, p.rng() < 0.15 ? '#a8a8a8' : shades[id])
    }
  },
  stone_bricks: p => {
    p.noise(['#7b7b7b', '#858585', '#717171'])
    for (let x = 0; x < T; x++) { p.set(x, 7, '#5a5a5a'); p.set(x, 15, '#5a5a5a') }
    for (let y = 0; y < 7; y++) { p.set(15, y, '#5a5a5a'); p.set(7, y + 8, '#5a5a5a') }
    for (let x = 0; x < 15; x++) { p.set(x, 0, '#939393'); p.set(x, 8, '#939393') }
  },
  polished_andesite: p => { p.noise(['#8a8d89', '#949792', '#80837f']); bevel(p, '#a3a6a1', '#6f726e') },
  sky_stone: p => p.noise(['#202027', '#26262e', '#1b1b21', '#2e2e38'], [4, 3, 2, 1]),
  deepslate: p => {
    p.noise(['#3d3d43', '#46464d', '#35353a'])
    for (let y = 1; y < T; y += 4) for (let x = 0; x < T; x++) if (p.rng() < 0.6) p.set(x, y, '#2d2d32')
  },
  sand: p => p.noise(['#dbcf9f', '#e3d8aa', '#d1c493', '#e9e0b8'], [4, 3, 2, 1]),
  gravel: p => p.noise(['#857f7c', '#6f6a68', '#9a9491', '#5d5958', '#a8a29e'], [3, 3, 2, 1, 1]),
  path: p => { p.noise(['#9b7b4f', '#8f7046', '#a7865a', '#836540'], [4, 3, 2, 1]); for (let i = 0; i < 6; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#b39466') },
  oak_log: p => {
    for (let x = 0; x < T; x++) {
      const base = x % 4 === 0 ? '#4f3b22' : x % 3 === 0 ? '#5f4829' : '#6b5232'
      for (let y = 0; y < T; y++) p.set(x, y, p.rng() < 0.12 ? '#47341e' : base)
    }
  },
  oak_log_top: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))
      p.set(x, y, d > 6.6 ? '#5a4428' : Math.floor(d) % 2 ? '#b8945f' : '#9c7a4a')
    }
  },
  oak_planks: p => {
    for (let b = 0; b < 4; b++) {
      const tone = ['#b08a57', '#a5804f', '#b8935f', '#9e7a4a'][b]
      const seam = Math.floor(p.rng() * 12) + 2
      for (let y = b * 4; y < b * 4 + 4; y++) for (let x = 0; x < T; x++) p.set(x, y, p.rng() < 0.1 ? '#94703f' : tone)
      for (let x = 0; x < T; x++) p.set(x, b * 4 + 3, '#7d5e36')
      for (let y = b * 4; y < b * 4 + 3; y++) p.set(seam, y, '#7d5e36')
    }
  },
  dark_planks: p => {
    for (let b = 0; b < 4; b++) {
      for (let y = b * 4; y < b * 4 + 4; y++) for (let x = 0; x < T; x++) p.set(x, y, p.rng() < 0.1 ? '#3b2814' : ['#4a331b', '#53391f'][b % 2])
      for (let x = 0; x < T; x++) p.set(x, b * 4 + 3, '#2e1f0f')
    }
  },
  dark_log: p => {
    for (let x = 0; x < T; x++) {
      const base = x % 3 === 0 ? '#2e2116' : '#3c2c1d'
      for (let y = 0; y < T; y++) p.set(x, y, p.rng() < 0.15 ? '#251a10' : base)
    }
  },
  oak_leaves: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, p.rng() < 0.2 ? null : p.pick(['#3f7d2a', '#4a8c31', '#356b24', '#57993a']))
  },
  dark_leaves: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, p.rng() < 0.16 ? null : p.pick(['#24472a', '#2c5531', '#1d3b22', '#346238']))
  },
  hedge: p => p.noise(['#2f5d26', '#38692c', '#264f1f', '#427833'], [4, 3, 2, 1]),
  glass: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (let i = 0; i < T; i++) { p.set(i, 0, '#dcf0f5'); p.set(0, i, '#dcf0f5'); p.set(i, T - 1, '#b9d6de'); p.set(T - 1, i, '#b9d6de') }
    for (let i = 0; i < 4; i++) p.set(3 + i, 6 - i, '#f4fbfd')
    p.set(10, 11, '#f4fbfd'); p.set(11, 10, '#f4fbfd')
  },
  andesite_casing: framed(['#9a9d98', '#a6a9a4', '#8c8f8a'], '#8a6a42', '#5f4528', '#6d6f6b'),
  brass_casing: framed(['#d9a64b', '#e3b55c', '#c38f39'], '#8c5c2b', '#5e3c1a', '#f2d27e'),
  brass_block: metal(['#dcab4f', '#e7bc63', '#c9963d'], '#f6dd8f', '#9a6a26'),
  copper_block: p => { p.noise(['#c46f4a', '#d27c55', '#b4613f'], [4, 3, 2]); for (let i = 0; i < 10; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#5fa893'); bevel(p, '#e09370', '#8e4a2e') },
  copper_roof: p => { p.noise(['#4f9d86', '#5aab93', '#43897a', '#6cb7a0'], [4, 3, 2, 1]); for (let y = 3; y < T; y += 4) for (let x = 0; x < T; x++) p.set(x, y, '#3a7a68') },
  rail: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (let y = 1; y < T; y += 4) p.rect(1, y, 14, 2, '#6b4f2d')
    for (let y = 0; y < T; y++) { p.set(3, y, '#9b9b9b'); p.set(4, y, '#c8c8c8'); p.set(11, y, '#9b9b9b'); p.set(12, y, '#c8c8c8') }
  },
  me_drive: p => {
    p.noise(['#3a3a45', '#34343e'])
    bevel(p, '#575766', '#22222a')
    const leds = ['#62f0ff', '#62f0ff', '#a07bff', '#7dff9a', '#ffcd5e']
    for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) {
      const x = 2 + c * 6; const y = 1 + r * 3
      p.rect(x, y, 5, 2, '#17171c')
      p.set(x + 4, y, p.pick(leds)); p.set(x + 1, y + 1, '#2c2c35')
    }
  },
  me_side: p => { p.noise(['#4a4a56', '#44444f', '#50505d']); bevel(p, '#62626f', '#2b2b33'); for (let i = 3; i < 13; i += 3) p.rect(3, i, 10, 1, '#383843') },
  me_controller: p => {
    p.noise(['#2d2d3a', '#313142'])
    bevel(p, '#4a4a60', '#1a1a22')
    for (let i = 3; i < 13; i++) { p.set(i, 3, '#8a5cf6'); p.set(i, 12, '#8a5cf6'); p.set(3, i, '#8a5cf6'); p.set(12, i, '#8a5cf6') }
    p.rect(6, 6, 4, 4, '#7cf3ff'); p.rect(7, 7, 2, 2, '#e8fdff')
  },
  fluix: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const f = ((x + y) >> 2) % 3
      p.set(x, y, p.rng() < 0.08 ? '#d9c4ff' : ['#7b4fd6', '#9a6ff0', '#5c36b4'][f])
    }
    bevel(p, '#c3a6ff', '#3f2287')
  },
  jukebox_side: p => {
    TILES.dark_planks(p)
    bevel(p, '#6e4b2a', '#2a1a0c')
    for (let i = 0; i < 6; i++) { p.set(5 + i, 5 + Math.abs(2.5 - i) | 0, '#2a1a0c') }
  },
  jukebox_top: p => {
    TILES.dark_planks(p)
    bevel(p, '#6e4b2a', '#2a1a0c')
    p.rect(3, 7, 10, 2, '#111111'); p.rect(4, 7, 3, 1, '#3a3a3a')
  },
  note_block: p => {
    TILES.dark_planks(p)
    bevel(p, '#6e4b2a', '#2a1a0c')
    for (let y = 4; y < 12; y += 2) for (let x = 4; x < 12; x += 2) p.set(x, y, '#1a1008')
  },
  bookshelf: p => {
    TILES.oak_planks(p)
    const spines = ['#7a2d2d', '#2d4f7a', '#3f7a2d', '#7a6a2d', '#5a2d7a', '#2d7a6e', '#8a5a2d']
    for (const row of [2, 9]) {
      let x = 1
      while (x < 15) {
        const w = 1 + Math.floor(p.rng() * 2); const h = 4 + Math.floor(p.rng() * 2); const c = p.pick(spines)
        for (let i = 0; i < w && x < 15; i++, x++) for (let y = row + (6 - h); y < row + 5; y++) p.set(x, y, c)
        if (p.rng() < 0.2) x++
      }
    }
  },
  mycelium_top: p => { p.noise(['#6f6370', '#7e6f80', '#62566a', '#8e8091'], [4, 3, 2, 1]); for (let i = 0; i < 7; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#b9a9bd') },
  mycelium_side: p => {
    TILES.dirt(p)
    for (let x = 0; x < T; x++) { const h = 2 + Math.floor(p.rng() * 2.5); for (let y = 0; y < h; y++) p.set(x, y, p.pick(['#6f6370', '#7e6f80'])) }
  },
  mushroom_red: p => { p.noise(['#c42c2c', '#b52424', '#cf3a3a']); for (const [x, y] of [[2, 3], [9, 2], [5, 9], [12, 10], [11, 5]]) p.rect(x, y, 2 + (x % 2), 2, '#f2ece4') },
  mushroom_brown: p => p.noise(['#9a7457', '#8d684d', '#a67f61']),
  mushroom_stem: p => { p.noise(['#d8d2c4', '#cfc8b8', '#e2ddd1']); for (let y = 0; y < T; y += 3) p.set(Math.floor(p.rng() * T), y, '#b7ae9c') },
  glowstone: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, p.pick(['#f6d27a', '#e8b65a', '#fff0b0', '#c98c3e']))
    for (let i = 0; i < 5; i++) p.rect(Math.floor(p.rng() * 13), Math.floor(p.rng() * 13), 3, 3, '#fff6cf')
  },
  lamp: p => { p.noise(['#ffdf8f', '#ffd170', '#fff0c2']); bevel(p, '#fff7dc', '#c98c3e') },
  iron_block: metal(['#d8d8d8', '#e2e2e2', '#cbcbcb'], '#f7f7f7', '#9e9e9e'),
  gold_block: metal(['#f2cf3f', '#f8dd5c', '#e3bb2c'], '#fff3a8', '#b88a17'),
  diamond_block: metal(['#62e3dc', '#7ef0e9', '#4ccfc8'], '#c8fffb', '#2b9b95'),
  beacon: p => {
    p.noise(['#bff8f6', '#d6fcfb'])
    bevel(p, '#ffffff', '#7ccfd0')
    p.rect(4, 4, 8, 8, '#4fe3e0'); p.rect(6, 6, 4, 4, '#e8ffff')
  },
  obsidian: p => { p.noise(['#140f1e', '#1c1430', '#0e0a16', '#2a1c47'], [4, 3, 2, 1]); for (let i = 0; i < 6; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#5b3d96') },
  end_stone: p => p.noise(['#dedba0', '#d3cf8f', '#e7e4b2', '#c8c483'], [4, 3, 2, 1]),
  end_frame_side: p => { TILES.end_stone(p); p.rect(0, 0, T, 4, '#3f6e58'); p.rect(0, 4, T, 1, '#2c4f3f'); for (let x = 0; x < T; x += 3) p.set(x, 2, '#5f9a7e') },
  end_frame_top: p => {
    p.noise(['#3f6e58', '#4a7f66', '#365f4c'])
    bevel(p, '#5f9a7e', '#24402f')
    p.rect(4, 4, 8, 8, '#0c2a20'); p.rect(5, 5, 6, 6, '#3fe07a'); p.rect(7, 6, 2, 4, '#0b1a12')
  },
  cobweb: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (let i = 0; i < T; i++) { p.set(i, i, '#e8e8e8'); p.set(T - 1 - i, i, '#e8e8e8'); p.set(7, i, '#dcdcdc'); p.set(i, 8, '#dcdcdc') }
    for (const r of [3, 6]) for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; p.set(Math.round(7.5 + Math.cos(t) * r), Math.round(7.5 + Math.sin(t) * r), '#f2f2f2') }
  },
  sculk: p => {
    p.noise(['#0d2a33', '#0a2129', '#11343e'])
    for (let i = 0; i < 9; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#2fd6e0')
    p.rect(6, 6, 2, 2, '#7ff6ff')
  },
  crafting_top: p => { TILES.oak_planks(p); p.rect(2, 2, 12, 12, '#7d5e36'); for (let i = 2; i < 14; i += 4) { p.rect(i, 2, 1, 12, '#5f4527'); p.rect(2, i, 12, 1, '#5f4527') } },
  crafting_side: p => { TILES.oak_planks(p); p.rect(0, 0, T, 3, '#5f4527'); p.rect(3, 6, 3, 6, '#9b9b9b'); p.rect(10, 5, 2, 7, '#6b5232'); p.rect(9, 5, 4, 2, '#9b9b9b') },
  furnace_front: p => { TILES.cobblestone(p); p.rect(4, 8, 8, 6, '#1d1d1d'); p.rect(5, 11, 6, 2, '#ff9b38'); p.rect(6, 12, 4, 1, '#ffe08a'); p.rect(3, 3, 10, 2, '#4b4b4b') },
  hay_top: p => { p.noise(['#c9a43a', '#b8922f', '#d6b247']); p.rect(0, 0, T, 2, '#8a6a1f'); p.rect(0, 14, T, 2, '#8a6a1f') },
  hay_side: p => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, x % 2 ? '#c9a43a' : '#b8922f'); p.rect(0, 3, T, 2, '#7a3e1a'); p.rect(0, 11, T, 2, '#7a3e1a') },
  farmland: p => { p.noise(['#5a3c25', '#4c3220', '#664530']); for (let y = 2; y < T; y += 4) p.rect(0, y, T, 1, '#3d2818') },
  wheat: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (const sx of [2, 6, 10, 13]) { for (let y = 5; y < T; y++) p.set(sx, y, '#9a8a2a'); p.rect(sx - 1, 2, 3, 4, '#d9b84a'); p.set(sx, 1, '#e8cf6a') }
  },
  tall_grass: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (let i = 0; i < 9; i++) { const x = 1 + Math.floor(p.rng() * 14); const h = 6 + Math.floor(p.rng() * 8); for (let y = T - h; y < T; y++) p.set(x + ((y % 5 === 0) ? 1 : 0), y, p.pick(['#5d9e3c', '#4f8e33', '#69ad45'])) }
  },
  fern: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    for (let y = 3; y < T; y++) { p.set(7, y, '#3d7a2a'); if (y % 2) { p.set(6 - ((y - 3) >> 2), y, '#4f8e33'); p.set(8 + ((y - 3) >> 2), y, '#4f8e33') } }
  },
  poppy: cross('#3d7a2a', ['#d42a2a', '#b51d1d', '#e84a3a']),
  dandelion: cross('#3d7a2a', ['#f5d63a', '#e8c022', '#fff07a'], 8),
  cornflower: cross('#3d7a2a', ['#5476e8', '#3d5bd1', '#7a94f2']),
  firefly_bush: cross('#2c5531', ['#d8ff6a', '#2c5531', '#b6e84a'], 10),
  red_mushroom_small: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, null)
    p.rect(7, 9, 2, 7, '#d8d2c4'); p.rect(4, 6, 8, 3, '#c42c2c'); p.rect(5, 5, 6, 1, '#c42c2c'); p.set(6, 6, '#f2ece4'); p.set(9, 7, '#f2ece4')
  },
  coal_ore: ore(['#2a2a2a', '#3a3a3a']),
  iron_ore: ore(['#d8af93', '#c4957a', '#e6c3a8']),
  diamond_ore: ore(['#5ee6de', '#9ff7f1', '#2fb3ab']),
  redstone_ore: ore(['#d11c1c', '#ff4a3a', '#8e0f0f']),
  bricks: p => {
    p.noise(['#9a5a4a', '#a6634f', '#8c4f40'])
    for (let y = 3; y < T; y += 4) for (let x = 0; x < T; x++) p.set(x, y, '#c9b8a8')
    for (let r = 0; r < 4; r++) for (let x = (r % 2) * 4; x < T; x += 8) for (let y = r * 4; y < r * 4 + 3; y++) p.set(x, y, '#c9b8a8')
  },
  white_wool: p => p.noise(['#e9ecec', '#dcdfe0', '#f4f6f6']),
  red_wool: p => p.noise(['#a12722', '#b02e28', '#93221e']),
  agar: p => p.noise(['#e8dca0', '#efe4ae', '#dfd292'], [4, 3, 2]),
  colony_green: p => { p.noise(['#7cc860', '#8fd870', '#69b34f']); for (let i = 0; i < 5; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#c8f5a8') },
  colony_pink: p => { p.noise(['#e07aa8', '#ec8fb8', '#cc6595']); for (let i = 0; i < 5; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#ffd0e4') },
  colony_blue: p => { p.noise(['#5fa3e0', '#74b5ee', '#4a8ccc']); for (let i = 0; i < 5; i++) p.set(Math.floor(p.rng() * T), Math.floor(p.rng() * T), '#cfe8ff') },
  quartz: p => { p.noise(['#ece6df', '#e3dcd3', '#f4efe9']); bevel(p, '#ffffff', '#c9c0b5') },
  snow: p => p.noise(['#f4f9fb', '#e8f1f5', '#ffffff']),
  lantern_glow: p => p.noise(['#ffd36e', '#ffbf47', '#fff0b5']),
  water: p => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.set(x, y, p.pick(['#3a6fd4', '#3466c9', '#4279dc', '#2f5dbd'], [4, 3, 2, 2]))
    for (let i = 0; i < 6; i++) { const y = Math.floor(p.rng() * T); const x = Math.floor(p.rng() * 10); p.rect(x, y, 3 + Math.floor(p.rng() * 4), 1, '#6b9bea') }
  },
  belt: p => {
    p.noise(['#2b2b2b', '#262626'])
    for (let y = 0; y < T; y += 4) p.rect(1, y, 14, 1, '#4a4a4a')
    p.rect(0, 0, 1, T, '#8a6a42'); p.rect(15, 0, 1, T, '#8a6a42')
  },
}

export const TILE_NAMES = Object.keys(TILES)
export const ATLAS_COLS = 16
const ATLAS_ROWS = Math.ceil(TILE_NAMES.length / ATLAS_COLS)
export const ATLAS_W = ATLAS_COLS * T
export const ATLAS_H = ATLAS_ROWS * T

const tileCanvases = new Map<string, HTMLCanvasElement>()

function paint(name: string) {
  const canvas = document.createElement('canvas')
  canvas.width = T; canvas.height = T
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(T, T)
  let seed = 0
  for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) | 0
  const rng = mulberry32(seed)
  const set = (x: number, y: number, c: string | null) => {
    if (x < 0 || y < 0 || x >= T || y >= T) return
    const o = (y * T + x) * 4
    if (c === null) { img.data[o + 3] = 0; return }
    const n = parseInt(c.slice(1), 16)
    img.data[o] = n >> 16; img.data[o + 1] = (n >> 8) & 255; img.data[o + 2] = n & 255; img.data[o + 3] = 255
  }
  const px: Px = {
    rng,
    set,
    rect: (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c) },
    noise: (colors, weights, x = 0, y = 0, w = T, h = T) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, pickWeighted(rng, colors, weights)) },
    pick: (colors, weights) => pickWeighted(rng, colors, weights),
  }
  TILES[name](px)
  ctx.putImageData(img, 0, 0)
  return canvas
}

export function tileCanvas(name: string) {
  let c = tileCanvases.get(name)
  if (!c) { c = paint(name); tileCanvases.set(name, c) }
  return c
}

export function tileIndex(name: string) {
  const i = TILE_NAMES.indexOf(name)
  if (i < 0) throw new Error(`Unknown tile ${name}`)
  return i
}

/** UV rect of a tile inside the atlas, inset half a texel to avoid bleeding. */
export function tileUV(name: string) {
  const i = tileIndex(name)
  const col = i % ATLAS_COLS
  const row = Math.floor(i / ATLAS_COLS)
  const e = 0.02
  const u0 = (col * T + e) / ATLAS_W
  const u1 = ((col + 1) * T - e) / ATLAS_W
  const v1 = 1 - (row * T + e) / ATLAS_H
  const v0 = 1 - ((row + 1) * T - e) / ATLAS_H
  return { u0, u1, v0, v1 }
}

export function buildAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_W; canvas.height = ATLAS_H
  const ctx = canvas.getContext('2d')!
  TILE_NAMES.forEach((name, i) => ctx.drawImage(tileCanvas(name), (i % ATLAS_COLS) * T, Math.floor(i / ATLAS_COLS) * T))
  return canvas
}

/** Inventory-style isometric block icon, the way a block sits in a hotbar slot. */
export function blockIcon(top: string, left: string, right = left, size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const S = size
  const face = (tile: string, m: [number, number, number, number, number, number], shade: number) => {
    ctx.save()
    ctx.setTransform(...m)
    ctx.drawImage(tileCanvas(tile), 0, 0)
    if (shade > 0) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fillRect(0, 0, T, T) }
    ctx.restore()
  }
  face(top, [S / 32, S / 64, -S / 32, S / 64, S / 2, 0.5], 0)
  face(left, [S / 32, S / 64, 0, S / 32, 0, S / 4], 0.22)
  face(right, [S / 32, -S / 64, 0, S / 32, S / 2, S / 2], 0.4)
  return canvas.toDataURL()
}

export function flatIcon(tile: string, size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tileCanvas(tile), 0, 0, size, size)
  return canvas.toDataURL()
}
