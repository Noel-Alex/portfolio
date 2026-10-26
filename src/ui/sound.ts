import { store } from './store'

// Every sound here is synthesized; no samples are shipped.
let ctx: AudioContext | null = null
const audio = () => {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noiseBurst(duration: number, freq: number, gain: number, q = 1.4) {
  const a = audio(); if (!a) return
  const len = Math.floor(a.sampleRate * duration)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource(); src.buffer = buf
  const filter = a.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = q
  const g = a.createGain(); g.gain.value = gain
  src.connect(filter).connect(g).connect(a.destination)
  src.start()
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  const a = audio(); if (!a) return
  const o = a.createOscillator(); o.type = type; o.frequency.value = freq
  const g = a.createGain()
  const t = a.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t); o.stop(t + dur + 0.02)
}

const on = () => store.get().settings.sound

export const sfx = {
  click() { if (on()) { noiseBurst(0.045, 2400, 0.5, 0.9); tone(1180, 0, 0.05, 0.04, 'square') } },
  page() { if (on()) noiseBurst(0.16, 1500, 0.35, 0.6) },
  toast() { if (on()) { tone(784, 0, 0.35, 0.08); tone(1047, 0.12, 0.5, 0.08); tone(1568, 0.24, 0.6, 0.05) } },
  step() { if (on()) noiseBurst(0.07, 420 + Math.random() * 160, 0.18, 0.7) },
  pop() { if (on()) { tone(520, 0, 0.08, 0.08, 'triangle'); tone(780, 0.05, 0.1, 0.06, 'triangle') } },
  boom() { if (on()) { noiseBurst(0.9, 160, 1.2, 0.5); noiseBurst(0.4, 700, 0.5, 0.6) } },
  hiss() { if (on()) noiseBurst(1.4, 5200, 0.25, 0.4) },
  note() { if (on()) tone([523, 587, 659, 784, 880][Math.floor(Math.random() * 5)], 0, 0.5, 0.06, 'triangle') },
}
