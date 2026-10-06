import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  ink: '#2a1630',
  white: '#ffffff',
  stone: '#f3ebf4',
  pale: '#dccbe4',
  teal: '#16b3a0',
  mint: '#7dffe6',
  folk: '#4a35a8',
  magenta: '#ff3fae',
  rose: '#ff8fd2',
  indigo: '#3346d6',
  madder: '#e0304a',
  saffron: '#ffb52e',
  gold: '#ffd36b',
  wood: '#a8673f',
  oak: '#7a4630',
}

const SIN = Math.sin((50 * Math.PI) / 180)
const COS = Math.cos((50 * Math.PI) / 180)
export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))
const Y = new THREE.Vector3(0, 1, 0)
const spin = new THREE.Quaternion()

export const air = (dx: number, dy: number, h: number, out = new THREE.Vector3()) =>
  out.set(dx, -dy + h * COS, h * SIN)

export function orient(turn: number, out: THREE.Quaternion) {
  return out.copy(TILT).multiply(spin.setFromAxisAngle(Y, turn))
}

export function tint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color)
  const rgb = [c.r, c.g, c.b]
  const n = g.getAttribute('position').count
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => rgb[i % 3]), 3))
  return g
}

const tilt = new THREE.Matrix4().makeRotationFromQuaternion(TILT)
const mat = new THREE.Matrix4()

export class Kit {
  parts: THREE.BufferGeometry[] = []

  add(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0, tiltX = 0) {
    const g = shape.index ? shape.toNonIndexed() : shape
    if (shape !== g) shape.dispose()
    if (tiltX) g.rotateX(tiltX)
    if (turn) g.rotateY(turn)
    g.translate(x, y, z)
    if (g.getAttribute('uv')) g.deleteAttribute('uv')
    this.parts.push(tint(g, color))
    return this
  }

  eyes(y: number, z: number, gap: number, r: number, up = 0) {
    for (const side of [-1, 1]) {
      this.add(new THREE.CircleGeometry(r, 10), C.white, side * gap, y, z, 0, -up)
      this.add(new THREE.CircleGeometry(r * 0.5, 8), C.ink, side * gap * 0.9, y - r * 0.3 * Math.cos(up), z + r * 0.3 * Math.sin(up) + r * 0.04, 0, -up)
    }
    return this
  }

  geo() {
    const g = mergeGeometries(this.parts)
    this.parts.forEach((p) => p.dispose())
    this.parts = []
    return g
  }

  stand(at: [number, number], size: number, turn = 0) {
    const g = this.geo()
    g.applyMatrix4(mat.makeRotationY(turn))
    g.scale(size, size, size)
    g.applyMatrix4(tilt)
    g.translate(at[0], -at[1], 0)
    return g
  }
}

export function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function folkGeometry() {
  const k = new Kit()
  const body = new THREE.SphereGeometry(0.5, 10, 8)
  body.scale(1, 1.05, 0.9)
  k.add(body, C.folk, 0, 0.55, 0)
  k.add(new THREE.TorusGeometry(0.36, 0.1, 4, 10), C.magenta, 0, 0.3, 0, 0, Math.PI / 2)
  k.add(new THREE.BoxGeometry(0.18, 0.1, 0.28), C.ink, -0.17, 0.05, 0.08)
  k.add(new THREE.BoxGeometry(0.18, 0.1, 0.28), C.ink, 0.17, 0.05, 0.08)
  k.eyes(0.86, 0.36, 0.17, 0.15, 0.75)
  return k.geo()
}

export const TILE = 116

export function netTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(255,63,174,0.3)'
  g.fillRect(0, 0, 128, 128)
  for (const [w, col] of [[10, 'rgba(255,40,160,0.6)'], [4, 'rgba(255,190,232,1)']] as const) {
    g.strokeStyle = col
    g.lineWidth = w
    g.beginPath()
    for (const o of [-128, 0, 128]) {
      g.moveTo(o, 0)
      g.lineTo(o + 128, 128)
      g.moveTo(o + 128, 0)
      g.lineTo(o, 128)
    }
    g.stroke()
  }
  g.fillStyle = '#fff4c2'
  for (const [x, y] of [[0, 0], [128, 0], [0, 128], [128, 128], [64, 64]]) {
    g.beginPath()
    g.arc(x, y, 6, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
