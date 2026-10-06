import { glyph } from './atlas'
import { BUBBLES, PEARLS, SHADY, SHADY_B, STAGE, STALLS } from './data'
import { hash } from './kit'

export type Pose = { x: number; y: number; z: number; h: number; s: number; turn: number; sq: number; on: boolean; hat: number }
export type Ball = { x: number; y: number; z: number; h: number; r: number; on: boolean; tint: number }
export type Talk = { x: number; y: number; z: number; h: number; cell: number; pop: number }
export type Ring = { x: number; y: number; age: number }

type Hop = { at: number; to: number; t0: number; dur: number; ox: number; oy: number; nx: number; ny: number; prev: number }

export const FOLK_SIZE = 34
export const STAGE_SIZE = 62
const STAGE_TOP = STAGE_SIZE * 0.26
const HAGGLE = [0, 1, 4, 6, 9, 12, 15, 17]
const SCRIPT = [
  [0, '9!'],
  [1, '2'],
  [0, '5?'],
  [1, 'NO'],
  [0, '3'],
  [1, 'coin'],
  [0, 'heart'],
] as const
const BEAT = 1.15
const REST = 3.5
const HOPPERS = 24
const CROWD = 6

const pose = (x = 0, y = 0, z = 0, h = 0, s = FOLK_SIZE, hat = -1): Pose => ({ x, y, z, h, s, turn: 0, sq: 1, on: true, hat })

function slot(k: number, who: 'seller' | 'buyer') {
  const st = STALLS[k]
  const S = st.size
  if (st.kind === 3) return who === 'seller' ? [st.x - 0.62 * S, 0.44 * S, 0.07 * S] : [st.x - 0.2 * S, 1.12 * S, 0.02 * S]
  return who === 'seller' ? [st.x + 0.4 * S, -0.12 * S, 0.19 * S] : [st.x + 0.12 * S, 0.98 * S, 0.02 * S]
}

const stallOf = (b: number) => STALLS.findIndex((st) => Math.hypot(st.x - BUBBLES[b].x, st.y - BUBBLES[b].y) < 90)

function spot(b: number, seed: number): [number, number] {
  const k = stallOf(b)
  const bb = BUBBLES[b]
  if (k >= 0) {
    const st = STALLS[k]
    return [st.x + (hash(seed) - 0.5) * st.size * 1.2, st.y + st.size * (0.85 + hash(seed + 1) * 0.25)]
  }
  const a = hash(seed) * Math.PI * 2
  const d = hash(seed + 1) * bb.r * 0.4
  return [bb.x + Math.cos(a) * d, bb.y + Math.sin(a) * d]
}

export function makeMarket() {
  const sellers = STALLS.map((st, k) => {
    const [x, z, h] = slot(k, 'seller')
    return pose(x, st.y, z, h, FOLK_SIZE * 1.1, k % 3)
  })
  const buyers = HAGGLE.map((k, i) => {
    const [x, z, h] = slot(k, 'buyer')
    return pose(x, STALLS[k].y, z, h, FOLK_SIZE, (i + 1) % 4)
  })
  const hops: Hop[] = Array.from({ length: HOPPERS }, (_, i) => {
    const pick = Math.floor(hash(i * 7 + 1) * BUBBLES.length)
    const at = pick === SHADY_B ? (pick + 1) % BUBBLES.length : pick
    const [ox, oy] = spot(at, i * 13)
    return { at, to: at, t0: hash(i) * 4, dur: 1, ox, oy, nx: ox, ny: oy, prev: -1 }
  })
  const hoppers = hops.map((h, i) => pose(h.ox, h.oy, 0, 0, FOLK_SIZE * (0.85 + hash(i + 40) * 0.3), i % 4))
  const divers = PEARLS.map(([x, y], i) => pose(x, y, 0, 0, FOLK_SIZE, i % 2 ? 1 : 0))
  const juggler = pose(STAGE.x, STAGE.y, 0, 0, FOLK_SIZE * 1.15, 2)
  const kid = pose(STAGE.x, STAGE.y, 0, 0, FOLK_SIZE * 0.45, -1)
  const crowd = Array.from({ length: CROWD }, (_, i) => {
    const a = Math.PI * (0.05 + (i / (CROWD - 1)) * 0.9)
    return pose(STAGE.x + Math.cos(a) * 112, STAGE.y + Math.sin(a) * 92, 0, 0, FOLK_SIZE * (0.8 + hash(i + 70) * 0.35), (i + 2) % 4)
  })
  const shady = pose(SHADY.x + 48, SHADY.y, -6, 8, FOLK_SIZE * 1.1, -1)
  const gawker = pose(SHADY.x + 30, SHADY.y, 95, 7, FOLK_SIZE * 0.95, 3)
  const folk = [...sellers, ...buyers, ...hoppers, ...divers, juggler, kid, ...crowd, shady, gawker]
  const civil = [...buyers, ...hoppers, ...divers, juggler, kid, ...crowd, gawker]
  const balls: Ball[] = [
    ...Array.from({ length: 4 }, (_, i) => ({ x: 0, y: 0, z: 0, h: 0, r: 7, on: true, tint: i })),
    ...PEARLS.map(() => ({ x: 0, y: 0, z: 0, h: 0, r: 9, on: false, tint: 4 })),
  ]
  const talk: Talk[] = [...HAGGLE.map(() => ({ x: 0, y: 0, z: 0, h: 0, cell: 0, pop: 0 })), { x: 0, y: 0, z: 0, h: 0, cell: 0, pop: 0 }]
  const rings: Ring[] = PEARLS.flatMap(() => [{ x: 0, y: 0, age: 9 }, { x: 0, y: 0, age: 9 }])
  return { calm: true, base: Float32Array.from(civil.map((p) => p.x)), folk, sellers, buyers, hops, hoppers, divers, juggler, kid, crowd, shady, gawker, civil, balls, talk, rings, flee: new Float32Array(civil.length) }
}

export type Market = ReturnType<typeof makeMarket>

function haggle(m: Market, t: number) {
  HAGGLE.forEach((k, i) => {
    const seller = m.sellers[k]
    const buyer = m.buyers[i]
    const cycle = SCRIPT.length * BEAT + REST
    const u = (t + hash(i + 20) * cycle) % cycle
    const beat = Math.floor(u / BEAT)
    const line = SCRIPT[Math.min(beat, SCRIPT.length - 1)]
    const who = line[0] ? buyer : seller
    const talk = m.talk[i]
    const f = (u % BEAT) / BEAT
    const live = beat < SCRIPT.length
    talk.pop = live ? Math.min(1, f * 6) * (f > 0.88 ? (1 - f) / 0.12 : 1) : 0
    talk.cell = glyph(line[1])
    talk.x = who.x + (line[0] ? 14 : -14)
    talk.y = who.y
    talk.z = who.z
    talk.h = who.h + who.s * 1.55
    const deal = beat >= SCRIPT.length - 2 && live
    const bounce = (p: Pose, me: boolean) => (live && me ? Math.abs(Math.sin(f * Math.PI)) * 8 : 0) + (deal ? Math.abs(Math.sin(u * 9)) * 12 : 0)
    seller.h = slot(k, 'seller')[2] + bounce(seller, !line[0])
    buyer.h = slot(k, 'buyer')[2] + bounce(buyer, line[0] === 1)
    seller.turn = Math.sin(t * 0.5 + k) * 0.35 + 0.3
    buyer.turn = Math.PI * 0.82 + Math.sin(t * 0.7 + i) * 0.15
  })
}

function idle(m: Market, t: number) {
  m.sellers.forEach((p, k) => {
    if (HAGGLE.includes(k)) return
    p.h = slot(k, 'seller')[2] + Math.abs(Math.sin(t * 1.6 + k * 1.3)) * 5
    p.turn = Math.sin(t * 0.45 + k * 2) * 0.6
  })
}

function hop(m: Market, t: number) {
  m.hops.forEach((h, i) => {
    const p = m.hoppers[i]
    if (t < h.t0) {
      const wait = h.t0 - t
      p.x = h.ox
      p.y = h.oy
      p.h = 0
      p.sq = wait < 0.22 ? 0.72 + wait : 1
      return
    }
    const f = (t - h.t0) / h.dur
    if (f >= 1) {
      h.prev = h.at
      h.at = h.to
      h.ox = h.nx
      h.oy = h.ny
      const opts = BUBBLES[h.at].near.filter((n) => n !== h.prev && n !== SHADY_B)
      const pick = opts.length ? opts : BUBBLES[h.at].near.filter((n) => n !== SHADY_B)
      const shop = pick.filter((n) => stallOf(n) >= 0)
      const r = hash(i * 31 + t)
      h.to = shop.length && r < 0.45 ? shop[Math.floor(r * 2.2 * shop.length) % shop.length] : pick[Math.floor(r * pick.length)] ?? h.at
      ;[h.nx, h.ny] = spot(h.to, i * 17 + Math.floor(t))
      h.dur = 0.55 + Math.hypot(h.nx - h.ox, h.ny - h.oy) / 520
      h.t0 = t + 0.6 + hash(i + t) * (stallOf(h.at) >= 0 ? 4 : 1.6)
      p.sq = 1.25
      return
    }
    const e = f * f * (3 - 2 * f) * 0.6 + f * 0.4
    p.x = h.ox + (h.nx - h.ox) * e
    p.y = h.oy + (h.ny - h.oy) * e
    p.h = Math.sin(f * Math.PI) * (50 + Math.hypot(h.nx - h.ox, h.ny - h.oy) * 0.3)
    p.sq = 1.12
    p.turn = Math.atan2(h.nx - h.ox, h.ny - h.oy) * 0.55
  })
}

function dive(m: Market, t: number, calm: boolean) {
  PEARLS.forEach(([px, py], i) => {
    const p = m.divers[i]
    const ball = m.balls[4 + i]
    const period = 12 + hash(i + 3) * 5
    const u = calm ? (t + hash(i) * period) % period : 0
    const a = hash(i + 9) * Math.PI * 2
    const rx = px + Math.cos(a) * 95
    const ry = py + Math.sin(a) * 70
    const r1 = m.rings[i * 2]
    const r2 = m.rings[i * 2 + 1]
    r1.x = r2.x = px
    r1.y = r2.y = py
    r1.age = u - 3.8
    r2.age = u - 7
    ball.on = false
    p.on = true
    p.sq = 1
    if (u < 3) {
      p.x = rx
      p.y = ry
      p.h = u > 2.6 ? 0 : Math.abs(Math.sin(u * 2.2)) * 3
      p.sq = u > 2.6 ? 0.75 : 1
      p.turn = Math.sin(u * 1.5 + i) * 0.5
      return
    }
    if (u < 3.8) {
      const f = (u - 3) / 0.8
      p.x = rx + (px - rx) * f
      p.y = ry + (py - ry) * f
      p.h = Math.sin(f * Math.PI) * 110 - f * f * 30
      p.turn = t * 9
      return
    }
    if (u < 7) {
      p.on = false
      return
    }
    p.x = px
    p.y = py
    p.turn = 0
    if (u < 9) {
      const f = Math.min(1, (u - 7) * 4)
      p.h = -20 * (1 - f) + Math.abs(Math.sin(u * 5)) * 6
      ball.on = true
      ball.x = px
      ball.y = py
      ball.z = 0
      ball.h = p.h + p.s * 1.3
      return
    }
    if (u < 9.8) {
      const f = (u - 9) / 0.8
      const st = STALLS.reduce((b, s) => (Math.hypot(s.x - px, s.y - py) < Math.hypot(b.x - px, b.y - py) ? s : b))
      ball.on = f < 0.98
      ball.x = px + (st.x - px) * f
      ball.y = py + (st.y + st.size * 0.3 - py) * f
      ball.h = p.s * 1.3 + Math.sin(f * Math.PI) * 160
      p.h = 0
      return
    }
    const f = Math.min(1, (u - 9.8) / 1.8)
    p.x = px + (rx - px) * f
    p.y = py + (ry - py) * f
    p.h = Math.abs(Math.sin(f * Math.PI * 4)) * 14
    p.turn = Math.atan2(rx - px, ry - py) * 0.5
  })
}

function juggle(m: Market, t: number, calm: boolean) {
  const j = m.juggler
  const beat = t * 1.9
  j.h = STAGE_TOP + Math.abs(Math.sin(beat * Math.PI)) * 3
  j.turn = Math.sin(t * 0.8) * 0.2
  const flyers = [...m.balls.slice(0, 4), m.kid]
  flyers.forEach((b, k) => {
    const u = (t * 0.38 + k / 5) % 1
    const back = u >= 0.5
    const s = (u * 2) % 1
    const from = back ? 20 : -20
    const x = j.x + from + (-2 * from) * s
    const h = j.h + j.s * 0.55 + 4 * s * (1 - s) * (k === 4 ? 150 : 110)
    if (!calm) {
      b.x = j.x + (k - 2) * 26
      b.h = 0
      return
    }
    b.x = x
    b.y = j.y
    b.h = h
  })
  m.kid.turn = t * 7
  m.kid.z = 14
  m.balls.slice(0, 4).forEach((b) => (b.z = 14))
  m.crowd.forEach((c, i) => {
    c.h = Math.abs(Math.sin(t * (2.2 + hash(i) * 1.4) + i)) * (6 + hash(i + 5) * 8)
    c.turn = Math.atan2(j.x - c.x, j.y - c.y) * 0.8
  })
}

function shady(m: Market, t: number, jolt: number) {
  m.shady.h = 7 + Math.abs(Math.sin(t * 1.1)) * 3
  m.shady.turn = Math.sin(t * 0.3) * 0.5 - 0.2
  m.gawker.turn = Math.PI * 0.85 + jolt * 0.6
  m.gawker.h = 7 + jolt * 22
  m.gawker.z = 95 + jolt * 25
  const talk = m.talk[HAGGLE.length]
  const u = t % 7
  talk.cell = glyph(u < 3.5 ? '3' : '?!')
  const who = u < 3.5 ? m.shady : m.gawker
  talk.x = who.x
  talk.y = who.y
  talk.z = who.z
  talk.h = who.h + who.s * 1.6
  talk.pop = (u % 3.5) < 2.4 ? Math.min(1, (u % 3.5) * 5) : 0
}

export function step(m: Market, t: number, dt: number, panic: number, jolt: number) {
  const calm = panic < 0.12
  m.calm = calm
  m.civil.forEach((p, i) => {
    p.x = m.base[i]
    p.on = true
  })
  haggle(m, t)
  idle(m, t)
  hop(m, t)
  dive(m, t, calm)
  juggle(m, t, calm)
  shady(m, t, jolt)
  m.sellers.forEach((p) => (p.h -= Math.min(1, panic * 4) * 34))
  m.civil.forEach((p, i) => {
    m.flee[i] = Math.max(0, Math.min(2600, m.flee[i] + dt * (calm ? -900 : 300 + hash(i) * 200)))
    const f = m.flee[i]
    if (f <= 0) return
    p.x -= f
    p.h += Math.abs(Math.sin(t * 10 + i)) * 22
    p.turn = -Math.PI / 2 * 0.7
    p.on = p.on && f < 2400
  })
  if (!calm) m.talk.forEach((k) => (k.pop = 0))
}
