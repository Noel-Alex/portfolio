import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Icon } from '../content'
import { blockIcon } from '../engine/textures'
import { track } from '../analytics'
import { mail, reduced, useSeen } from './util'
import { href, navigate, type Route } from '../ui/router'
import { cases, type Case } from './cases'
import { me } from './profile'

/** Shared pieces of the readable portfolio. Each project page styles them in its own world. */

/** An in-site link: real href for new tabs and crawlers, client-side navigation on a plain click. */
export function Go({ to, children, className, onClick, label }: { to: Route; children: ReactNode; className?: string; onClick?: () => void; label?: string }) {
  const go = (e: MouseEvent) => {
    onClick?.()
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  return <a className={className} href={href(to)} onClick={go} aria-label={label}>{children}</a>
}

export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style={back ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  )
}

const icons = new Map<string, string>()
/** A project's block from the 3D world, painted by the same code as the world's textures. */
export function Block({ icon, size = 32, className = '' }: { icon: Icon; size?: number; className?: string }) {
  const src = useMemo(() => {
    const k = icon.join('|')
    if (!icons.has(k)) icons.set(k, blockIcon(icon[0], icon[1], icon[2] ?? icon[1], 64))
    return icons.get(k)!
  }, [icon])
  return <img className={`block ${className}`} src={src} width={size} height={size} alt="" draggable={false} />
}

/** The project's build, rendered from the 3D world as an isometric diorama (see engine/diorama.ts). */
export function Diorama({ id, className = '', eager = false }: { id: string; className?: string; eager?: boolean }) {
  return <img className={`diorama ${className}`} src={`${import.meta.env.BASE_URL}builds/${id}.webp`} width={800} height={800} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
}

/** A number that counts up once it is on screen. Renders the final value for reduced motion and crawlers. */
export function Count({ to, decimals = 0, ms = 1400, suffix = '' }: { to: number; decimals?: number; ms?: number; suffix?: string }) {
  const [ref, seen] = useSeen<HTMLSpanElement>(0.6)
  const [v, setV] = useState(to)
  const started = useRef(false)
  useEffect(() => {
    if (!seen || started.current || reduced()) return
    started.current = true
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / ms))
      setV(to * (1 - Math.pow(1 - k, 4)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    setV(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, ms])
  const text = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span ref={ref} className="count">{text}{suffix}</span>
}

/** The thin bar on every page: home, résumé, email, and the 3D world. Each page dresses it. */
export function SiteBar({ c }: { c?: Case }) {
  return (
    <header className="sitebar">
      <Go to={{ screen: 'home' }} className="sitebar-home">{c ? <><Arrow back /> Noel Alex</> : 'Noel Alex'}</Go>
      <nav aria-label="Site">
        <Go to={{ screen: 'resume' }}>Résumé</Go>
        <a href={`mailto:${me.email}`} onClick={mail(c ? `bar-${c.id}` : 'bar')}>Email</a>
        <a href={href(c ? { screen: 'world', book: c.id } : { screen: 'title' })} onClick={() => track('world_link', { from: c ? `bar-${c.id}` : 'bar' })}>3D world</a>
      </nav>
    </header>
  )
}

/** Patent or unpublished work: what is held back, said once and plainly. */
export function Sealed({ c }: { c: Case }) {
  if (!c.sealed) return null
  return <p className="sealed">{c.sealed}</p>
}

/** Every project page ends the same way, in its own clothes: links, the build in 3D, the next project. */
export function ProjectEnd({ c }: { c: Case }) {
  const next = cases[(cases.indexOf(c) + 1) % cases.length]
  return (
    <footer className="pend">
      {c.limits && <section className="pend-limits"><h2>Known limits</h2><p>{c.limits}</p></section>}
      <div className="pend-links">
        {c.links.map(l => <a key={l.href} className="pend-link" href={l.href} target="_blank" rel="noreferrer" onClick={() => track('project_link', { id: c.id, label: l.label })}>{l.label} <Arrow /></a>)}
        {!c.links.length && <p className="pend-private">The source is private. I’m glad to walk through it on a call: <a href={`mailto:${me.email}?subject=${encodeURIComponent(c.name)}`} onClick={mail(`end-${c.id}`)}>{me.email}</a></p>}
        <a className="pend-world" href={href({ screen: 'world', book: c.id })} onClick={() => track('world_link', { from: 'project', id: c.id })}>
          <Block icon={c.icon} size={20} /> See the build in the 3D world
        </a>
      </div>
      <Go to={{ screen: 'project', id: next.id }} className="pend-next" onClick={() => track('project_click', { id: next.id, from: `next-${c.id}` })}>
        <span>Next</span>
        <strong className={`face face--${next.id}`}>{next.name}</strong>
        <Diorama id={next.id} className="pend-next-art" />
      </Go>
    </footer>
  )
}
