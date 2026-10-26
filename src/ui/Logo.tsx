import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { tileCanvas } from '../engine/textures'
import { splashes } from '../content'
import { store } from './store'
import { sfx } from './sound'

const GLYPHS: Record<string, string[]> = {
  N: ['##..##', '###.##', '######', '##.###', '##..##', '##..##', '##..##'],
  O: ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
  E: ['######', '##....', '##....', '#####.', '##....', '##....', '######'],
  L: ['##....', '##....', '##....', '##....', '##....', '##....', '######'],
  A: ['.####.', '##..##', '##..##', '######', '##..##', '##..##', '##..##'],
  X: ['##..##', '##..##', '.####.', '..##..', '.####.', '##..##', '##..##'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
}

const B = 10
const DEPTH = 4

function drawLogo(canvas: HTMLCanvasElement, text: string) {
  const glyphs = [...text].map(ch => GLYPHS[ch])
  const cols = glyphs.reduce((n, g) => n + g[0].length, 0) + glyphs.length - 1
  canvas.width = cols * B + DEPTH * 2
  canvas.height = 7 * B + DEPTH * 3
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const stone = tileCanvas('stone')
  const cells: [number, number][] = []
  let ox = 0
  for (const g of glyphs) {
    g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') cells.push([ox + x, y]) }))
    ox += g[0].length + 1
  }
  const filled = new Set(cells.map(([x, y]) => `${x},${y}`))
  // extrusion: stepped darker layers falling down-right
  for (let d = DEPTH; d >= 1; d--) {
    ctx.fillStyle = d === 1 ? '#4a4a4a' : '#262626'
    for (const [x, y] of cells) ctx.fillRect(x * B + d * 0.5, y * B + d * 2, B, B)
  }
  for (const [x, y] of cells) {
    const px = x * B; const py = y * B
    ctx.drawImage(stone, (x * 5) % 8, (y * 7) % 8, 8, 8, px, py, B, B)
    if (!filled.has(`${x},${y - 1}`)) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(px, py, B, 2) }
    if (!filled.has(`${x - 1},${y}`)) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(px, py, 2, B) }
    if (!filled.has(`${x},${y + 1}`)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py + B - 2, B, 2) }
    if (!filled.has(`${x + 1},${y}`)) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(px + B - 2, py, 2, B) }
  }
}

export function Logo({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [splash, setSplash] = useState(() => Math.floor(Math.random() * splashes.length))
  const seen = useRef(new Set<number>([splash]))
  useEffect(() => { if (ref.current) drawLogo(ref.current, 'NOEL ALEX') }, [])
  const next = () => {
    sfx.pop()
    const n = (splash + 1 + Math.floor(Math.random() * (splashes.length - 1))) % splashes.length
    setSplash(n)
    seen.current.add(n)
    if (seen.current.size >= 5) store.earn('splash')
  }
  return (
    <div className="logo">
      <canvas ref={ref} role="img" aria-label="Noel Alex" />
      <div className="logo-edition">Data Science Edition</div>
      <button type="button" className={`splash ${reduced ? '' : 'splash--pulse'}`} style={{ '--fit': Math.min(1, 24 / splashes[splash].length) } as CSSProperties} onClick={next} aria-label={`Splash: ${splashes[splash]} Show another`}>
        <span key={splash}>{splashes[splash]}</span>
      </button>
    </div>
  )
}
