import * as THREE from 'three'

const TILT = (50 * Math.PI) / 180
export const COS = Math.cos(TILT)
export const SIN = Math.sin(TILT)
const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const q = new THREE.Quaternion()
const s = new THREE.Vector3()
const e = new THREE.Euler()

export function stand(mesh: THREE.InstancedMesh, i: number, x: number, y: number, size: number, yaw = 0, roll = 0, z = 0) {
  q.setFromEuler(e.set(TILT, yaw, roll, 'XYZ'))
  mesh.setMatrixAt(i, m.compose(p.set(x, -y, z), q, s.set(size, size, size)))
}

export function flat(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy = sx, rot = 0) {
  q.setFromEuler(e.set(0, 0, rot))
  mesh.setMatrixAt(i, m.compose(p.set(x, -y, z), q, s.set(sx, sy, 1)))
}

export function hide(mesh: THREE.InstancedMesh, i: number) {
  mesh.setMatrixAt(i, m.makeScale(0, 0, 0))
}

export const lifted = { x: 0, y: 0, z: 0 }

export function lift(x: number, y: number, hx: number, hy: number, hz: number, size: number, yaw = 0) {
  const c = Math.cos(yaw)
  const sn = Math.sin(yaw)
  const mx = (hx * c + hz * sn) * size
  const mz = (-hx * sn + hz * c) * size
  const my = hy * size
  lifted.x = x + mx
  lifted.y = y - (my * COS - mz * SIN)
  lifted.z = my * SIN + mz * COS
  return lifted
}

export function done(...meshes: (THREE.InstancedMesh | null)[]) {
  for (const k of meshes) {
    if (!k) continue
    k.instanceMatrix.needsUpdate = true
    if (k.instanceColor) k.instanceColor.needsUpdate = true
  }
}

export function haloTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(c)
}

export const ease = (x: number) => x - Math.sin(2 * Math.PI * x) / (2 * Math.PI)
