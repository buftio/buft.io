import { field } from '../lands/threat'
import type { Point } from './sim'
import { CASTLES, DEPOSITS, siteAt, TUMORS } from './sites'

const CASTLE_REACH = 1100
const DEPOSIT_REACH = 900
const TUMOR_REACH = 500

export type Note = {
  kind: 'castle' | 'deposit' | 'tumor'
  id: string
  name: string
  tag: string
  story: string
  bio: string
}

const far = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

function closest<T extends Point>(list: T[], p: Point, reach: number) {
  return list
    .filter((x) => far(x, p) < reach)
    .sort((a, b) => far(a, p) - far(b, p))[0]
}

function inside(poly: [number, number][], { x, y }: Point) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit
  }
  return hit
}

export function explain(p: Point): Note | null {
  const war = field.war
  if (!war) return null
  const castle = closest(
    war.castles.filter((c) => c.known),
    p,
    CASTLE_REACH,
  )
  const keep = castle && siteAt(CASTLES, castle)
  if (castle && keep)
    return {
      kind: 'castle',
      ...keep,
      tag: castle.lit
        ? 'Lit. Your lighthouses draw their light from here.'
        : 'Dark. Reach it with your light to bring it over.',
    }
  const deposit = closest(
    war.deposits.filter((d) => d.known),
    p,
    DEPOSIT_REACH,
  )
  const seep = deposit && siteAt(DEPOSITS, deposit)
  if (deposit && seep)
    return {
      kind: 'deposit',
      ...seep,
      tag: `Fat deposit · ${Math.round(deposit.rich * 100)}% rich`,
    }
  const k = field.tumors.findIndex((poly, k) => {
    if (!war.spotted[k]) return false
    if (inside(poly, p)) return true
    const cx = poly.reduce((s, [x]) => s + x, 0) / poly.length
    const cy = poly.reduce((s, [, y]) => s + y, 0) / poly.length
    return far({ x: cx, y: cy }, p) < TUMOR_REACH
  })
  if (k < 0 || !TUMORS[k]) return null
  return {
    kind: 'tumor',
    ...TUMORS[k],
    tag: `Tumor ${k + 1} · ${Math.floor(war.contained[k] * 100)}% held`,
  }
}
