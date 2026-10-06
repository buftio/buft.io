import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  ink: '#2a1630',
  white: '#ffffff',
  teal: '#16b3a0',
  mint: '#7dffe6',
  hide: '#2f2342',
  back: '#231a34',
  flank: '#4a3d68',
  sheen: '#6a5694',
  crown: '#4a3a6c',
  muzzle: '#6c5a98',
  lid: '#8a76bd',
  belly: '#f1d28a',
  rug: '#fff3df',
  mane: '#ff5a3c',
  flame: '#ffb03a',
  horn: '#fff1d6',
  gold: '#ffd36b',
  cream: '#fff7ea',
  canvas: '#fbe9d9',
  twig: '#8a5a3a',
  egg: '#cfe9ff',
  beak: '#ff8a5c',
  folk: '#4a35a6',
  leather: '#a0603a',
}

type G = THREE.BufferGeometry
const up = new THREE.Vector3(0, 1, 0)
const q = new THREE.Quaternion()
const v = new THREE.Vector3()

export function part(shape: G, color: string, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (rx) g.rotateX(rx)
  if (ry) g.rotateY(ry)
  if (rz) g.rotateZ(rz)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  if (!g.getAttribute('normal')) g.computeVertexNormals()
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function blob(color: string, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, w = 12, h = 9) {
  const g = new THREE.SphereGeometry(1, w, h)
  g.scale(sx, sy, sz)
  return part(g, color, x, y, z)
}

export function rod(color: string, from: [number, number, number], dir: [number, number, number], len: number, r0: number, r1 = 0, n = 7) {
  const g = new THREE.CylinderGeometry(r1, r0, len, n)
  g.translate(0, len / 2, 0)
  g.applyQuaternion(q.setFromUnitVectors(up, v.set(...dir).normalize()))
  return part(g, color, ...from)
}

export function merged(parts: G[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function eyes(parts: G[], y: number, z: number, gap: number, r: number) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 12, 9), C.white, side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 8, 6), C.ink, side * gap * 0.92, y - r * 0.25, z + r * 0.75))
  }
}

const TILT = (50 * Math.PI) / 180
export const COS = Math.cos(TILT)
export const SIN = Math.sin(TILT)
const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const s = new THREE.Vector3()
const e = new THREE.Euler()

export function stand(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, size: number, yaw = 0, roll = 0) {
  q.setFromEuler(e.set(TILT, yaw, roll, 'XYZ'))
  mesh.setMatrixAt(i, m.compose(p.set(x, y, z), q, s.set(size, size, size)))
}

export function lay(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, rz = 0, rx = 0) {
  q.setFromEuler(e.set(rx, 0, rz, 'ZXY'))
  mesh.setMatrixAt(i, m.compose(p.set(x, y, z), q, s.set(sx, sy, sz)))
}

const a = new THREE.Vector3()
const b = new THREE.Vector3()

export function span(mesh: THREE.InstancedMesh, i: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, w: number) {
  a.set(x0, y0, z0)
  b.set(x1, y1, z1)
  v.subVectors(b, a)
  const len = v.length()
  q.setFromUnitVectors(up, len > 0 ? v.divideScalar(len) : up)
  mesh.setMatrixAt(i, m.compose(p.addVectors(a, b).multiplyScalar(0.5), q, s.set(w, len, w)))
}

export function hide(mesh: THREE.InstancedMesh, i: number) {
  mesh.setMatrixAt(i, m.makeScale(0, 0, 0))
}

export function done(...meshes: THREE.InstancedMesh[]) {
  for (const k of meshes) {
    k.instanceMatrix.needsUpdate = true
    if (k.instanceColor) k.instanceColor.needsUpdate = true
  }
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
export const smooth = (x: number) => {
  const t = clamp(x)
  return t * t * (3 - 2 * t)
}
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
