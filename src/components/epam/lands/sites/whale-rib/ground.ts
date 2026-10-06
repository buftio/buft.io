import * as THREE from 'three'
import { C, hash, placed } from './kit'
import { SIGNS } from './props'
import { CELL, DUG, GRID, RIB, SKULL, track, along } from './plan'

type Q = { x: number[]; c: number[] }

const col = new THREE.Color()

function tri(q: Q, pts: [number, number][], z: number, color: string) {
  col.set(color)
  for (const [x, y] of pts) {
    q.x.push(x, -y, z)
    q.c.push(col.r, col.g, col.b)
  }
}

function disc(q: Q, cx: number, cy: number, r: number, z: number, color: string, n = 8, sx = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const b = ((i + 1) / n) * Math.PI * 2
    tri(q, [[cx, cy], [cx + Math.cos(b) * r * sx, cy + Math.sin(b) * r], [cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r]], z, color)
  }
}

function line(q: Q, x0: number, y0: number, x1: number, y1: number, w: number, z: number, color: string) {
  const a = Math.atan2(y1 - y0, x1 - x0)
  const nx = (-Math.sin(a) * w) / 2
  const ny = (Math.cos(a) * w) / 2
  tri(q, [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny]], z, color)
  tri(q, [[x0 + nx, y0 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], z, color)
}

function build(q: Q) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(q.x, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(q.c, 3))
  return g
}

function blobby(q: Q, cx: number, cy: number, r: number, z: number, color: string, seed: number, dy = 0, sx = 1) {
  const n = 16
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const sq = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) ** 0.55
    const k = r * sq * (0.9 + hash(seed * 31 + i) * 0.16)
    pts.push([cx + Math.cos(a) * k * sx, cy + dy + Math.sin(a) * k])
  }
  for (let i = 0; i < n; i++) tri(q, [[cx, cy + dy], pts[(i + 1) % n], pts[i]], z, color)
}

function pit(q: Q, cx: number, cy: number, i: number) {
  const h = CELL / 2
  blobby(q, cx, cy, h - 14, 2, '#c99447', i)
  blobby(q, cx, cy, h - 26, 2.5, '#9c6a2a', i + 50)
  blobby(q, cx, cy, h - 34, 3, '#e3b66a', i + 50, 9)
  for (let k = 0; k < 3; k++) {
    const a = hash(i * 7 + k) * Math.PI * 2
    disc(q, cx + Math.cos(a) * (h - 4), cy + Math.sin(a) * (h - 4), 16 + hash(i + k * 3) * 12, 3.5, C.sand, 12)
  }
  if (i % 4 === 1) {
    line(q, cx - h + 20, cy - 30, cx + h - 20, cy - 10, 22, 4, C.wood)
    line(q, cx - h + 20, cy - 21, cx + h - 20, cy - 1, 3, 4.2, C.bark)
  }
  if (i % 4 === 3) {
    for (const s of [-1, 1]) line(q, cx + 50 + s * 14, cy - h + 22, cx + 50 + s * 14, cy - 10, 4, 4, C.wood)
    for (let k = 0; k < 5; k++) line(q, cx + 36, cy - h + 32 + k * 18, cx + 64, cy - h + 32 + k * 18, 3, 4.1, C.wood)
  }
}

export function groundGeometry() {
  const q: Q = { x: [], c: [] }
  blobby(q, -250, 25, 690, 0.5, '#efe2c4', 3, 0, 1.12)
  blobby(q, -1560, 380, 330, 1, '#e9d6ad', 5, 0, 1.3)
  blobby(q, -1640, 1030, 200, 1, '#e9d6ad', 6, 0, 1.6)
  blobby(q, -1240, -800, 150, 1, '#e9d6ad', 7, 0, 1.4)
  const [sx, sy] = SKULL
  blobby(q, sx, sy, 150, 2, '#c99447', 90, 0, 1.6)
  blobby(q, sx, sy, 132, 2.5, '#9c6a2a', 91, 0, 1.62)
  blobby(q, sx, sy, 118, 3, '#e3b66a', 91, 10, 1.62)
  for (let k = 0; k < 6; k++) disc(q, sx + Math.cos(k * 1.1) * 250, sy + Math.sin(k * 1.1) * 150, 22 + hash(k + 40) * 14, 3.5, C.sand, 12)
  DUG.forEach(([c, r], i) => pit(q, GRID.x + (c + 0.5) * CELL, GRID.y + (r + 0.5) * CELL, i))
  for (let c = 0; c <= GRID.cols; c++) line(q, GRID.x + c * CELL, GRID.y, GRID.x + c * CELL, GRID.y + GRID.rows * CELL, 3.5, 6, '#b85a35')
  for (let r = 0; r <= GRID.rows; r++) line(q, GRID.x, GRID.y + r * CELL, GRID.x + GRID.cols * CELL, GRID.y + r * CELL, 3.5, 6, '#b85a35')
  const tr = track(RIB)
  const at = { x: 0, y: 0, a: 0 }
  for (let d = 30; d < tr.len - 20; d += 58) {
    along(tr, d, at)
    disc(q, at.x, at.y, 15, 4, C.ivory, 7)
  }
  return build(q)
}

export function ribbonGeometry() {
  const tr = track(RIB)
  const at = { x: 0, y: 0, a: 0 }
  const pos: number[] = []
  const rgb: number[] = []
  const n = 60
  const mint = new THREE.Color(C.white)
  for (let i = 0; i < n; i++) {
    const rows: [number, number, number][] = []
    for (const k of [i, i + 1]) {
      along(tr, (k / n) * tr.len, at)
      const w = 150 * Math.sin((k / n) * Math.PI) ** 0.5 + 20
      const nx = -Math.sin(at.a) * w
      const ny = Math.cos(at.a) * w
      rows.push([at.x + nx, at.y + ny, 0], [at.x, at.y, 1], [at.x - nx, at.y - ny, 0])
    }
    const quad = (a: number, b: number, c: number) => {
      for (const j of [a, b, c]) {
        pos.push(rows[j][0], -rows[j][1], 8)
        const v = rows[j][2]
        rgb.push(mint.r * v, mint.g * v, mint.b * v)
      }
    }
    quad(0, 3, 4)
    quad(0, 4, 1)
    quad(1, 4, 5)
    quad(1, 5, 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(rgb, 3))
  return g
}

export function signGeometry() {
  const parts = SIGNS.map((s) => {
    const g = new THREE.PlaneGeometry(2.5, 0.5)
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (s.row + 1 - uv.getY(i)) / ROWS)
    g.translate(0, s.y, s.z)
    return placed(g, s.at[0], s.at[1], s.size)
  })
  const pos: number[] = []
  const uvs: number[] = []
  for (const g of parts) {
    const ix = g.index ? Array.from(g.index.array) : []
    const p = g.getAttribute('position')
    const u = g.getAttribute('uv')
    for (const i of ix) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i))
      uvs.push(u.getX(i), u.getY(i))
    }
    g.dispose()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return g
}

const ROWS = 5
const H = 256 / ROWS
const LABELS = ['LEVIATHAN MUSEUM', 'TICKETS  2 FAT', 'DIG  -  KEEP OFF', 'TOUCH FOR LUCK', 'AS IT WAS. PROBABLY.']

export function signTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  if (g)
    LABELS.forEach((text, i) => {
      const y = i * H
      g.fillStyle = i === 0 ? C.rust : C.ivory
      g.fillRect(0, y, 256, H)
      g.fillStyle = i === 0 ? C.fat : C.ink
      g.fillRect(4, y + 4, 248, 2)
      g.fillRect(4, y + H - 6, 248, 2)
      g.font = `900 ${i === 0 ? 24 : 26}px Georgia, serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = i === 0 ? C.ivory : C.ink
      g.fillText(text, 128, y + H / 2 + 1, 236)
    })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.3, 'rgba(255,255,255,0.45)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(c)
}
