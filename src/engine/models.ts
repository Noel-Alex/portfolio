import * as THREE from 'three'
import { painter, paintSkin } from './skin'

const PX = 0.056

type Net = { u: number; v: number; w: number; h: number; d: number }

/** Map a box's six faces onto a Minecraft-style skin net. */
function skinBox(w: number, h: number, d: number, net: Net, size = 64) {
  const g = new THREE.BoxGeometry(w * PX, h * PX, d * PX)
  const { u, v } = net
  const W = net.w; const Hh = net.h; const Dd = net.d
  const rects: [number, number, number, number][] = [
    [u + Dd + W, v + Dd, Dd, Hh], // +x  (model's left)
    [u, v + Dd, Dd, Hh], // -x  (model's right)
    [u + Dd, v, W, Dd], // +y
    [u + Dd + W, v, W, Dd], // -y
    [u + Dd, v + Dd, W, Hh], // +z front
    [u + Dd + W + Dd, v + Dd, W, Hh], // -z back
  ]
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  rects.forEach(([x, y, rw, rh], f) => {
    const x0 = x / size; const x1 = (x + rw) / size
    const y0 = 1 - y / size; const y1 = 1 - (y + rh) / size
    uv.setXY(f * 4 + 0, x0, y0); uv.setXY(f * 4 + 1, x1, y0)
    uv.setXY(f * 4 + 2, x0, y1); uv.setXY(f * 4 + 3, x1, y1)
  })
  uv.needsUpdate = true
  return g
}

function canvasTexture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function makeSkin() {
  return canvasTexture(paintSkin())
}

export type Biped = {
  root: THREE.Group
  head: THREE.Object3D
  armL: THREE.Object3D
  armR: THREE.Object3D
  legL: THREE.Object3D
  legR: THREE.Object3D
}

function limb(parent: THREE.Object3D, mat: THREE.Material, geo: THREE.BufferGeometry, pivot: [number, number, number], hang: number) {
  const pivotObj = new THREE.Object3D()
  pivotObj.position.set(pivot[0] * PX, pivot[1] * PX, pivot[2] * PX)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = -hang * PX
  pivotObj.add(mesh)
  parent.add(pivotObj)
  return pivotObj
}

export function makePlayer(): Biped {
  const tex = makeSkin()
  const mat = new THREE.MeshLambertMaterial({ map: tex })
  const root = new THREE.Group()
  const body = new THREE.Mesh(skinBox(8, 12, 4, { u: 16, v: 16, w: 8, h: 12, d: 4 }), mat)
  body.position.y = 18 * PX
  root.add(body)
  const head = limb(root, mat, skinBox(8, 8, 8, { u: 0, v: 0, w: 8, h: 8, d: 8 }), [0, 24, 0], -4)
  const arm = { u: 40, v: 16, w: 4, h: 12, d: 4 }
  const leg = { u: 0, v: 16, w: 4, h: 12, d: 4 }
  const armR = limb(root, mat, skinBox(4, 12, 4, arm), [-6, 22, 0], 4)
  const armL = limb(root, mat, skinBox(4, 12, 4, arm), [6, 22, 0], 4)
  const legR = limb(root, mat, skinBox(4, 12, 4, leg), [-2, 12, 0], 6)
  const legL = limb(root, mat, skinBox(4, 12, 4, leg), [2, 12, 0], 6)
  root.traverse(o => { o.castShadow = false })
  return { root, head, armL, armR, legL, legR }
}

const lambert = (color: string, emissive?: string) => new THREE.MeshLambertMaterial({ color, emissive: emissive ?? '#000000' })

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * PX, h * PX, d * PX), mat)
  m.position.set(x * PX, y * PX, z * PX)
  return m
}

export function makeVillager(robe: string): Biped {
  const skin = lambert('#b98a6a')
  const robeMat = lambert(robe)
  const dark = lambert('#4a3424')
  const root = new THREE.Group()
  root.add(box(8, 12, 6, robeMat, 0, 18, 0))
  root.add(box(8, 6, 4, skin, 0, 18, 4.5))
  const headPivot = new THREE.Object3D(); headPivot.position.y = 24 * PX; root.add(headPivot)
  const head = box(8, 10, 8, skin, 0, 5, 0); headPivot.add(head)
  headPivot.add(box(2, 4, 2, lambert('#a87a5c'), 0, 2, 5))
  headPivot.add(box(6, 1, 1, lambert('#2e2018'), 0, 6, 4.1))
  headPivot.add(box(1, 1, 1, lambert('#2f6b3a'), -2, 5, 4.2)); headPivot.add(box(1, 1, 1, lambert('#2f6b3a'), 2, 5, 4.2))
  const legR = limb(root, dark, new THREE.BoxGeometry(4 * PX, 12 * PX, 4 * PX), [-2, 12, 0], 6)
  const legL = limb(root, dark, new THREE.BoxGeometry(4 * PX, 12 * PX, 4 * PX), [2, 12, 0], 6)
  const dummy = new THREE.Object3D()
  return { root, head: headPivot, armL: dummy, armR: dummy, legL, legR }
}

export function makeSpider() {
  const shell = lambert('#2c2a2e')
  const leg = lambert('#1f1d22')
  const eye = new THREE.MeshBasicMaterial({ color: '#ff3b3b' })
  const root = new THREE.Group()
  root.add(box(10, 8, 12, shell, 0, 6, -7))
  root.add(box(6, 6, 6, shell, 0, 6, 1))
  const head = box(8, 8, 8, shell, 0, 6, 7)
  root.add(head)
  for (const [x, y] of [[-2, 7], [2, 7], [-3, 5], [3, 5]]) root.add(box(1, 1, 0.5, eye, x, y, 11.1))
  const legs: THREE.Object3D[] = []
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1
    const pivot = new THREE.Object3D()
    pivot.position.set(side * 3 * PX, 6 * PX, (Math.floor(i / 2) * 2.5 - 3) * PX)
    const l = box(16, 2, 2, leg, side * 8, 0, 0)
    pivot.add(l)
    pivot.rotation.y = (Math.floor(i / 2) - 1.5) * 0.35 * side
    pivot.rotation.z = side * 0.45
    root.add(pivot)
    legs.push(pivot)
  }
  return { root, legs, head }
}

export function makeCreeper() {
  const { canvas, rect, speckle } = painter(16)
  speckle(0, 0, 16, 16, ['#5fb54a', '#4fa33c', '#7ccf63', '#3e8a2f', '#9ad47f'], 42)
  const tex = canvasTexture(canvas)
  const faceCanvas = painter(8)
  faceCanvas.speckle(0, 0, 8, 8, ['#5fb54a', '#4fa33c', '#7ccf63', '#3e8a2f'], 7)
  const face: [number, number, number, number][] = [[1, 2, 2, 2], [5, 2, 2, 2], [3, 4, 2, 3], [2, 5, 1, 3], [5, 5, 1, 3]]
  for (const [x, y, w, h] of face) faceCanvas.rect(x, y, w, h, '#101010')
  const faceTex = canvasTexture(faceCanvas.canvas)
  void rect
  const mat = new THREE.MeshLambertMaterial({ map: tex })
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTex })
  const root = new THREE.Group()
  root.add(box(8, 12, 4, mat, 0, 12, 0))
  const head = new THREE.Mesh(new THREE.BoxGeometry(8 * PX, 8 * PX, 8 * PX), [mat, mat, mat, mat, faceMat, mat])
  head.position.y = 22 * PX
  root.add(head)
  const feet: THREE.Object3D[] = []
  for (const [x, z] of [[-2, 4], [2, 4], [-2, -4], [2, -4]]) {
    const f = box(4, 6, 4, mat, x, 3, z)
    root.add(f); feet.push(f)
  }
  return { root, feet, materials: [mat, faceMat] }
}
