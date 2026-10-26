import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { achievements, advancementTabs } from '../content'
import { tileCanvas } from '../engine/textures'
import { BlockIcon, McButton } from './gui'
import { sfx } from './sound'
import { useStore } from './store'

const CELL = 84
const PAD = 40
const BACKDROP: Record<string, string> = { story: 'dirt', builds: 'andesite_casing', yours: 'stone' }
const bgCache = new Map<string, string>()
const bg = (tile: string) => {
  let url = bgCache.get(tile)
  if (!url) { url = tileCanvas(tile).toDataURL(); bgCache.set(tile, url) }
  return url
}

export function Advancements({ onClose, openBook }: { onClose: () => void; openBook: (id: string) => void }) {
  const [tab, setTab] = useState('story')
  const earned = useStore(s => s.earned)
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key.toLowerCase() === 'l') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  const current = advancementTabs.find(t => t.id === tab)
  const tree = useMemo(() => {
    if (!current) return null
    const byId = new Map(current.items.map(a => [a.id, a]))
    const w = Math.max(...current.items.map(a => a.x)) * CELL + PAD * 2 + 26
    const h = Math.max(...current.items.map(a => a.y)) * CELL + PAD * 2 + 26
    const pos = (x: number, y: number) => [PAD + x * CELL + 13, PAD + y * CELL + 13]
    const lines = current.items.filter(a => a.parent).map(a => {
      const p = byId.get(a.parent!)!
      const [x0, y0] = pos(p.x, p.y); const [x1, y1] = pos(a.x, a.y)
      const mx = (x0 + x1) / 2
      return { id: a.id, d: `M${x0} ${y0} H${mx} V${y1} H${x1}`, locked: !!a.locked }
    })
    return { w, h, lines, pos }
  }, [current])

  return (
    <div className="adv-layer" role="dialog" aria-modal="true" aria-labelledby="adv-title" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="adv">
        <div className="adv-tabs" role="tablist" aria-label="Advancement tabs">
          {[...advancementTabs.map(t => ({ id: t.id, title: t.title, icon: t.icon })), { id: 'yours', title: 'Yours', icon: ['diamond_block', 'diamond_block', 'diamond_block'] as [string, string, string] }].map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`adv-tab ${tab === t.id ? 'is-on' : ''}`} onClick={() => { sfx.click(); setTab(t.id) }}>
              <BlockIcon icon={t.icon} size={24} /><span>{t.title}</span>
            </button>
          ))}
        </div>
        <section className="adv-panel panel">
          <h2 id="adv-title" className={current ? 'sr-only' : 'inv-label'}>{current ? `${current.title} advancements` : `${earned.length} of ${achievements.length} found`}</h2>
          <div className="adv-view" style={{ backgroundImage: `url(${bg(BACKDROP[tab])})` }}>
            {current && tree ? (
              <div className="adv-tree" style={{ width: tree.w, height: tree.h }}>
                <svg width={tree.w} height={tree.h} aria-hidden="true">
                  {tree.lines.map(l => <path key={`o${l.id}`} d={l.d} className="adv-line-o" />)}
                  {tree.lines.map(l => <path key={l.id} d={l.d} className={`adv-line ${l.locked ? 'is-locked' : ''}`} />)}
                </svg>
                {current.items.map((a, i) => {
                  const [x, y] = tree.pos(a.x, a.y)
                  return (
                    <button key={a.id} type="button" className={`adv-node has-tip frame--${a.frame ?? 'task'} ${a.locked ? 'is-locked' : 'is-done'}`}
                      style={{ left: x, top: y, '--i': i } as CSSProperties}
                      onClick={() => { if (a.book) { sfx.click(); openBook(a.book) } }}
                      aria-label={`${a.title}: ${a.desc}${a.locked ? ' (not yet)' : ''}`}>
                      <BlockIcon icon={a.icon} size={26} />
                      <span className="tip adv-tip" role="tooltip"><strong>{a.title}</strong><span>{a.desc}</span>{a.date && <em>{a.date}</em>}{a.book && <em>Click to open the guidebook</em>}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <ul className="adv-yours">
                {achievements.map(a => {
                  const got = earned.includes(a.id)
                  return (
                    <li key={a.id} className={got ? 'is-done' : ''}>
                      <span className="adv-node frame--task"><BlockIcon icon={a.icon} size={26} /></span>
                      <span><strong>{got ? a.title : '???'}</strong><span>{a.desc}</span></span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <McButton size="auto" onClick={onClose}>Done</McButton>
        </section>
      </div>
    </div>
  )
}
