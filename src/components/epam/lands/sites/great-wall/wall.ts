import * as THREE from 'three'
import { BEACONS, FLAGS, frame, heapAt, LAMPS, PIER, H, INK, KITCHEN, LEN, merged, part, eyes, rand, GATE_D, SHEAR, SITES, T, TURRET, type Frame } from './space'

const STONE = '#f6e2ec'
const STONE2 = '#f0d5e3'
const COURSE = '#dfa9c6'
const PLINTH = '#a65b8c'
const WALK = '#fff4f9'
const MERLON = '#fbe9f2'
const TOWER = '#f4dcea'
const COPPER = '#a85a37'
const RIM = '#e3995a'
const PLUM = '#6e2a63'
const GOLD = '#ffc94d'
const TEAL = '#16b3a0'

type Parts = THREE.BufferGeometry[]

const ONION = [[0.86, 0], [1.08, 0.2], [1.12, 0.38], [0.95, 0.6], [0.6, 0.8], [0.26, 0.93], [0.08, 1.02], [0, 1.06]]

function at(f: Frame, along: number, out: number) {
  return [f.x + f.tx * along + f.nx * out, f.z + f.tz * along + f.nz * out] as const
}

function box(p: Parts, f: Frame, w: number, h: number, d: number, color: string, along: number, y: number, out: number) {
  const [x, z] = at(f, along, out)
  p.push(part(new THREE.BoxGeometry(w, h, d), color, x, y, z, f.turn))
}

function walls(p: Parts) {
  const n = Math.ceil(LEN / 46)
  for (let i = 0; i < n; i++) {
    const a = frame(i / n)
    const b = frame((i + 1) / n)
    const f = frame((i + 0.5) / n)
    const len = Math.hypot(b.x - a.x, b.z - a.z) + 3
    box(p, f, len, 36, T + 36, PLINTH, 0, 18, 0)
    box(p, f, len, H - 36, T, i % 2 ? STONE : STONE2, 0, 36 + (H - 36) / 2, 0)
    box(p, f, len, 12, T + 8, COURSE, 0, H - 34, 0)
    box(p, f, len, 6, T - 24, WALK, 0, H + 3, 0)
    for (const side of [-1, 1]) box(p, f, 24, 32, 16, MERLON, 0, H + 16, side * (T / 2 - 8))
    if (i % 4 === 2) box(p, f, 7, 30, 4, INK, 0, H * 0.55, -T / 2 - 2)
  }
}

function ring(p: Parts, x: number, z: number, r: number, y: number, count: number, color: string) {
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2
    p.push(part(new THREE.BoxGeometry(r * 0.32, 34, 22), color, x + Math.cos(a) * r, y, z + Math.sin(a) * r, -a))
  }
}

function tower(p: Parts, u: number, r: number, h: number) {
  const { x, z } = frame(u)
  p.push(part(new THREE.CylinderGeometry(r * 1.14, r * 1.18, 44, 20), PLINTH, x, 22, z))
  p.push(part(new THREE.CylinderGeometry(r * 0.94, r * 1.04, h, 20), TOWER, x, h / 2, z))
  p.push(part(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 28, 20), COURSE, x, h - 14, z))
  ring(p, x, z, r * 1.02, h + 17, 10, MERLON)
  p.push(part(new THREE.BoxGeometry(r * 0.42, r * 0.6, 6), INK, x, r * 0.3, z + r * 1.02))
  p.push(part(new THREE.BoxGeometry(8, 34, 6), INK, x, h * 0.4, z + r))
  eyes(p, r * 0.21, x, h * 0.66, z + r * 0.9, r * 0.29, [0.35, 0.25])
  p.push(part(new THREE.CylinderGeometry(r * 0.44, r * 0.24, 50, 14), COPPER, x, h + 25, z))
  p.push(part(new THREE.CylinderGeometry(r * 0.48, r * 0.48, 9, 14), RIM, x, h + 50, z))
}

function gate(p: Parts) {
  const f = frame(SITES.gate)
  const D = T + 80
  box(p, f, 330, 44, D + 30, PLINTH, 0, 22, 0)
  box(p, f, 320, 300, D, '#efd0e0', 0, 150, 0)
  box(p, f, 330, 14, D + 8, COURSE, 0, 268, 0)
  for (let k = -3; k <= 3; k++) for (const side of [-1, 1]) box(p, f, 28, 34, 18, MERLON, k * 46, 317, side * (D / 2 - 9))
  box(p, f, 124, 150, 8, INK, 0, 75, -D / 2 - 3)
  const [ax, az] = at(f, 0, -D / 2 - 3)
  const arch = new THREE.CylinderGeometry(62, 62, 8, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2)
  p.push(part(arch, INK, ax, 150, az, f.turn))
  box(p, f, 26, 34, 12, TEAL, 0, 222, -D / 2 - 6)
  const { at: d, r, h, dome } = TURRET
  for (const side of [-1, 1]) {
    const [x, z] = at(f, side * d, 0)
    p.push(part(new THREE.CylinderGeometry(r + 14, r + 20, 44, 16), PLINTH, x, 22, z))
    p.push(part(new THREE.CylinderGeometry(r, r + 8, h, 16), TOWER, x, h / 2, z))
    p.push(part(new THREE.CylinderGeometry(r + 12, r + 12, 22, 16), COURSE, x, h - 11, z))
    p.push(part(new THREE.CylinderGeometry(r + 4, r + 4, 10, 16), TEAL, x, h + 5, z))
    p.push(part(new THREE.LatheGeometry(ONION.map(([a, b]) => new THREE.Vector2(a * (r + 14), b * dome)), 16), PLUM, x, h + 10, z))
    p.push(part(new THREE.SphereGeometry(13, 8, 6), GOLD, x, h + dome + 12, z))
    p.push(part(new THREE.BoxGeometry(10, 34, 6), INK, x, h - 215, z + r + 3))
    eyes(p, 19, x, h - 150, z + r - 4, 26, [side * -0.3, -0.2])
  }
}

function kitchen(p: Parts) {
  const f = frame(SITES.kitchen)
  const { r, h } = KITCHEN
  const { x, z } = f
  p.push(part(new THREE.CylinderGeometry(r * 1.1, r * 1.14, 44, 24), PLINTH, x, 22, z))
  p.push(part(new THREE.CylinderGeometry(r, r * 1.05, h, 24), TOWER, x, h / 2, z))
  p.push(part(new THREE.CylinderGeometry(r * 1.07, r * 1.07, 26, 24), COURSE, x, h - 13, z))
  ring(p, x, z, r * 1.0, h + 17, 14, MERLON)
  p.push(part(new THREE.BoxGeometry(76, 104, 6), INK, x, 52, z + r * 1.02))
  p.push(part(new THREE.BoxGeometry(120, 38, 6), GOLD, x, 135, z + r * 1.0))
  p.push(part(new THREE.TorusGeometry(10, 3, 6, 12), INK, x - 22, 135, z + r * 1.0 + 4))
  p.push(part(new THREE.BoxGeometry(34, 5, 4), INK, x + 12, 135, z + r * 1.0 + 4))
  eyes(p, 26, x, h * 0.73, z + r * 1.02, 38, [-0.2, 0.3])
  p.push(part(new THREE.SphereGeometry(58, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#3a2346', x, h + 64, z + 20))
  p.push(part(new THREE.TorusGeometry(56, 7, 8, 20).rotateX(Math.PI / 2), RIM, x, h + 64, z + 20))
  p.push(part(new THREE.CylinderGeometry(50, 50, 4, 20), '#c8284e', x, h + 58, z + 20))
  p.push(part(new THREE.CylinderGeometry(50, 60, 26, 12), INK, x, h + 13, z + 20))
  const [cx, cz] = at(f, -95, 70)
  p.push(part(new THREE.BoxGeometry(52, 210, 52), COURSE, cx, h + 105, cz, f.turn))
  p.push(part(new THREE.BoxGeometry(66, 14, 66), INK, cx, h + 214, cz, f.turn))
  const [px, pz] = at(f, 120, 60)
  p.push(part(new THREE.CylinderGeometry(4, 4, 170, 6), INK, px, h + 85, pz))
  for (let k = 0; k < 6; k++) {
    const t = (k + 0.5) / 6
    const [sx, sz] = at(f, -95 + t * 215, 65)
    const sag = Math.sin(t * Math.PI) * 22
    p.push(part(new THREE.CapsuleGeometry(7, 22, 3, 6), '#c4583f', sx, h + 150 - sag, sz))
  }
}

function barrels(p: Parts, u: number, r: number, side: number) {
  const f = frame(u + (side * (r + 50)) / LEN)
  const spots = [[0, -30], [30, -38], [14, -8]]
  spots.forEach(([a, o], k) => {
    const [x, z] = at(f, a * side, o)
    p.push(part(new THREE.CylinderGeometry(15, 15, 34, 10), GOLD, x, H + 23, z))
    p.push(part(new THREE.CylinderGeometry(16, 16, 5, 10), '#c27a2c', x, H + 14 + (k % 2) * 18, z))
    p.push(part(new THREE.CylinderGeometry(16, 16, 5, 10), '#c27a2c', x, H + 32 - (k % 2) * 18, z))
  })
}

function pier(p: Parts) {
  const [[ax, az], [bx, bz]] = PIER
  const len = Math.hypot(bx - ax, bz - az)
  const turn = Math.atan2(-(bz - az), bx - ax)
  const n = 9
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n
    p.push(part(new THREE.BoxGeometry(len / n - 4, 6, 58), i % 2 ? '#c98f52' : '#b37a43', ax + (bx - ax) * k, 12, az + (bz - az) * k, turn))
  }
  for (let i = 0; i <= 3; i++)
    for (const s of [-1, 1]) {
      const k = i / 3
      const [nx, nz] = [Math.sin(turn), Math.cos(turn)]
      p.push(part(new THREE.CylinderGeometry(4, 4, 22, 6), '#6e4a2c', ax + (bx - ax) * k + nx * s * 30, 8, az + (bz - az) * k + nz * s * 30))
    }
}

function heap(p: Parts) {
  const [x, z] = heapAt()
  p.push(part(new THREE.CylinderGeometry(48, 38, 44, 14), '#c98f52', x, 22, z))
  p.push(part(new THREE.TorusGeometry(47, 4, 5, 16).rotateX(Math.PI / 2), '#a26c38', x, 44, z))
  const berries = [[0, 0], [-20, 8], [20, 6], [-8, -16], [12, -14], [0, 18], [-26, -8], [26, -6]]
  berries.forEach(([dx, dz], k) => p.push(part(new THREE.SphereGeometry(11, 8, 6), k % 2 ? '#d8264a' : '#ff3d63', x + dx, 50 + (k < 2 ? 10 : 0), z + dz)))
}

export function wallGeometry() {
  const p: Parts = []
  walls(p)
  BEACONS.forEach((b) => tower(p, b.u, b.r, b.h))
  gate(p)
  kitchen(p)
  heap(p)
  pier(p)
  BEACONS.forEach((b, k) => barrels(p, b.u, b.r, k % 2 ? 1 : -1))
  for (const u of LAMPS) {
    const f = frame(u)
    const [x, z] = at(f, 0, -(T / 2 - 6))
    p.push(part(new THREE.CylinderGeometry(2.5, 2.5, 26, 5), INK, x, H + 30, z))
    p.push(part(new THREE.CylinderGeometry(9, 7, 4, 8), INK, x, H + 41, z))
  }
  for (const f of FLAGS) p.push(part(new THREE.CylinderGeometry(2.6, 2.6, f.y - f.base, 5), INK, f.x, (f.y + f.base) / 2, f.z))
  const g = merged(p)
  g.applyMatrix4(SHEAR)
  g.translate(0, 0, 2)
  return g
}

type Pt = readonly [number, number]

function ribbon(out: number[], cols: number[], pts: Pt[], w: number, rgba: number[], z: number) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay) || 1
    const [nx, ny] = [((by - ay) / l) * (w / 2), (-(bx - ax) / l) * (w / 2)]
    const q = [
      [ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny],
      [ax + nx, ay + ny], [bx - nx, by - ny], [ax - nx, ay - ny],
    ]
    for (const [x, y] of q) {
      out.push(x, -y, z)
      cols.push(...rgba)
    }
  }
}

function stones(out: number[], cols: number[], pts: Pt[]) {
  let k = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay)
    const [tx, ty] = [(bx - ax) / l, (by - ay) / l]
    for (let d = 0; d < l; d += 30, k++) {
      const fade = Math.max(0, 1 - k / 62)
      for (const side of [-1, 1]) {
        const w = 1 - k / 90
        const j = rand(k * 2 + side) - 0.5
        const x = ax + tx * (d + j * 10) - ty * side * (15 + (k % 2) * 6) * w
        const y = ay + ty * (d + j * 10) + tx * side * (15 + (k % 2) * 6) * w
        const r = (12 + rand(k + side * 9) * 4) * w
        const rgba = [0.97, 0.9 + j * 0.06, 0.95, 0.9 * fade]
        for (let a = 0; a < 7; a++) {
          const [p, q] = [(a / 7) * Math.PI * 2, ((a + 1) / 7) * Math.PI * 2]
          out.push(x, -y, 1.5, x + Math.cos(p) * r, -(y + Math.sin(p) * r * 0.8), 1.5, x + Math.cos(q) * r, -(y + Math.sin(q) * r * 0.8), 1.5)
          cols.push(...rgba, ...rgba, ...rgba)
        }
      }
    }
  }
}

export function groundGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const n = 120
  const shadow: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const f = frame(i / n)
    shadow.push([f.x - f.nx * (T / 2 + 36), f.z - f.nz * (T / 2 + 36)])
  }
  ribbon(pos, col, shadow, 80, [0.16, 0.05, 0.2, 0.28], 1)
  const g = frame(SITES.gate)
  const inner: Pt = [g.x - g.nx * (GATE_D / 2 + 20), g.z - g.nz * (GATE_D / 2 + 20)]
  stones(pos, col, [inner, [-400, 620], [-520, 900], [-560, 1180], [-660, 1450], [-700, 1700]])
  const outer: Pt = [g.x + g.nx * 130, g.z + g.nz * 130]
  ribbon(pos, col, [outer, [-120, 70], [-30, -30], [40, -60]], 40, [0.66, 0.24, 0.45, 0.35], 1.5)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return geo
}
