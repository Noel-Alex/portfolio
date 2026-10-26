import { useEffect, useMemo, useState } from 'react'
import { projects, type Project } from '../content'
import type { LandmarkId } from '../engine/world'
import { BlockIcon, McButton, PixelIcon, Screen } from './gui'
import { navigate } from './router'
import { sfx } from './sound'

export function ModsScreen({ onPeek }: { onPeek: (id: LandmarkId | null) => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(projects[0].id)
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(p => [p.name, p.summary, ...(p.stack ?? [])].join(' ').toLowerCase().includes(q))
  }, [query])
  const current = projects.find(p => p.id === selected) ?? list[0]
  useEffect(() => { onPeek(current?.landmark ?? null) }, [current, onPeek])
  useEffect(() => () => onPeek(null), [onPeek])

  const open = (p: Project) => navigate({ screen: 'mods', book: p.id })

  return (
    <Screen
      title="Mods"
      className="mods-screen"
      onClose={() => navigate({ screen: 'title' })}
      footer={<McButton onClick={() => navigate({ screen: 'title' })}>Done</McButton>}
    >
      <div className="mods">
        <section className="mod-list" aria-label="Projects">
          <label className="mc-input">
            <PixelIcon name="search" size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" aria-label="Search projects" />
          </label>
          <ul>
            {list.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`mod-row ${current?.id === p.id ? 'is-selected' : ''}`}
                  onClick={() => { sfx.click(); setSelected(p.id); if (matchMedia('(max-width: 760px)').matches) open(p) }}
                  onDoubleClick={() => open(p)}
                  aria-current={current?.id === p.id}
                >
                  <BlockIcon icon={p.icon} size={32} />
                  <span><strong>{p.name}</strong><small>{p.version}</small></span>
                </button>
              </li>
            ))}
            {!list.length && <li className="mod-empty">No mods match “{query}”.</li>}
          </ul>
          <p className="mod-count">{projects.length} mods loaded</p>
        </section>
        {current && (
          <article className="mod-detail" aria-live="polite">
            <header>
              <BlockIcon icon={current.icon} size={64} />
              <div>
                <h2>{current.name}</h2>
                <p>{current.summary}</p>
              </div>
            </header>
            <dl className="mod-meta">
              <div><dt>Version</dt><dd>{current.version}</dd></div>
              <div><dt>Credits</dt><dd>{current.credit}</dd></div>
              <div><dt>Year</dt><dd>{current.year}</dd></div>
            </dl>
            <p className="mod-lede">{current.lede}</p>
            {current.stats.length > 0 && (
              <ul className="mod-stats">
                {current.stats.map(s => <li key={s.value}><strong>{s.value}</strong><span>{s.label}</span></li>)}
              </ul>
            )}
            <div className="mod-actions">
              <McButton size="auto" onClick={() => open(current)}>Open guidebook</McButton>
              {current.landmark && <McButton size="auto" onClick={() => navigate({ screen: 'world', book: current.id })}>Visit in world</McButton>}
              {current.links.map(l => <McButton size="auto" key={l.href} href={l.href} external>{l.label} <PixelIcon name="link" size={12} /></McButton>)}
            </div>
          </article>
        )}
      </div>
    </Screen>
  )
}
