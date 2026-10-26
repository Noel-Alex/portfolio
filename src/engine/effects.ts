import * as THREE from 'three'
import { tileCanvas, tileUV } from './textures'
import { mulberry32, valueNoise } from './rng'
import type { Decor, Vec3 } from './world'

export type Updatable = { update: (t: number, dt: number, night: number) => void }

const nearest = (t: THREE.Texture) => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t }

function tileTexture(name: string, repeat = false) {
  const t = nearest(new THREE.CanvasTexture(tileCanvas(name)))
  if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping }
  return t
}

/** Box with every face mapped to one atlas tile. */
export function atlasBox(w: number, h: number, d: number, tile: string, atlas: THREE.Texture, emissive = false) {
  const g = new THREE.BoxGeometry(w, h, d)
  const { u0, u1, v0, v1 } = tileUV(tile)
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0)
  const mat = emissive ? new THREE.MeshBasicMaterial({ map: atlas }) : new THREE.MeshLambertMaterial({ map: atlas })
  return new THREE.Mesh(g, mat)
}

// ---------------------------------------------------------------- sky --------
export function makeSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y*1.6+0.12,0.0,1.0); vec3 c = mix(horizon, top, pow(h,0.7));
        float s = max(dot(normalize(vec3(vDir.x,0.0,vDir.z)), normalize(vec3(sunDir.x,0.0,sunDir.z))),0.0);
        c += glow * pow(s,6.0) * (1.0-h) * 0.9;
        gl_FragColor = vec4(c,1.0); }`,
  })
  const sky = new THREE.Mesh(geo, mat)

  const square = (color: string, inner: string) => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16
    const x = c.getContext('2d')!
    x.fillStyle = color; x.fillRect(2, 2, 12, 12); x.fillStyle = inner; x.fillRect(4, 4, 8, 8)
    return nearest(new THREE.CanvasTexture(c))
  }
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: square('#fff3b0', '#fffbe0'), fog: false, depthWrite: false }))
  sun.scale.set(70, 70, 1)
  const moonCanvas = document.createElement('canvas'); moonCanvas.width = 16; moonCanvas.height = 16
  const mc = moonCanvas.getContext('2d')!
  mc.fillStyle = '#dfe6f2'; mc.fillRect(3, 3, 10, 10); mc.fillStyle = '#b9c3d6'; mc.fillRect(5, 5, 3, 2); mc.fillRect(9, 8, 2, 3)
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: nearest(new THREE.CanvasTexture(moonCanvas)), fog: false, depthWrite: false }))
  moon.scale.set(50, 50, 1)

  const starGeo = new THREE.BufferGeometry()
  const rng = mulberry32(7)
  const pts: number[] = []
  for (let i = 0; i < 900; i++) {
    const th = rng() * Math.PI * 2; const y = rng() * 0.95 + 0.05
    const r = Math.sqrt(1 - y * y)
    pts.push(Math.cos(th) * r * 850, y * 850, Math.sin(th) * r * 850)
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }))
  return { sky, sun, moon, stars, uniforms: mat.uniforms }
}

// ------------------------------------------------------------- clouds --------
export function makeClouds(y: number, density: number, seed: number, opacity: number) {
  const cell = 12
  const n = 34
  const rng = mulberry32(seed)
  const offset = rng() * 100
  const boxes: THREE.Matrix4[] = []
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    if (valueNoise(x * 0.35 + offset, z * 0.35, seed) < density) continue
    boxes.push(new THREE.Matrix4().makeTranslation((x - n / 2) * cell, y, (z - n / 2) * cell))
  }
  const geo = new THREE.BoxGeometry(cell, 4, cell)
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity, depthWrite: false })
  const mesh = new THREE.InstancedMesh(geo, mat, boxes.length)
  boxes.forEach((m, i) => mesh.setMatrixAt(i, m))
  const group = new THREE.Group()
  const span = n * cell
  const twin = mesh.clone()
  twin.position.x = -span
  group.add(mesh, twin)
  return {
    group, mat,
    update(t: number) { group.position.x = (t * 1.6) % span },
  }
}

// ---------------------------------------------------------- particles --------
type Kind = 'firefly' | 'notes' | 'potion' | 'steam' | 'spores' | 'fire' | 'sculk' | 'rain' | 'boom'

function spriteTexture(kind: Kind) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16
  const x = c.getContext('2d')!
  x.fillStyle = '#ffffff'
  if (kind === 'notes') {
    x.fillRect(9, 2, 2, 9); x.fillRect(9, 2, 5, 2); x.fillRect(4, 9, 6, 5); x.fillRect(12, 4, 2, 2)
  } else if (kind === 'rain') {
    x.fillRect(7, 0, 2, 16)
  } else if (kind === 'firefly' || kind === 'fire' || kind === 'sculk') {
    x.globalAlpha = 0.35; x.fillRect(3, 3, 10, 10); x.globalAlpha = 1; x.fillRect(5, 5, 6, 6)
  } else {
    x.fillRect(3, 3, 10, 10)
  }
  return nearest(new THREE.CanvasTexture(c))
}

export class Particles implements Updatable {
  points: THREE.Points
  private pos: Float32Array
  private col: Float32Array
  private size: Float32Array
  private alpha: Float32Array
  private seed: Float32Array
  private kind: Kind
  private origin: THREE.Vector3
  private radius: number
  private count: number
  private rng = mulberry32(5)
  private life: Float32Array
  constructor(kind: Kind, origin: Vec3 | THREE.Vector3, radius: number, count: number, palette: string[], baseSize: number) {
    this.kind = kind
    this.origin = Array.isArray(origin) ? new THREE.Vector3(...origin) : origin
    this.radius = radius
    this.count = count
    this.pos = new Float32Array(count * 3)
    this.col = new Float32Array(count * 3)
    this.size = new Float32Array(count)
    this.alpha = new Float32Array(count)
    this.seed = new Float32Array(count)
    this.life = new Float32Array(count)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      color.set(palette[i % palette.length])
      this.col.set([color.r, color.g, color.b], i * 3)
      this.size[i] = baseSize * (0.7 + this.rng() * 0.6)
      this.seed[i] = this.rng() * 100
      this.life[i] = this.rng()
      this.respawn(i)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1))
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1))
    const additive = kind === 'firefly' || kind === 'fire' || kind === 'sculk' || kind === 'potion' || kind === 'boom'
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: spriteTexture(kind) }, scale: { value: 300 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vCol; varying float vA; uniform float scale;
        void main(){ vCol = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vCol; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); if(t.a < 0.05) discard; gl_FragColor = vec4(vCol * t.rgb, t.a * vA); }`,
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
  }
  private respawn(i: number) {
    const r = this.rng; const o = this.origin; const R = this.radius
    const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * R
    let y = o.y
    if (this.kind === 'firefly') y = o.y + (r() - 0.5) * 6
    if (this.kind === 'rain') y = o.y + r() * 40
    if (this.kind === 'spores') y = o.y + (r() - 0.3) * 5
    this.pos[i * 3] = o.x + Math.cos(a) * d
    this.pos[i * 3 + 1] = y
    this.pos[i * 3 + 2] = o.z + Math.sin(a) * d
    this.life[i] = 0
  }
  setOrigin(v: THREE.Vector3) { this.origin.copy(v) }
  update(t: number, dt: number, night: number) {
    const p = this.pos
    for (let i = 0; i < this.count; i++) {
      const s = this.seed[i]
      const k = i * 3
      this.life[i] += dt
      const life = this.life[i]
      switch (this.kind) {
        case 'firefly': {
          p[k] += Math.sin(t * 0.7 + s) * dt * 0.8
          p[k + 1] += Math.cos(t * 0.9 + s * 2) * dt * 0.5
          p[k + 2] += Math.cos(t * 0.6 + s) * dt * 0.8
          this.alpha[i] = (0.35 + 0.65 * night) * (0.5 + 0.5 * Math.sin(t * 2.4 + s * 3)) ** 2
          if (life > 14) this.respawn(i)
          break
        }
        case 'notes': {
          const L = 2.4
          p[k + 1] += dt * 0.9
          p[k] += Math.sin(s + life * 3) * dt * 0.3
          this.alpha[i] = life < 0.2 ? life * 5 : Math.max(0, 1 - life / L)
          if (life > L + (s % 1.5)) this.respawn(i)
          break
        }
        case 'potion': case 'spores': {
          const L = this.kind === 'potion' ? 3 : 7
          p[k + 1] += dt * (this.kind === 'potion' ? 0.6 : 0.15)
          p[k] += Math.sin(t + s) * dt * 0.25
          p[k + 2] += Math.cos(t * 0.8 + s) * dt * 0.25
          this.alpha[i] = Math.sin(Math.min(1, life / L) * Math.PI) * (this.kind === 'spores' ? 0.8 : 0.9)
          if (life > L) this.respawn(i)
          break
        }
        case 'steam': {
          const L = 3.2
          p[k + 1] += dt * 1.4
          p[k] += dt * 0.35
          this.size[i] = (0.6 + life * 0.6) * 1.2
          this.alpha[i] = Math.max(0, 0.55 * (1 - life / L))
          if (life > L + (s % 1)) this.respawn(i)
          break
        }
        case 'fire': {
          const L = 0.9
          p[k + 1] += dt * 1.1
          this.alpha[i] = Math.max(0, 1 - life / L)
          if (life > L + (s % 0.6)) this.respawn(i)
          break
        }
        case 'rain': {
          p[k + 1] -= dt * 38
          this.alpha[i] = 0.55
          if (p[k + 1] < this.origin.y - 30) { this.respawn(i); p[k + 1] = this.origin.y + 10 + this.rng() * 30 }
          break
        }
        case 'boom': {
          const dir = (i * 2.399) % (Math.PI * 2)
          p[k] += Math.cos(dir) * dt * 6 * Math.max(0, 1 - life)
          p[k + 1] += dt * 3 * Math.max(0, 1 - life)
          p[k + 2] += Math.sin(dir) * dt * 6 * Math.max(0, 1 - life)
          this.size[i] = 1.4 + life * 2
          this.alpha[i] = Math.max(0, 1 - life / 1.2)
          break
        }
        default: break
      }
    }
    const g = this.points.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.alpha.needsUpdate = true
    if (this.kind === 'steam' || this.kind === 'boom') g.attributes.size.needsUpdate = true
  }
}

// ------------------------------------------------------------- decor ---------
const brassMat = () => new THREE.MeshLambertMaterial({ color: '#d9a64b' })
const andesiteMat = () => new THREE.MeshLambertMaterial({ color: '#9a9d98' })
const woodMat = () => new THREE.MeshLambertMaterial({ color: '#8a6a42' })

function cog(radius: number, brass: boolean) {
  const g = new THREE.Group()
  const face = brass ? brassMat() : andesiteMat()
  const hub = woodMat()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.32, 8), face)
  disc.rotation.x = Math.PI / 2
  g.add(disc)
  const teeth = Math.max(8, Math.round(radius * 5))
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, radius * 0.28, 0.3), face)
    t.position.set(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, 0)
    t.rotation.z = a - Math.PI / 2
    g.add(t)
  }
  const axle = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.36, radius * 0.36, 0.6), hub)
  g.add(axle)
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.5, 0.18, 0.4), hub)
    s.rotation.z = (i * Math.PI) / 4
    g.add(s)
  }
  return g
}

export type DecorResult = { objects: THREE.Object3D[]; updates: Updatable[]; lights: THREE.Vector3[] }

export function buildDecor(list: Decor[], atlas: THREE.Texture, reduced: boolean): DecorResult {
  const objects: THREE.Object3D[] = []
  const updates: Updatable[] = []
  const lights: THREE.Vector3[] = []
  const rng = mulberry32(31)
  const add = (o: THREE.Object3D) => { objects.push(o); return o }
  const scale = reduced ? 0.4 : 1

  for (const d of list) {
    switch (d.type) {
      case 'cog': {
        const g = cog(d.radius, !!d.brass)
        g.position.set(...d.pos)
        if (d.axis === 'x') g.rotation.y = Math.PI / 2
        const inner = new THREE.Group(); inner.add(...g.children)
        g.add(inner)
        add(g)
        updates.push({ update: (t) => { inner.rotation.z = t * d.speed } })
        break
      }
      case 'belt': {
        const [ax, ay, az] = d.from; const [bx, , bz] = d.to
        const len = Math.hypot(bx - ax, bz - az) + 1
        const tex = tileTexture('belt', true)
        tex.repeat.set(1, len)
        const mat = new THREE.MeshLambertMaterial({ map: tex })
        const plane = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, len), mat)
        const dir = Math.atan2(bx - ax, bz - az)
        plane.position.set((ax + bx) / 2 + 0.5, ay + 0.07, (az + bz) / 2 + 0.5)
        plane.rotation.y = dir
        add(plane)
        const items: THREE.Mesh[] = []
        const colors = ['#d9a64b', '#c46f4a', '#9a6ff0', '#7cc860']
        const n = Math.max(1, Math.floor(len / 2.2))
        for (let i = 0; i < n; i++) {
          const it = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), new THREE.MeshLambertMaterial({ color: colors[(i + Math.floor(ax)) % colors.length] }))
          add(it); items.push(it)
        }
        updates.push({
          update: (t) => {
            tex.offset.y = -t * 0.8
            items.forEach((it, i) => {
              const f = (((t * 0.8) / len + i / n) % 1)
              it.position.set(ax + 0.5 + (bx - ax) * f, ay + 0.34, az + 0.5 + (bz - az) * f)
              it.rotation.y = t + i
            })
          },
        })
        break
      }
      case 'rail': {
        const pts = d.loop
        const segs: { a: THREE.Vector2; b: THREE.Vector2; len: number }[] = []
        let total = 0
        for (let i = 0; i < pts.length; i++) {
          const a = new THREE.Vector2(pts[i][0] + 0.5, pts[i][1] + 0.5)
          const b = new THREE.Vector2(pts[(i + 1) % pts.length][0] + 0.5, pts[(i + 1) % pts.length][1] + 0.5)
          const len = a.distanceTo(b)
          segs.push({ a, b, len }); total += len
          const tex = tileTexture('rail', true)
          tex.repeat.set(1, len)
          const m = new THREE.Mesh(new THREE.PlaneGeometry(1, len), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 }))
          m.rotation.x = -Math.PI / 2
          m.rotation.z = -Math.atan2(b.x - a.x, b.y - a.y)
          m.position.set((a.x + b.x) / 2, d.y + 0.03, (a.y + b.y) / 2)
          add(m)
        }
        const cart = new THREE.Group()
        const iron = new THREE.MeshLambertMaterial({ color: '#8d9094' })
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.1), iron); base.position.y = 0.35
        const crate = atlasBox(0.7, 0.7, 0.7, 'brass_casing', atlas); crate.position.y = 0.85
        cart.add(base, crate)
        const cart2 = cart.clone()
        add(cart); add(cart2)
        const place = (obj: THREE.Object3D, dist: number) => {
          let s = ((dist % total) + total) % total
          for (const seg of segs) {
            if (s <= seg.len) {
              const f = s / seg.len
              obj.position.set(seg.a.x + (seg.b.x - seg.a.x) * f, d.y, seg.a.y + (seg.b.y - seg.a.y) * f)
              obj.rotation.y = Math.atan2(seg.b.x - seg.a.x, seg.b.y - seg.a.y)
              return
            }
            s -= seg.len
          }
        }
        updates.push({ update: (t) => { place(cart, t * 3.2); place(cart2, t * 3.2 + total / 2) } })
        break
      }
      case 'beam': {
        const h = 260
        const mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { t: { value: 0 }, op: { value: 1 } },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform float t; uniform float op; varying vec2 vUv; void main(){ float s = 0.75 + 0.25*sin(vUv.y*260.0 - t*5.0); float fade = smoothstep(1.0,0.55,vUv.y); gl_FragColor = vec4(vec3(0.62,1.0,0.98)*s, 0.85*fade*op); }`,
        })
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h, 6, 1, true), mat)
        inner.position.set(d.pos[0] + 0.5, d.pos[1] + h / 2 - 0.5, d.pos[2] + 0.5)
        const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, h, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#7ff2ee', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }))
        outer.position.copy(inner.position)
        add(inner); add(outer)
        updates.push({ update: (t) => { mat.uniforms.t.value = t; inner.rotation.y = t * 0.6 } })
        lights.push(new THREE.Vector3(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5))
        break
      }
      case 'portal': {
        const w = d.max[0] - d.min[0]; const dd = d.max[2] - d.min[2]
        const mat = new THREE.ShaderMaterial({
          uniforms: { t: { value: 0 } },
          vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
          fragmentShader: `uniform float t; varying vec3 vW;
            float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
            void main(){ vec3 c = vec3(0.02,0.04,0.06);
              for(int i=0;i<5;i++){ float fi=float(i); vec2 uv = vW.xz*(1.6+fi*0.9) + vec2(t*0.05*(fi+1.0), -t*0.03*fi);
                vec2 cell = floor(uv*6.0); float s = h(cell+fi*13.0); float star = step(0.93, s) * step(0.35, fract(uv.x*6.0)) * step(0.35, fract(uv.y*6.0));
                vec3 tint = mix(vec3(0.15,0.55,0.55), vec3(0.45,0.3,0.85), h(cell*1.7)); c += star*tint*(0.9-fi*0.12); }
              gl_FragColor = vec4(c,1.0); }`,
        })
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, dd), mat)
        m.rotation.x = -Math.PI / 2
        m.position.set(d.min[0] + w / 2, d.min[1], d.min[2] + dd / 2)
        add(m)
        updates.push({ update: (t) => { mat.uniforms.t.value = t } })
        break
      }
      case 'emitter': {
        const palettes: Record<string, string[]> = {
          firefly: ['#d8ff6a', '#b6f04a', '#f2ff9a'],
          notes: ['#5ee6de', '#f25f9a', '#ffd34a', '#7dff9a', '#9a6ff0'],
          potion: ['#c45cff', '#ff6fb5', '#7cf3a0', '#ffd36e'],
          steam: ['#f2f2f2', '#d9d9d9'],
          spores: ['#f5d9ef', '#ffffff', '#d8c8f0'],
          fire: ['#ffb347', '#ff7a2f', '#ffe08a'],
          sculk: ['#2fd6e0'],
        }
        const sizes: Record<string, number> = { firefly: 0.32, notes: 0.5, potion: 0.22, steam: 1, spores: 0.12, fire: 0.3, sculk: 0.2 }
        const p = new Particles(d.kind, d.pos, d.radius, Math.max(4, Math.round(d.count * scale)), palettes[d.kind], sizes[d.kind])
        add(p.points); updates.push(p)
        break
      }
      case 'lantern': {
        const g = new THREE.Group()
        if (d.post) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 0.22), woodMat()); post.position.y = 0.65; g.add(post)
        }
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), new THREE.MeshLambertMaterial({ color: '#3a3a40' }))
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.44), new THREE.MeshBasicMaterial({ color: '#ffcf6b' }))
        const glow2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.32), new THREE.MeshBasicMaterial({ color: '#ffcf6b' }))
        const y = d.post ? 1.55 : 0.25
        frame.position.y = glow.position.y = glow2.position.y = y
        g.add(frame, glow, glow2)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        lights.push(new THREE.Vector3(d.pos[0] + 0.5, d.pos[1] + y, d.pos[2] + 0.5))
        break
      }
      case 'cable': {
        const mat = new THREE.MeshBasicMaterial({ color: '#8a5cf6' })
        const core = new THREE.MeshBasicMaterial({ color: '#d9c4ff' })
        for (let i = 0; i < d.points.length - 1; i++) {
          const a = new THREE.Vector3(...d.points[i]); const b = new THREE.Vector3(...d.points[i + 1])
          const len = a.distanceTo(b)
          const seg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, len + 0.26), mat)
          seg.position.copy(a).add(b).multiplyScalar(0.5)
          seg.lookAt(b)
          add(seg)
          const pulse = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), core)
          add(pulse)
          updates.push({ update: (t) => { const f = (t * 0.6 + i * 0.3) % 1; pulse.position.lerpVectors(a, b, f); pulse.lookAt(b) } })
        }
        break
      }
      case 'banner': {
        const c = document.createElement('canvas'); c.width = 12; c.height = 24
        const x = c.getContext('2d')!
        x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, 12, 24)
        d.colors.forEach((col, i) => { x.fillStyle = col; x.fillRect(2 + (i % 2) * 4, 5 + Math.floor(i / 2) * 5, 4, 4) })
        x.fillStyle = '#3a3a3a'; x.fillRect(0, 22, 12, 2)
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshLambertMaterial({ map: nearest(new THREE.CanvasTexture(c)), side: THREE.DoubleSide }))
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3, 0.14), woodMat())
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), woodMat())
        const g = new THREE.Group()
        pole.position.y = 1.5; bar.position.set(0, 2.9, 0.1)
        const hinge = new THREE.Group(); hinge.position.set(0, 2.85, 0.12)
        cloth.position.y = -1; hinge.add(cloth)
        g.add(pole, bar, hinge)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        g.rotation.y = d.rot
        add(g)
        updates.push({ update: (t) => { hinge.rotation.x = Math.sin(t * 1.3) * 0.12 } })
        break
      }
      case 'brewing': {
        const g = new THREE.Group()
        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), new THREE.MeshLambertMaterial({ color: '#7a6a52' }))
        rod.position.y = 0.45
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: '#5a5a5a' }))
        base.position.y = 0.05
        g.add(rod, base)
        ;['#c45cff', '#ff6fb5', '#7cf3a0'].forEach((col, i) => {
          const a = (i / 3) * Math.PI * 2
          const bottle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshBasicMaterial({ color: col }))
          bottle.position.set(Math.cos(a) * 0.3, 0.25, Math.sin(a) * 0.3)
          g.add(bottle)
        })
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        break
      }
      case 'cauldron': {
        const g = new THREE.Group()
        const iron = new THREE.MeshLambertMaterial({ color: '#4a4a4f' })
        for (const [x, z, w, dd] of [[0, -0.42, 1, 0.16], [0, 0.42, 1, 0.16], [-0.42, 0, 0.16, 1], [0.42, 0, 0.16, 1]]) {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, dd), iron); wall.position.set(x, 0.5, z); g.add(wall)
        }
        const liquid = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), new THREE.MeshBasicMaterial({ color: '#a24fe0' }))
        liquid.position.y = 0.8
        g.add(liquid)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        break
      }
      case 'campfire': {
        const g = new THREE.Group()
        const log = new THREE.MeshLambertMaterial({ color: '#5a4428' })
        for (let i = 0; i < 4; i++) {
          const l = new THREE.Mesh(new THREE.BoxGeometry(1, 0.22, 0.22), log)
          l.rotation.y = (i * Math.PI) / 4; l.position.y = 0.12 + (i % 2) * 0.18
          g.add(l)
        }
        const ember = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), new THREE.MeshBasicMaterial({ color: '#ff9b38' }))
        ember.position.y = 0.18
        g.add(ember)
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 4), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.85 }))
        flame.position.y = 0.65
        g.add(flame)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        const p = new Particles('fire', [d.pos[0] + 0.5, d.pos[1] + 0.5, d.pos[2] + 0.5], 0.3, Math.round(18 * scale) + 4, ['#ffb347', '#ff7a2f', '#ffe08a'], 0.22)
        add(p.points); updates.push(p)
        updates.push({ update: (t) => { flame.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 7 + 1) * 0.15, 1 + Math.cos(t * 8) * 0.08); flame.rotation.y = t * 1.4 } })
        lights.push(new THREE.Vector3(d.pos[0] + 0.5, d.pos[1] + 0.6, d.pos[2] + 0.5))
        break
      }
      case 'bell': {
        const g = new THREE.Group()
        const wood = woodMat()
        for (const x of [-0.6, 0.6]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), wood); post.position.set(x, 1, 0); g.add(post) }
        const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.2), wood); beam.position.y = 2; g.add(beam)
        const bell = new THREE.Group(); bell.position.y = 1.9
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.6, 8), new THREE.MeshLambertMaterial({ color: '#f2cf3f' }))
        body.position.y = -0.4
        bell.add(body); g.add(bell)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        updates.push({ update: (t) => { bell.rotation.x = Math.sin(t * 2) * 0.08 } })
        break
      }
      case 'lectern': {
        const g = new THREE.Group()
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), woodMat()); stand.position.y = 0.45
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.7), woodMat()); top.position.y = 0.95; top.rotation.x = -0.35
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), new THREE.MeshLambertMaterial({ color: '#f1e6c8' })); book.position.y = 1.03; book.rotation.x = -0.35
        g.add(stand, top, book)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        g.rotation.y = d.rot
        add(g)
        break
      }
      case 'chest': {
        const g = new THREE.Group()
        const body = atlasBox(0.88, 0.62, 0.88, 'oak_planks', atlas); body.position.y = 0.31
        const lid = atlasBox(0.88, 0.26, 0.88, 'dark_planks', atlas); lid.position.y = 0.75
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.06), new THREE.MeshLambertMaterial({ color: '#c8c8c8' })); latch.position.set(0, 0.62, 0.46)
        g.add(body, lid, latch)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        break
      }
      case 'bed': {
        const g = new THREE.Group()
        const red = atlasBox(1, 0.5, 1.4, 'red_wool', atlas); red.position.set(0, 0.3, -0.3)
        const white = atlasBox(1, 0.5, 0.6, 'white_wool', atlas); white.position.set(0, 0.3, 0.7)
        const legs = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 2), woodMat()); legs.position.y = 0.05
        g.add(red, white, legs)
        g.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        add(g)
        break
      }
      case 'waterfall': {
        const tex = tileTexture('water', true)
        const h = d.top - d.bottom
        tex.repeat.set((d.z1 - d.z0) / 2, h / 4)
        // the fall dissolves into spray instead of ending in a hard edge mid-air
        const fade = document.createElement('canvas'); fade.width = 1; fade.height = 64
        const fc = fade.getContext('2d')!
        const g = fc.createLinearGradient(0, 0, 0, 64)
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#ffffff'); g.addColorStop(1, '#000000')
        fc.fillStyle = g; fc.fillRect(0, 0, 1, 64)
        const alpha = new THREE.CanvasTexture(fade)
        const mat = new THREE.MeshBasicMaterial({ map: tex, alphaMap: alpha, transparent: true, opacity: 0.85, depthWrite: false })
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, d.z1 - d.z0), mat)
        m.position.set(d.x + 0.45, d.bottom + h / 2, d.z0 + (d.z1 - d.z0) / 2)
        add(m)
        const mist = new Particles('steam', [d.x + 1, d.bottom + 2, d.z0 + 1], 1.4, Math.round(20 * scale) + 4, ['#ffffff', '#e8f4ff'], 1.6)
        add(mist.points); updates.push(mist)
        updates.push({ update: (t) => { tex.offset.y = t * 1.6 } })
        break
      }
      default: break
    }
  }
  void rng
  return { objects, updates, lights }
}

export function glowSprites(points: THREE.Vector3[]) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,214,130,0.85)'); g.addColorStop(0.35, 'rgba(255,190,90,0.35)'); g.addColorStop(1, 'rgba(255,170,60,0)')
  x.fillStyle = g; x.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })
  const group = new THREE.Group()
  for (const p of points) { const s = new THREE.Sprite(mat); s.position.copy(p); s.scale.set(4.5, 4.5, 1); group.add(s) }
  return { group, mat }
}
