import * as THREE from 'three'
import { buildAtlas } from './textures'
import { generateWorld, C, Y0, type LandmarkId, type Landmark, type VoxelWorld } from './world'
import { meshWorld } from './mesher'
import { buildDecor, glowSprites, makeClouds, makeSky, Particles, type Updatable } from './effects'
import { makeCreeper, makePlayer, makeSpider, makeVillager, type Biped } from './models'
import { BLOCKS, SOLID } from './blocks'
import { findPath, settle, smooth, standable, type Cell } from './nav'

export type Quality = 'fancy' | 'fast'
export type Mode = 'title' | 'world'
export type PickId = LandmarkId | 'player'
export type View = 'third' | 'first'

type Listener = {
  hover?: (id: PickId | null) => void
  select?: (id: PickId) => void
  arrive?: (id: LandmarkId) => void
  depart?: () => void
  event?: (name: 'creeper' | 'void' | 'walk' | 'jump') => void
  /** Pointer lock ended without the page asking (the visitor pressed Esc). */
  unlock?: () => void
}

type Rig = { target: THREE.Vector3; yaw: number; pitch: number; dist: number }

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)
const lerpAngle = (a: number, b: number, t: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t }

const SKY = {
  day: { top: new THREE.Color('#4f8de8'), horizon: new THREE.Color('#a9d0ff'), glow: new THREE.Color('#fff2d0'), tint: new THREE.Color('#ffffff') },
  gold: { top: new THREE.Color('#3b5fae'), horizon: new THREE.Color('#ffb48a'), glow: new THREE.Color('#ff8a4a'), tint: new THREE.Color('#ffe0c4') },
  night: { top: new THREE.Color('#03060f'), horizon: new THREE.Color('#121a38'), glow: new THREE.Color('#1b2450'), tint: new THREE.Color('#46547f') },
}

export class Engine {
  readonly world: VoxelWorld
  readonly landmarks: Landmark[]
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000)
  private canvas: HTMLCanvasElement
  private listeners: Listener[] = []
  private updates: Updatable[] = []
  private clock = new THREE.Clock()
  private time = 0
  private dayTime = 0.035
  private cycle = true
  mode: Mode = 'title'
  private reduced: boolean
  private quality: Quality
  private rig: Rig = { target: new THREE.Vector3(C, Y0 + 2, C), yaw: 0.6, pitch: 0.22, dist: 96 }
  private goal: Rig = { target: new THREE.Vector3(C, Y0 + 2, C), yaw: 0.6, pitch: 0.22, dist: 96 }
  private flight: { from: Rig; to: Rig; start: number; dur: number } | null = null
  private player: Biped
  private playerPos = new THREE.Vector3()
  private playerYaw = 0
  private walkPhase = 0
  private path: THREE.Vector3[] = []
  view: View = 'third'
  /** First-person look direction; the body faces the same way. */
  private look = { yaw: 0, pitch: 0 }
  private lookGoal: { yaw: number; pitch: number } | null = null
  private stick = { x: 0, y: 0 }
  private locked = false
  private releasing = false
  private camClip = 110
  private bob = 0
  private pathTarget: LandmarkId | null = null
  private at: LandmarkId | null = 'spawn'
  private vy = 0
  private keys = new Set<string>()
  keyboardEnabled = false
  private hovered: PickId | null = null
  private outline: THREE.LineSegments
  private boxes = new Map<PickId, THREE.Box3>()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2(-9, -9)
  private drag: { x: number; y: number; moved: number; id: number } | null = null
  private pinch = new Map<number, { x: number; y: number }>()
  private pinchDist = 0
  private sky: ReturnType<typeof makeSky>
  private litMat: THREE.MeshBasicMaterial
  private waterMat: THREE.MeshBasicMaterial
  private lambertLights: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight }
  private glow: ReturnType<typeof glowSprites>
  private litMesh: THREE.Mesh
  private clouds: ReturnType<typeof makeClouds>[] = []
  private rain: Particles | null = null
  private creeper: { model: ReturnType<typeof makeCreeper>; start: number } | null = null
  private shake = 0
  private villagers: { m: Biped; base: number }[] = []
  private spider: ReturnType<typeof makeSpider> | null = null
  private fps = 60
  private resizeObserver: ResizeObserver
  private disposed = false
  private lookYaw = 0

  constructor(canvas: HTMLCanvasElement, opts: { reduced: boolean; quality: Quality }) {
    this.canvas = canvas
    this.reduced = opts.reduced
    this.quality = opts.quality
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.applyQuality()

    const { world, decor, landmarks } = generateWorld()
    this.world = world
    this.landmarks = landmarks

    const atlas = new THREE.CanvasTexture(buildAtlas())
    atlas.magFilter = THREE.NearestFilter
    atlas.minFilter = THREE.NearestMipmapLinearFilter
    atlas.colorSpace = THREE.SRGBColorSpace
    atlas.anisotropy = 4

    const meshes = meshWorld(world)
    this.litMat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5 })
    this.litMesh = new THREE.Mesh(meshes.lit, this.litMat)
    const glowMesh = new THREE.Mesh(meshes.glow, new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5 }))
    const waterTex = new THREE.CanvasTexture(buildWaterCanvas())
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
    waterTex.magFilter = THREE.NearestFilter
    waterTex.colorSpace = THREE.SRGBColorSpace
    this.waterMat = new THREE.MeshBasicMaterial({ map: waterTex, vertexColors: true, transparent: true, opacity: 0.84, depthWrite: false })
    const waterMesh = new THREE.Mesh(meshes.water, this.waterMat)
    waterMesh.renderOrder = 2
    this.scene.add(this.litMesh, glowMesh, waterMesh)
    this.updates.push({ update: (t) => { waterTex.offset.set(t * 0.04, t * 0.11) } })

    this.sky = makeSky()
    this.scene.add(this.sky.sky, this.sky.sun, this.sky.moon, this.sky.stars)
    this.scene.fog = new THREE.Fog('#a9d0ff', 150, 460)

    const hemi = new THREE.HemisphereLight('#ffffff', '#6b5a48', 1.6)
    const sun = new THREE.DirectionalLight('#ffffff', 1.4)
    sun.position.set(40, 80, 30)
    this.scene.add(hemi, sun)
    this.lambertLights = { hemi, sun }

    const built = buildDecor(decor, atlas, this.reduced || this.quality === 'fast')
    for (const o of built.objects) this.scene.add(o)
    this.updates.push(...built.updates)
    this.glow = glowSprites(built.lights)
    this.scene.add(this.glow.group)

    for (const d of decor) {
      if (d.type === 'villager') {
        const v = makeVillager(d.robe)
        v.root.position.set(d.pos[0] + 0.5, d.pos[1], d.pos[2] + 0.5)
        v.root.rotation.y = d.rot
        this.scene.add(v.root)
        this.villagers.push({ m: v, base: d.rot })
      }
      if (d.type === 'spider') {
        this.spider = makeSpider()
        this.spider.root.position.set(...d.pos)
        this.spider.root.rotation.y = Math.PI / 2
        this.scene.add(this.spider.root)
      }
    }

    if (this.quality === 'fancy') {
      this.clouds.push(makeClouds(Y0 + 34, 0.62, 3, 0.82))
      this.clouds.push(makeClouds(Y0 - 52, 0.4, 9, 0.95))
      for (const c of this.clouds) { c.group.position.z = C; this.scene.add(c.group) }
    }

    this.player = makePlayer()
    const spawn = this.landmark('spawn')
    this.playerPos.set(spawn.door[0] + 0.5, spawn.door[1], spawn.door[2] + 0.5)
    this.playerYaw = Math.PI
    this.player.root.position.copy(this.playerPos)
    this.scene.add(this.player.root)

    for (const l of landmarks) this.boxes.set(l.id, new THREE.Box3(new THREE.Vector3(...l.min), new THREE.Vector3(l.max[0] + 1, l.max[1] + 1, l.max[2] + 1)))
    this.outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.55 }))
    this.outline.visible = false
    this.scene.add(this.outline)

    this.bindInput()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    this.resize()
    this.applySky()
    this.renderer.setAnimationLoop(() => this.frame())
  }

  // ------------------------------------------------------------- public API
  on(l: Listener) { this.listeners.push(l); return () => { this.listeners = this.listeners.filter(x => x !== l) } }
  private emit<K extends keyof Listener>(k: K, ...args: Parameters<NonNullable<Listener[K]>>) {
    for (const l of this.listeners) (l[k] as ((...a: unknown[]) => void) | undefined)?.(...args)
  }

  landmark(id: LandmarkId) { return this.landmarks.find(l => l.id === id)! }

  setReduced(reduced: boolean) { this.reduced = reduced }
  setQuality(q: Quality) { this.quality = q; this.applyQuality(); for (const c of this.clouds) c.group.visible = q === 'fancy' }
  setCycle(on: boolean) { this.cycle = on }
  setTime(t: number) { this.dayTime = ((t % 1) + 1) % 1; this.applySky() }
  getTime() { return this.dayTime }

  setWeather(kind: 'clear' | 'rain') {
    if (kind === 'rain' && !this.rain) {
      this.rain = new Particles('rain', this.rig.target.clone(), 26, this.quality === 'fast' ? 250 : 700, ['#9fb8e8', '#c2d4f2'], 0.5)
      this.scene.add(this.rain.points)
    }
    if (kind === 'clear' && this.rain) { this.scene.remove(this.rain.points); this.rain = null }
    this.applySky()
  }

  setMode(mode: Mode) {
    if (mode === this.mode) return
    this.mode = mode
    if (mode === 'world') {
      if (this.view === 'first') { this.look = { yaw: this.playerYaw, pitch: -0.08 }; this.flyTo(this.eyeRig(), this.reduced ? 0 : 2.6) }
      else this.flyTo(this.followRig(0.32, 13, this.playerYaw + 0.6), this.reduced ? 0 : 2.6)
    } else {
      this.releasePointer()
      if (this.view === 'first') { this.rig = this.eyeRig(); this.goal = cloneRig(this.rig) }
      this.flyTo({ target: new THREE.Vector3(C, Y0 + 2, C), yaw: this.rig.yaw, pitch: 0.22, dist: 96 }, this.reduced ? 0 : 1.8)
      this.setHover(null)
    }
  }

  /** Switch between the over-the-shoulder camera and the player's own eyes. */
  setView(view: View) {
    if (view === this.view) return
    this.view = view
    if (this.mode !== 'world') return
    if (view === 'first') {
      this.look = { yaw: this.playerYaw, pitch: -0.08 }
      this.flyTo(this.eyeRig(), this.reduced ? 0 : 0.7)
    } else {
      this.releasePointer()
      this.rig = this.eyeRig(); this.goal = cloneRig(this.rig)
      this.flyTo(this.followRig(0.32, 13, this.look.yaw + Math.PI), this.reduced ? 0 : 0.8)
    }
  }

  /** Analog movement from the touch joystick: x right, y forward, each -1..1. */
  setStick(x: number, y: number) { this.stick.x = x; this.stick.y = y }

  /** Capture the mouse for first-person look. Must be called from a click. */
  lockPointer() {
    if (this.view !== 'first' || this.mode !== 'world' || this.locked || matchMedia('(pointer: coarse)').matches) return
    const p = this.canvas.requestPointerLock?.() as Promise<void> | undefined
    p?.catch?.(() => { /* denied or too soon after an unlock */ })
  }

  releasePointer() {
    if (!this.locked) return
    this.releasing = true
    document.exitPointerLock?.()
  }

  get pointerLocked() { return this.locked }

  /** Walk the player to a landmark, routing around anything in the way. */
  travelTo(id: LandmarkId) {
    const target = this.landmark(id)
    if (this.at === id && this.path.length === 0) { this.arrive(id); return }
    if (!this.walkTo({ x: target.door[0], y: target.door[1], z: target.door[2] })) { this.teleport(id); return }
    this.pathTarget = id
    if (this.mode === 'world' && this.view === 'third') this.goal = this.followRig(this.goal.pitch, Math.max(14, Math.min(this.goal.dist, 24)), this.goal.yaw)
    this.emit('event', 'walk')
  }

  teleport(id: LandmarkId) {
    const l = this.landmark(id)
    this.path = []
    this.vy = 0
    this.playerPos.set(l.door[0] + 0.5, l.door[1], l.door[2] + 0.5)
    this.arrive(id)
    if (this.mode === 'world' && this.view === 'third') this.flyTo({ ...this.frameRig(l) }, 0)
  }

  /** Plan a route to a cell. Returns false when the player can't get anywhere useful. */
  private walkTo(goal: Cell) {
    const p = this.playerPos
    const fx = Math.floor(p.x); const fz = Math.floor(p.z)
    const fy = settle(this.world, fx, fz, Math.floor(p.y + 0.01), 2) ?? Math.floor(p.y + 0.01)
    const from = { x: fx, y: fy, z: fz }
    const cells = smooth(this.world, from, findPath(this.world, from, goal))
    if (!cells.length) return Math.abs(fx - goal.x) + Math.abs(fz - goal.z) < 2
    this.path = cells.map(c => new THREE.Vector3(c.x + 0.5, c.y, c.z + 0.5))
    this.pathTarget = null
    if (this.at) { this.at = null; this.emit('depart') }
    return true
  }

  /** Frame a landmark without walking (used by mods list hover). */
  peek(id: LandmarkId | null) {
    if (this.mode !== 'title') return
    if (!id) { this.flyTo({ target: new THREE.Vector3(C, Y0 + 2, C), yaw: this.rig.yaw, pitch: 0.22, dist: 96 }, this.reduced ? 0 : 1.2); return }
    this.flyTo(this.frameRig(this.landmark(id)), this.reduced ? 0 : 1.4)
  }

  summonCreeper() {
    if (this.creeper) return
    const model = makeCreeper()
    const back = new THREE.Vector3(Math.sin(this.playerYaw + Math.PI), 0, Math.cos(this.playerYaw + Math.PI)).multiplyScalar(7)
    const p = this.playerPos.clone().add(back)
    p.y = this.world.ground(Math.floor(p.x), Math.floor(p.z)) + 1
    model.root.position.copy(p)
    this.scene.add(model.root)
    this.creeper = { model, start: this.time }
  }

  screenPos(id: PickId, out: { x: number; y: number; visible: boolean }) {
    const v = new THREE.Vector3()
    if (id === 'player') v.copy(this.playerPos).add(new THREE.Vector3(0, 2.2, 0))
    else { const b = this.boxes.get(id)!; b.getCenter(v); v.y = b.max.y + 0.6 }
    v.project(this.camera)
    out.visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2
    out.x = (v.x * 0.5 + 0.5) * this.canvas.clientWidth
    out.y = (-v.y * 0.5 + 0.5) * this.canvas.clientHeight
    return out
  }

  debug() {
    const p = this.playerPos
    const dirs = ['south', 'west', 'north', 'east']
    const facing = dirs[((Math.round(this.playerYaw / (Math.PI / 2)) % 4) + 4) % 4]
    return { fps: Math.round(this.fps), x: p.x - C, y: p.y, z: p.z - C, facing, at: this.at, time: this.dayTime, mode: this.mode }
  }

  dispose() {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.unbind?.()
    this.renderer.dispose()
  }

  // ----------------------------------------------------------- internals
  private applyQuality() {
    const dpr = window.devicePixelRatio || 1
    this.renderer.setPixelRatio(this.quality === 'fast' ? Math.min(dpr, 1) : Math.min(dpr, 1.75))
    this.resize?.()
  }

  private resize() {
    if (!this.renderer) return
    const parent = this.canvas.parentElement ?? this.canvas
    const w = parent.clientWidth; const h = parent.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = w < 640 ? 68 : 55
    this.camera.updateProjectionMatrix()
  }

  private frameRig(l: Landmark): Rig {
    const b = this.boxes.get(l.id)!
    const c = new THREE.Vector3(); b.getCenter(c)
    c.y = b.min.y + 2
    return { target: c, yaw: l.yaw, pitch: l.pitch, dist: l.dist }
  }

  private followRig(pitch: number, dist: number, yaw: number): Rig {
    return { target: this.playerPos.clone().add(new THREE.Vector3(0, 1.4, 0)), yaw, pitch, dist }
  }

  private eye() { return this.playerPos.clone().add(new THREE.Vector3(0, 1.62 + this.bob, 0)) }
  private forward() { const { yaw, pitch } = this.look; return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)) }

  /** A rig whose camera sits at the player's eyes, so flights can end exactly in first person. */
  private eyeRig(): Rig {
    const d = 0.05
    return { target: this.eye().addScaledVector(this.forward(), d), yaw: this.look.yaw + Math.PI, pitch: -this.look.pitch, dist: d }
  }

  private get firstPerson() { return this.mode === 'world' && this.view === 'first' && (!this.flight || this.rig.dist < 2.5) }

  private flyTo(to: Rig, dur: number) {
    if (dur <= 0) { this.rig = cloneRig(to); this.goal = cloneRig(to); this.flight = null; return }
    const from = cloneRig(this.rig)
    to = cloneRig(to)
    let d = (to.yaw - from.yaw) % (Math.PI * 2)
    if (d > Math.PI) d -= Math.PI * 2
    if (d < -Math.PI) d += Math.PI * 2
    to.yaw = from.yaw + d
    this.flight = { from, to, start: this.time, dur }
    this.goal = cloneRig(to)
  }

  private arrive(id: LandmarkId) {
    this.at = id
    this.path = []
    this.pathTarget = null
    const l = this.landmark(id)
    const c = new THREE.Vector3(); this.boxes.get(id)!.getCenter(c)
    this.playerYaw = Math.atan2(c.x - this.playerPos.x, c.z - this.playerPos.z)
    if (this.mode === 'world' && this.view === 'first') {
      const eye = this.eye()
      this.lookGoal = { yaw: this.playerYaw, pitch: THREE.MathUtils.clamp(Math.atan2(c.y - eye.y, Math.hypot(c.x - eye.x, c.z - eye.z)), -0.5, 0.5) }
    } else if (this.mode === 'world') {
      const f = this.frameRig(l)
      f.target.lerp(this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0.35)
      this.flyTo(f, this.reduced ? 0 : 1.1)
    }
    this.emit('arrive', id)
  }

  private setHover(id: PickId | null) {
    if (id === this.hovered) return
    this.hovered = id
    if (id && id !== 'player') {
      const b = this.boxes.get(id)!
      const size = new THREE.Vector3(); const c = new THREE.Vector3()
      b.getSize(size); b.getCenter(c)
      this.outline.scale.copy(size).addScalar(0.08)
      this.outline.position.copy(c)
      this.outline.visible = true
    } else this.outline.visible = false
    this.canvas.style.cursor = id ? 'pointer' : this.mode === 'world' ? 'grab' : 'default'
    this.emit('hover', id)
  }

  /**
   * What the pointer (or the crosshair) is on. A build counts only where the ray
   * actually lands on it: on its blocks, or on the ground inside its footprint.
   * Nested builds win over the ones around them (the spider inside the maze).
   */
  private pick(at?: THREE.Vector2): PickId | null {
    this.raycaster.setFromCamera(at ?? (this.firstPerson ? new THREE.Vector2(0, 0) : this.pointer), this.camera)
    this.raycaster.far = this.firstPerson ? 48 : Infinity
    const ray = this.raycaster.ray
    const terrain = this.raycaster.intersectObject(this.litMesh, false)[0]
    const tDist = terrain?.distance ?? this.raycaster.far
    const hit = new THREE.Vector3()
    if (!this.firstPerson) {
      const pb = new THREE.Box3(this.playerPos.clone().add(new THREE.Vector3(-0.4, 0, -0.4)), this.playerPos.clone().add(new THREE.Vector3(0.4, 1.9, 0.4)))
      if (ray.intersectBox(pb, hit) && hit.distanceTo(ray.origin) < tDist + 0.5) return 'player'
    }
    let best: { id: PickId; vol: number } | null = null
    const size = new THREE.Vector3()
    for (const [id, box] of this.boxes) {
      if (id === 'spawn') continue
      const landsInside = terrain && box.clone().expandByScalar(0.3).containsPoint(terrain.point)
      const front = ray.intersectBox(box, hit) && hit.distanceTo(ray.origin) < tDist - 0.2
      if (!landsInside && !front) continue
      box.getSize(size)
      const vol = size.x * size.y * size.z
      if (!best || vol < best.vol) best = { id, vol }
    }
    return best?.id ?? null
  }

  private groundClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    this.raycaster.far = Infinity
    const hit = this.raycaster.intersectObject(this.litMesh, false)[0]
    if (!hit?.face) return
    // the block we hit, then the air cell on its clicked face
    const n = hit.face.normal
    const b = hit.point.clone().addScaledVector(n, -0.01).floor()
    const x = b.x + Math.round(n.x); const z = b.z + Math.round(n.z)
    const y = settle(this.world, x, z, b.y + Math.max(0, Math.round(n.y)), 1)
    if (y === null) return
    if (this.walkTo({ x, y, z })) this.emit('event', 'walk')
  }

  private unbind: (() => void) | null = null
  private bindInput() {
    const c = this.canvas
    const toPointer = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const down = (e: PointerEvent) => {
      if (this.mode !== 'world') return
      if (this.view === 'first' && e.pointerType === 'mouse') {
        // first click captures the mouse; once captured, clicks act on whatever the crosshair is on
        if (!this.locked) { this.lockPointer(); return }
        const id = this.pick()
        if (id && id !== 'player') this.emit('select', id)
        return
      }
      c.setPointerCapture(e.pointerId)
      this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.pinch.size === 2) { const [a, b] = [...this.pinch.values()]; this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y); this.drag = null; return }
      this.drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }
      c.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (this.locked) {
        this.look.yaw -= e.movementX * 0.0024
        this.look.pitch = THREE.MathUtils.clamp(this.look.pitch - e.movementY * 0.0024, -1.5, 1.5)
        this.lookGoal = null
        return
      }
      toPointer(e)
      if (this.pinch.has(e.pointerId)) this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.pinch.size === 2) {
        const [a, b] = [...this.pinch.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (this.pinchDist) this.goal.dist = THREE.MathUtils.clamp(this.goal.dist * (this.pinchDist / d), 7, 110)
        this.pinchDist = d
        return
      }
      if (this.drag && this.drag.id === e.pointerId) {
        const dx = e.clientX - this.drag.x; const dy = e.clientY - this.drag.y
        this.drag.moved += Math.abs(dx) + Math.abs(dy)
        this.drag.x = e.clientX; this.drag.y = e.clientY
        if (this.view === 'first') {
          // touch look: drag the view the way a phone game does
          this.look.yaw += dx * 0.006
          this.look.pitch = THREE.MathUtils.clamp(this.look.pitch + dy * 0.005, -1.4, 1.4)
          this.lookGoal = null
          return
        }
        this.goal.yaw -= dx * 0.0065
        this.goal.pitch = THREE.MathUtils.clamp(this.goal.pitch + dy * 0.005, 0.06, 1.35)
        this.flight = null
      }
    }
    const up = (e: PointerEvent) => {
      this.pinch.delete(e.pointerId)
      if (this.pinch.size < 2) this.pinchDist = 0
      const d = this.drag
      this.drag = null
      if (this.mode !== 'world') return
      c.style.cursor = this.hovered ? 'pointer' : 'grab'
      if (d && d.id === e.pointerId && d.moved < 6) {
        toPointer(e)
        if (this.view === 'first') {
          // a tap in first person acts on what was tapped, through the camera's own eyes
          const id = this.pick(this.pointer)
          if (id && id !== 'player') this.emit('select', id)
          return
        }
        const id = this.pick()
        if (id) this.emit('select', id)
        else this.groundClick()
      }
    }
    const wheel = (e: WheelEvent) => {
      if (this.mode !== 'world' || this.view === 'first') return
      e.preventDefault()
      this.goal.dist = THREE.MathUtils.clamp(this.goal.dist * Math.pow(1.0015, e.deltaY), 7, 110)
      this.flight = null
    }
    const leave = () => { this.pointer.set(-9, -9); if (!this.drag) this.setHover(null) }
    const kd = (e: KeyboardEvent) => {
      if (!this.keyboardEnabled || this.mode !== 'world') return
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) {
        if (k === ' ' || k.startsWith('arrow')) e.preventDefault()
        this.keys.add(k)
      }
    }
    const ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase())
    const blur = () => this.keys.clear()
    const lockChange = () => {
      const was = this.locked
      this.locked = document.pointerLockElement === c
      if (was && !this.locked && !this.releasing) { this.keys.clear(); this.emit('unlock') }
      if (!this.locked) this.releasing = false
    }
    document.addEventListener('pointerlockchange', lockChange)
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointermove', move)
    c.addEventListener('pointerup', up)
    c.addEventListener('pointercancel', up)
    c.addEventListener('pointerleave', leave)
    c.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    this.unbind = () => {
      c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up)
      c.removeEventListener('pointercancel', up); c.removeEventListener('pointerleave', leave); c.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur)
      document.removeEventListener('pointerlockchange', lockChange)
    }
  }

  private solidAt(x: number, y: number, z: number) { return SOLID[this.world.get(Math.floor(x), Math.floor(y), Math.floor(z))] === 1 }

  private stepPlayer(dt: number) {
    let moving = false
    let speed = 0
    const p = this.playerPos
    const fp = this.view === 'first'
    // keyboard or joystick walking, relative to where the camera looks
    let ix = this.stick.x; let iz = -this.stick.y
    if (this.keys.has('w') || this.keys.has('arrowup')) iz -= 1
    if (this.keys.has('s') || this.keys.has('arrowdown')) iz += 1
    if (this.keys.has('a') || this.keys.has('arrowleft')) ix -= 1
    if (this.keys.has('d') || this.keys.has('arrowright')) ix += 1
    const inWater = this.wetAt(p.x, p.y + 0.3, p.z)
    let blocked = false
    if (Math.abs(ix) > 0.08 || Math.abs(iz) > 0.08) {
      if (this.path.length) { this.path = []; this.pathTarget = null }
      if (this.at) { this.at = null; this.emit('depart') }
      // forward is where the camera faces: the look direction in first person, away from the camera in third
      const yaw = fp ? this.look.yaw : this.rig.yaw + Math.PI
      const fx = Math.sin(yaw); const fz = Math.cos(yaw)
      const rx = -Math.cos(yaw); const rz = Math.sin(yaw)
      let mx = fx * -iz + rx * ix; let mz = fz * -iz + rz * ix
      const amount = Math.min(1, Math.hypot(mx, mz)); const len = Math.hypot(mx, mz); mx /= len; mz /= len
      speed = (this.keys.has('shift') ? 8.4 : 5.6) * amount * (inWater ? 0.6 : 1)
      blocked = !this.moveBy(mx * speed * dt, mz * speed * dt)
      if (!fp) this.playerYaw = lerpAngle(this.playerYaw, Math.atan2(mx, mz), Math.min(1, dt * 12))
      moving = true
    } else if (this.path.length) {
      const next = this.path[0]
      const dx = next.x - p.x; const dz = next.z - p.z
      const d = Math.hypot(dx, dz)
      const remaining = this.path.reduce((acc, w, i) => acc + (i === 0 ? d : w.distanceTo(this.path[i - 1])), 0)
      speed = fp ? Math.min(8, Math.max(5.6, remaining / 3)) : Math.max(7, Math.min(16, remaining / 2.6))
      const step = speed * dt
      if (d <= step) {
        p.x = next.x; p.z = next.z
        this.path.shift()
        if (!this.path.length) { if (this.pathTarget) this.arrive(this.pathTarget) }
      } else {
        p.x += (dx / d) * step; p.z += (dz / d) * step
        this.playerYaw = lerpAngle(this.playerYaw, Math.atan2(dx, dz), Math.min(1, dt * 10))
        if (fp) this.lookGoal = { yaw: Math.atan2(dx, dz), pitch: -0.12 }
      }
      // the planner already proved each cell; climb or drop to the waypoint's height
      if (d > 0.01 && Math.abs(next.y - p.y) > 0.01) { p.y = THREE.MathUtils.damp(p.y, next.y, 14, dt); this.vy = 0 }
      moving = true
    }
    if (fp) this.playerYaw = this.look.yaw
    // vertical: gravity, jumping, swimming
    const gx = Math.floor(p.x); const gz = Math.floor(p.z)
    let ground = -1
    for (let y = Math.floor(p.y + 1.1); y >= 0; y--) if (SOLID[this.world.get(gx, y, gz)]) { ground = y + 1; break }
    const onGround = ground >= 0 && Math.abs(p.y - ground) < 0.05
    if (this.keys.has(' ') && onGround && !inWater) { this.vy = 8.2; this.emit('event', 'jump') }
    if (inWater) {
      // water slows the fall, and swimming into a bank climbs you out of it
      this.vy = Math.max(this.vy - 9 * dt, -2.2)
      if (this.keys.has(' ') || blocked) this.vy = 4.2
    } else if (!this.path.length) this.vy -= 26 * dt
    if (this.vy > 0 && this.solidAt(p.x, p.y + 1.85 + this.vy * dt, p.z)) this.vy = 0
    if (!this.path.length) p.y += this.vy * dt
    if (ground >= 0 && p.y <= ground) { p.y = ground; if (this.vy < 0) this.vy = 0 }
    // never stay wedged inside a block: rise to the nearest place that fits
    if (this.solidAt(p.x, p.y + 0.2, p.z)) {
      for (let y = Math.floor(p.y) + 1; y <= Math.floor(p.y) + 4; y++) if (standable(this.world, gx, y, gz)) { p.y = y; this.vy = 0; break }
    }
    if (p.y < Y0 - 60) {
      this.emit('event', 'void')
      this.teleport('spawn')
    }
    // limbs
    if (moving) this.walkPhase += dt * speed * 1.3
    else this.walkPhase *= Math.pow(0.001, dt)
    const swing = moving ? Math.sin(this.walkPhase) * 0.85 : Math.sin(this.walkPhase) * 0.85 * 0
    const b = this.player
    b.legL.rotation.x = swing; b.legR.rotation.x = -swing
    b.armL.rotation.x = -swing * 0.9; b.armR.rotation.x = swing * 0.9
    const idle = this.reduced ? 0 : Math.sin(this.time * 1.6) * 0.04
    b.armL.rotation.z = 0.05 + idle; b.armR.rotation.z = -0.05 - idle
    b.root.position.copy(p)
    b.root.rotation.y = this.playerYaw
    // head looks toward the camera when idle, the way players glance around
    const toCam = Math.atan2(this.camera.position.x - p.x, this.camera.position.z - p.z) - this.playerYaw
    const wrapped = Math.atan2(Math.sin(toCam), Math.cos(toCam))
    const want = moving ? 0 : THREE.MathUtils.clamp(wrapped, -0.9, 0.9)
    this.lookYaw = THREE.MathUtils.damp(this.lookYaw, want, 4, dt)
    b.head.rotation.y = this.lookYaw
  }

  private moveBy(dx: number, dz: number) {
    const p = this.playerPos
    const tryAxis = (nx: number, nz: number) => {
      const feet = p.y + 0.01
      for (const ox of [-0.3, 0.3]) for (const oz of [-0.3, 0.3]) {
        const cx = nx + ox; const cz = nz + oz
        const blockedLow = this.solidAt(cx, feet, cz)
        const blockedHigh = this.solidAt(cx, feet + 1, cz) || this.solidAt(cx, feet + 1.7, cz)
        if (blockedHigh) return false
        if (blockedLow && (this.solidAt(cx, feet + 1, cz) || this.vy !== 0)) return false
      }
      return true
    }
    let moved = true
    if (tryAxis(p.x + dx, p.z)) p.x += dx
    else if (this.solidAt(p.x + dx, p.y + 0.01, p.z) && !this.solidAt(p.x + dx, p.y + 1.01, p.z) && !this.solidAt(p.x + dx, p.y + 2, p.z)) { p.y = Math.floor(p.y + 1); p.x += dx }
    else if (Math.abs(dx) > 1e-4) moved = false
    if (tryAxis(p.x, p.z + dz)) p.z += dz
    else if (this.solidAt(p.x, p.y + 0.01, p.z + dz) && !this.solidAt(p.x, p.y + 1.01, p.z + dz) && !this.solidAt(p.x, p.y + 2, p.z + dz)) { p.y = Math.floor(p.y + 1); p.z += dz }
    else if (Math.abs(dz) > 1e-4) moved = false
    return moved
  }

  private wetAt(x: number, y: number, z: number) { return !!BLOCKS[this.world.get(Math.floor(x), Math.floor(y), Math.floor(z))].water }

  private applySky() {
    const t = this.dayTime
    const angle = t * Math.PI * 2
    const elev = Math.sin(angle)
    const sunDir = new THREE.Vector3(Math.cos(angle), elev, 0.35).normalize()
    let a = SKY.day; let b = SKY.gold; let f = 0
    if (elev > 0.32) { a = SKY.day; b = SKY.day; f = 0 }
    else if (elev > 0.02) { a = SKY.day; b = SKY.gold; f = 1 - (elev - 0.02) / 0.3 }
    else if (elev > -0.16) { a = SKY.gold; b = SKY.night; f = (0.02 - elev) / 0.18 }
    else { a = SKY.night; b = SKY.night; f = 0 }
    const mix = (k: 'top' | 'horizon' | 'glow' | 'tint') => a[k].clone().lerp(b[k], f)
    const rainy = this.rain ? 0.55 : 1
    const top = mix('top').multiplyScalar(rainy); const horizon = mix('horizon').multiplyScalar(rainy)
    this.sky.uniforms.top.value.copy(top)
    this.sky.uniforms.horizon.value.copy(horizon)
    this.sky.uniforms.glow.value.copy(mix('glow')).multiplyScalar(this.rain ? 0.2 : 1)
    this.sky.uniforms.sunDir.value.copy(sunDir)
    ;(this.scene.fog as THREE.Fog).color.copy(horizon)
    const tint = mix('tint').multiplyScalar(this.rain ? 0.75 : 1)
    this.litMat.color.copy(tint)
    this.waterMat.color.copy(tint)
    const night = THREE.MathUtils.clamp((0.05 - elev) / 0.2, 0, 1)
    this.night = night
    ;(this.sky.stars.material as THREE.PointsMaterial).opacity = night
    this.glow.mat.opacity = night * 0.85
    this.lambertLights.hemi.intensity = 0.45 + 1.15 * (1 - night) * rainy
    this.lambertLights.sun.intensity = 0.2 + 1.2 * (1 - night) * rainy
    this.lambertLights.sun.color.copy(tint)
    for (const c of this.clouds) c.mat.color.copy(tint).multiplyScalar(night > 0.5 ? 0.7 : 1)
    this.sunDir.copy(sunDir)
    this.sky.sun.visible = sunDir.y > -0.08
    this.sky.moon.visible = sunDir.y < 0.08
  }
  private night = 0
  private sunDir = new THREE.Vector3()

  private frame() {
    if (this.disposed) return
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.time += dt
    this.fps = this.fps * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05

    if (this.cycle && this.mode === 'world' && !this.reduced) { this.dayTime = (this.dayTime + dt / 600) % 1; this.applySky() }

    if (this.mode === 'world') this.stepPlayer(dt)
    else {
      this.player.root.position.copy(this.playerPos)
      this.player.root.rotation.y = this.playerYaw
    }

    // camera
    if (this.mode === 'title' && !this.flight && !this.reduced) this.goal.yaw += dt * 0.05
    if (this.mode === 'world' && !this.flight && (this.path.length || this.keys.size || !this.at)) {
      this.goal.target.copy(this.playerPos).add(new THREE.Vector3(0, 1.4, 0))
    }
    if (this.flight) {
      const k = Math.min(1, (this.time - this.flight.start) / this.flight.dur)
      const e = this.mode === 'world' ? easeInOut(k) : easeOut(k)
      const { from, to } = this.flight
      this.rig.target.lerpVectors(from.target, to.target, e)
      this.rig.yaw = from.yaw + (to.yaw - from.yaw) * e
      this.rig.pitch = from.pitch + (to.pitch - from.pitch) * e
      // arc outward mid-flight for a swoop, not a slide
      this.rig.dist = from.dist + (to.dist - from.dist) * e + Math.sin(e * Math.PI) * (this.mode === 'world' ? 6 : 0)
      if (k >= 1) { this.flight = null; this.goal = cloneRig(to) }
    } else {
      const s = 1 - Math.exp(-dt * 6)
      this.rig.target.lerp(this.goal.target, s)
      this.rig.yaw += (this.goal.yaw - this.rig.yaw) * s
      this.rig.pitch += (this.goal.pitch - this.rig.pitch) * s
      this.rig.dist += (this.goal.dist - this.rig.dist) * s
    }
    const fp = this.firstPerson
    this.player.root.visible = !fp
    if (fp) {
      if (this.lookGoal) {
        const s = 1 - Math.exp(-dt * 5)
        this.look.yaw = lerpAngle(this.look.yaw, this.lookGoal.yaw, s)
        this.look.pitch += (this.lookGoal.pitch - this.look.pitch) * s
      }
      const walking = this.path.length > 0 || this.keys.size > 0 || Math.hypot(this.stick.x, this.stick.y) > 0.1
      this.bob = this.reduced || !walking ? THREE.MathUtils.damp(this.bob, 0, 10, dt) : Math.abs(Math.sin(this.walkPhase)) * 0.06
      const eye = this.eye()
      this.camera.position.copy(eye)
      this.camera.lookAt(eye.add(this.forward()))
    } else {
      const { target, yaw, pitch } = this.rig
      let dist = this.rig.dist
      // keep the camera out of walls and hills: march from the player toward it and stop short of the first block
      if (this.mode === 'world' && !this.flight) {
        const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
        let free = dist
        for (let s = 0.6; s < dist; s += 0.25) {
          const q = target.clone().addScaledVector(dir, s)
          if (this.solidAt(q.x, q.y, q.z)) { free = Math.max(1.4, s - 0.45); break }
        }
        this.camClip = free < this.camClip ? free : THREE.MathUtils.damp(this.camClip, free, 3, dt)
        dist = Math.min(dist, this.camClip)
      } else this.camClip = dist
      this.camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist)
      this.camera.lookAt(target)
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt)
      this.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2, 0))
    }
    const fov = fp ? 72 : this.canvas.clientWidth < 640 ? 68 : 55
    if (this.camera.fov !== fov) { this.camera.fov = fov; this.camera.updateProjectionMatrix() }

    // sky follows camera
    this.sky.sky.position.copy(this.camera.position)
    this.sky.stars.position.copy(this.camera.position)
    this.sky.sun.position.copy(this.camera.position).addScaledVector(this.sunDir, 700)
    this.sky.moon.position.copy(this.camera.position).addScaledVector(this.sunDir, -700)

    // ambient life
    const t = this.time
    for (const u of this.updates) u.update(t, dt, this.night)
    for (const c of this.clouds) c.update(t)
    if (this.rain) { this.rain.setOrigin(this.rig.target); this.rain.update(t, dt, this.night) }
    for (const v of this.villagers) {
      v.m.head.rotation.y = Math.sin(t * 0.5 + v.base) * 0.5
      v.m.root.rotation.y = v.base + Math.sin(t * 0.13 + v.base) * 0.6
    }
    if (this.spider) {
      this.spider.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 6 + i * 1.3) * 0.18 })
      this.spider.root.rotation.y = Math.PI / 2 + Math.sin(t * 0.4) * 0.7
    }
    if (this.creeper) this.stepCreeper(dt)

    // hover
    if (this.mode === 'world' && !this.drag && (this.firstPerson || this.pointer.x > -2)) this.setHover(this.pick())

    this.renderer.render(this.scene, this.camera)
    for (const l of this.listeners) (l as Listener & { frame?: () => void }).frame?.()
  }

  onFrame(cb: () => void) { const l = { frame: cb } as Listener; this.listeners.push(l); return () => { this.listeners = this.listeners.filter(x => x !== l) } }

  private stepCreeper(dt: number) {
    const c = this.creeper!
    const age = this.time - c.start
    const m = c.model.root
    const toP = this.playerPos.clone().sub(m.position); toP.y = 0
    const d = toP.length()
    m.rotation.y = Math.atan2(toP.x, toP.z)
    if (d > 1.6 && age < 6) {
      m.position.addScaledVector(toP.normalize(), dt * 2.4)
      m.position.y = this.world.ground(Math.floor(m.position.x), Math.floor(m.position.z)) + 1
      c.model.feet.forEach((f, i) => { f.rotation.x = Math.sin(this.time * 10 + i * Math.PI) * 0.5 })
      return
    }
    if (!(c as { fuse?: number }).fuse) (c as { fuse?: number }).fuse = this.time
    const fuse = this.time - (c as { fuse?: number }).fuse!
    const flash = Math.floor(fuse * 8) % 2 === 0
    for (const mat of c.model.materials) mat.emissive.set(flash ? '#ffffff' : '#000000')
    m.scale.setScalar(1 + fuse * 0.15)
    if (fuse > 1.5) {
      const boom = new Particles('boom', m.position.clone().add(new THREE.Vector3(0, 1, 0)), 1.2, 60, ['#ffffff', '#d9d9d9', '#bfbfbf'], 1.4)
      this.scene.add(boom.points)
      const start = this.time
      const u = { update: (t: number, d2: number, n: number) => { boom.update(t, d2, n); if (this.time - start > 1.6) { this.scene.remove(boom.points); this.updates = this.updates.filter(x => x !== u) } } }
      this.updates.push(u)
      this.scene.remove(m)
      this.creeper = null
      this.shake = this.reduced ? 0 : 0.6
      this.emit('event', 'creeper')
    }
  }
}

function cloneRig(r: Rig): Rig { return { target: r.target.clone(), yaw: r.yaw, pitch: r.pitch, dist: r.dist } }

function buildWaterCanvas() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16
  const x = c.getContext('2d')!
  let s = 3
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    x.fillStyle = r < 0.4 ? '#3a6fd4' : r < 0.7 ? '#3466c9' : r < 0.9 ? '#4279dc' : '#6b9bea'
    x.fillRect(i, j, 1, 1)
  }
  return c
}
