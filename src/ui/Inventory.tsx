import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { hotbar, links, projectById } from '../content'
import { paintSkin } from '../engine/skin'
import { BlockIcon, PixelIcon } from './gui'
import { itemById, items, itemUrl, LAYOUT, recipes, type ItemId, type Recipe } from './items'
import { sfx } from './sound'
import { store } from './store'

function ItemSprite({ id, size = 32 }: { id: ItemId; size?: number }) {
  return <img className="item-sprite" src={itemUrl(id)} width={size} height={size} alt="" draggable={false} />
}

function Slot({ children, tip, onClick, className = '', label }: { children?: ReactNode; tip?: ReactNode; onClick?: () => void; className?: string; label: string }) {
  return (
    <button type="button" className={`inv-slot has-tip ${className}`} onClick={onClick} aria-label={label} aria-disabled={!onClick} tabIndex={children ? 0 : -1}>
      {children}
      {tip && <span className="tip" role="tooltip">{tip}</span>}
    </button>
  )
}

/** A flat front view of the player, cut straight from the skin net. */
function PlayerPreview() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const skin = paintSkin()
    c.width = 16; c.height = 32
    const ctx = c.getContext('2d')!
    ctx.drawImage(skin, 8, 8, 8, 8, 4, 0, 8, 8) // head
    ctx.drawImage(skin, 20, 20, 8, 12, 4, 8, 8, 12) // body
    ctx.drawImage(skin, 44, 20, 4, 12, 0, 8, 4, 12) // right arm
    ctx.drawImage(skin, 44, 20, 4, 12, 12, 8, 4, 12) // left arm
    ctx.drawImage(skin, 4, 20, 4, 12, 4, 20, 4, 12) // right leg
    ctx.drawImage(skin, 4, 20, 4, 12, 8, 20, 4, 12) // left leg
  }, [])
  return <div className="player-preview"><canvas ref={ref} role="img" aria-label="Noel's player skin" /></div>
}

const sameBag = (a: ItemId[], b: ItemId[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

export function Inventory({ onClose, openBook, reduced }: { onClose: () => void; openBook: (id: string) => void; reduced: boolean }) {
  const [grid, setGrid] = useState<(ItemId | null)[]>(() => new Array(9).fill(null))
  const [crafted, setCrafted] = useState(false)
  const [copied, setCopied] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => { store.earn('inventory') }, [])
  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key.toLowerCase() === 'e') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  const placed = grid.filter((g): g is ItemId => !!g)
  const match = useMemo(() => recipes.find(r => !r.sealed && sameBag(r.items, placed)), [placed])
  const output = match ? projectById(match.project) : undefined

  const add = (id: ItemId) => {
    if (id === 'diamond') {
      navigator.clipboard?.writeText(links.emailText).then(() => { setCopied(true); sfx.pop(); store.earn('diamonds') }).catch(() => { /* clipboard blocked */ })
      return
    }
    const i = grid.indexOf(null)
    if (i < 0) return
    sfx.pop()
    setCrafted(false)
    setGrid(g => g.map((v, k) => (k === i ? id : v)))
  }
  const remove = (i: number) => { sfx.click(); setGrid(g => g.map((v, k) => (k === i ? null : v))) }
  const fill = (r: Recipe) => {
    if (r.sealed) return
    timers.current.forEach(t => window.clearTimeout(t))
    setCrafted(false)
    const slots = LAYOUT[r.items.length]
    setGrid(new Array(9).fill(null))
    r.items.forEach((id, k) => {
      const t = window.setTimeout(() => { sfx.pop(); setGrid(g => g.map((v, j) => (j === slots[k] ? id : v))) }, reduced ? 0 : 90 * (k + 1))
      timers.current.push(t)
    })
  }
  const take = () => {
    if (!match) return
    sfx.toast()
    store.earn('craft')
    setCrafted(true)
    setGrid(new Array(9).fill(null))
    const t = window.setTimeout(() => openBook(match.project), reduced ? 0 : 420)
    timers.current.push(t)
  }

  const main: (ItemId | null)[] = [...items.map(i => i.id), ...new Array(27 - items.length).fill(null)]

  return (
    <div className="inv-layer" role="dialog" aria-modal="true" aria-label="Inventory" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="inv-wrap">
        <section className="inv panel">
          <div className="inv-top">
            <PlayerPreview />
            <div className="craft">
              <h2 className="inv-label">Crafting</h2>
              <div className="craft-row">
                <div className="craft-grid">
                  {grid.map((g, i) => (
                    <Slot key={i} label={g ? `Remove ${itemById[g].name}` : 'Empty crafting slot'} onClick={g ? () => remove(i) : undefined} tip={g ? <strong>{itemById[g].name}</strong> : undefined}>
                      {g && <span className="pop-in"><ItemSprite id={g} /></span>}
                    </Slot>
                  ))}
                </div>
                <span className="craft-arrow" aria-hidden="true" />
                <Slot className={`craft-out ${output ? 'is-ready' : ''} ${crafted ? 'is-crafted' : ''}`} label={output ? `Craft ${output.name}` : 'Crafting output'} onClick={output ? take : undefined}
                  tip={output ? <><strong>{output.name}</strong><span>{output.summary}</span></> : undefined}>
                  {output && <BlockIcon icon={output.icon} size={32} />}
                </Slot>
              </div>
            </div>
          </div>
          <h2 className="inv-label">Inventory</h2>
          <div className="inv-grid">
            {main.map((id, i) => id
              ? (
                <Slot key={id} label={itemById[id].name} onClick={() => add(id)}
                  tip={<><strong className={itemById[id].rare ? 'tip-rare' : ''}>{itemById[id].name}</strong><span>{id === 'diamond' && copied ? 'Copied!' : itemById[id].lore}</span></>}>
                  <ItemSprite id={id} />
                </Slot>
              )
              : <Slot key={`e${i}`} label="Empty slot" />)}
          </div>
          <div className="inv-grid inv-hotbar">
            {hotbar.map(h => (
              <Slot key={h.landmark} label={h.label} tip={<strong>{h.label}</strong>}>
                <BlockIcon icon={h.icon} size={32} />
              </Slot>
            ))}
          </div>
        </section>
        <section className="recipes panel" aria-label="Recipe book">
          <h2 className="inv-label">Recipes</h2>
          <div className="recipe-grid">
            {recipes.map(r => {
              const p = projectById(r.project)!
              return (
                <Slot key={r.project} className={r.sealed ? 'is-sealed' : ''} label={r.sealed ? `${p.name}: recipe sealed` : `Fill the grid for ${p.name}`} onClick={r.sealed ? undefined : () => fill(r)}
                  tip={r.sealed ? <><strong>{p.name}</strong><span>Recipe sealed. The details stay private for now.</span></> : <><strong>{p.name}</strong><span>{r.items.map(i => itemById[i].name).join(' + ')}</span></>}>
                  <BlockIcon icon={p.icon} size={32} />
                  {r.sealed && <span className="seal"><PixelIcon name="lock" size={12} /></span>}
                </Slot>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
