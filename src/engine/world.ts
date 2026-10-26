import { B, BLOCKS, SOLID } from './blocks'
import { fbm, hash2, mulberry32, valueNoise } from './rng'

export class VoxelWorld {
  data: Uint8Array
  W: number
  H: number
  D: number
  constructor(W: number, H: number, D: number) {
    this.W = W; this.H = H; this.D = D
    this.data = new Uint8Array(W * H * D)
  }
  inside(x: number, y: number, z: number) { return x >= 0 && y >= 0 && z >= 0 && x < this.W && y < this.H && z < this.D }
  get(x: number, y: number, z: number) { return this.inside(x, y, z) ? this.data[(y * this.D + z) * this.W + x] : 0 }
  set(x: number, y: number, z: number, id: number) { if (this.inside(x, y, z)) this.data[(y * this.D + z) * this.W + x] = id }
  fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, id)
  }
  walls(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
      if (x === x0 || x === x1 || z === z0 || z === z1) this.set(x, y, z, id)
  }
  /** Highest block a player could stand on. */
  ground(x: number, z: number) {
    for (let y = this.H - 1; y >= 0; y--) if (SOLID[this.get(x, y, z)] || BLOCKS[this.get(x, y, z)].water) return y
    return -1
  }
}

export type Vec3 = [number, number, number]

export type Decor =
  | { type: 'cog'; pos: Vec3; radius: number; axis: 'x' | 'z'; speed: number; brass?: boolean }
  | { type: 'belt'; from: Vec3; to: Vec3 }
  | { type: 'rail'; loop: [number, number][]; y: number }
  | { type: 'beam'; pos: Vec3 }
  | { type: 'portal'; min: Vec3; max: Vec3 }
  | { type: 'emitter'; kind: 'firefly' | 'notes' | 'potion' | 'steam' | 'spores' | 'fire' | 'sculk'; pos: Vec3; radius: number; count: number }
  | { type: 'spider'; pos: Vec3 }
  | { type: 'villager'; pos: Vec3; rot: number; robe: string }
  | { type: 'lantern'; pos: Vec3; post?: boolean }
  | { type: 'cable'; points: Vec3[] }
  | { type: 'banner'; pos: Vec3; rot: number; colors: string[] }
  | { type: 'brewing'; pos: Vec3 }
  | { type: 'cauldron'; pos: Vec3 }
  | { type: 'campfire'; pos: Vec3 }
  | { type: 'bell'; pos: Vec3 }
  | { type: 'lectern'; pos: Vec3; rot: number }
  | { type: 'chest'; pos: Vec3; rot: number }
  | { type: 'bed'; pos: Vec3; rot: number }
  | { type: 'waterfall'; x: number; z0: number; z1: number; top: number; bottom: number }

export type LandmarkId = 'spawn' | 'stretchy' | 'sivana' | 'arachne' | 'petra' | 'portal' | 'ultrachat' | 'gdg' | 'polysafe' | 'kargo' | 'helix' | 'aster'

export type Landmark = {
  id: LandmarkId
  /** Where the player stands when visiting. */
  door: Vec3
  /** Walkable waypoints from the spawn hub to the door (grid x/z). */
  route: [number, number][]
  /** Selection box around the build (grid space). */
  min: Vec3
  max: Vec3
  /** Camera framing when the player arrives. */
  yaw: number
  pitch: number
  dist: number
}

export const C = 52
export const Y0 = 48
const SIZE = 104
const HEIGHT = 104

type Zone = { id: string; x: number; z: number; r: number; off: number; ground?: number }
const zone = (id: string, dx: number, dz: number, r: number, off = 0, ground?: number): Zone => ({ id, x: C + dx, z: C + dz, r, off, ground })

const ZONES: Zone[] = [
  zone('spawn', -3, 4, 6),
  zone('aster', 0, -28, 7, 4),
  zone('helix', 21, -19, 10),
  zone('kargo', 31, 7, 9),
  zone('polysafe', 22, 26, 6),
  zone('village', 2, 28, 11),
  zone('portal', -18, 26, 5),
  zone('petra', -29, 10, 8, 0, B.mycelium),
  zone('arachne', -27, -11, 10, -1),
  zone('stretchy', -16, -27, 7),
  zone('sivana', -4, -15, 4),
]
const Z = Object.fromEntries(ZONES.map(z => [z.id, z])) as Record<string, Zone>

function edgeRadius(x: number, z: number) {
  const a = Math.atan2(z - C, x - C)
  return 42 + (valueNoise(Math.cos(a) * 2.2 + 9, Math.sin(a) * 2.2 + 9, 4) - 0.5) * 9
}

export function generateWorld() {
  const world = new VoxelWorld(SIZE, HEIGHT, SIZE)
  const rng = mulberry32(2027)
  const decor: Decor[] = []
  const heights = new Int16Array(SIZE * SIZE).fill(-1)

  // ---- terrain -------------------------------------------------------------
  for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
    const r = Math.hypot(x - C, z - C)
    const R = edgeRadius(x, z)
    if (r > R) continue
    let h = Y0 + Math.round((fbm(x * 0.07, z * 0.07, 11) - 0.5) * 6)
    for (const zn of ZONES) {
      const d = Math.hypot(x - zn.x, z - zn.z)
      const t = Math.min(1, Math.max(0, (d - zn.r) / 4))
      h = Math.round((Y0 + zn.off) * (1 - t) + h * t)
    }
    if (r > R - 2) h -= 1
    heights[z * SIZE + x] = h
    const t = 1 - r / R
    const lumpy = 0.75 + fbm(x * 0.05, z * 0.05, 33) * 0.5
    const depth = 2 + Math.floor(Math.pow(t, 0.85) * 44 * lumpy + fbm(x * 0.18, z * 0.18, 21) * 5)
    const bottom = h - depth
    for (let y = bottom; y <= h; y++) {
      let id = B.stone
      if (y === h) id = B.grass
      else if (y >= h - 3) id = B.dirt
      else if (y < Y0 - 22) id = B.deepslate
      if (id === B.stone || id === B.deepslate) {
        const o = hash2(x * 7 + y, z * 3 - y, 99)
        if (o < 0.035) id = B.coal_ore
        else if (o < 0.05) id = B.iron_ore
        else if (o < 0.056 && y < Y0 - 10) id = B.diamond_ore
        else if (o < 0.062 && y < Y0 - 6) id = B.redstone_ore
      }
      world.set(x, y, z, id)
    }
  }
  const top = (x: number, z: number) => heights[z * SIZE + x]
  for (const zn of ZONES) if (zn.ground)
    for (let z = zn.z - zn.r - 2; z <= zn.z + zn.r + 2; z++) for (let x = zn.x - zn.r - 2; x <= zn.x + zn.r + 2; x++) {
      const d = Math.hypot(x - zn.x, z - zn.z) + hash2(x, z, 5) * 3
      if (d < zn.r + 2 && top(x, z) > 0 && world.get(x, top(x, z), z) === B.grass) world.set(x, top(x, z), z, zn.ground)
    }

  // ---- water: a pond spilling east off the island ---------------------------
  const pond = { x: C + 9, z: C - 7 }
  for (let z = pond.z - 5; z <= pond.z + 5; z++) for (let x = pond.x - 6; x <= pond.x + 6; x++) {
    if (Math.hypot((x - pond.x) / 1.3, z - pond.z) + hash2(x, z, 8) * 1.2 > 4.4) continue
    const h = Y0
    world.fill(x, h - 1, z, x, h + 3, z, 0)
    world.set(x, h - 2, z, B.sand); world.set(x, h - 1, z, B.water); world.set(x, h, z, 0)
    heights[z * SIZE + x] = h - 1
  }
  let streamEnd = pond.x
  for (let x = pond.x + 4; x < SIZE; x++) {
    const z = pond.z + 1 + Math.round(Math.sin(x * 0.3) * 0.6)
    if (top(x, z) < 0) { streamEnd = x; break }
    for (const dz of [0, 1]) {
      world.fill(x, Y0 - 1, z + dz, x, Y0 + 4, z + dz, 0)
      world.set(x, Y0 - 2, z + dz, B.sand); world.set(x, Y0 - 1, z + dz, B.water)
      heights[(z + dz) * SIZE + x] = Y0 - 1
    }
    streamEnd = x
  }
  const fallZ = pond.z + 1 + Math.round(Math.sin(streamEnd * 0.3) * 0.6)
  decor.push({ type: 'waterfall', x: streamEnd + 1, z0: fallZ, z1: fallZ + 2, top: Y0 - 0.14, bottom: Y0 - 20 })

  // ---- paths ---------------------------------------------------------------
  const pathCells = new Set<number>()
  const lay = (pts: [number, number][]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i]; const [bx, bz] = pts[i + 1]
      const steps = Math.max(Math.abs(bx - ax), Math.abs(bz - az))
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(ax + ((bx - ax) * s) / steps)
        const z = Math.round(az + ((bz - az) * s) / steps)
        for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const px = x + ox; const pz = z + oz
          const h = top(px, pz)
          if (h < 0) continue
          pathCells.add(pz * SIZE + px)
          if (world.get(px, h, pz) === B.water) { world.set(px, h, pz, B.oak_planks) } else if (world.get(px, h, pz) === B.grass || world.get(px, h, pz) === B.mycelium) world.set(px, h, pz, B.path)
          world.set(px, h + 1, pz, 0)
        }
      }
    }
  }
  const S: [number, number] = [C + 2, C + 6]
  const NH: [number, number] = [C + 2, C - 2]
  const SO: [number, number] = [C + 2, C + 12]

  // ---- builds --------------------------------------------------------------
  const landmarks: Landmark[] = []
  const lm = (id: LandmarkId, route: [number, number][], min: Vec3, max: Vec3, yaw: number, pitch = 0.5, dist = 26) => {
    if (route.length > 1) lay(route)
    const [dx, dz] = route[route.length - 1]
    landmarks.push({ id, route, door: [dx, 0, dz], min, max, yaw, pitch, dist })
  }

  // Spawn: a campfire camp with the essentials.
  {
    const { x, z } = Z.spawn; const g = Y0
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2
      world.set(Math.round(x + Math.cos(t) * 3), g, Math.round(z + Math.sin(t) * 3), B.cobblestone)
    }
    decor.push({ type: 'campfire', pos: [x, g + 1, z] })
    world.set(x - 4, g + 1, z - 3, B.crafting_table)
    world.set(x - 3, g + 1, z - 4, B.furnace)
    decor.push({ type: 'chest', pos: [x + 3, g + 1, z - 4], rot: 0 })
    decor.push({ type: 'bed', pos: [x + 4, g + 1, z - 2], rot: 0 })
    decor.push({ type: 'lantern', pos: [x - 4, g + 1, z + 3], post: true })
    decor.push({ type: 'lantern', pos: [x + 4, g + 1, z + 3], post: true })
    lm('spawn', [S, [x + 1, z + 2]], [x - 5, g, z - 5], [x + 5, g + 3, z + 4], 0.35, 0.42, 18)
  }

  // Aster: a beacon pyramid on the northern hill, its beam visible from anywhere.
  {
    const { x, z } = Z.aster; const g = Y0 + 4
    world.fill(x - 3, g + 1, z - 3, x + 3, g + 1, z + 3, B.iron_block)
    world.fill(x - 2, g + 2, z - 2, x + 2, g + 2, z + 2, B.gold_block)
    world.fill(x - 1, g + 3, z - 1, x + 1, g + 3, z + 1, B.diamond_block)
    world.set(x, g + 4, z, B.beacon)
    decor.push({ type: 'beam', pos: [x, g + 5, z] })
    for (const [dx, dz] of [[-6, -2], [5, -4], [-5, 4], [6, 3], [2, -6]]) {
      const h = 1 + Math.floor(hash2(dx, dz, 2) * 3)
      world.fill(x + dx, g + 1, z + dz, x + dx + 1, g + h, z + dz, B.stone)
    }
    lm('aster', [S, NH, [x, z + 5]], [x - 4, g, z - 4], [x + 4, g + 6, z + 4], 0, 0.42, 24)
  }

  // HELIX: a Create factory that splits one belt into many lanes.
  {
    const { x, z } = Z.helix; const g = Y0
    const x0 = x - 7; const x1 = x + 7; const z0 = z - 5; const z1 = z + 3
    world.fill(x0, g, z0, x1, g, z1, B.polished_andesite)
    world.walls(x0, g + 1, z0, x1, g + 6, z1, B.andesite_casing)
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) world.fill(cx, g + 1, cz, cx, g + 7, cz, B.brass_casing)
    world.walls(x0, g + 7, z0, x1, g + 7, z1, B.brass_casing)
    world.fill(x0 + 1, g + 7, z0 + 1, x1 - 1, g + 7, z1 - 1, B.andesite_casing)
    for (let i = x0 + 2; i <= x1 - 2; i += 3) { world.fill(i, g + 3, z1, i + 1, g + 5, z1, B.glass); world.fill(i, g + 3, z0, i + 1, g + 5, z0, B.glass) }
    for (let i = z0 + 2; i <= z1 - 2; i += 3) { world.fill(x0, g + 3, i, x0, g + 5, i + 1, B.glass); world.fill(x1, g + 3, i, x1, g + 5, i + 1, B.glass) }
    world.fill(x - 1, g + 1, z1, x + 1, g + 3, z1, 0)
    world.fill(x + 3, g + 8, z0 + 1, x + 4, g + 13, z0 + 2, B.bricks)
    world.fill(x + 3, g + 14, z0 + 1, x + 4, g + 14, z0 + 2, 0)
    decor.push({ type: 'emitter', kind: 'steam', pos: [x + 4, g + 14, z0 + 2], radius: 0.6, count: 26 })
    world.fill(x - 6, g + 1, z1 - 1, x - 5, g + 2, z1 - 1, B.brass_block)
    decor.push({ type: 'cog', pos: [x - 4.5, g + 4.5, z1 + 1.15], radius: 3.2, axis: 'z', speed: 0.6, brass: true })
    decor.push({ type: 'cog', pos: [x + 5, g + 5.5, z1 + 1.15], radius: 1.6, axis: 'z', speed: -1.2 })
    decor.push({ type: 'cog', pos: [x1 + 1.15, g + 4, z - 1], radius: 2, axis: 'x', speed: 0.9 })
    // one lane in, four lanes out
    const by = g + 1.02
    decor.push({ type: 'belt', from: [x, by, z1 + 1], to: [x, by, z1 + 5] })
    for (let l = -3; l <= 3; l += 2) decor.push({ type: 'belt', from: [x + l, by, z1 + 6], to: [x + l, by, z1 + 8] })
    decor.push({ type: 'belt', from: [x - 3, by, z1 + 5.5], to: [x + 3, by, z1 + 5.5] })
    lm('helix', [S, NH, [C + 6, C - 4], [x - 1, C - 4]], [x0, g, z0], [x1 + 2, g + 14, z1 + 10], 0.25, 0.4, 32)
  }

  // Kargo: a deployment depot with containers riding a rail loop.
  {
    const { x, z } = Z.kargo; const g = Y0
    world.fill(x - 2, g + 1, z - 2, x + 2, g + 4, z + 2, B.oak_planks)
    world.fill(x - 1, g + 1, z - 2, x + 1, g + 3, z - 2, B.glass)
    world.fill(x - 2, g + 1, z + 2, x - 2, g + 2, z + 2, B.oak_log)
    world.fill(x - 3, g + 5, z - 3, x + 3, g + 5, z + 3, B.copper_roof)
    world.fill(x - 2, g + 6, z - 2, x + 2, g + 6, z + 2, B.copper_roof)
    world.fill(x - 1, g + 2, z + 2, x + 1, g + 3, z + 2, 0)
    world.fill(x - 2, g + 1, z + 2, x - 2, g + 3, z + 2, 0)
    const stacks: [number, number, number, number][] = [[4, -4, B.copper_block, 2], [5, -2, B.brass_casing, 1], [-5, -4, B.colony_blue, 2], [-5, 3, B.red_wool, 1], [5, 4, B.copper_block, 1]]
    for (const [dx, dz, id, hgt] of stacks) world.fill(x + dx, g + 1, z + dz, x + dx + 1, g + hgt, z + dz, id)
    const loop: [number, number][] = [[x - 7, z - 6], [x + 7, z - 6], [x + 7, z + 6], [x - 7, z + 6]]
    decor.push({ type: 'rail', loop, y: g + 1 })
    lm('kargo', [S, [C + 10, C + 6], [x - 8, z + 2]], [x - 7, g, z - 6], [x + 7, g + 6, z + 6], -0.55, 0.55, 30)
  }

  // PolySafe: a brewing lab where pairs of potions get tested before mixing.
  {
    const { x, z } = Z.polysafe; const g = Y0
    world.fill(x - 2, g + 1, z - 2, x + 2, g + 4, z + 2, B.stone_bricks)
    world.fill(x - 1, g + 1, z - 1, x + 1, g + 3, z + 1, 0)
    world.fill(x - 2, g + 2, z - 1, x - 2, g + 3, z, 0)
    world.fill(x, g + 2, z - 2, x, g + 3, z - 2, B.glass); world.fill(x, g + 2, z + 2, x, g + 3, z + 2, B.glass)
    world.fill(x - 3, g + 5, z - 3, x + 3, g + 5, z + 3, B.dark_planks)
    world.fill(x - 2, g + 6, z - 2, x + 2, g + 6, z + 2, B.dark_planks)
    world.fill(x + 1, g + 5, z + 1, x + 1, g + 9, z + 1, B.bricks)
    world.set(x, g + 4, z, B.lamp)
    decor.push({ type: 'emitter', kind: 'steam', pos: [x + 1.5, g + 10, z + 1.5], radius: 0.4, count: 12 })
    decor.push({ type: 'brewing', pos: [x - 4, g + 1, z - 2] })
    decor.push({ type: 'brewing', pos: [x - 4, g + 1, z + 2] })
    decor.push({ type: 'cauldron', pos: [x - 4, g + 1, z] })
    decor.push({ type: 'emitter', kind: 'potion', pos: [x - 3.5, g + 2, z + 0.5], radius: 2.2, count: 30 })
    lm('polysafe', [S, [C + 6, C + 12], [x - 6, z]], [x - 5, g, z - 3], [x + 3, g + 9, z + 3], -0.9, 0.45, 20)
  }

  // GDG village around a bell, with the UltraChat library.
  {
    const { x, z } = Z.village; const g = Y0
    // library
    const lx0 = x - 4; const lx1 = x + 4; const lz0 = z - 2; const lz1 = z + 4
    world.fill(lx0, g, lz0, lx1, g, lz1, B.cobblestone)
    world.walls(lx0, g + 1, lz0, lx1, g + 4, lz1, B.oak_planks)
    for (const [cx, cz] of [[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]]) world.fill(cx, g + 1, cz, cx, g + 4, cz, B.oak_log)
    world.fill(lx0 + 1, g + 1, lz1 - 1, lx1 - 1, g + 3, lz1 - 1, B.bookshelf)
    world.fill(lx0 + 1, g + 1, lz0 + 1, lx0 + 1, g + 3, lz1 - 1, B.bookshelf)
    world.fill(lx1 - 1, g + 1, lz0 + 1, lx1 - 1, g + 3, lz1 - 1, B.bookshelf)
    for (const gx of [lx0 + 2, lx1 - 3]) world.fill(gx, g + 2, lz0, gx + 1, g + 3, lz0, B.glass)
    world.fill(x, g + 1, lz0, x, g + 2, lz0, 0)
    for (let s = 0; s <= 4; s++) {
      world.fill(lx0 - 1 + s, g + 5 + s, lz0 - 1, lx0 - 1 + s, g + 5 + s, lz1 + 1, B.dark_planks)
      world.fill(lx1 + 1 - s, g + 5 + s, lz0 - 1, lx1 + 1 - s, g + 5 + s, lz1 + 1, B.dark_planks)
      if (s < 4) { world.fill(lx0 + s, g + 5, lz0, lx1 - s, g + 4 + s, lz0, B.oak_planks); world.fill(lx0 + s, g + 5, lz1, lx1 - s, g + 4 + s, lz1, B.oak_planks) }
    }
    world.set(x, g + 7, lz0, B.glass)
    decor.push({ type: 'lectern', pos: [x + 2, g + 1, lz0 - 2], rot: 0 })
    // houses
    const house = (hx: number, hz: number) => {
      world.fill(hx - 2, g, hz - 2, hx + 2, g, hz + 2, B.cobblestone)
      world.walls(hx - 2, g + 1, hz - 2, hx + 2, g + 3, hz + 2, B.oak_planks)
      for (const [cx, cz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) world.fill(hx + cx, g + 1, hz + cz, hx + cx, g + 3, hz + cz, B.oak_log)
      world.fill(hx, g + 1, hz - 2, hx, g + 2, hz - 2, 0)
      world.set(hx + 2, g + 2, hz, B.glass); world.set(hx - 2, g + 2, hz, B.glass)
      for (let s = 0; s <= 2; s++) world.fill(hx - 3 + s, g + 4 + s, hz - 3 + s, hx + 3 - s, g + 4 + s, hz + 3 - s, B.dark_planks)
    }
    house(x - 9, z - 1); house(x + 9, z + 1)
    world.fill(x - 3, g, z - 8, x + 3, g, z - 6, B.path)
    world.fill(x + 6, g, z - 9, x + 10, g, z - 6, B.farmland)
    world.fill(x + 6, g + 1, z - 9, x + 10, g + 1, z - 6, B.wheat)
    world.fill(x + 5, g + 1, z - 10, x + 5, g + 1, z - 5, B.oak_log)
    decor.push({ type: 'bell', pos: [x, g + 1, z - 7] })
    decor.push({ type: 'banner', pos: [x - 3, g + 1, z - 8], rot: 0, colors: ['#4285f4', '#ea4335', '#fbbc04', '#34a853'] })
    decor.push({ type: 'villager', pos: [x - 2, g + 1, z - 5], rot: 2.6, robe: '#6b4a2b' })
    decor.push({ type: 'villager', pos: [x + 3, g + 1, z - 9], rot: -0.6, robe: '#3a5f8a' })
    decor.push({ type: 'villager', pos: [x + 7, g + 1, z - 4], rot: 3.4, robe: '#5a8a3a' })
    decor.push({ type: 'lantern', pos: [x - 4, g + 1, z - 5], post: true })
    decor.push({ type: 'lantern', pos: [x + 4, g + 1, z - 5], post: true })
    lm('gdg', [S, [C + 2, z - 9]], [x - 11, g, z - 10], [x + 11, g + 6, z - 3], 0.1, 0.55, 30)
    lm('ultrachat', [S, [C + 2, z - 9], [x + 1, lz0 - 3]], [lx0, g, lz0], [lx1, g + 9, lz1], 0.2, 0.42, 22)
  }

  // End portal: the way out (contact).
  {
    const { x, z } = Z.portal; const g = Y0
    world.fill(x - 3, g, z - 3, x + 3, g, z + 3, B.obsidian)
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const ring = Math.abs(dx) === 2 || Math.abs(dz) === 2
      const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2
      if (ring && !corner) world.set(x + dx, g + 1, z + dz, B.end_frame)
    }
    decor.push({ type: 'portal', min: [x - 1, g + 1.78, z - 1], max: [x + 2, g + 1.78, z + 2] })
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) world.fill(x + dx, g + 1, z + dz, x + dx, g + 3, z + dz, B.obsidian)
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) decor.push({ type: 'lantern', pos: [x + dx, g + 4, z + dz] })
    lm('portal', [S, SO, [C - 4, C + 14], [x + 1, z - 4]], [x - 3, g, z - 3], [x + 3, g + 4, z + 3], -0.5, 0.65, 18)
  }

  // Petra: a mushroom grove around an open petri dish.
  {
    const { x, z } = Z.petra; const g = Y0
    const mushroom = (mx: number, mz: number, h: number, red: boolean) => {
      world.fill(mx, g + 1, mz, mx, g + h, mz, B.mushroom_stem)
      const cap = red ? B.mushroom_red : B.mushroom_brown
      if (red) {
        world.fill(mx - 2, g + h + 1, mz - 2, mx + 2, g + h + 1, mz + 2, cap)
        world.walls(mx - 2, g + h - 2, mz - 2, mx + 2, g + h, mz + 2, cap)
        for (const [cx, cz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) world.fill(mx + cx, g + h - 2, mz + cz, mx + cx, g + h, mz + cz, 0)
      } else {
        world.fill(mx - 3, g + h + 1, mz - 3, mx + 3, g + h + 1, mz + 3, cap)
        for (const [cx, cz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) world.set(mx + cx, g + h + 1, mz + cz, 0)
      }
    }
    mushroom(x - 5, z - 4, 7, true)
    mushroom(x + 4, z + 5, 6, false)
    mushroom(x - 6, z + 6, 4, true)
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.hypot(dx, dz)
      if (d > 4.4) continue
      if (d > 3.5) { world.set(x + dx, g + 1, z + dz, B.glass); world.set(x + dx, g, z + dz, B.quartz); continue }
      const n = valueNoise((x + dx) * 0.6, (z + dz) * 0.6, 31)
      world.set(x + dx, g, z + dz, B.quartz)
      world.set(x + dx, g + 1, z + dz, 0)
      world.set(x + dx, g, z + dz, n > 0.72 ? B.colony_green : n < 0.2 ? B.colony_pink : (dx === 1 && dz === -2) || (dx === -2 && dz === 1) ? B.colony_blue : B.agar)
    }
    decor.push({ type: 'emitter', kind: 'spores', pos: [x, g + 4, z], radius: 7, count: 40 })
    for (let i = 0; i < 9; i++) {
      const px = x + Math.round((rng() - 0.5) * 14); const pz = z + Math.round((rng() - 0.5) * 14)
      if (Math.hypot(px - x, pz - z) > 5 && world.get(px, g + 1, pz) === 0 && world.get(px, g, pz) === B.mycelium) world.set(px, g + 1, pz, B.red_mushroom_small)
    }
    lm('petra', [S, SO, [C - 8, C + 12], [x + 6, z]], [x - 5, g, z - 5], [x + 5, g + 3, z + 5], 0.9, 0.62, 22)
  }

  // Arachne: a Twilight hedge maze under a firefly canopy, a spider at its heart.
  {
    const { x, z } = Z.arachne; const g = Y0 - 1
    const N = 5
    const open = new Set<string>()
    const seen = new Set<string>()
    const stack: [number, number][] = [[N - 1, 2]]
    seen.add(`${N - 1},2`)
    while (stack.length) {
      const [cx, cz] = stack[stack.length - 1]
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => {
        const nx = cx + dx; const nz = cz + dz
        return nx >= 0 && nz >= 0 && nx < N && nz < N && !seen.has(`${nx},${nz}`)
      })
      if (!options.length) { stack.pop(); continue }
      const [dx, dz] = options[Math.floor(rng() * options.length)]
      open.add(`${cx * 2 + 1 + dx},${cz * 2 + 1 + dz}`)
      seen.add(`${cx + dx},${cz + dz}`)
      stack.push([cx + dx, cz + dz])
    }
    const mx0 = x - 5; const mz0 = z - 5
    for (let gz = 0; gz <= N * 2; gz++) for (let gx = 0; gx <= N * 2; gx++) {
      const cell = gx % 2 === 1 && gz % 2 === 1
      const isOpen = cell || open.has(`${gx},${gz}`) || (gx === N * 2 && gz === 5)
      const wx = mx0 + gx; const wz = mz0 + gz
      world.set(wx, g, wz, B.grass)
      if (!isOpen) world.fill(wx, g + 1, wz, wx, g + 3, wz, B.hedge)
      else if (hash2(wx, wz, 77) < 0.12) world.set(wx, g + 1, wz, B.cobweb)
    }
    world.set(x, g + 1, z, 0)
    decor.push({ type: 'spider', pos: [x + 0.5, g + 1, z + 0.5] })
    const canopy = (tx: number, tz: number, h: number) => {
      world.fill(tx, g + 1, tz, tx + 1, g + h, tz + 1, B.dark_log)
      for (let dy = -2; dy <= 1; dy++) {
        const r = dy === 1 ? 2 : dy === -2 ? 3 : 4
        for (let dz = -r; dz <= r + 1; dz++) for (let dx = -r; dx <= r + 1; dx++)
          if (Math.hypot(dx - 0.5, dz - 0.5) < r + 0.3 && world.get(tx + dx, g + h + dy, tz + dz) === 0) world.set(tx + dx, g + h + dy, tz + dz, B.dark_leaves)
      }
    }
    canopy(x - 9, z - 7, 11); canopy(x - 8, z + 5, 9); canopy(x + 1, z - 10, 10); canopy(x - 1, z + 8, 8)
    for (let i = 0; i < 26; i++) {
      const px = x + Math.round((rng() - 0.5) * 22); const pz = z + Math.round((rng() - 0.5) * 22)
      const h = world.ground(px, pz)
      if (h > 0 && world.get(px, h, pz) === B.grass && world.get(px, h + 1, pz) === 0 && (Math.abs(px - x) > 5 || Math.abs(pz - z) > 5)) world.set(px, h + 1, pz, rng() < 0.4 ? B.firefly_bush : B.fern)
    }
    decor.push({ type: 'emitter', kind: 'firefly', pos: [x, g + 5, z], radius: 11, count: 70 })
    lm('arachne', [S, NH, [C - 8, C - 2], [x + 7, z]], [x - 6, g, z - 6], [x + 6, g + 4, z + 6], 1.2, 0.68, 26)
  }

  // Stretchy: an Applied-Energistics vault of glowing drives.
  {
    const { x, z } = Z.stretchy; const g = Y0
    const x0 = x - 5; const x1 = x + 5; const z0 = z - 4; const z1 = z + 3
    world.fill(x0, g, z0, x1, g, z1, B.sky_stone)
    world.walls(x0, g + 1, z0, x1, g + 6, z1, B.sky_stone)
    world.fill(x0, g + 7, z0, x1, g + 7, z1, B.me_side)
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) world.fill(cx, g + 1, cz, cx, g + 8, cz, B.me_controller)
    world.fill(x0 + 1, g + 2, z1, x1 - 1, g + 5, z1, B.me_drive)
    world.fill(x - 1, g + 1, z1, x + 1, g + 3, z1, 0)
    world.fill(x0, g + 2, z0 + 1, x0, g + 5, z1 - 1, B.me_drive)
    world.fill(x1, g + 2, z0 + 1, x1, g + 5, z1 - 1, B.me_drive)
    world.fill(x - 1, g + 8, z - 2, x + 1, g + 8, z, B.fluix)
    world.set(x, g + 9, z - 1, B.fluix)
    decor.push({ type: 'cable', points: [[x + 1.5, g + 1.2, z1 + 1.5], [x + 1.5, g + 1.2, z1 + 4], [Z.sivana.x - 1.5, g + 1.2, z1 + 4], [Z.sivana.x - 1.5, g + 1.2, Z.sivana.z - 0.5]] })
    lm('stretchy', [S, NH, [C - 4, C - 6], [x - 1, z1 + 3]], [x0, g, z0], [x1, g + 9, z1], -0.25, 0.45, 26)
  }

  // Sivana: a jukebox studio wired into the vault.
  {
    const { x, z } = Z.sivana; const g = Y0
    world.fill(x - 2, g, z - 2, x + 2, g, z + 2, B.dark_planks)
    world.set(x, g + 1, z, B.jukebox)
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2], [0, -2], [-2, 0], [2, 0]]) world.set(x + dx, g + 1, z + dz, B.note_block)
    decor.push({ type: 'emitter', kind: 'notes', pos: [x + 0.5, g + 2.2, z + 0.5], radius: 1.4, count: 10 })
    lm('sivana', [S, NH, [C - 4, C - 6], [x, z + 4]], [x - 2, g, z - 2], [x + 2, g + 2, z + 2], 0.5, 0.55, 16)
  }

  // ---- scenery: trees, flowers, lamps --------------------------------------
  const reserved = (x: number, z: number, pad: number) => ZONES.some(zn => Math.hypot(x - zn.x, z - zn.z) < zn.r + pad) || pathCells.has(z * SIZE + x)
  const oak = (tx: number, tz: number) => {
    const g = world.ground(tx, tz)
    if (g < 0 || world.get(tx, g, tz) !== B.grass) return
    const h = 4 + Math.floor(rng() * 2)
    world.fill(tx, g + 1, tz, tx, g + h, tz, B.oak_log)
    for (let dy = h - 2; dy <= h + 1; dy++) {
      const r = dy >= h ? 1 : 2
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && (dy === h + 1 || rng() < 0.5)) continue
        if (world.get(tx + dx, g + dy, tz + dz) === 0) world.set(tx + dx, g + dy, tz + dz, B.oak_leaves)
      }
    }
  }
  let planted = 0
  for (let attempt = 0; attempt < 600 && planted < 34; attempt++) {
    const tx = Math.floor(rng() * SIZE); const tz = Math.floor(rng() * SIZE)
    if (top(tx, tz) < 0 || Math.hypot(tx - C, tz - C) > edgeRadius(tx, tz) - 3 || reserved(tx, tz, 3)) continue
    oak(tx, tz); planted++
  }
  for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
    const g = world.ground(x, z)
    if (g < 0 || world.get(x, g, z) !== B.grass || world.get(x, g + 1, z) !== 0 || pathCells.has(z * SIZE + x)) continue
    const r = hash2(x, z, 404)
    if (r < 0.1) world.set(x, g + 1, z, B.tall_grass)
    else if (r < 0.112) world.set(x, g + 1, z, B.poppy)
    else if (r < 0.124) world.set(x, g + 1, z, B.dandelion)
    else if (r < 0.13) world.set(x, g + 1, z, B.cornflower)
  }
  for (const p of [[C + 3, C + 12], [C - 3, C - 4], [C + 6, C - 6], [C + 10, C + 8], [C - 10, C + 9]] as [number, number][]) {
    const g = world.ground(p[0], p[1])
    if (g > 0 && world.get(p[0], g + 1, p[1]) === 0) decor.push({ type: 'lantern', pos: [p[0], g + 1, p[1]], post: true })
  }

  for (const l of landmarks) l.door[1] = world.ground(l.door[0], l.door[2]) + 1
  return { world, decor, landmarks, hub: S, edgeRadius }
}
