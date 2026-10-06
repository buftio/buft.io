import * as THREE from 'three'
import { at, merge, paint, stand, track, sample } from './kit'
import { CHARMER, EGGS, HOUSES, JETTY, ROAD, SHRINE, type Egg } from './map'
import { CORAL, CREAM, INK, JADE, SAFFRON } from './models'

const PI = Math.PI

function eyes(parts: THREE.BufferGeometry[], y: number, z: number, r: number, gap: number) {
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.SphereGeometry(r, 10, 8), '#ffffff', at(side * gap, y, z)))
    parts.push(paint(new THREE.SphereGeometry(r * 0.5, 8, 6), INK, at(side * gap * 0.93, y - r * 0.3, z + r * 0.8)))
  }
}

function shell(r: number, len: number) {
  const prof = Array.from({ length: 13 }, (_, k) => {
    const t = k / 12
    return new THREE.Vector2(r * Math.pow(Math.sin(t * PI), 0.55) + 0.001, (t - 0.5) * len)
  })
  return new THREE.LatheGeometry(prof, 16, PI / 2, PI)
}

function hull() {
  const parts = [
    merge([
      paint(shell(0.4, 1.4), [JADE, '#43cdb6'], at(0, 0, 0, PI / 2, 0, 0)),
      paint(shell(0.42, 1.46), SAFFRON, at(0, -0.03, 0, PI / 2, 0, 0, 1, 1, 0.22)),
      paint(shell(0.405, 1.3), CREAM, at(0, 0.06, 0, PI / 2, 0, 0, 1, 1, 0.08)),
    ]).rotateY(PI / 2),
    paint(new THREE.BoxGeometry(1.2, 0.05, 0.05), '#6b4325', at(0, 0.4, 0)),
    paint(new THREE.PlaneGeometry(0.2, 0.14), SAFFRON, at(-0.36, 0.07, 0.33, -0.25, 0, 0)),
    paint(new THREE.CircleGeometry(0.1, 12, 0, PI), SAFFRON, at(-0.36, 0.14, 0.32, -0.25, 0, 0)),
    paint(new THREE.PlaneGeometry(0.14, 0.12), INK, at(-0.36, 0.07, 0.34, -0.25, 0, 0)),
    paint(new THREE.CircleGeometry(0.07, 12, 0, PI), INK, at(-0.36, 0.13, 0.335, -0.25, 0, 0)),
    paint(new THREE.CircleGeometry(0.06, 10), '#ffd36b', at(0.42, 0.12, 0.27, 0, 0.5, 0)),
    paint(new THREE.CylinderGeometry(0.045, 0.055, 0.3, 6), '#6b4325', at(0.35, 0.42, -0.1)),
    paint(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8), SAFFRON, at(0.35, 0.58, -0.1)),
  ]
  eyes(parts, 0.28, 0.36, 0.065, 0.1)
  return merge(parts)
}

function shrine() {
  const parts = [
    paint(new THREE.CylinderGeometry(0.06, 0.08, 1.05, 8), CORAL, at(-0.48, 0.52, 0)),
    paint(new THREE.CylinderGeometry(0.06, 0.08, 1.05, 8), CORAL, at(0.48, 0.52, 0)),
    paint(new THREE.TorusGeometry(0.56, 0.075, 6, 20, PI), SAFFRON, at(0, 1.0, 0)),
    paint(new THREE.BoxGeometry(1.25, 0.08, 0.1), CORAL, at(0, 0.88, 0)),
    paint(new THREE.SphereGeometry(0.11, 10, 8), '#ffd36b', at(0, 1.42, 0)),
    paint(new THREE.BoxGeometry(0.8, 0.14, 0.32), '#a8743f', at(0, 0.12, 0.35)),
  ]
  for (let k = 0; k < 11; k++) {
    const t = k / 10
    parts.push(paint(new THREE.SphereGeometry(0.06, 6, 5), k % 2 ? '#ff8a1f' : '#ffc23a', at(-0.48 + t * 0.96, 0.82 - Math.sin(t * PI) * 0.16, 0.05)))
  }
  for (const x of [-0.22, 0, 0.22])
    parts.push(paint(new THREE.CylinderGeometry(0.09, 0.1, 0.08, 10), x ? '#ffd36b' : '#ffb800', at(x, 0.23, 0.38)))
  for (const x of [-0.36, 0.36]) parts.push(paint(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), CREAM, at(x, 0.3, 0.38)))
  return merge(parts)
}

function nest(e: Egg) {
  const A = e.a * 1.32
  const B = e.b * 1.32
  const w = Math.min(A, B) * 0.22 + 10
  const parts = [paint(new THREE.TorusGeometry(1, 0.13, 5, 24), ['#3d2412', '#6b4325'], at(0, 0, 4, 0, 0, 0, A, B, w * 2))]
  const n = Math.round((A + B) / 7)
  for (let k = 0; k < n; k++) {
    const t = (k / n) * PI * 2
    const x = Math.cos(t) * A * (1 + ((k * 5) % 3) * 0.04)
    const y = Math.sin(t) * B * (1 + ((k * 5) % 3) * 0.04)
    const tan = Math.atan2(Math.cos(t) * B, -Math.sin(t) * A) - PI / 2 + (k % 2 ? 0.4 : -0.4)
    const g = new THREE.CylinderGeometry(5, 3.5, w * 2.6 + (k % 3) * 10, 4)
    parts.push(paint(g, ['#4a2c14', '#8a5a30', '#6b4325'][k % 3], at(x, y, 10 + (k % 3) * 3, 0, 0, tan)))
  }
  for (let k = 0; k < 5; k++) {
    const t = k * 2.3
    parts.push(paint(new THREE.CircleGeometry(Math.min(e.a, e.b) * (0.1 + (k % 3) * 0.04), 10), '#fff4f8', at(Math.cos(t) * e.a * 0.5, Math.sin(t) * e.b * 0.5, 5)))
  }
  return merge(parts, at(e.at[0], -e.at[1], 0, 0, 0, e.ang))
}

function jetty() {
  const [x, y] = JETTY
  const parts = [paint(new THREE.PlaneGeometry(400, 64), ['#a8743f', '#c99a62'], at(x + 180, -y, 4))]
  for (let k = 0; k < 9; k++) parts.push(paint(new THREE.PlaneGeometry(4, 64), '#6b4325', at(x + 10 + k * 45, -y, 5)))
  const lamp = merge([
    paint(new THREE.CylinderGeometry(0.04, 0.05, 1, 6), '#6b4325', at(0, 0.5, 0)),
    paint(new THREE.BoxGeometry(0.22, 0.26, 0.22), SAFFRON, at(0, 1.1, 0)),
  ])
  parts.push(lamp.applyMatrix4(stand(x + 370, y - 30, 120)))
  const boat = merge([
    paint(new THREE.SphereGeometry(0.5, 14, 6, 0, PI * 2, PI / 2, PI / 2), ['#7d4f28', '#c48a50'], at(0, 0.35, 0, 0, 0, 0, 1.4, 0.7, 1)),
    paint(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), '#6b4325', at(0, 0.7, 0)),
    paint(new THREE.PlaneGeometry(0.45, 0.5), CREAM, at(0.24, 0.8, 0)),
  ])
  parts.push(boat.applyMatrix4(stand(x + 250, y + 80, 110, 0.4)))
  return merge(parts)
}

function road() {
  const t = track(ROAD)
  const p = new THREE.Vector3()
  const parts: THREE.BufferGeometry[] = []
  const n = Math.floor(t.len / 75)
  for (let k = 0; k <= n; k++) {
    sample(t, k / n, p)
    parts.push(paint(new THREE.CircleGeometry(16 + (k % 3) * 4, 8), k % 4 ? '#f5ece2' : '#ffd9a8', at(p.x + ((k * 37) % 13) - 6, p.y, 3)))
  }
  return merge(parts)
}

function rug() {
  const [x, y] = CHARMER
  return merge([
    paint(new THREE.PlaneGeometry(120, 80), '#d1343f', at(x, -y - 6, 3, 0, 0, 0.15)),
    paint(new THREE.PlaneGeometry(100, 62), SAFFRON, at(x, -y - 6, 4, 0, 0, 0.15)),
    paint(new THREE.CircleGeometry(16, 10), '#d1343f', at(x, -y - 6, 5)),
  ])
}

export function scenery() {
  const parts = [jetty(), road(), rug()]
  for (const h of HOUSES) parts.push(hull().applyMatrix4(stand(h.at[0], h.at[1], h.s, h.turn)))
  parts.push(shrine().applyMatrix4(stand(SHRINE[0], SHRINE[1], 260)))
  for (const e of EGGS) parts.push(nest(e))
  return merge(parts)
}

const v = new THREE.Vector3()
const point = (m: THREE.Matrix4, x: number, y: number, z: number) => v.set(x, y, z).applyMatrix4(m).toArray() as [number, number, number]

export function flames(): [number, number, number][] {
  const s = stand(SHRINE[0], SHRINE[1], 260)
  const out = [point(s, -0.36, 0.46, 0.38), point(s, 0.36, 0.46, 0.38)]
  out.push(point(stand(JETTY[0] + 370, JETTY[1] - 30, 120), 0, 1.1, 0.14))
  for (const h of HOUSES) out.push(point(stand(h.at[0], h.at[1], h.s, h.turn), 0.42, 0.12, 0.3))
  return out
}
