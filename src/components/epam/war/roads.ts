import { hubs, LINK } from './build'
import { CELL, type Keep, type Point, type War } from './sim'

const MARGIN = 8
const GRAIN = 5
const BUMPY = 3
const BARE = 4
const ROT = 12
const SMOOTH = 3

export type Route = {
  points: Point[]
  along: number[]
  rich: number
  kind: number
}

const hash = (x: number, y: number, seed: number) => {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(seed, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function noise(x: number, y: number, seed: number) {
  const gx = x / GRAIN
  const gy = y / GRAIN
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const ease = (u: number) => u * u * (3 - 2 * u)
  const u = ease(gx - x0)
  const v = ease(gy - y0)
  const top = hash(x0, y0, seed) * (1 - u) + hash(x0 + 1, y0, seed) * u
  const bottom =
    hash(x0, y0 + 1, seed) * (1 - u) + hash(x0 + 1, y0 + 1, seed) * u
  return top * (1 - v) + bottom * v
}

class Heap {
  items: [number, number][] = []
  push(item: [number, number]) {
    const a = this.items
    a.push(item)
    for (let i = a.length - 1; i > 0;) {
      const up = (i - 1) >> 1
      if (a[up][0] <= a[i][0]) break
      ;[a[up], a[i]] = [a[i], a[up]]
      i = up
    }
  }
  pop() {
    const a = this.items
    const top = a[0]
    const last = a.pop() as [number, number]
    if (a.length) {
      a[0] = last
      for (let i = 0; ;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < a.length && a[l][0] < a[m][0]) m = l
        if (r < a.length && a[r][0] < a[m][0]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

function chaikin(points: Point[]) {
  let out = points
  for (let k = 0; k < SMOOTH; k++) {
    const next = [out[0]]
    for (let i = 0; i < out.length - 1; i++) {
      const [a, b] = [out[i], out[i + 1]]
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 })
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
    }
    next.push(out[out.length - 1])
    out = next
  }
  return out
}

function road(war: War, a: Point, b: Point): Point[] {
  const { cols, rows } = war
  const at = (p: Point) => [
    Math.min(cols - 1, Math.max(0, Math.floor(p.x / CELL))),
    Math.min(rows - 1, Math.max(0, Math.floor(p.y / CELL))),
  ]
  const [ac, ar] = at(a)
  const [bc, br] = at(b)
  const c0 = Math.max(0, Math.min(ac, bc) - MARGIN)
  const c1 = Math.min(cols - 1, Math.max(ac, bc) + MARGIN)
  const r0 = Math.max(0, Math.min(ar, br) - MARGIN)
  const r1 = Math.min(rows - 1, Math.max(ar, br) + MARGIN)
  const w = c1 - c0 + 1
  const n = w * (r1 - r0 + 1)
  const seed = Math.round(a.x + b.x) * 31 + Math.round(a.y + b.y)
  const cost = new Float32Array(n).fill(Infinity)
  const back = new Int32Array(n).fill(-1)
  const local = (c: number, r: number) => (r - r0) * w + (c - c0)
  const goal = local(bc, br)
  const start = local(ac, ar)
  const heap = new Heap()
  cost[start] = 0
  heap.push([0, start])
  while (heap.items.length) {
    const [, i] = heap.pop()
    if (i === goal) break
    const c = (i % w) + c0
    const r = Math.floor(i / w) + r0
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue
        const [nc, nr] = [c + dc, r + dr]
        if (nc < c0 || nc > c1 || nr < r0 || nr > r1) continue
        const j = local(nc, nr)
        const g = nr * cols + nc
        const ground =
          (war.tissue[g] ? 1 : BARE) * (1 + BUMPY * noise(nc, nr, seed)) +
          (war.corrupt[g] >= 0.5 ? ROT : 0)
        const next = cost[i] + Math.hypot(dc, dr) * ground
        if (next >= cost[j]) continue
        cost[j] = next
        back[j] = i
        heap.push([next + Math.hypot(nc - bc, nr - br), j])
      }
  }
  const cells: Point[] = []
  for (let i = goal; i >= 0 && i !== start; i = back[i])
    cells.push({
      x: ((i % w) + c0 + 0.5) * CELL,
      y: (Math.floor(i / w) + r0 + 0.5) * CELL,
    })
  return chaikin([a, ...cells.reverse().slice(0, -1), b])
}

function stitch(
  war: War,
  chain: Point[],
  cache: Map<string, Point[]>,
  used: Set<string>,
) {
  const points: Point[] = [chain[0]]
  for (let k = 0; k < chain.length - 1; k++) {
    const [a, b] = [chain[k], chain[k + 1]]
    const flip = a.x > b.x || (a.x === b.x && a.y > b.y)
    const key = flip
      ? `${b.x},${b.y}>${a.x},${a.y}`
      : `${a.x},${a.y}>${b.x},${b.y}`
    used.add(key)
    let path = cache.get(key)
    if (!path) {
      path = flip ? road(war, b, a) : road(war, a, b)
      cache.set(key, path)
    }
    points.push(...(flip ? [...path].reverse() : path).slice(1))
  }
  const along = [0]
  for (let i = 1; i < points.length; i++)
    along.push(
      along[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    )
  return { points, along }
}

export function routes(war: War, cache: Map<string, Point[]>) {
  const nodes = hubs(war)
  const castle = new Set<Point>(war.castles.filter((c) => c.lit))
  const near = nodes.map((p) =>
    nodes
      .map((_, j) => j)
      .filter(
        (j) =>
          nodes[j] !== p &&
          Math.hypot(nodes[j].x - p.x, nodes[j].y - p.y) <= LINK,
      ),
  )
  const used = new Set<string>()
  const carry: Route[] = []
  for (const mine of war.mines) {
    const source = nodes.indexOf(mine)
    if (source < 0) continue
    const dist = nodes.map(() => Infinity)
    const prev = nodes.map(() => -1)
    const done = new Set<number>()
    dist[source] = 0
    let end = -1
    while (done.size < nodes.length) {
      let i = -1
      for (let k = 0; k < nodes.length; k++)
        if (!done.has(k) && (i < 0 || dist[k] < dist[i])) i = k
      if (i < 0 || dist[i] === Infinity) break
      if (castle.has(nodes[i])) {
        end = i
        break
      }
      done.add(i)
      for (const j of near[i]) {
        const d =
          dist[i] + Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y)
        if (d < dist[j]) {
          dist[j] = d
          prev[j] = i
        }
      }
    }
    if (end < 0) continue
    const chain: Point[] = []
    for (let i = end; i >= 0; i = prev[i]) chain.unshift(nodes[i])
    carry.push({ ...stitch(war, chain, cache, used), rich: mine.rich, kind: 0 })
  }
  const parents = new Set(war.squads.map((s) => s.from))
  const march: Route[] = []
  for (const leaf of war.squads) {
    if (!leaf.from || parents.has(leaf)) continue
    const chain: Point[] = []
    for (
      let p: Point | null = leaf;
      p;
      p = 'from' in p ? (p.from as Point | null) : null
    )
      chain.unshift(p)
    march.push({
      ...stitch(war, chain, cache, used),
      rich: 1,
      kind: 'kind' in chain[0] ? (chain[0] as Keep).kind : 0,
    })
  }
  for (const key of cache.keys()) if (!used.has(key)) cache.delete(key)
  return { carry, march }
}
