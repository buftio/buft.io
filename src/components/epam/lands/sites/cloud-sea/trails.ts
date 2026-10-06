import * as THREE from 'three'

export const SAMPLES = 60
export const TRAILS = 2
const EVERY = 0.22

export type Trail = { x: Float32Array; y: Float32Array; z: Float32Array; head: number; last: number }

export function trail(): Trail {
  return { x: new Float32Array(SAMPLES), y: new Float32Array(SAMPLES), z: new Float32Array(SAMPLES), head: -1, last: -9 }
}

export function trailGeometry() {
  const g = new THREE.BufferGeometry()
  const verts = TRAILS * SAMPLES * 2
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(verts * 4), 4))
  const idx: number[] = []
  for (let t = 0; t < TRAILS; t++)
    for (let k = 0; k < SAMPLES - 1; k++) {
      const a = (t * SAMPLES + k) * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  g.setIndex(idx)
  return g
}

export function push(tr: Trail, time: number, x: number, y: number, z: number) {
  if (tr.head < 0) {
    tr.x.fill(x)
    tr.y.fill(y)
    tr.z.fill(z)
    tr.head = 0
  }
  if (time - tr.last >= EVERY || time < tr.last) {
    tr.last = time
    tr.head = (tr.head + 1) % SAMPLES
  }
  tr.x[tr.head] = x
  tr.y[tr.head] = y
  tr.z[tr.head] = z
}

export function draw(g: THREE.BufferGeometry, slot: number, tr: Trail, width: number, alpha: number, tint: THREE.Color) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const col = g.getAttribute('color') as THREE.BufferAttribute
  for (let k = 0; k < SAMPLES; k++) {
    const i = (tr.head - k + SAMPLES) % SAMPLES
    const j = (tr.head - Math.min(k + 1, SAMPLES - 1) + SAMPLES) % SAMPLES
    const h = (tr.head - Math.max(k - 1, 0) + SAMPLES) % SAMPLES
    let dx = tr.x[h] - tr.x[j]
    let dy = tr.y[h] - tr.y[j]
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d
    const u = k / (SAMPLES - 1)
    const w = width * (0.35 + u * 1.3) * (k === 0 ? 0.2 : 1)
    const a = alpha * Math.min(1, k / 3) * (1 - u) ** 1.4
    const v = (slot * SAMPLES + k) * 2
    pos.setXYZ(v, tr.x[i] - dy * w, tr.y[i] + dx * w, tr.z[i])
    pos.setXYZ(v + 1, tr.x[i] + dy * w, tr.y[i] - dx * w, tr.z[i])
    col.setXYZW(v, tint.r, tint.g, tint.b, a)
    col.setXYZW(v + 1, tint.r, tint.g, tint.b, a)
  }
  pos.needsUpdate = true
  col.needsUpdate = true
}
