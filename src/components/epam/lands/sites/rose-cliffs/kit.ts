import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))

const v = new THREE.Vector3()
const w = new THREE.Vector3()
const spin = new THREE.Matrix4()

export function stand(dx: number, dy: number, s = 1, turn = 0, lift = 0, out = new THREE.Matrix4()) {
  out.compose(v.set(dx, -dy, lift), TILT, w.set(s, s, s))
  return out.multiply(spin.makeRotationY(turn))
}

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Opt = { rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; top?: string; uv?: boolean }

const local = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const tint = new THREE.Color()
const roof = new THREE.Color()

export class Kit {
  parts: THREE.BufferGeometry[] = []
  frame = new THREE.Matrix4()

  on(m: THREE.Matrix4) {
    this.frame.copy(m)
    return this
  }

  add(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, o: Opt = {}) {
    const g = shape.index ? shape.toNonIndexed() : shape
    if (g !== shape) shape.dispose()
    local.compose(v.set(x, y, z), q.setFromEuler(e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0)), w.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1))
    g.applyMatrix4(local)
    const normal = g.getAttribute('normal')
    const n = g.getAttribute('position').count
    tint.set(color)
    roof.set(o.top ?? color)
    const rgb = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const c = o.top && normal.getY(i) > 0.55 ? roof : tint
      rgb[i * 3] = c.r
      rgb[i * 3 + 1] = c.g
      rgb[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
    if (!o.uv) g.deleteAttribute('uv')
    g.applyMatrix4(this.frame)
    this.parts.push(g)
    return this
  }

  beam(a: THREE.Vector3Like, b: THREE.Vector3Like, t: number, color: string) {
    const d = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z)
    const g = new THREE.BoxGeometry(t, d.length(), t)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()))
    return this.add(g, color, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
  }

  box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, o: Opt = {}) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, o)
  }

  build() {
    const g = mergeGeometries(this.parts)
    this.parts.forEach((p) => p.dispose())
    this.parts = []
    return g
  }
}

export function at(m: THREE.Matrix4, x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z).applyMatrix4(m)
}
