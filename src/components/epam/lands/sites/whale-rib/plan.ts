type P = [number, number]

export const RIB: P[] = [
  [-1300, -1300],
  [-800, -1200],
  [-280, -1040],
  [200, -880],
  [680, -830],
  [960, -600],
  [1060, -280],
  [1095, 40],
  [1040, 360],
  [920, 680],
  [720, 1000],
  [440, 1240],
  [160, 1410],
  [-200, 1490],
]

export const CELL = 240
export const GRID = { x: -980, y: -580, cols: 6, rows: 5 }
export const DUG: P[] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [2, 3],
  [2, 4],
  [1, 1],
  [3, 2],
  [0, 3],
  [3, 0],
]
export const cellAt = (c: number, r: number): P => [GRID.x + (c + 0.5) * CELL, GRID.y + (r + 0.5) * CELL]

export const SPINE: P[] = [
  [-400, -515],
  [-360, -400],
  [-330, -285],
  [-310, -165],
  [-300, -45],
  [-300, 75],
  [-305, 195],
  [-320, 315],
  [-345, 430],
  [-380, 545],
]

export const SKULL: P = [230, 30]
export const TENT: P = [-1560, 300]
export const BOOTH: P = [-1230, 610]
export const QUEUE: P[] = [
  [-1560, 520],
  [-1420, 660],
  [-1230, 740],
  [-1040, 820],
  [-900, 930],
  [-780, 1060],
]
export const LARD: P = [-1640, 1000]
export const SHRINE: P = [-420, 1560]
export const TIP: P = [-250, 1490]
export const GATE: P = [-1345, -1270]
export const ROD: P = [-610, -1568]
export const TUG: P[] = Array.from({ length: 6 }, (_, i) => [-760 - i * 72, -1552 + i * 4] as P)
export const DERRICK: P = [-1130, -420]
export const PILE: P = [-1430, -600]
export const HEAP: P = [-1240, -830]
export const CHAIN: P[] = [
  [-1040, -620],
  [-1100, -700],
  [-1160, -770],
]

export const DIGGERS: { at: P; turn: number }[] = [
  { at: [-905, -520], turn: 0.4 },
  { at: [-800, -420], turn: -0.5 },
  { at: [-470, -380], turn: 0.3 },
  { at: [-430, -110], turn: -0.6 },
  { at: [-250, 130], turn: 0.5 },
  { at: [-460, 380], turn: -0.2 },
  { at: [-30, 30], turn: 0.6 },
  { at: [-920, 210], turn: -0.4 },
  { at: [-200, -500], turn: 0.2 },
]
export const NAP: P = [470, 150]
export const BRUSH: P[] = [
  [-255, -230],
  [-380, 250],
  [-255, 490],
  [130, 150],
]
export const PROUD: P = [-680, -310]
export const WINCH: P[] = [
  [-1210, -360],
  [-1060, -350],
]
export const GAWK: P[] = [
  [-1520, 1130],
  [-1780, 1150],
  [-1880, 960],
]
export const SELLER: P = [-1230, 590]

export type Track = { pts: P[]; cum: number[]; len: number }

export function track(pts: P[]): Track {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return { pts, cum, len: cum[cum.length - 1] }
}

export function along(tr: Track, d: number, out: { x: number; y: number; a: number }) {
  const s = Math.max(0, Math.min(tr.len, d))
  let i = 1
  while (i < tr.cum.length - 1 && tr.cum[i] < s) i++
  const [ax, ay] = tr.pts[i - 1]
  const [bx, by] = tr.pts[i]
  const k = (s - tr.cum[i - 1]) / (tr.cum[i] - tr.cum[i - 1] || 1)
  out.x = ax + (bx - ax) * k
  out.y = ay + (by - ay) * k
  out.a = Math.atan2(by - ay, bx - ax)
  return out
}
