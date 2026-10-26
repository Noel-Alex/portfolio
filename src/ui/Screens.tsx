import { useEffect, useState } from 'react'
import { links, servers } from '../content'
import { BlockIcon, McButton, PixelIcon, Screen } from './gui'
import { navigate } from './router'
import { sfx } from './sound'
import { store, useStore, type Settings } from './store'

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`

function Ping({ bars }: { bars: number }) {
  return (
    <span className="ping" aria-label={`Signal ${bars} of 5`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= bars ? 'is-on' : ''} style={{ height: 2 + i * 2 }} />)}
    </span>
  )
}

export function ServersScreen({ server, back }: { server?: string; back: () => void }) {
  const [selected, setSelected] = useState(server ?? servers[0].id)
  const current = servers.find(s => s.id === (server ?? selected)) ?? servers[0]
  const joined = !!server
  useEffect(() => { if (joined) store.earn('multiplayer') }, [joined])

  if (joined) {
    return (
      <Screen title={current.name} className="server-screen" onClose={() => navigate({ screen: 'multiplayer' })}
        footer={<McButton onClick={() => navigate({ screen: 'multiplayer' })}>Disconnect</McButton>}>
        <article className="server-join">
          {current.photo && <img className="server-photo" src={asset(current.photo.src)} alt={current.photo.alt} />}
          <div className="server-text">
            <p className="motd">{current.motd[0]}</p>
            {current.body.map(b => <p key={b}>{b}</p>)}
            {current.link && <McButton size="auto" href={current.link.href} external>{current.link.label} <PixelIcon name="link" size={12} /></McButton>}
          </div>
        </article>
      </Screen>
    )
  }

  const join = (id: string) => { sfx.click(); navigate({ screen: 'multiplayer', server: id }) }
  return (
    <Screen title="Play Multiplayer" className="servers-screen" onClose={back}
      footer={
        <div className="servers-actions">
          <McButton size="half" onClick={() => join(current.id)}>Join Server</McButton>
          <McButton size="half" onClick={() => navigate({ screen: 'work' })}>Add Server</McButton>
          <McButton size="half" onClick={back}>Cancel</McButton>
        </div>
      }>
      <ul className="server-list" aria-label="Servers">
        {servers.map(s => (
          <li key={s.id}>
            <button type="button" className={`server-row ${current.id === s.id ? 'is-selected' : ''}`} aria-current={current.id === s.id}
              onClick={() => { sfx.click(); if (current.id === s.id || matchMedia('(pointer: coarse)').matches) join(s.id); else setSelected(s.id) }}
              onDoubleClick={() => join(s.id)}>
              <BlockIcon icon={s.icon} size={48} />
              <span className="server-info">
                <strong>{s.name}</strong>
                <span className="motd">{s.motd[0]}</span>
                <span className="motd motd--2">{s.motd[1]}</span>
              </span>
              <span className="server-status"><span>{s.players}</span><Ping bars={s.ping} /></span>
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

const FIELDS = ['AI systems', 'Retrieval and search', 'Distributed systems', 'ML research', 'Data infrastructure']
const PLACES = ['Remote', 'Riyadh', 'Abu Dhabi', 'Dubai', 'United States']

export function WorkScreen({ back }: { back: () => void }) {
  const [field, setField] = useState(0)
  const [place, setPlace] = useState(0)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(links.emailText); setCopied(true); sfx.pop(); store.earn('diamonds') } catch { /* clipboard blocked */ }
  }
  useEffect(() => { if (!copied) return; const t = window.setTimeout(() => setCopied(false), 1800); return () => window.clearTimeout(t) }, [copied])
  return (
    <Screen title="Open to Work" className="work-screen" onClose={back}
      footer={<McButton onClick={back}>Done</McButton>}>
      <div className="work">
        <div className="work-row">
          <McButton size="auto" onClick={() => setField((field + 1) % FIELDS.length)}>Field: {FIELDS[field]}</McButton>
          <McButton size="auto" onClick={() => setPlace((place + 1) % PLACES.length)}>Location: {PLACES[place]}</McButton>
        </div>
        <p className="work-status">Accepting messages about {FIELDS[field]} roles in {PLACES[place] === 'Remote' ? 'remote teams' : PLACES[place]}.</p>
        <div className="work-email">
          <a href={links.email} onClick={() => { sfx.click(); store.earn('diamonds') }}><PixelIcon name="mail" size={16} /> {links.emailText}</a>
          <McButton size="auto" onClick={copy}>{copied ? 'Copied' : 'Copy'}</McButton>
        </div>
        <div className="work-row">
          <McButton size="auto" href={links.linkedin} external>LinkedIn <PixelIcon name="link" size={12} /></McButton>
          <McButton size="auto" href={links.github} external>GitHub <PixelIcon name="link" size={12} /></McButton>
          <McButton size="auto" href={links.resume} external>Resume (PDF) <PixelIcon name="link" size={12} /></McButton>
        </div>
      </div>
    </Screen>
  )
}

const MOTION: Settings['motion'][] = ['system', 'reduced', 'full']
const MOTION_LABEL = { system: 'System', reduced: 'Reduced', full: 'Full' }

export function OptionsScreen({ back, time: initialTime, setTime: applyTime }: { back: () => void; time: number; setTime: (t: number) => void }) {
  const [time, setLocal] = useState(initialTime)
  useEffect(() => { setLocal(initialTime) }, [initialTime])
  const setTime = (t: number) => { setLocal(t); applyTime(t) }
  const s = useStore(st => st.settings)
  const earned = useStore(st => st.earned.length)
  const [confirm, setConfirm] = useState(false)
  const toggle = (k: 'music' | 'sound' | 'cycle') => store.setSettings({ [k]: !s[k] })
  return (
    <Screen title="Options" className="options-screen" onClose={back}
      footer={<McButton onClick={back}>Done</McButton>}>
      <div className="options">
        <McButton size="half" onClick={() => toggle('music')}>Music: {s.music ? 'ON' : 'OFF'}</McButton>
        <McButton size="half" onClick={() => toggle('sound')}>Sounds: {s.sound ? 'ON' : 'OFF'}</McButton>
        <McButton size="half" onClick={() => store.setSettings({ quality: s.quality === 'fancy' ? 'fast' : 'fancy' })}>Graphics: {s.quality === 'fancy' ? 'Fancy' : 'Fast'}</McButton>
        <McButton size="half" onClick={() => store.setSettings({ motion: MOTION[(MOTION.indexOf(s.motion) + 1) % 3] })}>Motion: {MOTION_LABEL[s.motion]}</McButton>
        <McButton size="half" onClick={() => toggle('cycle')}>Daylight Cycle: {s.cycle ? 'ON' : 'OFF'}</McButton>
        <label className="mc-slider">
          <span>Time: {timeLabel(time)}</span>
          <input type="range" min={0} max={1} step={0.005} value={time} onChange={e => setTime(Number(e.target.value))} aria-label="Time of day" />
        </label>
        <McButton size="full" className={confirm ? 'is-danger' : ''} onClick={() => { if (confirm) { store.reset(); setConfirm(false) } else setConfirm(true) }} disabled={!earned && !confirm}>
          {confirm ? 'Click again to reset advancements' : `Reset Advancements (${earned})`}
        </McButton>
      </div>
    </Screen>
  )
}

/** dayTime 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight. */
function timeLabel(t: number) {
  const minutes = Math.round(((t * 24 + 6) % 24) * 60)
  const h = Math.floor(minutes / 60) % 24; const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m - (m % 5)).padStart(2, '0')}`
}
