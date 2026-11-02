import { useEffect, useRef, useState } from 'react'
import { track } from '../analytics'

/** Shared behaviour for the readable portfolio; kit.tsx holds the components. */

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const mail = (from: string) => () => track('email_click', { from })
export const resumeClick = (from: string) => () => track('resume_download', { from })

/** True once the element has scrolled into view; figures animate from there. */
export function useSeen<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (reduced() || typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [seen, threshold])
  return [ref, seen] as const
}

/** Title and scroll reset for a project page. */
export function usePage(title: string) {
  useEffect(() => { document.title = title; window.scrollTo(0, 0) }, [title])
}
