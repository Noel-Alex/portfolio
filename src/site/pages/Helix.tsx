import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/silkscreen/latin-700.css'
import './helix.css'
import { useState, type CSSProperties } from 'react'
import { track } from '../../analytics'
import type { Case } from '../cases'
import { Count, Diorama, ProjectEnd, SiteBar } from '../kit'
import { usePage, useSeen } from '../util'

type Stage = { key: string; label: string; real?: boolean; text: string }
const STAGES: Stage[] = [
  {
    key: 'src', label: 'Source', real: true, text:
`fn main() {
    let n = 33554432;
    let a: [f64] = zeros(n);
    let out: [f64] = zeros(n);
    for i in 0..n {
        out[i] = a[i] * 5.0;
    }
    print(out[42]);
}`,
  },
  {
    key: 'tok', label: 'Tokens', text:
`FN  IDENT(main)  LPAREN  RPAREN  LBRACE
LET IDENT(n)  EQ  INT(33554432)  SEMI
LET IDENT(a)  COLON  LBRACK  TY(f64)  RBRACK ...
FOR IDENT(i)  IN  INT(0)  DOTDOT  IDENT(n)  LBRACE
IDENT(out) LBRACK IDENT(i) RBRACK  EQ
IDENT(a) LBRACK IDENT(i) RBRACK  STAR  FLOAT(5.0)`,
  },
  {
    key: 'ast', label: 'AST', text:
`Fn main
└ Block
  ├ Let n = 33554432
  ├ Let a: [f64] = zeros(n)
  ├ Let out: [f64] = zeros(n)
  ├ For i in 0..n
  │ └ Assign out[i] = Mul(a[i], 5.0)
  └ Call print(out[42])`,
  },
  {
    key: 'ssa', label: 'SSA', text:
`loop.header:
  i1 = phi [i0, entry], [i2, loop.body]
  c1 = lt i1, n
  br c1, loop.body, exit
loop.body:
  t1 = load a[i1]
  t2 = fmul t1, 5.0
  store out[i1], t2
  i2 = add i1, 1
  jmp loop.header`,
  },
  {
    key: 'proof', label: 'Proof', real: true, text:
`$ helix loops examples/scale.hx
Loop #2: RAW 0 / WAR 0 / WAW 0 => SAFE
    READ a[i]
    WRITE out[i]

$ helix loops examples/recurrence_reject.hx
Loop #1: RAW 1 / WAR 0 / WAW 0 => SEQUENTIAL (RAW a[i] <- a[i - 1] (carried by iteration distance 1, level 1))
    READ a[i - 1]
    WRITE a[i]`,
  },
  {
    key: 'x86', label: 'Native', text:
`; Cranelift -> x86-64, split across 8 workers
.loop:
  movsd  xmm0, [rsi + rcx*8]
  mulsd  xmm0, xmm1
  movsd  [rdi + rcx*8], xmm0
  add    rcx, 1
  cmp    rcx, rdx
  jl     .loop`,
  },
]

function Machine() {
  const [at, setAt] = useState(0)
  const s = STAGES[at]
  return (
    <div className="hx-machine">
      <div className="hx-win hx-screen">
        <div className="hx-title"><span>HELIX://{s.label.toUpperCase()}</span><span className="hx-tag">{s.real ? 'real output' : 'simplified'}</span></div>
        <pre className="hx-code" key={s.key} aria-live="polite">{s.key === 'proof' ? <Proof text={s.text} /> : s.text}</pre>
      </div>
      <div className="hx-keys" role="tablist" aria-label="Pipeline stage">
        {STAGES.map((k, i) => (
          <button key={k.key} role="tab" aria-selected={i === at} className={i === at ? 'is-on' : ''} onClick={() => { setAt(i); track('demo', { id: 'helix', stage: k.key }) }}>
            <small>F{i + 1}</small>{k.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Proof({ text }: { text: string }) {
  return <>{text.split('\n').map((l, i) => <span key={i} className={l.includes('SAFE') ? 'hx-ok' : l.includes('SEQUENTIAL') || l.includes('RAW a[i]') ? 'hx-no' : ''}>{l}{'\n'}</span>)}</>
}

function Speedup() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const rows = [{ t: 1, v: 1 }, { t: 8, v: 5.79 }, { t: 32, v: 7.84 }]
  return (
    <div ref={ref} className={`hx-win hx-chart ${seen ? 'is-on' : ''}`}>
      <div className="hx-title"><span>SAXPY · 16M DOUBLES</span><span className="hx-tag">measured</span></div>
      <div className="hx-bars">
        {rows.map((r, i) => (
          <div key={r.t} className="hx-bar">
            <span>{r.t} {r.t === 1 ? 'THREAD' : 'THREADS'}</span>
            <div className="hx-cells">
              {Array.from({ length: 32 }, (_, k) => <i key={k} className={k < Math.round(r.v * 4) ? 'is-on' : ''} style={{ '--d': `${i * 300 + k * 28}ms` } as CSSProperties} />)}
            </div>
            <b>{r.v.toFixed(2)}×</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function Native() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  return (
    <div ref={ref} className={`hx-win hx-native ${seen ? 'is-on' : ''}`}>
      <div className="hx-title"><span>MATMUL 128² · ONE CELL = 5.9 MS</span></div>
      <div className="hx-native-body">
        <div><b>INTERPRETER</b><span>1,199 ms</span></div>
        <div className="hx-grid" aria-hidden="true">{Array.from({ length: 203 }, (_, k) => <i key={k} style={{ '--d': `${k * 6}ms` } as CSSProperties} />)}</div>
        <div><b>NATIVE</b><span>5.9 ms</span></div>
        <div className="hx-grid hx-grid--one" aria-hidden="true"><i /></div>
      </div>
    </div>
  )
}

export default function Helix({ c }: { c: Case }) {
  usePage('HELIX Lite · Noel Alex')
  return (
    <div className="hx">
      <SiteBar c={c} />
      <main id="main-content">
        <header className="hx-hero">
          <div className="hx-win hx-hero-win">
            <div className="hx-title"><span>HELIX LITE v1.0</span><span className="hx-tag">{c.status}</span></div>
            <div className="hx-hero-body">
              <div>
                <h1>HELIX<span className="hx-caret" aria-hidden="true" /></h1>
                <p className="hx-summary">{c.summary}.</p>
                <p className="hx-lede">{c.lede}</p>
                <p className="hx-cta">
                  <a href="https://noel-alex.github.io/helix-compiler/" target="_blank" rel="noreferrer" onClick={() => track('project_link', { id: 'helix', label: 'observatory-hero' })}>RUN IT IN YOUR BROWSER</a>
                </p>
              </div>
              <Diorama id="helix" className="hx-art" eager />
            </div>
          </div>
          <dl className="hx-stats">
            <div><dt>SAXPY · 8 THREADS</dt><dd><Count to={5.79} decimals={2} suffix="×" /></dd></div>
            <div><dt>PEAK · 32 THREADS</dt><dd><Count to={7.84} decimals={2} suffix="×" /></dd></div>
            <div><dt>KERNELS REFUSED ON PURPOSE</dt><dd>2 / 9</dd></div>
          </dl>
        </header>

        <section className="hx-sec">
          <h2>THE WHOLE PIPELINE, BY HAND</h2>
          <p className="hx-p">Lexer, Pratt parser, type checker, CFG, SSA, the classic optimizations, loop detection, a dependence battery, then Cranelift to x86-64. Every stage is mine and every stage is inspectable. Step through one loop:</p>
          <Machine />
        </section>

        <section className="hx-sec hx-sec--two">
          <div>
            <h2>PROVE IT, OR REFUSE</h2>
            <p className="hx-p">A parallelizing compiler that guesses is a bug generator. When HELIX can’t prove a loop is safe it runs it sequentially and names the dependence that stopped it. Refusing costs nothing; a wrong “safe” costs everything.</p>
          </div>
          <div className="hx-verdicts">
            <div className="hx-verdict hx-verdict--ok"><b>SAFE</b><code>out[i] = a[i] * 5.0</code><span>no loop-carried dependence</span></div>
            <div className="hx-verdict hx-verdict--no"><b>SEQUENTIAL</b><code>a[i] = a[i - 1] + 1</code><span>RAW a[i] ← a[i − 1], distance 1</span></div>
          </div>
        </section>

        <section className="hx-sec hx-sec--two">
          <Speedup />
          <Native />
        </section>
      </main>
      <ProjectEnd c={c} />
    </div>
  )
}
