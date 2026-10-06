import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const TILT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler((50 * Math.PI) / 180, 0, 0),
)
export const UP = new THREE.Vector3(0, 1, 0).applyQuaternion(TILT)
const Y = new THREE.Vector3(0, 1, 0)
const spin = new THREE.Quaternion()
const m4 = new THREE.Matrix4()
const e = new THREE.Euler()
const q = new THREE.Quaternion()
const v = new THREE.Vector3()
const s = new THREE.Vector3()

export type Spot = { at: [number, number]; size: number; turn?: number }

export function lift(
  spot: Spot,
  x: number,
  y: number,
  z: number,
  out = new THREE.Vector3(),
) {
  out
    .set(x, y, z)
    .multiplyScalar(spot.size)
    .applyQuaternion(spin.setFromAxisAngle(Y, spot.turn ?? 0))
    .applyQuaternion(TILT)
  return out.set(out.x + spot.at[0], out.y - spot.at[1], out.z)
}

export function orient(turn: number, out: THREE.Quaternion) {
  return out.copy(TILT).multiply(spin.setFromAxisAngle(Y, turn))
}

function tint(g: THREE.BufferGeometry, color: string, alpha?: number) {
  const c = new THREE.Color(color)
  const rgb = alpha === undefined ? [c.r, c.g, c.b] : [c.r, c.g, c.b, alpha]
  const n = g.getAttribute('position').count
  g.setAttribute(
    'color',
    new THREE.BufferAttribute(
      Float32Array.from(
        { length: n * rgb.length },
        (_, i) => rgb[i % rgb.length],
      ),
      rgb.length,
    ),
  )
  return g
}

export class Kit {
  parts: THREE.BufferGeometry[] = []

  add(
    shape: THREE.BufferGeometry,
    color: string,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const g = shape.index ? shape.toNonIndexed() : shape
    if (g !== shape) shape.dispose()
    g.deleteAttribute('uv')
    g.applyMatrix4(m4.makeRotationFromEuler(e.set(rx, ry, rz)))
    g.translate(x, y, z)
    this.parts.push(tint(g, color))
    return g
  }

  rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, sides = 6) {
    const len = a.distanceTo(b)
    const g = new THREE.CylinderGeometry(r, r, len, sides)
    q.setFromUnitVectors(Y, v.subVectors(b, a).normalize())
    g.applyMatrix4(
      m4.compose(s.addVectors(a, b).multiplyScalar(0.5), q, v.set(1, 1, 1)),
    )
    return this.add(g, color)
  }

  place(spot: Spot, build: (k: Kit) => void) {
    const k = new Kit()
    build(k)
    const g = k.merge()
    g.applyMatrix4(
      m4.compose(
        v.set(spot.at[0], -spot.at[1], 0),
        orient(spot.turn ?? 0, q),
        s.setScalar(spot.size),
      ),
    )
    this.parts.push(g)
  }

  merge() {
    const g = mergeGeometries(this.parts)
    this.parts.forEach((p) => p.dispose())
    this.parts = []
    return g
  }
}

export function fan(
  x: number,
  y: number,
  rx: number,
  ry: number,
  inner: string,
  alpha: number,
  outer = inner,
  edge = 0,
  n = 28,
) {
  const pos = [x, -y, 0]
  const col = [...rgb(inner), alpha]
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    pos.push(x + Math.cos(a) * rx, -y + Math.sin(a) * ry, 0)
    col.push(...rgb(outer), edge)
  }
  const idx = []
  for (let i = 1; i <= n; i++) idx.push(0, i, i + 1)
  return sheet(pos, col, idx)
}

export function ribbon(
  path: [number, number][],
  width: number,
  core: string,
  alpha: number,
  n = 40,
) {
  const curve = new THREE.CatmullRomCurve3(
    path.map(([x, y]) => new THREE.Vector3(x, -y, 0)),
  )
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const c = rgb(core)
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n)
    const t = curve.getTangent(i / n)
    for (const k of [-1, 0, 1]) {
      pos.push(p.x - t.y * width * k, p.y + t.x * width * k, 0)
      col.push(...c, k === 0 ? alpha : 0)
    }
    if (i < n) {
      const b = i * 3
      idx.push(
        b,
        b + 3,
        b + 1,
        b + 1,
        b + 3,
        b + 4,
        b + 1,
        b + 4,
        b + 2,
        b + 2,
        b + 4,
        b + 5,
      )
    }
  }
  return sheet(pos, col, idx)
}

function sheet(pos: number[], col: number[], idx: number[]) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

function rgb(hex: string) {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b]
}

export function path(points: [number, number][]) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
  )
  const table = curve.getSpacedPoints(64)
  return (t: number, out: THREE.Vector3) => {
    const f = Math.min(0.9999, Math.max(0, t)) * 64
    const i = Math.floor(f)
    return out.lerpVectors(table[i], table[i + 1], f - i)
  }
}
