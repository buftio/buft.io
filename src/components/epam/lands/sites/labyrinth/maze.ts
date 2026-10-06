import * as THREE from 'three'
import { part, PITCH_Q, UP } from './kit'

const LEAF = '#5cbc7c'
const HEDGE = '#2f7a5a'
const BLOOM = '#ff8fb0'
import { WALLS } from './walls'

export type P = [number, number]

export const SPIRE: P = [150, 700]
export const CHUTES: [P, number][] = [
  [[-1180, -1310], 100],
  [[-1030, -1450], 115],
]
export const WELL: [P, number] = [[-790, 680], 92]
export const BOX: P = [960, -460]
export const GATE: P = [-190, 170]
export const TURNSTILE: P = [1120, 310]
export const SLING: P = [-235, -20]
export const LANDING: P = [-150, -1100]

const WEST: P[] = [[-1320, -1050], [-1650, -760], [-1720, -420], [-1450, -120], [-1200, 300], [-960, 520], [-860, 760], [-1000, 1000], [-1250, 1250], [-1450, 1600]]
export const ROUTES = {
  west: [CHUTES[0][0], ...WEST] as P[],
  west2: [CHUTES[1][0], ...WEST] as P[],
  north: [[-150, -1780], [-120, -1450], [-20, -1150], [300, -1120], [600, -1350], [900, -1700]] as P[],
  east: [SPIRE, [450, 430], [850, 260], [1250, 240], [1780, 120]] as P[],
  dead: [SPIRE, [300, 980], [560, 1120], [640, 1260]] as P[],
  column: [[100, 650], [-150, 420], [-190, 230]] as P[],
  sling: [[-190, 230], [-215, 90], SLING] as P[],
  summit: [LANDING, [-120, -1450], [-150, -1780]] as P[],
  lost: [[-1400, 0], [-1050, -100], [-950, 380], [-1200, 680], [-1440, 380], [-1400, 0]] as P[],
  ne: [[1780, -200], [1520, -560], [1420, -980], [1620, -1350]] as P[],
  post: [[1000, 220], [970, -370]] as P[],
}

const WALL_H = 82
const WALL_T = 56
const R = 1800

const fade = (x: number, y: number) => {
  const r = Math.hypot(x, y)
  const t = Math.min(1, Math.max(0, (R - r) / 380))
  return t * t * (3 - 2 * t)
}

function wallStrip(pts: number[], out: number[], cols: number[], cap: THREE.Color, side: THREE.Color) {
  const v = (x: number, y: number, h: number) => [x + UP.x * h, -y + UP.y * h, UP.z * h]
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const [ax, ay, bx, by] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = (-(by - ay) / len) * (WALL_T / 2)
    const ny = ((bx - ax) / len) * (WALL_T / 2)
    const ha = WALL_H * fade(ax, ay)
    const hb = WALL_H * fade(bx, by)
    const quad = (p: number[][], c: THREE.Color) => {
      for (const k of [0, 1, 2, 0, 2, 3]) {
        out.push(...p[k])
        cols.push(c.r, c.g, c.b)
      }
    }
    const top = [v(ax + nx, ay + ny, ha), v(bx + nx, by + ny, hb), v(bx - nx, by - ny, hb), v(ax - nx, ay - ny, ha)]
    quad(top, cap)
    quad([v(ax + nx, ay + ny, 0), v(bx + nx, by + ny, 0), top[1], top[0]], side)
    quad([v(ax - nx, ay - ny, 0), v(bx - nx, by - ny, 0), top[2], top[3]], side)
  }
}

export function stood(g: THREE.BufferGeometry, at: P, s: number, turn = 0, lift = 0) {
  g.scale(s, s, s)
  g.rotateY(turn)
  g.applyQuaternion(PITCH_Q)
  g.translate(at[0], -at[1], lift)
  return g
}

const LEAVES = ['#57b878', '#3f9f68', '#74c98a']

function blob(parts: THREE.BufferGeometry[], x: number, y: number, k: number, big = 1) {
  const h = (WALL_H * fade(x, y)) / WALL_T
  if (h < 0.3) return
  const r = (0.5 + ((k * 37) % 11) / 50) * big
  const g = part(new THREE.IcosahedronGeometry(r, 0), LEAVES[k % 3], 0, 0, 0)
  g.rotateY(k * 1.7)
  g.rotateX(k * 0.9)
  g.translate(0, h + r * 0.15, 0)
  parts.push(stood(g, [x, y], WALL_T))
}

function posts(parts: THREE.BufferGeometry[]) {
  let k = 0
  for (const line of WALLS)
    for (let i = 0; i < line.length; i += 2) {
      const [x, y] = [line[i], line[i + 1]]
      const h = (WALL_H * fade(x, y)) / WALL_T
      if (h < 0.3) continue
      parts.push(stood(part(new THREE.CylinderGeometry(0.5, 0.5, h, 6, 1, true), HEDGE, 0, h / 2, 0), [x, y], WALL_T))
      blob(parts, x, y, k++, 1.1)
      if (i % 10 === 4) parts.push(stood(part(new THREE.SphereGeometry(0.5, 8, 6), BLOOM, 0.1, h + 1.15, 0.1), [x, y], WALL_T))
      if (i + 3 >= line.length) continue
      const [bx, by] = [line[i + 2], line[i + 3]]
      const n = Math.floor(Math.hypot(bx - x, by - y) / 44)
      for (let j = 1; j <= n; j++) blob(parts, x + ((bx - x) * j) / (n + 1), y + ((by - y) * j) / (n + 1), k++)
    }
}

export function wallGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const cap = new THREE.Color(LEAF)
  const side = new THREE.Color(HEDGE)
  for (const line of WALLS) wallStrip(line, pos, col, cap, side)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  const parts = [g]
  posts(parts)
  return parts
}

export function routeGeometry() {
  const pos: number[] = []
  const w = 9
  const dash = (ax: number, ay: number, bx: number, by: number) => {
    const len = Math.hypot(bx - ax, by - ay)
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len]
    for (let s = 0; s + 34 < len; s += 62) {
      const [x0, y0, x1, y1] = [ax + ux * s, ay + uy * s, ax + ux * (s + 34), ay + uy * (s + 34)]
      const [nx, ny] = [-uy * w, ux * w]
      const q = [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]
      for (const k of [0, 2, 1, 0, 3, 2]) pos.push(q[k][0], -q[k][1], 3)
    }
  }
  for (const r of Object.values(ROUTES)) for (let i = 0; i + 1 < r.length; i++) dash(r[i][0], r[i][1], r[i + 1][0], r[i + 1][1])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return g
}

export function routeGlowGeometry(w = 46) {
  const pos: number[] = []
  const uv: number[] = []
  const col: number[] = []
  for (const r of Object.values(ROUTES))
    for (let i = 0; i + 1 < r.length; i++) {
      const [[ax, ay], [bx, by]] = [r[i], r[i + 1]]
      const len = Math.hypot(bx - ax, by - ay)
      const [nx, ny] = [(-(by - ay) / len) * w, ((bx - ax) / len) * w]
      const q = [[ax + nx, ay + ny, 0], [bx + nx, by + ny, 0], [bx - nx, by - ny, 1], [ax - nx, ay - ny, 1]]
      for (const k of [0, 1, 2, 0, 2, 3]) {
        pos.push(q[k][0], -q[k][1], 2)
        uv.push(0.5, q[k][2])
        col.push(1, 1, 1, fade(q[k][0], q[k][1]) ** 2)
      }
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return g
}

export function rim(parts: THREE.BufferGeometry[], at: P, r: number, color: string) {
  const g = new THREE.TorusGeometry(r, r * 0.13, 6, 40)
  g.scale(1, 1, 0.6)
  parts.push(part(g, color, at[0], -at[1], 6))
  return parts
}

