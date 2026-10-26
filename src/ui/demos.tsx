import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Demo } from '../content'
import { sfx } from './sound'

const sleep = (ms: number) => new Promise(r => window.setTimeout(r, ms))

function HelixDemo({ reduced }: { reduced: boolean }) {
  const programs = {
    scale: { code: ['for i in 0..n {', '  out[i] = a[i] * 5.0 + 1.0;', '}'], out: ['Loop #1: RAW 0 / WAR 0 / WAW 0', '    READ a[i]', '    WRITE out[i]'], verdict: 'SAFE', lanes: 8 },
    recurrence: { code: ['for i in 1..n {', '  a[i] = a[i - 1] * 0.5 + b[i];', '}'], out: ['Loop #1: RAW 1 / WAR 0 / WAW 0', '    READ a[i - 1]', '    WRITE a[i]', 'RAW a[i] <- a[i - 1] (carried by iteration distance 1, level 1)'], verdict: 'SEQUENTIAL', lanes: 1 },
  }
  const [which, setWhich] = useState<keyof typeof programs>('scale')
  const [lines, setLines] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const run = useRef(0)
  const p = programs[which]
  const analyze = async () => {
    const id = ++run.current
    setLines([]); setDone(false); sfx.click()
    for (const l of ['$ helix loops', ...p.out]) {
      if (run.current !== id) return
      await sleep(reduced ? 0 : 260)
      setLines(prev => [...prev, l])
    }
    await sleep(reduced ? 0 : 200)
    if (run.current === id) { setDone(true); sfx.pop() }
  }
  return (
    <div className="demo demo-helix">
      <div className="demo-tabs" role="tablist" aria-label="Example loop">
        {(Object.keys(programs) as (keyof typeof programs)[]).map(k => (
          <button key={k} role="tab" aria-selected={which === k} className={which === k ? 'is-on' : ''} onClick={() => { setWhich(k); setLines([]); setDone(false); run.current++ }}>{k}.hx</button>
        ))}
      </div>
      <pre className="demo-code">{p.code.join('\n')}</pre>
      <button className="demo-run" onClick={analyze}>Analyze loop</button>
      <pre className="demo-term" aria-live="polite">{lines.join('\n')}{done && <b className={`verdict verdict--${p.verdict === 'SAFE' ? 'ok' : 'no'}`}>{'\n'}=&gt; {p.verdict}</b>}</pre>
      <div className="lanes" aria-label={done ? `${p.lanes} of 8 cores used` : 'Cores idle'}>
        {Array.from({ length: 8 }, (_, i) => <span key={i} className={done && i < p.lanes ? 'is-busy' : ''} style={{ '--i': i } as CSSProperties} />)}
      </div>
    </div>
  )
}

function SplitDemo({ title, a, b, rows, note }: { title: [string, string]; a: number[]; b: number[]; rows: { label: string; max: number; fmt: (v: number) => string }[]; note: string }) {
  const [side, setSide] = useState(0)
  const vals = side === 0 ? a : b
  return (
    <div className="demo demo-split">
      <div className="demo-tabs" role="tablist" aria-label="Evaluation split">
        {title.map((t, i) => <button key={t} role="tab" aria-selected={side === i} className={side === i ? 'is-on' : ''} onClick={() => { sfx.click(); setSide(i) }}>{t}</button>)}
      </div>
      {rows.map((r, i) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="bar"><i style={{ width: `${(vals[i] / r.max) * 100}%` }} /></div>
          <strong>{r.fmt(vals[i])}</strong>
        </div>
      ))}
      <p className="demo-note">{note}</p>
    </div>
  )
}

function SivanaDemo({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'idle' | 'listening' | 'match'>('idle')
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const W = 64; const H = 32
    c.width = W; c.height = H
    let frame = 0; let raf = 0
    const peaks: [number, number][] = []
    const draw = () => {
      ctx.fillStyle = '#1b1220'
      ctx.fillRect(0, 0, W, H)
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
        const t = x + frame * 0.5
        const v = (Math.sin(t * 0.21 + y * 0.6) + Math.sin(t * 0.07 - y * 0.33) + Math.sin(y * 1.7 + t * 0.4)) / 3
        const e = Math.max(0, v) * (1 - y / H * 0.6)
        if (e > 0.18) { ctx.fillStyle = e > 0.62 ? '#ffd34a' : e > 0.4 ? '#f25f9a' : '#5b2c6f'; ctx.fillRect(x, H - 1 - y, 1, 1) }
      }
      if (state !== 'idle') {
        if (frame % 6 === 0 && peaks.length < 14) peaks.push([8 + Math.floor(Math.random() * 48), 3 + Math.floor(Math.random() * 26)])
        ctx.strokeStyle = '#5ee6de'; ctx.lineWidth = 0.5
        for (let i = 1; i < peaks.length; i++) { ctx.beginPath(); ctx.moveTo(peaks[i - 1][0] + 0.5, peaks[i - 1][1] + 0.5); ctx.lineTo(peaks[i][0] + 0.5, peaks[i][1] + 0.5); ctx.stroke() }
        ctx.fillStyle = '#ffffff'
        for (const [x, y] of peaks) ctx.fillRect(x, y, 1, 1)
      }
      if (!reduced) frame++
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [state, reduced])
  const listen = async () => {
    sfx.note(); setState('listening')
    await sleep(reduced ? 200 : 2200)
    setState('match'); sfx.pop()
  }
  return (
    <div className="demo demo-sivana">
      <canvas ref={ref} className="spectro" aria-label="Illustrated spectrogram with fingerprint landmarks" />
      <button className="demo-run" onClick={listen} disabled={state === 'listening'}>{state === 'listening' ? 'Fingerprinting…' : 'Listen'}</button>
      <p className="demo-term" aria-live="polite">{state === 'match' ? 'Match: track 2, offset 12.4 s, confidence high' : state === 'listening' ? 'Peaks → landmark pairs → hashes' : 'Press listen'}</p>
      <p className="demo-note">An illustration of the pipeline, not live audio.</p>
    </div>
  )
}

function KargoDemo({ reduced }: { reduced: boolean }) {
  const stages = ['Connect repo', 'Read the code', 'Write Docker config', 'Deploy to Kubernetes', 'Watch it live']
  const [stage, setStage] = useState(-1)
  useEffect(() => {
    if (stage < 0 || stage >= stages.length) return
    const t = window.setTimeout(() => setStage(s => s + 1), reduced ? 80 : 650)
    return () => window.clearTimeout(t)
  }, [stage, reduced, stages.length])
  return (
    <div className="demo demo-kargo">
      <div className="rail-line">
        <span className="cart" style={{ '--p': Math.max(0, Math.min(stage, stages.length - 1)) / (stages.length - 1) } as CSSProperties} />
      </div>
      <ol>{stages.map((s, i) => <li key={s} className={stage >= i ? 'is-on' : ''}>{s}</li>)}</ol>
      <button className="demo-run" onClick={() => { sfx.click(); setStage(0) }}>Run the line</button>
    </div>
  )
}

function UltraDemo({ reduced }: { reduced: boolean }) {
  const steps = ['Collect channel history', 'Summarize long threads', 'Embed into vectors', 'Retrieve what matters']
  const [i, setI] = useState(-1)
  useEffect(() => {
    if (i < 0 || i > steps.length) return
    const t = window.setTimeout(() => setI(v => v + 1), reduced ? 60 : 520)
    return () => window.clearTimeout(t)
  }, [i, reduced, steps.length])
  return (
    <div className="demo demo-ultra">
      <div className="chat">
        <p><b>noel</b> where did we land on the deploy plan?</p>
        {i > steps.length - 1 && <p className="bot"><b>UltraChat</b> Found it across four summaries from #infra: Docker Compose on the club server, decided on the 12th.</p>}
      </div>
      <ol>{steps.map((s, k) => <li key={s} className={i > k ? 'is-on' : i === k ? 'is-now' : ''}>{s}</li>)}</ol>
      <button className="demo-run" onClick={() => { sfx.click(); setI(0) }}>Ask</button>
      <p className="demo-note">An example exchange.</p>
    </div>
  )
}

function AsterDemo() {
  const rows = [
    ['Dense challenger', 661, 661], ['MoE probe', 670, 364], ['Frontier', 890, 482], ['Target', 1500, 620], ['Stretch', 1900, 764],
  ] as const
  return (
    <div className="demo demo-aster">
      {rows.map(([name, total, active]) => (
        <div className="bar-row" key={name}>
          <span>{name}</span>
          <div className="bar bar--stack"><i style={{ width: `${(total / 1900) * 100}%` }} /><b style={{ width: `${(active / 1900) * 100}%` }} /></div>
          <strong>{total >= 1000 ? `${(total / 1000).toFixed(1)}B` : `${total}M`}</strong>
        </div>
      ))}
      <p className="demo-note"><i className="key key--total" /> total parameters <i className="key key--active" /> active per token</p>
    </div>
  )
}

export function DemoView({ demo, reduced }: { demo: Demo; reduced: boolean }) {
  switch (demo) {
    case 'helix': return <HelixDemo reduced={reduced} />
    case 'sivana': return <SivanaDemo reduced={reduced} />
    case 'kargo': return <KargoDemo reduced={reduced} />
    case 'ultrachat': return <UltraDemo reduced={reduced} />
    case 'aster': return <AsterDemo />
    case 'arachne': return (
      <SplitDemo
        title={['Random split', 'Split by domain']}
        a={[96.9, 0.977]} b={[0, 0.793]}
        rows={[{ label: 'Test domains seen in training', max: 100, fmt: v => `${v.toFixed(1)}%` }, { label: 'Graph model PR-AUC', max: 1, fmt: v => v.toFixed(2) }]}
        note="Same model, same data. Only the split changed."
      />
    )
    case 'polysafe': return (
      <SplitDemo
        title={['Random pairs', 'Unseen drugs']}
        a={[0.3]} b={[0.12]}
        rows={[{ label: 'Micro-AUPRC', max: 0.35, fmt: v => v.toFixed(2) }]}
        note="Testing on drugs the model has never seen drops the score about 2.5×."
      />
    )
    default: return null
  }
}
