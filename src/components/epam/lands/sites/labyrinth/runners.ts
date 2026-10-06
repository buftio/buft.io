import { LANDING, type P, ROUTES, SLING } from './maze'

type Kind = 'run' | 'wait' | 'fly'
type Leg = { kind: Kind; pts: P[]; cum: number[]; dur: number; carry: boolean; ask: boolean; start: number }
export type Runner = { legs: Leg[]; total: number; offset: number; fade: boolean; size: number; tint: number }
type Spec = { run?: P[]; wait?: number; fly?: [P, P, number]; carry?: boolean; ask?: boolean }

export const state = { x: 0, y: 0, lift: 0, carry: false, ask: false, dir: 0, leg: 0, u: 0, scale: 1, moving: false }

function make(specs: Spec[], speed: number, offset: number, fade: boolean, size = 40, tint = 0): Runner {
  let start = 0
  let last: P = specs.find((s) => s.run)?.run?.[0] ?? [0, 0]
  const legs = specs.map((s) => {
    const pts: P[] = s.run ?? (s.fly ? [s.fly[0], s.fly[1]] : [last])
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    const kind: Kind = s.run ? 'run' : s.fly ? 'fly' : 'wait'
    const dur = kind === 'run' ? cum[cum.length - 1] / speed : kind === 'fly' ? s.fly![2] : s.wait!
    const leg = { kind, pts, cum, dur, carry: s.carry ?? true, ask: s.ask ?? false, start }
    start += dur
    last = pts[pts.length - 1]
    return leg
  })
  return { legs, total: start, offset, fade, size, tint }
}

const back = (r: P[]) => [...r].reverse()

export const RUNNERS: Runner[] = [
  make([{ run: ROUTES.west }], 165, 0, true),
  make([{ run: ROUTES.west2 }], 140, 11, true, 38, 1),
  make([{ run: ROUTES.north }], 175, 3, true),
  make([{ run: back(ROUTES.north) }], 150, 9, true, 38, 2),
  make([{ run: ROUTES.east }], 185, 2, true),
  make([{ run: back(ROUTES.east) }], 160, 7, true, 39, 1),
  make([{ wait: 1.2 }, { run: ROUTES.dead }, { wait: 2.2, ask: true }, { run: back(ROUTES.dead) }], 150, 1, false, 40, 2),
  make(
    [
      { run: ROUTES.column },
      { wait: 1.6 },
      { run: ROUTES.sling },
      { wait: 1.1 },
      { fly: [SLING, LANDING, 2.0] },
      { wait: 1.4, ask: true },
      { run: ROUTES.summit },
    ],
    170,
    0,
    true,
  ),
  make([{ run: ROUTES.lost, ask: true }], 95, 0, false, 39, 3),
  make([{ run: ROUTES.ne }], 160, 5, true, 39, 1),
  make([{ run: ROUTES.post }, { wait: 0.9, carry: false }, { run: back(ROUTES.post), carry: false }, { wait: 1.5 }], 150, 4, false),
]

export const SLINGER = 7

export function where(r: Runner, t: number) {
  const s = state
  const tau = (((t + r.offset) % r.total) + r.total) % r.total
  let k = r.legs.length - 1
  while (k > 0 && r.legs[k].start > tau) k--
  const leg = r.legs[k]
  const u = leg.dur ? Math.min(1, (tau - leg.start) / leg.dur) : 0
  s.leg = k
  s.u = u
  s.carry = leg.carry
  s.ask = leg.ask
  s.lift = 0
  s.moving = leg.kind !== 'wait'
  if (leg.kind === 'fly') {
    const [a, b] = leg.pts
    s.x = a[0] + (b[0] - a[0]) * u
    s.y = a[1] + (b[1] - a[1]) * u
    s.lift = 4 * 620 * u * (1 - u)
    s.dir = 0
  } else if (leg.kind === 'run') {
    const total = leg.cum[leg.cum.length - 1]
    const d = u * total
    let i = 1
    while (i < leg.cum.length - 1 && leg.cum[i] < d) i++
    const [a, b] = [leg.pts[i - 1], leg.pts[i]]
    const f = (d - leg.cum[i - 1]) / Math.max(1e-6, leg.cum[i] - leg.cum[i - 1])
    s.x = a[0] + (b[0] - a[0]) * f
    s.y = a[1] + (b[1] - a[1]) * f
    s.dir = Math.sign(b[0] - a[0])
    s.lift = Math.abs(Math.sin(d / 16)) * 9
  } else {
    const p = leg.pts[leg.pts.length - 1]
    s.x = p[0]
    s.y = p[1]
    s.dir = 0
  }
  const edge = Math.min(tau, r.total - tau)
  s.scale = r.fade ? Math.min(1, edge / 0.7) : 1
  return s
}
