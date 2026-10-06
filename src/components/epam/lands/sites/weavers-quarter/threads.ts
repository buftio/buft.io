import * as THREE from 'three'
import { air } from './kit'
import { LINES } from './layout'

const SEG = 10

function span(a: [number, number, number], b: [number, number, number], out: THREE.Vector3[]) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1])
  for (let i = out.length ? 1 : 0; i <= SEG; i++) {
    const s = i / SEG
    const h = a[2] + (b[2] - a[2]) * s - d * 0.1 * 4 * s * (1 - s)
    out.push(air(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, h))
  }
}

export type Wire = { pts: THREE.Vector3[]; acc: number[]; len: number; color: THREE.Color }

export const WIRES: Wire[] = LINES.map(({ color, pts }) => {
  const out: THREE.Vector3[] = []
  for (let i = 0; i < pts.length - 1; i++) span(pts[i], pts[i + 1], out)
  const acc = [0]
  for (let i = 1; i < out.length; i++) acc.push(acc[i - 1] + out[i].distanceTo(out[i - 1]))
  return { pts: out, acc, len: acc[acc.length - 1], color: new THREE.Color(color) }
})

export function along(w: Wire, u: number, out: THREE.Vector3) {
  const d = Math.min(Math.max(u, 0), 1) * w.len
  let i = 1
  while (i < w.acc.length - 1 && w.acc[i] < d) i++
  const s = (d - w.acc[i - 1]) / (w.acc[i] - w.acc[i - 1] || 1)
  return out.lerpVectors(w.pts[i - 1], w.pts[i], s)
}

export function path(pts: [number, number][]) {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const len = acc[acc.length - 1]
  return (u: number, out: THREE.Vector3) => {
    const d = Math.min(Math.max(u, 0), 1) * len
    let i = 1
    while (i < acc.length - 1 && acc[i] < d) i++
    const s = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1)
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    return out.set(ax + (bx - ax) * s, ay + (by - ay) * s, Math.atan2(bx - ax, by - ay))
  }
}

export const yarn = (t: number, out: THREE.Vector3) => {
  const a = t * 0.35
  return out.set(260 + Math.sin(a) * 230, 330 + Math.sin(a * 2) * 90 + Math.sin(a * 3.1) * 25, 0)
}
