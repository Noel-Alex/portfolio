import { useEffect, useMemo, useRef, type ReactNode, type MouseEvent, type CSSProperties } from 'react'
import { blockIcon } from '../engine/textures'
import type { Icon } from '../content'
import { achievements } from '../content'
import { sfx } from './sound'
import { useStore } from './store'

const iconCache = new Map<string, string>()
function iconUrl(icon: Icon) {
  const key = icon.join('|')
  let url = iconCache.get(key)
  if (!url) { url = blockIcon(icon[0], icon[1], icon[2] ?? icon[1]); iconCache.set(key, url) }
  return url
}

export function BlockIcon({ icon, size = 32, className = '' }: { icon: Icon; size?: number; className?: string }) {
  const src = useMemo(() => iconUrl(icon), [icon])
  return <img className={`block-icon ${className}`} src={src} width={size} height={size} alt="" draggable={false} />
}

type ButtonProps = {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLElement>) => void
  href?: string
  external?: boolean
  size?: 'full' | 'half' | 'icon' | 'auto'
  disabled?: boolean
  label?: string
  className?: string
  autoFocus?: boolean
}

export function McButton({ children, onClick, href, external, size = 'full', disabled, label, className = '', autoFocus }: ButtonProps) {
  const cls = `mc-btn mc-btn--${size} ${className}`
  const click = (e: MouseEvent<HTMLElement>) => { sfx.click(); onClick?.(e) }
  if (href) {
    return <a className={cls} href={href} onClick={click} aria-label={label} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{children}</a>
  }
  return <button type="button" className={cls} onClick={click} disabled={disabled} aria-label={label} autoFocus={autoFocus}>{children}</button>
}

/** A full-screen menu over the blurred world, titled the way every client screen is. */
export function Screen({ title, children, footer, className = '', onClose }: { title: string; children: ReactNode; footer?: ReactNode; className?: string; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  return (
    <main id="main-content" className={`screen ${className}`}>
      <h1 className="screen-title">{title}</h1>
      <div className="screen-body">{children}</div>
      {footer && <footer className="screen-footer">{footer}</footer>}
    </main>
  )
}

// --------------------------------------------------------------- pixel icons
const PALETTE: Record<string, string> = { '#': 'currentColor', k: '#000000', w: '#ffffff', r: '#e3262a', d: '#8b1414', g: '#7cd34f', y: '#ffe14d', b: '#3f76e4', s: '#c6c6c6' }
const ICONS: Record<string, string[]> = {
  left: ['...#', '..##', '.###', '####', '.###', '..##', '...#'],
  right: ['#...', '##..', '###.', '####', '###.', '##..', '#...'],
  close: ['#...#', '##.##', '.###.', '..#..', '.###.', '##.##', '#...#'],
  mail: ['#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#.......#', '#########'],
  book: ['.########', '#.......#', '#.#####.#', '#.......#', '#.####..#', '#.......#', '#.......#', '.########'],
  code: ['..#...#..', '.#.....#.', '#...#...#', '.#.#...#.', '..#...#..'],
  chat: ['#########', '#.......#', '#.##.##.#', '#.......#', '####.####', '...#.#...', '....#....'],
  pause: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##'],
  link: ['....####', '.....###', '....####', '#..##..#', '#.##....', '#.......', '#.......', '#######.'],
  search: ['.###...', '#...#..', '#...#..', '#...#..', '.###...', '....##.', '.....##'],
  lock: ['.###.', '#...#', '#...#', '#####', '##.##', '##.##', '#####'],
  heart: ['.kk...kk.', 'kwwk.krrk', 'kwrrkrrrk', 'krrrrrrrk', 'krrrrrrdk', '.krrrrdk.', '..krrdk..', '...kdk...', '....k....'],
  heartEmpty: ['.kk...kk.', 'k..k.k..k', 'k...k...k', 'k.......k', 'k.......k', '.k.....k.', '..k...k..', '...k.k...', '....k....'],
}

export function PixelIcon({ name, size = 16, title }: { name: keyof typeof ICONS; size?: number; title?: string }) {
  const rows = ICONS[name]
  const w = Math.max(...rows.map(r => r.length)); const h = rows.length
  const rects: ReactNode[] = []
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={PALETTE[ch]} />) }))
  return (
    <svg className="pixel-icon" viewBox={`0 0 ${w} ${h}`} width={(size * w) / Math.max(w, h)} height={(size * h) / Math.max(w, h)} shapeRendering="crispEdges" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {rects}
    </svg>
  )
}

/** The purple-bordered item tooltip. */
export function Tip({ children, tip, className = '', style }: { children: ReactNode; tip: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={`has-tip ${className}`} style={style}>{children}<span className="tip" role="tooltip">{tip}</span></span>
}

export function Toasts() {
  const toasts = useStore(s => s.toasts)
  const last = useRef(0)
  useEffect(() => { if (toasts.length > last.current) sfx.toast(); last.current = toasts.length }, [toasts.length])
  return (
    <div className="toasts" aria-live="polite">
      {toasts.slice(-3).map(t => {
        const a = achievements.find(x => x.id === t.id)!
        return (
          <div className="toast" key={t.key}>
            <BlockIcon icon={a.icon} size={32} />
            <div><strong>Advancement Made!</strong><span>{a.title}</span></div>
          </div>
        )
      })}
    </div>
  )
}
