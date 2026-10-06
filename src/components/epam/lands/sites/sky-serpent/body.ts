import * as THREE from 'three'
import { C } from './kit'
import { N, type Spine } from './spine'

const M = 12
const SHADE = { x: 46, y: -64 }
const ink = new THREE.Color()
const tone = (t: number, a: number, out: number[]) => {
  const top = Math.sin(a)
  const band = Math.floor(t * 70) % 2 ? 1 : 0.86
  if (top > 0.92) ink.set(Math.floor(t * 46) % 2 ? C.sheen : C.crown)
  else if (top > 0.55) ink.set(C.back).lerp(new THREE.Color(C.hide), 0.4 * band)
  else if (top > -0.35) ink.set(C.flank).multiplyScalar(band)
  else ink.set(C.belly)
  if (t < 0.04) ink.lerp(new THREE.Color(C.mane), 1 - t / 0.04)
  out.push(ink.r, ink.g, ink.b)
}

export function bodyGeometry() {
  const g = new THREE.BufferGeometry()
  const col: number[] = []
  const idx: number[] = []
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      tone(i / (N - 1), (j / M) * Math.PI * 2, col)
      if (i === N - 1) continue
      const a = i * M + j
      const b = i * M + ((j + 1) % M)
      idx.push(a, a + M, b, b, a + M, b + M)
    }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * M * 3), 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

export function shadowGeometry() {
  const g = new THREE.BufferGeometry()
  const idx: number[] = []
  for (let i = 0; i < N - 1; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3))
  g.setIndex(idx)
  return g
}

export function shape(body: THREE.BufferGeometry, shadow: THREE.BufferGeometry, sp: Spine) {
  const p = body.getAttribute('position') as THREE.BufferAttribute
  const s = shadow.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < N; i++) {
    const nx = -sp.ty[i]
    const ny = sp.tx[i]
    const r = sp.r[i]
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2
      const c = Math.cos(a) * r
      p.setXYZ(i * M + j, sp.x[i] + nx * c, sp.y[i] + ny * c, sp.z[i] + Math.sin(a) * r)
    }
    const w = r * 0.9
    const k = 1 - (sp.z[i] - 100) / 400
    s.setXYZ(i * 2, sp.x[i] + SHADE.x * k + nx * w, sp.y[i] + SHADE.y * k + ny * w, 2)
    s.setXYZ(i * 2 + 1, sp.x[i] + SHADE.x * k - nx * w, sp.y[i] + SHADE.y * k - ny * w, 2)
  }
  p.needsUpdate = true
  s.needsUpdate = true
}
