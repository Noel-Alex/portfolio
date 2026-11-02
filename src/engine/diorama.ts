import * as THREE from 'three'
import { buildAtlas } from './textures'
import { generateWorld, VoxelWorld, type Decor, type LandmarkId } from './world'
import { meshWorld } from './mesher'
import { buildDecor } from './effects'
import { makeSpider, makeVillager } from './models'
import { B } from './blocks'

/**
 * Cut one build out of the island as a floating chunk and render it in
 * isometric projection on a transparent background. Dev-only: capture.html
 * calls this and saves the results to public/builds/, which the portfolio uses
 * as each project's artwork. Same blocks, same textures as the 3D world.
 */
export function renderDiorama(id: LandmarkId, size = 1200, opts: { margin?: number; depth?: number; yaw?: number; of?: LandmarkId } = {}) {
  const { world, decor, landmarks } = generateWorld()
  const l = landmarks.find(x => x.id === (opts.of ?? id))!
  const m = opts.margin ?? 3
  const x0 = l.min[0] - m; const x1 = l.max[0] + m
  const z0 = l.min[2] - m; const z1 = l.max[2] + m
  const yBot = l.min[1] - (opts.depth ?? 5)
  const yTop = l.max[1] + 14

  // the chunk: every block in the column range, with a stepped, eroded underside like a floating island
  const sub = new VoxelWorld(world.W, world.H, world.D)
  let topY = l.min[1]
  for (let y = yBot; y <= yTop; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, z - z0, z1 - z)
    const below = l.min[1] - y
    if (below > 0 && edge < below - 1) continue
    // around the build keep only the ground and what grows on it, so trees don't hide the work
    const outside = x < l.min[0] || x > l.max[0] || z < l.min[2] || z > l.max[2]
    if (outside && y > world.ground(x, z) + 1) continue
    if (outside && y > l.min[1] + 2) continue
    const b = world.get(x, y, z)
    if (outside && (b === B.oak_log || b === B.dark_log)) continue
    if (b) sub.set(x, y, z, b)
  }
  // canopies whose trunks were trimmed would float: keep only leaves connected to a log
  const leaf = new Set([B.oak_leaves, B.dark_leaves])
  const log = new Set([B.oak_log, B.dark_log])
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`
  const held = new Set<string>()
  const queue: number[][] = []
  for (let y = yBot; y <= yTop; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (log.has(sub.get(x, y, z))) queue.push([x, y, z])
  }
  while (queue.length) {
    const [x, y, z] = queue.pop()!
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const n = [x + dx, y + dy, z + dz]; const k = key(n[0], n[1], n[2])
      if (!held.has(k) && leaf.has(sub.get(n[0], n[1], n[2]))) { held.add(k); queue.push(n) }
    }
  }
  for (let y = yBot; y <= yTop; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const b = sub.get(x, y, z)
    if (leaf.has(b) && !held.has(key(x, y, z))) sub.set(x, y, z, 0)
    else if (b && y > topY) topY = y
  }

  const atlas = new THREE.CanvasTexture(buildAtlas())
  atlas.magFilter = THREE.NearestFilter
  atlas.minFilter = THREE.NearestMipmapLinearFilter
  atlas.colorSpace = THREE.SRGBColorSpace
  const meshes = meshWorld(sub)
  const scene = new THREE.Scene()
  const mat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5 })
  scene.add(new THREE.Mesh(meshes.lit, mat), new THREE.Mesh(meshes.glow, mat))
  scene.add(new THREE.Mesh(meshes.water, new THREE.MeshBasicMaterial({ color: '#3f78d8', vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })))
  scene.add(new THREE.HemisphereLight('#ffffff', '#6b5a48', 1.6))
  const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(40, 80, 30); scene.add(sun)

  const inside = (p: number[]) => p[0] >= x0 && p[0] <= x1 + 1 && p[2] >= z0 && p[2] <= z1 + 1
  const kept = decor.filter(d => {
    if ('pos' in d) return inside(d.pos)
    if (d.type === 'belt') return inside(d.from)
    if (d.type === 'portal') return inside(d.min)
    if (d.type === 'cable') return d.points.every(inside)
    if (d.type === 'rail') return d.loop.every(([x, z]) => inside([x, 0, z]))
    return false
  }) as Decor[]
  const built = buildDecor(kept.filter(d => d.type !== 'emitter'), atlas, true)
  for (const o of built.objects) scene.add(o)
  for (const u of built.updates) u.update(2.4, 0.016, 0)
  for (const d of kept) {
    if (d.type === 'spider') { const s = makeSpider(); s.root.position.set(...d.pos); s.root.rotation.y = Math.PI / 2 + 0.5; scene.add(s.root) }
    if (d.type === 'villager') { const v = makeVillager(d.robe); v.root.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5); v.root.rotation.y = d.rot; scene.add(v.root) }
  }

  // isometric camera fitted to the chunk
  const box = new THREE.Box3(new THREE.Vector3(x0, yBot, z0), new THREE.Vector3(x1 + 1, Math.max(topY + 1, l.max[1] + 1), z1 + 1))
  const center = box.getCenter(new THREE.Vector3())
  const yaw = opts.yaw ?? Math.PI / 4
  const pitch = Math.atan(1 / Math.SQRT2)
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
  cam.position.copy(center).addScaledVector(dir, 300)
  cam.lookAt(center)
  cam.updateMatrixWorld()
  // fit: project the box corners into camera space and size the frustum to them
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity
  for (const cx of [box.min.x, box.max.x]) for (const cy of [box.min.y, box.max.y]) for (const cz of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(cx, cy, cz).applyMatrix4(cam.matrixWorldInverse)
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const half = Math.max(maxX - minX, maxY - minY) / 2 * 1.04
  const mx = (minX + maxX) / 2; const my = (minY + maxY) / 2
  cam.left = mx - half; cam.right = mx + half; cam.top = my + half; cam.bottom = my - half
  cam.updateProjectionMatrix()

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(1)
  renderer.setSize(size, size, false)
  renderer.setClearColor(0x000000, 0)
  renderer.render(scene, cam)
  const url = renderer.domElement.toDataURL('image/webp', 0.86)
  renderer.dispose()
  atlas.dispose()
  return url
}
