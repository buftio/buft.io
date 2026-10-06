import { recruit } from './kinds'
import {
  CELL,
  CREW,
  eachCell,
  enlist,
  type Mine,
  type Point,
  type Squad,
  type War,
} from './sim'

export const LINK = 3500
export const POST = 80
export const MINE = 80
export const SPOT = 700
export const MAX_POSTS = 160
export const SCAN = 30
const SOFT = 600
const HIT = 400
const TOLL = 1.5
const YIELD = 10
const RECRUITS = 20
const REFILL = 20
const UPKEEP = 0.25
const REFUND = 0.5

type Building = Squad | Mine

const within = (a: Point, b: Point, r: number) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= r
const cell = (war: War, p: Point) =>
  Math.min(war.rows - 1, Math.floor(p.y / CELL)) * war.cols +
  Math.min(war.cols - 1, Math.floor(p.x / CELL))
const buildings = (war: War): Building[] => [...war.squads, ...war.mines]
export const spotAt = (war: War, p: Point) =>
  war.deposits.find((d) => within(d, p, SPOT))

export const hubs = (war: War): Point[] => [
  ...war.castles.filter((c) => c.lit),
  ...buildings(war).filter((b) => b.from),
]

function shine(war: War) {
  const lights = hubs(war)
  const key = lights.map((h) => `${h.x},${h.y}`).join(';')
  if (key === war.lights) return
  war.lights = key
  war.light.fill(0)
  for (const h of lights)
    eachCell(war, h.x, h.y, LINK + SOFT / 2, (i, d) => {
      war.light[i] = Math.max(
        war.light[i],
        Math.min(1, (LINK + SOFT / 2 - d) / SOFT),
      )
    })
}

export function relink(war: War) {
  const all = buildings(war)
  for (const b of all) b.from = null
  let frontier: Point[] = war.castles.filter((c) => c.lit)
  while (frontier.length) {
    const next: Point[] = []
    for (const b of all) {
      if (b.from) continue
      const hub = frontier.find((f) => within(f, b, LINK))
      if (!hub) continue
      b.from = hub
      next.push(b)
    }
    for (const c of war.castles) {
      if (c.lit || !frontier.some((f) => within(f, c, LINK))) continue
      c.lit = true
      next.push(c)
    }
    frontier = next
  }
  shine(war)
}

export const linked = (war: War, p: Point) =>
  hubs(war).some((h) => within(h, p, LINK))

export function build(war: War, x: number, y: number, grab: number) {
  const tap = { x, y }
  const own = buildings(war).find((b) => within(b, tap, Math.min(grab, HIT)))
  if (own) {
    war.squads = war.squads.filter((s) => s !== own)
    war.mines = war.mines.filter((m) => m !== own)
    war.fat += ('rich' in own ? MINE : POST) * REFUND
    relink(war)
    return 'removed'
  }
  const spot = spotAt(war, tap)
  const at = spot ?? tap
  const i = cell(war, at)
  if (spot && war.mines.some((m) => within(m, spot, 1))) return 'taken'
  if (!spot && !war.tissue[i]) return 'empty'
  if (!linked(war, at)) return 'dark'
  if (war.corrupt[i] >= 0.5) return 'corrupt'
  if (!spot && war.squads.length >= MAX_POSTS) return 'full'
  const cost = spot ? MINE : POST
  if (war.fat < cost) return 'poor'
  war.fat -= cost
  if (spot)
    war.mines.push({
      id: war.nextId++,
      x: spot.x,
      y: spot.y,
      rich: spot.rich,
      from: null,
    })
  else enlist(war, x, y, RECRUITS)
  relink(war)
  return spot ? 'mine' : 'post'
}

export function charge(war: War) {
  if (war.fat < SCAN) return false
  war.fat -= SCAN
  return true
}

export function economy(war: War, dt: number) {
  const eaten = (b: Building) => war.corrupt[cell(war, b)] >= 0.5
  for (const s of war.squads) if (eaten(s)) war.fallen += s.crew
  war.squads = war.squads.filter((s) => !eaten(s))
  war.mines = war.mines.filter((m) => !eaten(m))
  relink(war)
  let gain = war.castles.filter((c) => c.lit).length * TOLL
  for (const m of war.mines) if (m.from) gain += m.rich * YIELD
  war.fat += gain * dt
  let spent = 0
  for (const s of war.squads) {
    if (!s.from || s.crew >= CREW) continue
    const n = Math.min(
      CREW - s.crew,
      Math.round(REFILL * dt),
      Math.floor(war.fat / UPKEEP),
    )
    recruit(war, s, n)
    war.fat -= n * UPKEEP
    spent += n * UPKEEP
  }
  war.income += (gain - spent / dt - war.income) * Math.min(1, dt)
}
