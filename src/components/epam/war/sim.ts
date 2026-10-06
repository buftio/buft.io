import type { Deposit } from './fat'

export const CELL = 128
export const RADIUS = 2000
export const CREW = 100
const GROW = 0.05
const ATTACK = 0.03
const SIGHT = 0.3
const LOSS = 0.01
const START = 300
const GLOW = 10

export type Point = { x: number; y: number }

export type Squad = {
  id: number
  x: number
  y: number
  crew: number
  wounds: number
  fighting: boolean
  from: Point | null
}

export type Mine = {
  id: number
  x: number
  y: number
  rich: number
  from: Point | null
}

export type Keep = Point & { lit: boolean; known: boolean }
export type Seep = Deposit & { known: boolean }

export type War = {
  cols: number
  rows: number
  tissue: Uint8Array
  folk: Uint8Array
  scar: Uint8Array
  corrupt: Float32Array
  owner: Int8Array
  seen: Uint8Array
  light: Float32Array
  glow: Float32Array
  lights: string
  marks: number[]
  spotted: boolean[]
  guard: Uint8Array
  pace: Float32Array
  squads: Squad[]
  mines: Mine[]
  deposits: Seep[]
  castles: Keep[]
  fat: number
  income: number
  tumors: number
  contained: number[]
  group: number[]
  fallen: number
  corrupted: number
  folkTotal: number
  folkLost: number
  nextId: number
  time: number
  won: number | null
}

export const reach = (s: Squad) => RADIUS * Math.sqrt(s.crew / CREW)

function random(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function inside(poly: [number, number][], x: number, y: number) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit
  }
  return hit
}

export function createWar(
  size: { width: number; height: number },
  tumors: [number, number][][],
  land: {
    tissue: Uint8Array
    folk: Uint8Array
    castles: Point[]
    deposits: Deposit[]
  },
  seed = 7,
): War {
  const cols = Math.ceil(size.width / CELL)
  const rows = Math.ceil(size.height / CELL)
  const n = cols * rows
  const rand = random(seed)
  const tissue = land.tissue.slice()
  const folk = land.folk.slice()
  const corrupt = new Float32Array(n)
  const scar = new Uint8Array(n)
  const owner = new Int8Array(n).fill(-1)
  const pace = new Float32Array(n)
  for (let i = 0; i < n; i++) pace[i] = 0.4 + rand() * 1.2
  const marks = tumors.map((poly) => {
    const x = poly.reduce((s, [px]) => s + px, 0) / poly.length
    const y = poly.reduce((s, [, py]) => s + py, 0) / poly.length
    return (
      Math.min(rows - 1, Math.floor(y / CELL)) * cols +
      Math.min(cols - 1, Math.floor(x / CELL))
    )
  })
  tumors.forEach((poly, k) => {
    const xs = poly.map(([x]) => x)
    const ys = poly.map(([, y]) => y)
    const c0 = Math.max(0, Math.floor(Math.min(...xs) / CELL))
    const c1 = Math.min(cols - 1, Math.floor(Math.max(...xs) / CELL))
    const r0 = Math.max(0, Math.floor(Math.min(...ys) / CELL))
    const r1 = Math.min(rows - 1, Math.floor(Math.max(...ys) / CELL))
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        if (inside(poly, (c + 0.5) * CELL, (r + 0.5) * CELL)) {
          const i = r * cols + c
          tissue[i] = 1
          folk[i] = 0
          scar[i] = 1
          corrupt[i] = 1
          owner[i] = k
          if (owner[marks[k]] !== k) marks[k] = i
        }
  })
  let [sx, sy, sn] = [0, 0, 0]
  for (let i = 0; i < n; i++)
    if (tissue[i]) {
      sx += (i % cols) + 0.5
      sy += Math.floor(i / cols) + 0.5
      sn++
    }
  const heart = {
    x: (sx / Math.max(1, sn)) * CELL,
    y: (sy / Math.max(1, sn)) * CELL,
  }
  const away = (p: Point) => Math.hypot(p.x - heart.x, p.y - heart.y)
  const first = land.castles.reduce(
    (a, b) => (away(b) < away(a) ? b : a),
    land.castles[0],
  )
  const war: War = {
    cols,
    rows,
    tissue,
    folk,
    scar,
    corrupt,
    owner,
    seen: new Uint8Array(n),
    light: new Float32Array(n),
    glow: new Float32Array(n),
    lights: '',
    marks,
    spotted: tumors.map(() => false),
    guard: new Uint8Array(n),
    pace,
    squads: [],
    mines: [],
    deposits: land.deposits.map(({ x, y, rich }) => ({
      x,
      y,
      rich,
      known: false,
    })),
    castles: land.castles.map(({ x, y }) => ({
      x,
      y,
      lit: x === first.x && y === first.y,
      known: false,
    })),
    fat: START,
    income: 0,
    tumors: tumors.length,
    contained: tumors.map(() => 0),
    group: tumors.map((_, k) => k),
    fallen: 0,
    corrupted: 0,
    folkTotal: folk.reduce((sum, v) => sum + v, 0),
    folkLost: 0,
    nextId: 0,
    time: 0,
    won: null,
  }
  stampGuard(war)
  measure(war)
  return war
}

export function enlist(war: War, x: number, y: number, crew = CREW) {
  const squad: Squad = {
    id: war.nextId++,
    x,
    y,
    crew,
    wounds: 0,
    fighting: false,
    from: null,
  }
  war.squads.push(squad)
  return squad
}

export function eachCell(
  war: War,
  x: number,
  y: number,
  radius: number,
  visit: (i: number, d: number) => void,
) {
  const c0 = Math.max(0, Math.floor((x - radius) / CELL))
  const c1 = Math.min(war.cols - 1, Math.floor((x + radius) / CELL))
  const r0 = Math.max(0, Math.floor((y - radius) / CELL))
  const r1 = Math.min(war.rows - 1, Math.floor((y + radius) / CELL))
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const d = Math.hypot((c + 0.5) * CELL - x, (r + 0.5) * CELL - y)
      if (d <= radius) visit(r * war.cols + c, d)
    }
}

function stampGuard(war: War) {
  war.guard.fill(0)
  for (const s of war.squads)
    eachCell(war, s.x, s.y, reach(s), (i) => (war.guard[i] = 1))
}

function fight(war: War, dt: number) {
  for (const s of war.squads) {
    const r = reach(s)
    let mass = 0
    eachCell(war, s.x, s.y, r, (i, d) => {
      if (d <= r * SIGHT) war.seen[i] = 1
      if (!war.seen[i] || war.corrupt[i] <= 0) return
      mass += war.corrupt[i]
      war.corrupt[i] = Math.max(0, war.corrupt[i] - ATTACK * dt)
      if (war.corrupt[i] < 0.5) war.owner[i] = -1
    })
    s.fighting = mass > 0
    s.wounds += LOSS * mass * dt
    while (s.wounds >= 1 && s.crew > 0) {
      s.wounds--
      s.crew--
      war.fallen++
    }
  }
  war.squads = war.squads.filter((s) => s.crew > 0)
}

function spread(war: War, dt: number) {
  const { cols, rows, tissue, corrupt, owner, guard, pace } = war
  const next = corrupt.slice()
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      if (!tissue[i] || guard[i] || corrupt[i] >= 1) continue
      let sum = 0
      let top = 0
      let from = -1
      for (const j of [i - 1, i + 1, i - cols, i + cols]) {
        if (j < 0 || j >= corrupt.length) continue
        if ((j === i - 1 && c === 0) || (j === i + 1 && c === cols - 1))
          continue
        sum += corrupt[j]
        if (corrupt[j] > top) {
          top = corrupt[j]
          from = owner[j]
        }
      }
      const self = corrupt[i] >= 0.5 ? corrupt[i] : 0
      const push = GROW * pace[i] * (sum / 4 + self) * dt
      if (push <= 0) continue
      next[i] = Math.min(1, corrupt[i] + push)
      if (corrupt[i] < 0.5 && next[i] >= 0.5) {
        owner[i] = from
        war.folkLost += war.folk[i]
        war.folk[i] = 0
        war.scar[i] = 1
      }
    }
  corrupt.set(next)
}

function measure(war: War) {
  const { cols, tissue, corrupt, owner, guard } = war
  const root = Array.from({ length: war.tumors }, (_, k) => k)
  const find = (k: number): number =>
    root[k] === k ? k : (root[k] = find(root[k]))
  const edges = new Array(war.tumors).fill(0)
  const held = new Array(war.tumors).fill(0)
  const open = new Uint8Array(corrupt.length)
  let count = 0
  for (let i = 0; i < corrupt.length; i++) {
    if (corrupt[i] < 0.5) continue
    count++
    const c = i % cols
    const k = owner[i]
    if (k < 0) continue
    for (const j of [i - 1, i + 1, i - cols, i + cols]) {
      if (j < 0 || j >= corrupt.length) continue
      if ((j === i - 1 && c === 0) || (j === i + 1 && c === cols - 1)) continue
      if (tissue[j] && corrupt[j] < 0.5) open[i] = 1
      else if (owner[j] >= 0 && corrupt[j] >= 0.5)
        root[find(owner[j])] = find(k)
    }
  }
  war.corrupted = count
  for (let i = 0; i < corrupt.length; i++) {
    if (!open[i]) continue
    const g = find(owner[i])
    edges[g]++
    if (guard[i]) held[g]++
  }
  war.group = root.map((_, k) => find(k))
  war.contained = root.map((_, k) => {
    const g = find(k)
    return edges[g] ? held[g] / edges[g] : 1
  })
  if (war.won === null && war.contained.every((v) => v >= 1)) war.won = war.time
}

function dusk(war: War, dt: number) {
  const { light, glow, seen } = war
  for (let i = 0; i < seen.length; i++) {
    if (glow[i] > 0) glow[i] = Math.max(0, glow[i] - dt / GLOW)
    seen[i] = light[i] >= 0.5 || glow[i] > 0 ? 1 : 0
  }
  for (const c of [...war.castles, ...war.deposits]) {
    const i =
      Math.min(war.rows - 1, Math.floor(c.y / CELL)) * war.cols +
      Math.min(war.cols - 1, Math.floor(c.x / CELL))
    if (seen[i] || ('lit' in c && c.lit)) c.known = true
  }
  war.marks.forEach((i, k) => {
    if (seen[i]) war.spotted[k] = true
  })
}

export function step(war: War, dt: number) {
  war.time += dt
  dusk(war, dt)
  stampGuard(war)
  fight(war, dt)
  stampGuard(war)
  spread(war, dt)
  measure(war)
}

export function reveal(
  war: War,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  const c0 = Math.max(0, Math.floor(left / CELL))
  const c1 = Math.min(war.cols - 1, Math.floor(right / CELL))
  const r0 = Math.max(0, Math.floor(top / CELL))
  const r1 = Math.min(war.rows - 1, Math.floor(bottom / CELL))
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const i = r * war.cols + c
      war.seen[i] = 1
      war.glow[i] = 1
    }
}

export const warriors = (war: War) =>
  war.squads.reduce((sum, s) => sum + s.crew, 0)
