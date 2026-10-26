import * as THREE from 'three'
import { BLOCKS, OPAQUE, faceTile, type Face } from './blocks'
import { tileUV } from './textures'
import { hash2 } from './rng'
import type { VoxelWorld } from './world'

class Buffers {
  pos: number[] = []
  uv: number[] = []
  col: number[] = []
  idx: number[] = []
  quad(p: number[][], uv: number[][], c: number[], flip = false) {
    const base = this.pos.length / 3
    for (let i = 0; i < 4; i++) {
      this.pos.push(p[i][0], p[i][1], p[i][2])
      this.uv.push(uv[i][0], uv[i][1])
      this.col.push(c[i], c[i], c[i])
    }
    if (flip) this.idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base)
    else this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setIndex(this.idx)
    g.computeBoundingSphere()
    return g
  }
}

const FACES: { axis: number; sign: 1 | -1; name: Face; shade: number }[] = [
  { axis: 0, sign: 1, name: 'px', shade: 0.78 },
  { axis: 0, sign: -1, name: 'nx', shade: 0.78 },
  { axis: 1, sign: 1, name: 'py', shade: 1 },
  { axis: 1, sign: -1, name: 'ny', shade: 0.52 },
  { axis: 2, sign: 1, name: 'pz', shade: 0.64 },
  { axis: 2, sign: -1, name: 'nz', shade: 0.64 },
]
const AO = [0.48, 0.66, 0.83, 1]
const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]]

export type WorldMeshes = { lit: THREE.BufferGeometry; glow: THREE.BufferGeometry; water: THREE.BufferGeometry }

export function meshWorld(world: VoxelWorld): WorldMeshes {
  const lit = new Buffers()
  const glow = new Buffers()
  const water = new Buffers()
  const { W, H, D } = world
  const opaque = (x: number, y: number, z: number) => OPAQUE[world.get(x, y, z)] === 1
  const c = [0, 0, 0]
  const n = [0, 0, 0]

  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const id = world.get(x, y, z)
    if (!id) continue
    const def = BLOCKS[id]
    const out = def.emissive ? glow : lit

    if (def.shape === 'cross') {
      const { u0, u1, v0, v1 } = tileUV(def.top)
      const jx = (hash2(x, z, 3) - 0.5) * 0.3
      const jz = (hash2(z, x, 5) - 0.5) * 0.3
      const cx = x + 0.5 + jx; const cz = z + 0.5 + jz
      const r = 0.45
      const shade = def.emissive ? [1, 1, 1, 1] : [0.85, 0.85, 1, 1]
      for (const [dx, dz] of [[r, r], [r, -r]]) {
        const p = [[cx - dx, y, cz - dz], [cx + dx, y, cz + dz], [cx + dx, y + 1, cz + dz], [cx - dx, y + 1, cz - dz]]
        const uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]
        out.quad(p, uv, shade)
        out.quad([p[1], p[0], p[3], p[2]], [uv[1], uv[0], uv[3], uv[2]], shade)
      }
      continue
    }

    for (const f of FACES) {
      n[0] = n[1] = n[2] = 0
      n[f.axis] = f.sign
      const nx = x + n[0]; const ny = y + n[1]; const nz = z + n[2]
      const nid = world.get(nx, ny, nz)
      if (def.water) {
        if (nid && (BLOCKS[nid].water || OPAQUE[nid])) continue
      } else {
        if (OPAQUE[nid]) continue
        if (nid === id && def.name === 'glass') continue
      }
      const u = (f.axis + 1) % 3
      const v = (f.axis + 2) % 3
      const tile = tileUV(faceTile(def, f.name))
      const ps: number[][] = []
      const uvs: number[][] = []
      const ao: number[] = []
      for (const [du, dv] of CORNERS) {
        c[0] = x; c[1] = y; c[2] = z
        c[f.axis] += f.sign > 0 ? 1 : 0
        c[u] += du; c[v] += dv
        const p = [c[0], c[1], c[2]]
        if (def.water && f.axis === 1 && f.sign > 0) p[1] -= 0.14
        if (def.water && f.axis !== 1 && dv === 1 && v === 1) p[1] -= world.get(x, y + 1, z) === id ? 0 : 0.14
        if (def.water && f.axis !== 1 && du === 1 && u === 1) p[1] -= world.get(x, y + 1, z) === id ? 0 : 0.14
        ps.push(p)
        // texture axes: sides keep world-up as V
        let tu: number; let tv: number
        if (f.axis === 1) { tu = p[0] - x; tv = p[2] - z }
        else if (f.axis === 0) { tu = f.sign > 0 ? 1 - (p[2] - z) : p[2] - z; tv = p[1] - y }
        else { tu = f.sign > 0 ? p[0] - x : 1 - (p[0] - x); tv = p[1] - y }
        if (def.water) uvs.push([f.axis === 1 ? p[0] / 4 : (p[0] + p[2]) / 4, f.axis === 1 ? p[2] / 4 : p[1] / 4])
        else uvs.push([tile.u0 + tu * (tile.u1 - tile.u0), tile.v0 + tv * (tile.v1 - tile.v0)])
        if (def.emissive || def.water) { ao.push(def.water ? f.shade : Math.max(0.86, f.shade)); continue }
        const s1 = opaque(nx + (u === 0 ? (du ? 1 : -1) : 0), ny + (u === 1 ? (du ? 1 : -1) : 0), nz + (u === 2 ? (du ? 1 : -1) : 0))
        const s2 = opaque(nx + (v === 0 ? (dv ? 1 : -1) : 0), ny + (v === 1 ? (dv ? 1 : -1) : 0), nz + (v === 2 ? (dv ? 1 : -1) : 0))
        const cc = opaque(
          nx + (u === 0 ? (du ? 1 : -1) : 0) + (v === 0 ? (dv ? 1 : -1) : 0),
          ny + (u === 1 ? (du ? 1 : -1) : 0) + (v === 1 ? (dv ? 1 : -1) : 0),
          nz + (u === 2 ? (du ? 1 : -1) : 0) + (v === 2 ? (dv ? 1 : -1) : 0),
        )
        const level = s1 && s2 ? 0 : 3 - (Number(s1) + Number(s2) + Number(cc))
        ao.push(AO[level] * f.shade)
      }
      const target = def.water ? water : out
      const order = f.sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1]
      const P = order.map(i => ps[i]); const U = order.map(i => uvs[i]); const A = order.map(i => ao[i])
      target.quad(P, U, A, A[0] + A[2] < A[1] + A[3])
    }
  }
  return { lit: lit.geometry(), glow: glow.geometry(), water: water.geometry() }
}
