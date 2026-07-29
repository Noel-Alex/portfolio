import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

type WorldProps = {
  active: number
  creative: boolean
  reducedMotion: boolean
}

type BlockProps = {
  position: [number, number, number]
  color: string
  scale?: [number, number, number]
  emissive?: string
  glow?: number
}

const palette = {
  grass: '#6f9f42',
  grassLight: '#9bc85d',
  dirt: '#6c4930',
  stone: '#515755',
  deep: '#252c2d',
  wood: '#6f4c2e',
  leaves: '#315f38',
  redstone: '#f0443c',
  amethyst: '#ae6cff',
  amethystLight: '#e1b8ff',
  glow: '#ffca66',
  obsidian: '#20172a',
  portal: '#9c55e8',
  endstone: '#c7cb85',
}

const sceneColors = ['#7fc6dd', '#8fbfcb', '#6f8c87', '#312742', '#56384a', '#120d1e']

function Block({ position, color, scale = [1, 1, 1], emissive = '#000000', glow = 0 }: BlockProps) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={glow} roughness={0.94} />
    </mesh>
  )
}

function Terrain({ z, kind = 'grass' }: { z: number; kind?: 'grass' | 'stone' | 'end' }) {
  const blocks = useMemo(() => {
    const result: Array<{ position: [number, number, number]; color: string }> = []
    for (let x = -8; x <= 8; x += 1) {
      for (let dz = -8; dz <= 8; dz += 1) {
        const edge = Math.abs(x) + Math.abs(dz)
        if (edge > 13 || (x * 7 + dz * 11 + z) % 17 === 0) continue
        const height = kind === 'grass' ? Math.round((Math.sin(x * 0.74) + Math.cos(dz * 0.61)) * 0.42) : 0
        const color = kind === 'grass' ? (height > 0 ? palette.grassLight : palette.grass) : kind === 'end' ? palette.endstone : palette.deep
        result.push({ position: [x, height - 1.6, z + dz] as [number, number, number], color })
        if (kind === 'grass' && height > 0) {
          result.push({ position: [x, height - 2.6, z + dz] as [number, number, number], color: palette.dirt })
        }
      }
    }
    return result
  }, [kind, z])

  return <>{blocks.map((block, i) => <Block key={`${z}-${i}`} {...block} />)}</>
}

function Tree({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position
  return (
    <group>
      <Block position={[x, y + 1, z]} color={palette.wood} scale={[0.7, 3, 0.7]} />
      {[
        [0, 3, 0], [1, 3, 0], [-1, 3, 0], [0, 3, 1], [0, 3, -1],
        [0, 4, 0], [1, 4, 0], [-1, 4, 0], [0, 4, 1], [0, 4, -1], [0, 5, 0],
      ].map(([dx, dy, dz], i) => (
        <Block key={i} position={[x + dx, y + dy, z + dz]} color={i % 3 === 0 ? '#417547' : palette.leaves} />
      ))}
    </group>
  )
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Block position={[0, 0, 0]} color="#3a2c1c" scale={[0.22, 2.2, 0.22]} />
      <Block position={[0, 1.35, 0]} color="#ffc862" scale={[0.55, 0.75, 0.55]} emissive="#ff9e45" glow={2.4} />
      <pointLight position={[0, 1.5, 0]} color="#ffb45c" intensity={1.8} distance={8} />
    </group>
  )
}

function Crystal({ position, color = palette.amethyst }: { position: [number, number, number]; color?: string }) {
  const [x, y, z] = position
  return (
    <group position={[x, y, z]} rotation={[0.12, 0, 0.35]}>
      <Block position={[0, 0.7, 0]} color={color} emissive={color} glow={0.75} scale={[0.45, 2.4, 0.45]} />
      <Block position={[0.52, 0.25, 0.1]} color={palette.amethystLight} emissive={color} glow={0.45} scale={[0.32, 1.5, 0.32]} />
    </group>
  )
}

function Overworld({ z }: { z: number }) {
  return (
    <group>
      <Terrain z={z} />
      <Tree position={[-5, -0.5, z - 2]} />
      <Tree position={[5, -0.3, z - 5]} />
      <Tree position={[7, -0.5, z + 5]} />
      <Lantern position={[-2.2, -0.35, z + 1]} />
      <Block position={[2.5, -0.55, z - 1]} color="#9a7244" scale={[2.8, 0.32, 1.1]} />
      <Block position={[2.5, -0.2, z - 1]} color="#d7c39c" scale={[0.8, 0.35, 0.8]} />
    </group>
  )
}

function Village({ z }: { z: number }) {
  return (
    <group>
      <Terrain z={z} />
      <Block position={[-4, 0.2, z - 2]} color="#92704b" scale={[4.2, 3.5, 3.8]} />
      <Block position={[-4, 2.15, z - 2]} color="#623f2d" scale={[5, 0.5, 4.6]} />
      <Block position={[-4, 0.2, z + 0.05]} color="#402b1f" scale={[0.9, 1.9, 0.25]} />
      <Block position={[-5.3, 0.65, z + 0.06]} color="#8ed5ff" emissive="#5eb7f0" glow={0.35} scale={[0.95, 0.95, 0.22]} />
      <Block position={[3.6, -0.45, z - 2.5]} color="#d95172" scale={[3.4, 1.7, 3]} />
      <Block position={[3.6, 1.05, z - 2.5]} color="#f0c4d0" scale={[4.1, 0.45, 3.7]} />
      <Lantern position={[-0.2, -0.3, z + 1]} />
      <Lantern position={[5.8, -0.3, z + 2]} />
      <Tree position={[6.7, -0.6, z - 6]} />
    </group>
  )
}

function Workshop({ z }: { z: number }) {
  const rails = Array.from({ length: 13 }, (_, i) => i - 6)
  return (
    <group>
      <Terrain z={z} kind="stone" />
      {rails.map((x) => (
        <group key={x}>
          <Block position={[x, -0.92, z + 1]} color="#695640" scale={[0.12, 0.12, 4.8]} />
          <Block position={[x, -0.86, z + 1]} color="#b47a3d" scale={[0.7, 0.08, 0.16]} />
        </group>
      ))}
      <Block position={[3.8, -0.2, z - 1.8]} color="#3a3430" scale={[2.1, 1.3, 2.1]} />
      <Block position={[3.8, 0.66, z - 1.8]} color="#725036" scale={[1.55, 0.4, 1.55]} />
      <Block position={[-4.2, -0.35, z - 1]} color="#294358" emissive="#2ba6dd" glow={0.7} scale={[1.7, 1.7, 1.7]} />
      <Block position={[-4.2, -0.35, z - 0.1]} color="#5ac7ff" emissive="#48bfff" glow={1.5} scale={[0.55, 0.55, 0.15]} />
      <Lantern position={[0, -0.4, z - 4]} />
      {[[-6, z + 5], [-3, z + 5], [0, z + 5], [3, z + 5], [6, z + 5]].map(([x, pz], i) => (
        <Block key={i} position={[x, -0.75, pz]} color={i % 2 ? palette.redstone : '#761f24'} emissive={palette.redstone} glow={i % 2 ? 1.2 : 0.45} scale={[0.55, 0.16, 0.55]} />
      ))}
    </group>
  )
}

function Cave({ z }: { z: number }) {
  const ceiling = Array.from({ length: 34 }, (_, i) => {
    const x = (i % 9) - 4
    const dz = Math.floor(i / 9) * 2 - 4
    return [x * 1.6, 5 + ((i * 7) % 3) * 0.4, z + dz] as [number, number, number]
  })
  return (
    <group>
      <Terrain z={z} kind="stone" />
      {ceiling.map((position, i) => <Block key={i} position={position} color={i % 4 ? palette.deep : '#394343'} scale={[1.7, 1, 1.7]} />)}
      <Crystal position={[-5, -0.1, z - 2]} />
      <Crystal position={[-3.8, -0.5, z - 3.5]} color="#7b4fc5" />
      <Crystal position={[5.2, 0.1, z - 1]} />
      <Crystal position={[4.2, -0.55, z + 2.6]} color="#65c8ff" />
      <Block position={[0, -0.65, z - 4.5]} color="#e66d26" emissive="#ff5d20" glow={2.5} scale={[3.4, 0.3, 1.3]} />
      <pointLight position={[0, 0, z - 4]} color="#ff672f" intensity={2.6} distance={11} />
    </group>
  )
}

function Festival({ z }: { z: number }) {
  const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853']
  return (
    <group>
      <Terrain z={z} />
      {colors.map((color, i) => (
        <group key={color} position={[(i - 1.5) * 3.1, -0.1, z - 2 - (i % 2) * 2]}>
          <Block position={[0, 0.5, 0]} color={color} scale={[2.4, 1.8, 2.4]} />
          <Block position={[0, 1.6, 0]} color="#f5efe2" scale={[2.8, 0.35, 2.8]} />
        </group>
      ))}
      <Lantern position={[-6.5, -0.2, z + 2]} />
      <Lantern position={[0, -0.2, z + 2]} />
      <Lantern position={[6.5, -0.2, z + 2]} />
      <Block position={[0, -0.35, z + 4.4]} color="#e8633d" emissive="#ff8b42" glow={1.2} scale={[1.1, 0.8, 1.1]} />
    </group>
  )
}

function Portal({ z }: { z: number }) {
  const frame: Array<[number, number, number]> = []
  for (let x = -3; x <= 3; x += 1) {
    frame.push([x, -0.3, z])
    frame.push([x, 4.7, z])
  }
  for (let y = 0.7; y <= 3.7; y += 1) {
    frame.push([-3, y, z])
    frame.push([3, y, z])
  }
  return (
    <group>
      <Terrain z={z + 1} kind="end" />
      {frame.map((position, i) => <Block key={i} position={position} color={palette.obsidian} emissive="#5c287d" glow={0.22} />)}
      <Block position={[0, 2.2, z + 0.05]} color={palette.portal} emissive={palette.portal} glow={2.1} scale={[5, 4, 0.18]} />
      <pointLight position={[0, 2, z + 2]} color="#b36cff" intensity={3.2} distance={13} />
      <Crystal position={[-5, -0.4, z + 3]} />
      <Crystal position={[5.2, -0.4, z + 2]} color="#6de0d1" />
    </group>
  )
}

function Stars({ creative }: { creative: boolean }) {
  const positions = useMemo(() => {
    const data = new Float32Array(360 * 3)
    for (let i = 0; i < 360; i += 1) {
      data[i * 3] = ((i * 41) % 100) / 5 - 10
      data[i * 3 + 1] = ((i * 67) % 100) / 8 - 1
      data[i * 3 + 2] = -((i * 29) % 170)
    }
    return data
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={creative ? '#f6d4ff' : '#d9f2df'} size={creative ? 0.13 : 0.08} transparent opacity={0.82} sizeAttenuation />
    </points>
  )
}

function WorldRig({ active, creative, reducedMotion }: WorldProps) {
  const group = useRef<THREE.Group>(null)
  const { camera, pointer, scene } = useThree()
  const background = useMemo(() => new THREE.Color(sceneColors[active] ?? sceneColors[0]), [active])

  useFrame((state, delta) => {
    const speed = reducedMotion ? 12 : 2.4
    if (group.current) {
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, active * 32, speed, delta)
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, creative ? 0.08 : 0, 1.8, delta)
    }
    camera.position.x = THREE.MathUtils.damp(camera.position.x, reducedMotion ? 0 : pointer.x * 0.9, 2.2, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.2 + (reducedMotion ? 0 : pointer.y * 0.35), 2.2, delta)
    camera.lookAt(0, 1, -5)
    const current = scene.background instanceof THREE.Color ? scene.background : new THREE.Color('#080d0a')
    current.lerp(background, Math.min(1, delta * 1.3))
    scene.background = current
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(current)
    state.gl.setClearColor(current)
  })

  return (
    <>
      <fog attach="fog" args={[sceneColors[0], 12, 28]} />
      <ambientLight intensity={creative ? 1.45 : 1.05} />
      <directionalLight position={[7, 12, 7]} intensity={creative ? 2.1 : 1.65} color="#fff2ce" />
      <hemisphereLight args={['#bce8ff', '#32221b', 1.1]} />
      <Stars creative={creative} />
      <group ref={group}>
        <Overworld z={0} />
        <Village z={-32} />
        <Workshop z={-64} />
        <Cave z={-96} />
        <Festival z={-128} />
        <Portal z={-160} />
      </group>
    </>
  )
}

export default function VoxelWorld(props: WorldProps) {
  return (
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 4.2, 10], fov: 48, near: 0.1, far: 220 }}
        dpr={[1, 1.45]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <WorldRig {...props} />
        </Suspense>
      </Canvas>
      <div className="world-vignette" />
      <div className="world-grain" />
    </div>
  )
}
