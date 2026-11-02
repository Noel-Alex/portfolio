import { B, BLOCKS, SOLID } from './blocks'
import type { VoxelWorld } from './world'

/** A cell the player can occupy: feet at y, so y-1 is the floor. */
export type Cell = { x: number; y: number; z: number }

const solid = (w: VoxelWorld, x: number, y: number, z: number) => SOLID[w.get(x, y, z)] === 1
const wet = (w: VoxelWorld, x: number, y: number, z: number) => !!BLOCKS[w.get(x, y, z)].water

/** Feet at y fit here: something to stand on, two blocks of headroom. */
export function standable(w: VoxelWorld, x: number, y: number, z: number) {
  return (solid(w, x, y - 1, z) || wet(w, x, y - 1, z)) && !solid(w, x, y, z) && !solid(w, x, y + 1, z)
}

/** The standable y in this column nearest to `near`, searching up to `up` blocks higher and 4 lower. */
export function settle(w: VoxelWorld, x: number, z: number, near: number, up = 1) {
  for (let y = near + up; y >= near - 4; y--) if (standable(w, x, y, z)) return y
  return null
}

/** Highest standable y in a column (open sky), or null. */
export function surface(w: VoxelWorld, x: number, z: number) {
  for (let y = w.H - 2; y > 0; y--) if (standable(w, x, y, z)) return y
  return null
}

class Heap {
  private a: { k: number; f: number }[] = []
  get size() { return this.a.length }
  push(k: number, f: number) {
    const a = this.a; a.push({ k, f }); let i = a.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop()!
    if (a.length) {
      a[0] = last; let i = 0
      for (;;) {
        const l = i * 2 + 1; const r = l + 1; let m = i
        if (l < a.length && a[l].f < a[m].f) m = l
        if (r < a.length && a[r].f < a[m].f) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]; i = m
      }
    }
    return top.k
  }
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

/**
 * A* over standable cells: one-block steps up (two out of water), drops of up to
 * three, diagonals only when both corners are clear. Paths are cheaper than grass,
 * so the player keeps to the roads the way a person would. If the goal can't be
 * reached, the path ends at the closest cell that can.
 */
export function findPath(w: VoxelWorld, from: Cell, to: Cell, budget = 60000): Cell[] {
  const key = (x: number, y: number, z: number) => (y * w.D + z) * w.W + x
  const unkey = (k: number): Cell => { const x = k % w.W; const r = (k - x) / w.W; const z = r % w.D; return { x, y: (r - z) / w.D, z } }
  const h = (x: number, y: number, z: number) => {
    const dx = Math.abs(x - to.x); const dz = Math.abs(z - to.z)
    return (Math.max(dx, dz) + 0.414 * Math.min(dx, dz)) * 0.7 + Math.abs(y - to.y) * 0.5
  }
  const start = key(from.x, from.y, from.z)
  const goal = key(to.x, to.y, to.z)
  const g = new Map<number, number>([[start, 0]])
  const came = new Map<number, number>()
  const open = new Heap()
  open.push(start, h(from.x, from.y, from.z))
  let best = start; let bestH = h(from.x, from.y, from.z)
  let expanded = 0
  while (open.size && expanded++ < budget) {
    const k = open.pop()
    if (k === goal) { best = k; break }
    const c = unkey(k)
    const gk = g.get(k)!
    const inWater = wet(w, c.x, c.y, c.z)
    for (const [dx, dz] of DIRS) {
      const nx = c.x + dx; const nz = c.z + dz
      const diag = dx !== 0 && dz !== 0
      if (diag && !(standable(w, c.x + dx, c.y, c.z) && standable(w, c.x, c.y, c.z + dz))) continue
      const ny = diag ? (standable(w, nx, c.y, nz) ? c.y : null) : settle(w, nx, nz, c.y, inWater ? 2 : 1)
      if (ny === null) continue
      // stepping up needs headroom above where we stand now
      if (ny > c.y && solid(w, c.x, c.y + 2, c.z)) continue
      const floor = w.get(nx, ny - 1, nz)
      let cost = diag ? 1.414 : 1
      if (floor === B.path || floor === B.oak_planks || floor === B.cobblestone || floor === B.polished_andesite) cost *= 0.7
      if (wet(w, nx, ny, nz)) cost += 4
      if (ny !== c.y) cost += 0.4 * Math.abs(ny - c.y)
      const nk = key(nx, ny, nz)
      const ng = gk + cost
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng); came.set(nk, k)
        const hn = h(nx, ny, nz)
        if (hn < bestH) { bestH = hn; best = nk }
        open.push(nk, ng + hn)
      }
    }
  }
  const path: Cell[] = []
  for (let k: number | undefined = best; k !== undefined && k !== start; k = came.get(k)) path.push(unkey(k))
  return path.reverse()
}

/** Drop waypoints the player can walk straight past, so routes read as strides, not staircases. */
export function smooth(w: VoxelWorld, from: Cell, path: Cell[]): Cell[] {
  if (path.length < 3) return path
  const out: Cell[] = []
  let anchor = from
  for (let i = 0; i < path.length; i++) {
    const next = path[i + 1]
    if (next && next.y === anchor.y && path[i].y === anchor.y && clear(w, anchor, next)) continue
    out.push(path[i]); anchor = path[i]
  }
  return out
}

function clear(w: VoxelWorld, a: Cell, b: Cell) {
  const ax = a.x + 0.5; const az = a.z + 0.5; const bx = b.x + 0.5; const bz = b.z + 0.5
  const len = Math.hypot(bx - ax, bz - az)
  const steps = Math.ceil(len / 0.25)
  const nx = -(bz - az) / (len || 1); const nz = (bx - ax) / (len || 1)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    for (const o of [-0.32, 0, 0.32]) {
      const x = Math.floor(ax + (bx - ax) * t + nx * o); const z = Math.floor(az + (bz - az) * t + nz * o)
      if (!standable(w, x, a.y, z) || wet(w, x, a.y, z)) return false
    }
  }
  return true
}
