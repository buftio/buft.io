import * as THREE from 'three'
import { C, merge } from './kit'
import { CLOTHS, FIELD, HAUL, MID, PLAZA, VATS, type P } from './layout'

function paint(g: THREE.BufferGeometry, color: string, alpha: number, z: number) {
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from({ length: n * 4 }, (_, i) => [c.r, c.g, c.b, alpha][i % 4]), 4))
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  if (g.getAttribute('normal')) g.deleteAttribute('normal')
  g.translate(0, 0, z)
  return g.index ? g.toNonIndexed() : g
}

function disc([x, y]: P, r: number, color: string, alpha: number, z = 0, sy = 1) {
  const g = new THREE.CircleGeometry(r, 28)
  g.scale(1, sy, 1)
  g.translate(x, -y, 0)
  return paint(g, color, alpha, z)
}

function ribbon(pts: P[], w: number, color: string, alpha: number, z = 0, joints = true) {
  const pos: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay)
    const nx = (-(by - ay) / l) * (w / 2)
    const ny = ((bx - ax) / l) * (w / 2)
    const q = [ax + nx, ay + ny, ax - nx, ay - ny, bx + nx, by + ny, bx - nx, by - ny]
    const v = (j: number) => [q[j * 2], -q[j * 2 + 1], 0]
    pos.push(...v(0), ...v(2), ...v(1), ...v(1), ...v(2), ...v(3))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const out = paint(g, color, alpha, z)
  if (!joints) return out
  return merge([out, ...pts.slice(1, -1).map((p) => disc(p, w / 2, color, alpha, z))])
}

function rect(x0: number, y0: number, x1: number, y1: number, color: string, alpha: number, z = 0) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0)
  g.translate((x0 + x1) / 2, -(y0 + y1) / 2, 0)
  return paint(g, color, alpha, z)
}

const PATH = '#eadcf0'
const ROADS: [P[], number][] = [
  [HAUL, 80],
  [[[-1450, 420], [-1100, 380], [-800, 470], [-560, 300]], 56],
  [[[-1300, 880], [-1050, 820], [-800, 470]], 48],
  [[[-300, 300], [100, 200], [MID, -60]], 56],
]

function stitch(pts: P[], z: number) {
  const out: THREE.BufferGeometry[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay)
    for (let d = 20; d + 34 < l; d += 64) {
      const s0 = d / l
      const s1 = (d + 34) / l
      out.push(ribbon([[ax + (bx - ax) * s0, ay + (by - ay) * s0], [ax + (bx - ax) * s1, ay + (by - ay) * s1]], 9, C.magenta, 1, z, false))
    }
  }
  return out
}

export function decals() {
  return merge([
    rect(FIELD.x0 - 40, FIELD.north - 30, FIELD.x1 + 40, FIELD.south + 30, '#2a0b3a', 0.32),
    disc(VATS[0].at, 290, C.indigo, 0.28, 0.2, 0.85),
    disc(VATS[1].at, 240, C.madder, 0.3, 0.2, 0.85),
    disc([VATS[2].at[0] + 60, VATS[2].at[1] + 30], 200, C.gold, 0.25, 0.2, 0.8),
    disc(PLAZA, 262, C.oak, 1, 0.3, 0.8),
    ...ROADS.map(([pts, w]) => ribbon(pts, w + 16, C.oak, 1, 0.4)),
    ...ROADS.map(([pts, w]) => ribbon(pts, w, PATH, 1, 0.5)),
    ...ROADS.flatMap(([pts]) => stitch(pts, 0.6)),
    disc(PLAZA, 250, PATH, 1, 0.7, 0.8),
    disc(PLAZA, 120, C.rose, 1, 0.8, 0.8),
    disc(PLAZA, 100, PATH, 1, 0.9, 0.8),
    ...CLOTHS.flatMap(cloth),
  ])
}

function cloth({ from, to, w, color, edge }: (typeof CLOTHS)[number]) {
  const wave: P[] = Array.from({ length: 9 }, (_, i) => {
    const s = i / 8
    return [from[0] + (to[0] - from[0]) * s, from[1] + (to[1] - from[1]) * s + Math.sin(s * 9) * 8]
  })
  return [ribbon(wave, w + 18, edge, 1, 1, false), ribbon(wave, w, color, 1, 1.2, false), ribbon(wave, 6, edge, 1, 1.4, false)]
}
