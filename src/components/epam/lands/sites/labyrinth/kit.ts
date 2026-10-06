import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const IVORY = '#fbf1dc'
export const PARCH = '#e8d6b4'
export const SHADE = '#b49a7c'
export const INK = '#2a1630'
export const SEAL = '#e8473c'
export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const BRASS = '#d9a548'
export const WHITE = '#ffffff'
export const BODY = '#4a34a6'
export const LIGHT = '#74e4ff'
export const URGENT = '#ff4b5c'

export const UP = new THREE.Vector3(0, Math.cos((50 * Math.PI) / 180), Math.sin((50 * Math.PI) / 180))
export const PITCH_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0, tilt = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (shape.index) shape.dispose()
  if (tilt) g.rotateX(tilt)
  g.rotateY(turn)
  g.translate(x, y, z)
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap = 0.14, r = 0.12, look = 0) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 12, 8), WHITE, side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r / 2, 8, 6), INK, side * gap * 0.93 + look * r * 0.4, y - r * 0.3, z + r * 0.8))
  }
}

export function folk(parts: THREE.BufferGeometry[], x: number, z: number, opts: { s?: number; color?: string; cap?: string; look?: number } = {}) {
  const s = opts.s ?? 1
  const at = (g: THREE.BufferGeometry, color: string, dx: number, dy: number, dz: number) =>
    part(g.scale(s, s, s), color, x + dx * s, dy * s, z + dz * s)
  parts.push(at(new THREE.SphereGeometry(0.5, 14, 10), opts.color ?? BODY, 0, 0.5, 0))
  const eye: THREE.BufferGeometry[] = []
  eyes(eye, 0.62, 0.38, 0.15, 0.13, opts.look ?? 0)
  for (const g of eye) {
    g.scale(s, s, s)
    g.translate(x, 0, z)
    parts.push(g)
  }
  if (opts.cap) {
    parts.push(at(new THREE.CylinderGeometry(0.3, 0.34, 0.2, 12), opts.cap, 0, 1.0, 0))
    parts.push(at(new THREE.BoxGeometry(0.4, 0.04, 0.24), INK, 0, 0.92, 0.3))
  }
}

export function envelope(parts: THREE.BufferGeometry[], x = 0, y = 0, z = 0, s = 1, turn = 0) {
  const add = (g: THREE.BufferGeometry, color: string, dx: number, dy: number, dz: number) => {
    g.scale(s, s, s)
    g.translate(dx * s, dy * s, dz * s)
    parts.push(part(g, color, x, y, z, turn))
  }
  add(new THREE.BoxGeometry(0.8, 0.52, 0.06), IVORY, 0, 0, 0)
  const flap = new THREE.Shape([new THREE.Vector2(-0.4, 0.26), new THREE.Vector2(0.4, 0.26), new THREE.Vector2(0, -0.04)])
  add(new THREE.ShapeGeometry(flap), PARCH, 0, 0, 0.035)
  add(new THREE.CircleGeometry(0.09, 10), SEAL, 0, -0.03, 0.04)
}

export function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export const WORDS = ['DEAD END', 'SHORTCUT!', 'YOU ARE HERE', 'LOST LETTERS', '?', 'POST']
export const ROW = 256 / 6

export function signTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  WORDS.forEach((w, k) => {
    const y = k * ROW
    g.fillStyle = w === '?' ? 'rgba(0,0,0,0)' : IVORY
    g.fillRect(0, y + 1, 256, ROW - 2)
    g.fillStyle = w === '?' ? '#ffffff' : INK
    g.font = `900 ${w === '?' ? 40 : w.length > 9 ? 25 : 30}px system-ui, sans-serif`
    g.fillText(w, 128, y + ROW / 2 + 1)
  })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function board(word: number, w: number, h: number) {
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv')
  const v0 = 1 - (word + 1) / 6
  const v1 = 1 - word / 6
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? v1 : v0)
  return g
}
