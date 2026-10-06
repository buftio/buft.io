import * as THREE from 'three'
import {
  ACROSS, ALONG, ARC_T0, ARC_T1, H2, MILLS, PITCH_Q, RIVER_T0, RIVER_T1, WALK, WHEEL_R, WHEEL_Z,
  GATE_X, craneAt, damAt, deckAt, hash, lift, millAt, river, road, spot,
} from './layout'

export const RIVER_BEADS = 110
const TRAIN = 11
const GAP = 34
const SPAN = RIVER_T1 - RIVER_T0 + 80
export const CHANNEL_BEADS = 60
export const PUFFS = 22
const SPEED = 520
const WHEEL_T = MILLS.map((t) => t - 23)

type Walker = { kind: 'deck'; a: number; b: number; period: number; phase: number; load: number }
type Ground = { kind: 'ground'; a: [number, number]; b: [number, number]; period: number; phase: number; load: number }
type Spec =
  | Walker
  | Ground
  | { kind: 'warden' }
  | { kind: 'cheer'; at: [number, number]; t: number }
  | { kind: 'surfer' }
  | { kind: 'sneezer' }
  | { kind: 'winch' }
  | { kind: 'hauler'; phase: number }
  | { kind: 'boat'; at: [number, number]; r: number; period: number }

export const LARD = 0
export const FLOUR = 1

export const FOLK: Spec[] = [
  { kind: 'warden' },
  { kind: 'deck', a: ARC_T1 - 20, b: MILLS[2] + 40, period: 9, phase: 0, load: LARD },
  { kind: 'deck', a: MILLS[2] - 40, b: MILLS[1] + 40, period: 11, phase: 0.4, load: FLOUR },
  { kind: 'deck', a: MILLS[1] - 40, b: ARC_T0 + 45, period: 16, phase: 0.1, load: FLOUR },
  { kind: 'deck', a: MILLS[0] - 40, b: ARC_T0 + 45, period: 10, phase: 0.65, load: FLOUR },
  { kind: 'ground', a: [-1380, 180], b: [-790, 330], period: 14, phase: 0, load: LARD },
  { kind: 'ground', a: [-1300, 420], b: [-770, 360], period: 17, phase: 0.55, load: LARD },
  { kind: 'surfer' },
  { kind: 'sneezer' },
  { kind: 'winch' },
  { kind: 'hauler', phase: 0 },
  { kind: 'hauler', phase: 0.5 },
  ...[0, 1, 2, 3, 4].map((k) => ({ kind: 'cheer' as const, at: spot(-410 + k * 40, -258 - (k % 2) * 14), t: -330 })),
  { kind: 'boat', at: spot(-60, 40), r: 70, period: 23 },
  { kind: 'boat', at: spot(380, 40), r: 55, period: -17 },
]

export const CARGO = 9

export type Life = {
  time: number
  next: number
  start: number
  count: number
  gate: number
  spin: number[]
  kick: number[]
  alarm: number
  check: number
  river: Float32Array
  chan: Float32Array
  flee: Float32Array
  puff: Float32Array
  surf: { mode: number; t: number }
  sneeze: number
  danger: number
}

export function newLife(): Life {
  const r = new Float32Array(RIVER_BEADS)
  for (let i = 0; i < RIVER_BEADS; i++) {
    const g = Math.floor(i / TRAIN)
    const t = RIVER_T0 + ((g + 0.4 * hash(g + 40)) / (RIVER_BEADS / TRAIN)) * SPAN - (i % TRAIN) * GAP * (0.75 + 0.6 * hash(i + 3))
    r[i] = t < RIVER_T0 - 80 ? t + SPAN : t
  }
  const c = new Float32Array(CHANNEL_BEADS)
  for (let i = 0; i < CHANNEL_BEADS; i++) c[i] = hash(i + 500) * (chanLen(i % 3) + 140)
  const p = new Float32Array(PUFFS)
  for (let i = 0; i < PUFFS; i++) p[i] = hash(i + 900)
  return {
    time: 0, next: 2.5, start: -100, count: 0, gate: 0, spin: [0, 0, 0, 0], kick: [0, 0, 0], alarm: 0, check: 0,
    river: r, chan: c, flee: new Float32Array(FOLK.length), puff: p, surf: { mode: 2, t: RIVER_T0 + 20 }, sneeze: 4, danger: 0,
  }
}

const chanLen = (k: number) => WHEEL_T[k] + 23 - ARC_T0 - 20

export function front(s: Life) {
  const tau = s.time - s.start
  return tau < 0.8 ? -1e5 : RIVER_T0 + SPEED * (tau - 0.8)
}

export const wave = (s: Life, t: number) => {
  const f = front(s)
  if (f < RIVER_T0 - 10 || f > RIVER_T1 + 600) return 0
  const d = (t - f) / 240
  return Math.exp(-d * d) + (t < f ? 0.35 * Math.exp((t - f) / 900) : 0)
}

export function step(s: Life, dt: number, threat: number) {
  s.time += dt
  s.alarm += ((threat > 0.12 ? 1 : 0) - s.alarm) * Math.min(1, dt * 0.8)
  if (s.time > s.next) {
    s.count++
    s.next = s.time + 11 + 6 * hash(s.count)
    if (s.alarm < 0.3) {
      s.start = s.time
      if (s.surf.mode === 2) s.surf.mode = 0
    }
  }
  const tau = s.time - s.start
  const open = tau < 0.8 ? tau / 0.8 : tau < 3.6 ? 1 : Math.max(0, 1 - (tau - 3.6) / 0.9)
  s.gate = open * (1 - s.alarm)
  const f = front(s)
  for (let k = 0; k < 3; k++) {
    if (Math.abs(f - WHEEL_T[k]) < SPEED * dt * 1.5 + 1) s.kick[k] = 1
    s.kick[k] *= Math.exp(-dt / 3.2)
    s.spin[k] -= (0.35 + 2.4 * s.kick[k]) * (1 - s.alarm) * dt
  }
  s.spin[3] += (tau < 4.4 ? 3 : 0.15) * dt * (1 - s.alarm)
  for (let i = 0; i < RIVER_BEADS; i++) {
    const t = s.river[i]
    s.river[i] = t + ((24 + 22 * hash(Math.floor(i / TRAIN) + 77)) * (1 - 0.7 * s.alarm) + 170 * wave(s, t)) * dt
    if (s.river[i] > RIVER_T1) s.river[i] -= SPAN
  }
  for (let i = 0; i < CHANNEL_BEADS; i++) {
    const L = chanLen(i % 3)
    const c = s.chan[i]
    const v = c < L ? (60 + 40 * hash(i)) + 480 * wave(s, ARC_T0 + 20 + c) : 230
    s.chan[i] = c + v * (1 - s.alarm) * dt
    if (s.chan[i] > L + 140) s.chan[i] = 0
  }
  if (s.surf.mode === 0 && f > RIVER_T1 - 60) {
    s.surf.mode = 1
    s.surf.t = RIVER_T1 - 60
  }
  if (s.surf.mode === 1) {
    s.surf.t -= (tau < 6 && s.time > 6 ? 240 : 95) * dt
    if (s.surf.t < RIVER_T0 + 30) s.surf.mode = 2
  }
  for (let i = 0; i < FOLK.length; i++) s.flee[i] = Math.min(1, Math.max(0, s.flee[i] + (s.alarm > 0.5 ? dt / (2 + hash(i) * 2) : -dt / 3)))
  for (let i = 0; i < PUFFS; i++) {
    const m = i % 3
    s.puff[i] = (s.puff[i] + dt * (i < 15 ? (0.22 + 0.5 * s.kick[m]) * (1 - s.alarm) : 0.7)) % 1
  }
  if (s.time > s.sneeze + 9 + 5 * hash(Math.floor(s.sneeze))) s.sneeze = s.time
}

const q = new THREE.Quaternion()
const lean = new THREE.Quaternion()
const zAxis = new THREE.Vector3(0, 0, 1)
const p = new THREE.Vector3()
const sc = new THREE.Vector3()
const v = new THREE.Vector3()
const exitTo = new THREE.Vector3()
export const folkAt = p
export const folkSize = { value: 30 }

export function pose(m: THREE.Matrix4, pos: THREE.Vector3, size: number, tilt = 0) {
  lean.setFromAxisAngle(zAxis, tilt)
  q.copy(PITCH_Q).multiply(lean)
  return m.compose(pos, q, sc.set(size, size, size))
}

function shuttle(time: number, period: number, phase: number) {
  const u = ((time / period + phase) % 1 + 1) % 1
  const go = u < 0.5
  const g = go ? u * 2 : (1 - u) * 2
  const e = Math.min(1, Math.max(0, (g - 0.08) / 0.84))
  return { e: e * e * (3 - 2 * e), go, moving: g > 0.08 && g < 0.92 }
}

export function folkFrame(s: Life, i: number, m: THREE.Matrix4, cart: THREE.Matrix4 | null) {
  const spec = FOLK[i]
  const t = s.time + hash(i) * 10
  let size = 30
  let tilt = 0
  let carry = -1
  let hop = 0
  switch (spec.kind) {
    case 'warden': {
      const crank = s.time - s.start < 4.4 && s.alarm < 0.5
      lift(damAt(), ACROSS, GATE_X + 20, 182 + (crank ? Math.abs(Math.sin(t * 6)) * 6 : 0), -26, p)
      tilt = crank ? Math.sin(t * 6) * 0.35 : Math.sin(t) * 0.05
      size = 34
      break
    }
    case 'deck': {
      const r = shuttle(s.time, spec.period, spec.phase)
      lift(deckAt(spec.a + (spec.b - spec.a) * r.e), ALONG, 0, H2 + 4 + (r.moving ? Math.abs(Math.sin(t * 9)) * 4 : 0), WALK, p)
      tilt = r.moving ? Math.sin(t * 9) * 0.12 : 0
      if (r.go) carry = 1
      break
    }
    case 'ground': {
      const r = shuttle(s.time, spec.period, spec.phase)
      const x = spec.a[0] + (spec.b[0] - spec.a[0]) * r.e
      const y = spec.a[1] + (spec.b[1] - spec.a[1]) * r.e
      lift([x, y], 0, 0, r.moving ? Math.abs(Math.sin(t * 8)) * 4 : 0, 0, p)
      tilt = r.moving ? Math.sin(t * 8) * 0.1 : 0
      if (r.go) carry = 0
      break
    }
    case 'cheer': {
      const w = wave(s, spec.t)
      hop = w > 0.3 ? Math.abs(Math.sin(t * 7)) * 18 * w : Math.abs(Math.sin(t * 1.3)) * 1.5
      lift(spec.at, 0, 0, hop, 0, p)
      size = 28
      tilt = w > 0.3 ? Math.sin(t * 5) * 0.3 : 0
      break
    }
    case 'surfer': {
      const mode = s.surf.mode
      const tt = mode === 0 ? Math.max(RIVER_T0 + 30, front(s)) : s.surf.t
      const [c, h] = river(tt)
      const n = mode === 0 ? c + Math.sin(t * 2) * h * 0.3 : c - h - 55
      lift(spot(tt, n), 0, 0, mode === 0 ? 14 + Math.sin(t * 9) * 4 : Math.abs(Math.sin(t * (mode === 1 ? 8 : 1))) * 4, 0, p)
      tilt = mode === 0 ? Math.sin(t * 3) * 0.3 : 0
      carry = mode === 0 ? 2 : 3
      break
    }
    case 'sneezer': {
      const a = s.time - s.sneeze
      hop = a < 0.5 ? Math.sin((a / 0.5) * Math.PI) * 14 : 0
      lift(deckAt(MILLS[1] + 30), ALONG, 0, H2 + 4 + hop, WALK, p)
      tilt = a < 0.6 ? -0.4 * Math.sin((a / 0.6) * Math.PI) : a < 1.6 ? 0 : Math.sin(t * 0.7) * 0.05
      break
    }
    case 'winch': {
      lift(craneAt(), ALONG, 44, Math.abs(Math.sin(t * 3)) * 3, 40, p)
      tilt = Math.sin(t * 3) * 0.25
      break
    }
    case 'hauler': {
      const f = ((s.time / 34 + spec.phase) % 1 + 1) % 1
      const [x, y] = road(f)
      lift([x, y], 0, 0, Math.abs(Math.sin(t * 7)) * 3, 0, p)
      const fade = Math.min(1, f * 12, (1 - f) * 12)
      size = 30 * fade
      tilt = Math.sin(t * 7) * 0.1
      if (cart) {
        const [cx, cy] = road(Math.max(0, f - 0.025))
        pose(cart, lift([cx, cy], 0, 0, 0, 0, v).setZ(2), 34 * fade, 0)
      }
      break
    }
    case 'boat': {
      const a = (s.time / spec.period) * Math.PI * 2 + hash(i) * 6
      const push = 60 * wave(s, -60)
      const x = spec.at[0] + Math.cos(a) * spec.r - push * 0.7
      const y = spec.at[1] + Math.sin(a) * spec.r * 0.7 + push * 0.7
      const rock = Math.sin(t * 2.3) * 0.12 + push * 0.004 * Math.sin(t * 9)
      if (cart) pose(cart, lift([x, y], 0, 0, 0, 0, v).setZ(3), 30, rock)
      lift([x, y], 0, 0, 5 + Math.abs(Math.sin(t * 0.9)) * 2, 0, p)
      tilt = rock
      size = 28
      break
    }
  }
  const f = s.flee[i]
  if (f > 0) {
    exitTo.set(-1500 + hash(i + 3) * 200, -(-200 + hash(i + 4) * 600), 4)
    const e = f * f * (3 - 2 * f)
    if (spec.kind === 'deck' || spec.kind === 'sneezer' || spec.kind === 'warden') {
      p.z += Math.sin(e * Math.PI) * 30
      size *= 1 - e
    } else {
      p.lerp(exitTo, e)
      size *= f > 0.85 ? (1 - f) / 0.15 : 1
      tilt = Math.sin(t * 14) * 0.2
    }
    if (carry === 2 || carry === 3) carry = -1
  }
  p.z += 3
  pose(m, p, size, tilt)
  folkSize.value = size
  return carry
}

export const beadFade = (t: number) => Math.min(1, Math.max(0, (t - RIVER_T0) / 60), Math.max(0, (RIVER_T1 - t) / 80))

export function beadPos(s: Life, i: number, out: THREE.Vector3) {
  if (i < RIVER_BEADS) {
    const g = Math.floor(i / TRAIN)
    const t = Math.max(RIVER_T0, s.river[i])
    const [c, h] = river(t)
    const lane = (hash(g + 31) * 2 - 1) * 0.6 + Math.sin(t / 130 + g * 1.7) * 0.22 + (hash(i + 9) - 0.5) * 0.3
    return lift(spot(t, c + lane * h), 0, 0, 0, 0, out).setZ(5)
  }
  const j = i - RIVER_BEADS
  const k = j % 3
  const c = s.chan[j]
  const L = chanLen(k)
  const jit = (hash(j + 61) * 2 - 1) * 16
  if (c < L) return lift(deckAt(ARC_T0 + 20 + c), ALONG, jit * 0.6, H2 + 13, jit, out)
  const ph = (c - L) / 140
  if (ph < 0.3) {
    const g = ph / 0.3
    return lift(millAt(k), ALONG, jit * 0.5, H2 + 14 - (H2 - 30) * g * 0.13, 12 + (WHEEL_Z - 18) * g, out)
  }
  const g = (ph - 0.3) / 0.7
  return lift(millAt(k), ALONG, jit + 20, (2 * WHEEL_R + 8) * (1 - g * g), WHEEL_Z + 26, out)
}
