import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-800.css'
import './ultrachat.css'
import { type CSSProperties, type ReactNode } from 'react'
import type { Case } from '../cases'
import { Diorama, ProjectEnd, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

type Msg = { who: string; hue: number; time: string; body: ReactNode; bot?: boolean; cmd?: boolean }
const CHAT: Msg[] = [
  { who: 'mira', hue: 330, time: '9:02 PM', body: 'is the hackathon submission due friday or saturday??' },
  { who: 'kai', hue: 190, time: '9:04 PM', body: 'someone posted it last week but I can’t find it' },
  { who: 'sam', hue: 40, time: '9:05 PM', cmd: true, body: <><span className="uc-slash">/ask</span> when is the hackathon submission due?</> },
  {
    who: 'UltraChat', hue: 235, time: '9:05 PM', bot: true, body: (
      <div className="uc-embed">
        <p><b>Saturday, 11:59 PM.</b> The deadline moved from Friday in an announcement on the 14th.</p>
        <p className="uc-src">Source · #announcements · Jump to message</p>
      </div>
    ),
  },
  { who: 'kai', hue: 190, time: '9:06 PM', cmd: true, body: <><span className="uc-slash">/summarize</span> #general · last 7 days</> },
  {
    who: 'UltraChat', hue: 235, time: '9:06 PM', bot: true, body: (
      <div className="uc-embed">
        <ul>
          <li>Team formation closes Wednesday; three teams still need a designer.</li>
          <li>Venue moved to the main auditorium.</li>
          <li>Mentors are taking questions in #help until Friday.</li>
        </ul>
        <p className="uc-src">1,284 messages · 6 sources</p>
      </div>
    ),
  },
]

function Chat() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className={`uc-client ${seen ? 'is-on' : ''}`} role="img" aria-label="An example conversation with the UltraChat bot">
      <aside className="uc-side" aria-hidden="true">
        <p className="uc-server">GDG Hack Night</p>
        <p className="uc-cat">Text channels</p>
        <ul><li># announcements</li><li className="is-on"># general</li><li># help</li><li># teams</li></ul>
      </aside>
      <div className="uc-main">
        <p className="uc-head"># general</p>
        <ol className="uc-msgs">
          {CHAT.map((m, i) => (
            <li key={i} className={`${m.bot ? 'is-bot' : ''} ${m.cmd ? 'is-cmd' : ''}`} style={{ '--i': i, '--h': m.hue } as CSSProperties}>
              <span className="uc-av">{m.who[0].toUpperCase()}</span>
              <div>
                <p className="uc-meta"><b>{m.who}</b>{m.bot && <span className="uc-tag">BOT</span>}<time>Today at {m.time}</time></p>
                <div className="uc-body">{m.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="uc-input">Message #general</p>
      </div>
    </div>
  )
}

export default function UltraChat({ c }: { c: Case }) {
  usePage('UltraChat · Noel Alex')
  return (
    <div className="uc">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="uc-hero">
          <div>
            <p className="uc-pill">{c.role} · {c.year}</p>
            <h1>UltraChat</h1>
            <p className="uc-sum">{c.summary}.</p>
            <p className="uc-lede">{c.lede}</p>
          </div>
          <Diorama id="ultrachat" className="uc-art" eager />
        </header>
        <section className="uc-sec"><Chat /></section>
        <section className="uc-sec uc-sec--text">
          <h2>Where I learned to ship with a team</h2>
          <p>I worked on message collection, long-text summarization, vector storage, retrieval, the bot’s commands and the Docker setup. I’d build it differently today, which is exactly why it stays here.</p>
          <ul className="uc-stack">{c.stack.map(s => <li key={s}>{s}</li>)}</ul>
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
