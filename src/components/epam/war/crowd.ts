import { CELL, reach, type Squad, type War } from './sim'

export const PATROL = 0
export const FIGHT = 1
export const FALLEN = 2
export const EATEN = 3
export const FADE = 4
export const CAPACITY = 8192
const RUN = 3400
const LOOK = 0.6
const FIGHTERS = 0.75
const IDLE = 10
const DOOR = 40

export type Agent = {
  squad: number
  x: number
  y: number
  tx: number
  ty: number
  state: number
  age: number
  seed: number
  angle: number
  ring: number
  look: number
  face: number
  inside: boolean
  kind: number
}

export type Crowd = {
  agents: Agent[]
  ready: boolean
  fallen: number
  eaten: number
  cheer: boolean
  next: () => number
}

export function createCrowd(seed = 3): Crowd {
  let a = seed
  const next = () => ((a = (a * 16807) % 2147483647) - 1) / 2147483646
  return {
    agents: [],
    ready: false,
    fallen: 0,
    eaten: 0,
    cheer: false,
    next,
  }
}

export const alive = (a: Agent) => a.state < FALLEN

const cellAt = (war: War, x: number, y: number) => {
  const c = Math.min(war.cols - 1, Math.max(0, Math.floor(x / CELL)))
  const r = Math.min(war.rows - 1, Math.max(0, Math.floor(y / CELL)))
  return r * war.cols + c
}

const danger = (war: War, a: Agent) =>
  war.corrupt[cellAt(war, a.x, a.y)] +
  (a.state === FIGHT ? 1 : 0) +
  a.seed * 0.01

function die(crowd: Crowd, war: War, a: Agent) {
  a.state = war.corrupt[cellAt(war, a.x, a.y)] >= 0.5 ? EATEN : FALLEN
  a.age = 0
  if (a.state === EATEN) crowd.eaten++
  else crowd.fallen++
}

function spawn(crowd: Crowd, s: Squad, kind: number) {
  const { next } = crowd
  const angle = next() * Math.PI * 2
  const ring = Math.sqrt(next())
  const r = crowd.ready ? 60 * next() : ring * reach(s) * 0.8
  const x = s.x + Math.cos(angle) * r
  const y = s.y + Math.sin(angle) * r
  crowd.agents.push({
    squad: s.id,
    x,
    y,
    tx: x,
    ty: y,
    state: PATROL,
    age: next() * 10,
    seed: next(),
    angle,
    ring,
    look: 0,
    face: 0,
    inside: false,
    kind,
  })
}

function enemy(war: War, s: Squad, a: Agent) {
  const r = reach(s)
  const c0 = Math.max(0, Math.floor((s.x - r) / CELL))
  const c1 = Math.min(war.cols - 1, Math.floor((s.x + r) / CELL))
  const r0 = Math.max(0, Math.floor((s.y - r) / CELL))
  const r1 = Math.min(war.rows - 1, Math.floor((s.y + r) / CELL))
  const px = s.x + Math.cos(a.angle) * a.ring * r
  const py = s.y + Math.sin(a.angle) * a.ring * r
  let best = Infinity
  let bx = 0
  let by = 0
  for (let row = r0; row <= r1; row++)
    for (let c = c0; c <= c1; c++) {
      const i = row * war.cols + c
      if (war.corrupt[i] < 0.5 || !war.seen[i]) continue
      const x = (c + 0.5) * CELL
      const y = (row + 0.5) * CELL
      if (Math.hypot(x - s.x, y - s.y) > r) continue
      const d = Math.hypot(x - px, y - py)
      if (d < best) {
        best = d
        bx = x
        by = y
      }
    }
  if (best === Infinity) return null
  best = Math.hypot(bx - a.x, by - a.y)
  const pull = Math.min(best, CELL * 0.55) / Math.max(best, 1)
  return { x: bx - (bx - a.x) * pull, y: by - (by - a.y) * pull }
}

function steer(war: War, s: Squad, a: Agent, dt: number, next: () => number) {
  a.look -= dt
  const out = s.fighting || war.won !== null || a.seed < IDLE / s.crew
  if (out) a.inside = false
  else if (a.inside) return
  else if (Math.hypot(s.x - a.x, s.y - a.y) < DOOR) {
    a.inside = true
    a.state = PATROL
    return
  }
  const fighter = s.fighting && a.seed < FIGHTERS
  if (fighter && a.look <= 0) {
    a.look = LOOK * (0.5 + next())
    const spot = enemy(war, s, a)
    a.state = spot ? FIGHT : PATROL
    if (spot) {
      a.tx = spot.x
      a.ty = spot.y
    }
  }
  if (!fighter) a.state = PATROL
  let tx = a.tx
  let ty = a.ty
  if (!out) {
    tx = s.x
    ty = s.y
  } else if (a.state === FIGHT) {
    const jab = Math.sin(a.age * 9 + a.seed * 40) * CELL * 0.18
    const d = Math.hypot(tx - a.x, ty - a.y) || 1
    tx += ((tx - a.x) / d) * jab
    ty += ((ty - a.y) / d) * jab
  } else {
    const r = reach(s) * 0.8
    const angle = a.angle + a.age * (a.seed - 0.5) * 0.3
    tx =
      s.x +
      Math.cos(angle) * a.ring * r +
      Math.sin(a.age * 1.7 + a.seed * 40) * 40
    ty =
      s.y +
      Math.sin(angle) * a.ring * r +
      Math.cos(a.age * 1.3 + a.seed * 30) * 40
  }
  const dx = tx - a.x
  const dy = ty - a.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-3) return
  const move = Math.min(d, Math.min(RUN, d * 2.5 + 30) * dt)
  a.x += (dx / d) * move
  a.y += (dy / d) * move
  if (d > 4) a.face += (dx / d - a.face) * Math.min(1, dt * 6)
}

export function syncCrowd(crowd: Crowd, war: War, dt: number) {
  const squads = new Map(war.squads.map((s) => [s.id, s]))
  const groups = new Map<number, Agent[]>()
  for (const a of crowd.agents) {
    a.age += dt
    if (!alive(a)) continue
    const list = groups.get(a.squad)
    if (list) list.push(a)
    else groups.set(a.squad, [a])
  }
  for (const [id, list] of groups)
    if (!squads.has(id)) for (const a of list) die(crowd, war, a)
  for (const s of war.squads) {
    const list = groups.get(s.id) ?? []
    const extra = s.mix.map((n) => -n)
    for (const a of list) extra[a.kind]++
    if (list.length > s.crew || extra.some((n) => n > 0)) {
      list.sort((a, b) => danger(war, b) - danger(war, a))
      for (const a of list)
        if (extra[a.kind] > 0) {
          extra[a.kind]--
          die(crowd, war, a)
        }
    }
    extra.forEach((n, kind) => {
      for (let k = n; k < 0 && crowd.agents.length < CAPACITY; k++)
        spawn(crowd, s, kind)
    })
  }
  crowd.ready = true
  crowd.cheer = war.won !== null
  for (const a of crowd.agents) {
    const s = squads.get(a.squad)
    if (s && alive(a)) steer(war, s, a, dt, crowd.next)
  }
  crowd.agents = crowd.agents.filter((a) => alive(a) || a.age < FADE)
}

export const headcount = (crowd: Crowd) => crowd.agents.filter(alive).length
