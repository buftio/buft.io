import * as THREE from 'three'
import { beam, CANVAS, eyes, type G, HAZARD, INK, IRON, merged, MINT, part, PLANK, SACK, stand, STONE, TEAL, TIMBER } from './kit'
import { ARC, BOOM, BRAZIERS, BRIDGE, CHECK, LAUNCHER, PYRES, ROAD, TENTS, TOWER, type P } from './plan'

export const T = 125
export const CABIN: [number, number, number] = [0, 9.5, -0.2]
export const LEGS = 8.5

function tower() {
  const p: G[] = []
  const lo = 1.5
  const hi = 0.9
  const at = (sx: number, sz: number, y: number): [number, number, number] => {
    const r = lo + ((hi - lo) * y) / LEGS
    return [sx * r, y, sz * r]
  }
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  corners.forEach(([sx, sz]) => {
    p.push(beam(at(sx, sz, 0), at(sx, sz, LEGS), 0.15, TIMBER, 6))
    p.push(part(new THREE.CylinderGeometry(0.32, 0.4, 0.3, 6), STONE, at(sx, sz, 0.15)))
  })
  const levels = [0.3, 3, 5.7, 8.4]
  corners.forEach(([ax, az], k) => {
    const [bx, bz] = corners[(k + 1) % 4]
    for (let l = 0; l < 3; l++) {
      p.push(beam(at(ax, az, levels[l]), at(bx, bz, levels[l + 1]), 0.07, PLANK, 4))
      p.push(beam(at(bx, bz, levels[l]), at(ax, az, levels[l + 1]), 0.07, PLANK, 4))
      p.push(beam(at(ax, az, levels[l + 1]), at(bx, bz, levels[l + 1]), 0.09, TIMBER, 4))
    }
  })
  for (let y = 0.4; y < LEGS; y += 0.55) {
    const z = at(1, 1, y)[2] + 0.12
    p.push(part(new THREE.BoxGeometry(0.7, 0.07, 0.07), PLANK, [0.5, y, z]))
  }
  for (const s of [0.15, 0.85]) p.push(beam([s, 0, lo + 0.12], [s, LEGS, hi + 0.12], 0.05, TIMBER, 4))
  p.push(part(new THREE.BoxGeometry(3, 0.3, 3), PLANK, [0, LEGS + 0.1, 0]))
  for (let k = 0; k < 8; k++) {
    const x = -1.4 + k * 0.4
    p.push(part(new THREE.BoxGeometry(0.4, 0.22, 0.08), k % 2 ? INK : HAZARD, [x + 0.2, LEGS + 0.75, 1.48]))
    p.push(part(new THREE.BoxGeometry(0.08, 0.22, 0.4), k % 2 ? HAZARD : INK, [1.48, LEGS + 0.75, x + 0.2]))
    p.push(part(new THREE.BoxGeometry(0.08, 0.22, 0.4), k % 2 ? HAZARD : INK, [-1.48, LEGS + 0.75, x + 0.2]))
  }
  for (const [sx, sz] of corners) p.push(part(new THREE.BoxGeometry(0.1, 0.9, 0.1), TIMBER, [sx * 1.45, LEGS + 0.6, sz * 1.45]))
  const [cx, cy, cz] = CABIN
  p.push(part(new THREE.BoxGeometry(2.2, 1.9, 1.8), CANVAS, [cx, cy, cz]))
  p.push(part(new THREE.BoxGeometry(2.3, 0.18, 1.9), TIMBER, [cx, cy - 0.95, cz]))
  p.push(part(new THREE.BoxGeometry(1.2, 0.12, 0.1), INK, [cx, cy - 0.55, cz + 0.92]))
  eyes(p, cy + 0.2, cz + 0.72, 0.5, 0.48, false, 14)
  const bands = [1.9, 1.45, 1.0, 0.55, 0.12]
  bands.slice(0, -1).forEach((r, k) => {
    const h = 0.42
    p.push(part(new THREE.CylinderGeometry(bands[k + 1], r, h, 4), k % 2 ? INK : HAZARD, [cx, cy + 0.95 + h * (k + 0.5), cz], [0, Math.PI / 4, 0]))
  })
  p.push(part(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), INK, [1.3, LEGS + 1.5, -1.3]))
  p.push(part(new THREE.BoxGeometry(1.1, 0.75, 0.08), PLANK, [-0.9, 5.2, 1.3]))
  p.push(part(new THREE.BoxGeometry(0.16, 0.38, 0.04), INK, [-0.9, 5.3, 1.36]))
  p.push(part(new THREE.SphereGeometry(0.09, 6, 4), INK, [-0.9, 4.98, 1.36]))
  return p
}

function tent(color: string) {
  const g = new THREE.CylinderGeometry(1, 1, 2.4, 3, 1, false, Math.PI / 2)
  g.rotateZ(Math.PI / 2)
  g.translate(0, 0.5, 0)
  return [
    part(g, color, [0, 0, 0], [0, 0, 0], [1, 1.25, 1.15]),
    part(new THREE.BoxGeometry(2.5, 0.12, 0.12), color === TEAL ? CANVAS : TEAL, [0, 1.92, 0]),
    part(new THREE.CylinderGeometry(0.02, 0.6, 1.15, 3, 1, false, Math.PI), INK, [1.22, 0.55, 0], [0, 0, 0], [0.1, 1, 1]),
    part(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 4), TIMBER, [1.3, 1, 0]),
    part(new THREE.ConeGeometry(0.22, 0.5, 3), color === TEAL ? HAZARD : TEAL, [1.3, 2.1, 0.15], [Math.PI / 2, 0, 0]),
  ]
}

function hut() {
  const roof = new THREE.CylinderGeometry(1, 1, 1.55, 3, 1, false, 0)
  roof.rotateX(-Math.PI / 2)
  const p = [
    part(new THREE.BoxGeometry(1.6, 1.2, 1.3), STONE, [0, 0.6, 0]),
    part(roof, TEAL, [0, 1.55, 0], [0, 0, 0], [1, 0.75, 1]),
    part(new THREE.BoxGeometry(1.7, 0.16, 0.08), HAZARD, [0, 1.12, 0.68]),
    part(new THREE.BoxGeometry(0.75, 0.08, 0.3), PLANK, [0, 0.45, 0.8]),
    ...[-1, 1].map((s) => part(new THREE.BoxGeometry(0.06, 0.45, 0.06), TIMBER, [s * 0.3, 0.2, 0.9])),
  ]
  eyes(p, 0.78, 0.6, 0.26, 0.2, true, 8)
  return p
}

function post() {
  const p = [part(new THREE.BoxGeometry(0.28, 1.3, 0.28), INK, [0, 0.65, 0]), part(new THREE.BoxGeometry(0.5, 0.2, 0.5), STONE, [0, 0.1, 0])]
  p.push(part(new THREE.BoxGeometry(0.25, 0.8, 0.25), STONE, [0, 0.4, 3.75]))
  return p
}

function bridge() {
  const p: G[] = []
  for (let k = 0; k < 9; k++) p.push(part(new THREE.BoxGeometry(0.32, 0.14, 1.7), k % 2 ? PLANK : '#a87650', [-1.4 + k * 0.35, 0.3 + Math.sin((k / 8) * Math.PI) * 0.35, 0]))
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) p.push(part(new THREE.BoxGeometry(0.1, 0.6, 0.1), TIMBER, [-1.4 + k * 0.93, 0.6 + Math.sin((k / 3) * Math.PI) * 0.35, s * 0.85]))
    p.push(beam([-1.45, 0.85, s * 0.85], [0, 1.25, s * 0.85], 0.05, HAZARD))
    p.push(beam([0, 1.25, s * 0.85], [1.45, 0.85, s * 0.85], 0.05, HAZARD))
  }
  return p
}

function pyre() {
  const p: G[] = [part(new THREE.CylinderGeometry(0.8, 0.95, 0.35, 9), '#a993bb', [0, 0.17, 0])]
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2
    p.push(beam([Math.cos(a) * 0.85, 0.4, Math.sin(a) * 0.85], [Math.cos(a) * 0.12, 1.6, Math.sin(a) * 0.12], 0.11, k % 2 ? TIMBER : PLANK))
  }
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 3), INK, [0.8, 1.3, -0.6]))
  p.push(part(new THREE.BoxGeometry(0.5, 0.3, 0.02), HAZARD, [1.06, 2.4, -0.6]))
  return p
}

function brazier() {
  const p: G[] = []
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    p.push(beam([Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6], [0, 1.1, 0], 0.06, IRON, 4))
  }
  p.push(part(new THREE.SphereGeometry(0.55, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), IRON, [0, 1.35, 0]))
  return p
}

function launcher() {
  const p: G[] = [part(new THREE.BoxGeometry(1.6, 0.35, 1.4), TIMBER, [0, 0.18, 0])]
  p.push(part(new THREE.CylinderGeometry(0.32, 0.4, 1.6, 9), IRON, [0.25, 1, 0], [0, 0, -0.45]))
  p.push(part(new THREE.TorusGeometry(0.33, 0.07, 4, 10), HAZARD, [0.55, 1.65, 0], [Math.PI / 2, 0, -0.45]))
  p.push(part(new THREE.BoxGeometry(0.9, 0.6, 0.7), PLANK, [-1.3, 0.3, 0.4]))
  for (let k = 0; k < 4; k++) p.push(part(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 5), k % 2 ? HAZARD : '#ff3b5c', [-1.6 + k * 0.2, 0.75, 0.4]))
  return p
}

function sign() {
  const arrow = (y: number, dir: number, color: string) => [
    part(new THREE.BoxGeometry(1.5, 0.4, 0.08), color, [dir * 0.55, y, 0]),
    part(new THREE.ConeGeometry(0.32, 0.4, 3), color, [dir * 1.48, y, 0], [0, 0, dir * Math.PI / 2], [1, 1, 0.25]),
  ]
  return [
    part(new THREE.BoxGeometry(0.14, 2.6, 0.14), TIMBER, [0, 1.3, 0]),
    ...arrow(2.2, -1, TEAL),
    ...arrow(1.6, -1, MINT),
    ...arrow(1.0, 1, HAZARD),
  ]
}

function crates() {
  return [
    part(new THREE.BoxGeometry(0.9, 0.9, 0.9), PLANK, [0, 0.45, 0]),
    part(new THREE.BoxGeometry(0.8, 0.8, 0.8), '#a87650', [0.95, 0.4, 0.2], [0, 0.3, 0]),
    part(new THREE.BoxGeometry(0.7, 0.7, 0.7), PLANK, [0.3, 1.25, 0.1], [0, -0.2, 0]),
    part(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 9), SACK, [-0.9, 0.45, 0.3]),
  ]
}

function at(list: G[], [dx, dy]: P, size: number, turn = 0) {
  return list.map((g) => stand(g, dx, dy, size, turn))
}

export function structures() {
  const p: G[] = [...at(tower(), TOWER, T)]
  p.push(...at(hut(), [CHECK[0] + 170, CHECK[1] - 170], 95, -0.15))
  p.push(...at(post(), BOOM, 95))
  p.push(...at(bridge(), BRIDGE, 100, -0.1))
  PYRES.forEach((q, k) => p.push(...at(pyre(), q, 95, k)))
  BRAZIERS.forEach((q) => p.push(...at(brazier(), q, 55)))
  p.push(...at(launcher(), LAUNCHER, 90, 0.3))
  p.push(...at(sign(), [-1560, -280], 80, -0.1))
  p.push(...at(crates(), [1180, 520], 80, 0.4))
  p.push(...at(crates(), [1240, -180], 70, -0.8))
  TENTS.forEach(([x, y, turn, s], k) => p.push(...at(tent([CANVAS, TEAL, '#ff9eb8'][k % 3]), [x, y], 62 * s, turn * 0.6 - Math.PI / 2)))
  return merged(p)
}

type RGBA = [number, number, number, number]
const rgba = (hex: string, a: number): RGBA => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b, a]
}

class Paint {
  pos: number[] = []
  col: number[] = []
  quad(a: P, b: P, c: P, d: P, ca: RGBA, cb: RGBA, cc: RGBA, cd: RGBA, z: number) {
    for (const [pt, cl] of [[a, ca], [b, cb], [c, cc], [a, ca], [c, cc], [d, cd]] as [P, RGBA][]) {
      this.pos.push(pt[0], -pt[1], z)
      this.col.push(...cl)
    }
  }
  ribbon(pts: P[], lanes: number[], colors: RGBA[], z: number) {
    for (let i = 0; i < pts.length - 1; i++) {
      const n0 = normal(pts, i)
      const n1 = normal(pts, i + 1)
      for (let j = 0; j < lanes.length - 1; j++) {
        const o = (p: P, n: P, l: number): P => [p[0] + n[0] * l, p[1] + n[1] * l]
        this.quad(o(pts[i], n0, lanes[j]), o(pts[i + 1], n1, lanes[j]), o(pts[i + 1], n1, lanes[j + 1]), o(pts[i], n0, lanes[j + 1]), colors[j], colors[j], colors[j + 1], colors[j + 1], z)
      }
    }
  }
  strip(pts: P[], lanes: number[], colors: RGBA[][], z: number) {
    for (let i = 0; i < pts.length - 1; i++) {
      const n0 = normal(pts, i)
      const n1 = normal(pts, i + 1)
      const o = (p: P, n: P, l: number): P => [p[0] + n[0] * l, p[1] + n[1] * l]
      for (let j = 0; j < lanes.length - 1; j++)
        this.quad(o(pts[i], n0, lanes[j]), o(pts[i + 1], n1, lanes[j]), o(pts[i + 1], n1, lanes[j + 1]), o(pts[i], n0, lanes[j + 1]), colors[j][i], colors[j][i + 1], colors[j + 1][i + 1], colors[j + 1][i], z)
    }
  }
  disc([x, y]: P, r: number, inner: RGBA, outer: RGBA, z: number, sx = 1) {
    const n = 28
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2
      const a1 = ((k + 1) / n) * Math.PI * 2
      const e0: P = [x + Math.cos(a0) * r * sx, y + Math.sin(a0) * r]
      const e1: P = [x + Math.cos(a1) * r * sx, y + Math.sin(a1) * r]
      this.quad([x, y], e0, e1, [x, y], inner, outer, outer, inner, z)
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 4))
    return g
  }
}

function normal(pts: P[], i: number): P {
  const a = pts[Math.max(0, i - 1)]
  const b = pts[Math.min(pts.length - 1, i + 1)]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}

export function groundPaint() {
  const g = new Paint()
  const dust = '#f7d6bd'
  g.disc(TOWER, 520, rgba('#f2cfd9', 0.4), rgba('#f2cfd9', 0), 1, 1.2)
  g.disc([-760, 800], 760, rgba('#f2cfd9', 0.35), rgba('#f2cfd9', 0), 1, 1.25)
  const arc: P[] = []
  for (let k = 0; k <= 120; k++) {
    const a = ARC.a0 + ((ARC.a1 - ARC.a0) * k) / 120
    arc.push([Math.cos(a) * ARC.r, Math.sin(a) * ARC.r])
  }
  const ditch = rgba('#2a1630', 0.5)
  g.ribbon(arc, [-320, -150, -60, 0], [rgba('#2a1630', 0), ditch, rgba('#5a2a4a', 0.35), rgba('#5a2a4a', 0)], 1.5)
  const dashes = 64
  for (let k = 0; k < dashes; k++) {
    const a0 = ARC.a0 + ((ARC.a1 - ARC.a0) * k) / dashes
    const a1 = ARC.a0 + ((ARC.a1 - ARC.a0) * (k + 1)) / dashes
    const r0 = ARC.r + 200
    const r1 = ARC.r + 270
    const c = rgba(k % 2 ? INK : HAZARD, 0.92)
    const lean = 0.02
    g.quad([Math.cos(a0) * r0, Math.sin(a0) * r0], [Math.cos(a1) * r0, Math.sin(a1) * r0], [Math.cos(a1 + lean) * r1, Math.sin(a1 + lean) * r1], [Math.cos(a0 + lean) * r1, Math.sin(a0 + lean) * r1], c, c, c, c, 2)
  }
  const n = ROAD.length
  const fade = (i: number) => Math.min(1, i / 18, (n - 1 - i) / 18)
  const lane = (a: number) => ROAD.map((_, i) => rgba(dust, a * fade(i)))
  const ruts = ROAD.map((_, i) => rgba('#b07884', 0.4 * fade(i)))
  g.strip(ROAD, [-85, -50, -30, -24, -18, 18, 24, 30, 50, 85], [lane(0), lane(0.5), lane(0.5), ruts, lane(0.5), lane(0.5), ruts, lane(0.5), lane(0.5), lane(0)], 2.5)
  return g.geometry()
}

