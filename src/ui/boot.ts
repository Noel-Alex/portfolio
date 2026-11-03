/** The "Generating world" screen. Its markup lives in index.html so it paints before any bundle arrives. */

const KEY = 'noel-world-booted'
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

let ready = false

/** The 3D client calls this once its engine has finished building the world. */
export function worldReady() { ready = true }

export function startBoot() {
  const el = document.getElementById('boot')
  const fill = document.getElementById('boot-fill')
  const pct = document.getElementById('boot-pct')
  const root = document.documentElement
  if (!el || !fill || !pct) { root.removeAttribute('data-boot'); return }

  let seen = false
  try { seen = sessionStorage.getItem(KEY) === 'yes' } catch { /* storage can be unavailable */ }
  // the first visit lingers long enough to read as world generation; later ones just cover the load
  const hold = reduced ? 250 : seen ? 600 : 1900
  const t0 = performance.now()
  let p = 0

  const end = () => {
    root.removeAttribute('data-boot')
    el.remove()
    try { sessionStorage.setItem(KEY, 'yes') } catch { /* storage can be unavailable */ }
  }

  const frame = (now: number) => {
    const t = now - t0
    const done = (ready && t >= hold) || t > 15000
    // creeps toward 90% like chunks streaming in, then rushes to 100% when the world is ready
    const target = done ? 1 : 0.9 * (1 - Math.exp(-t / (hold * 0.55)))
    p = done ? Math.min(1, p + Math.max(0.02, (1 - p) * 0.22)) : Math.max(p, target)
    fill.style.transform = `scaleX(${p})`
    pct.textContent = `${Math.round(p * 100)}%`
    if (p < 1) { requestAnimationFrame(frame); return }
    el.dataset.out = ''
    // let the title screen's own entrance play as the cover lifts
    root.dataset.bootOut = ''
    window.setTimeout(end, reduced ? 0 : 440)
  }
  requestAnimationFrame(frame)
}
