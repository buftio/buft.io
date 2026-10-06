import * as THREE from 'three'
import { C, eyes, lift, merged, part, stood, UP_Y, UP_Z } from './kit'
import { ATOLL, CRANE, CRANE_H, CRANE_SIZE, DESK, LAMP_H, PIER, TOWER } from './map'

const STRIPES = 5

function lighthouse() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 9), '#c79ab6', 0, 0.25, 0))
  p.push(part(new THREE.CylinderGeometry(1.05, 1.15, 0.35, 14), C.wall, 0, 0.67, 0))
  for (let k = 0; k < 4; k++) p.push(part(new THREE.BoxGeometry(0.06, 1.5, 0.06), C.ink, Math.cos(k * 1.571 + 0.785) * 0.58, 5.87, Math.sin(k * 1.571 + 0.785) * 0.58))
  const seg = 4.2 / STRIPES
  for (let k = 0; k < STRIPES; k++) {
    const r0 = 0.95 - (k * 0.33) / STRIPES
    const r1 = 0.95 - ((k + 1) * 0.33) / STRIPES
    p.push(part(new THREE.CylinderGeometry(r1, r0, seg, 16), k % 2 ? C.red : C.stone, 0, 0.85 + seg * (k + 0.5), 0))
  }
  p.push(part(new THREE.CylinderGeometry(0.98, 0.8, 0.12, 16), C.teal, 0, 5.1, 0))
  p.push(part(new THREE.TorusGeometry(0.92, 0.04, 4, 20).rotateX(Math.PI / 2), C.ink, 0, 5.45, 0))
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2
    p.push(part(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), C.ink, Math.cos(a) * 0.92, 5.3, Math.sin(a) * 0.92))
  }
  p.push(part(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16), C.ink, 0, 6.64, 0))
  p.push(part(new THREE.ConeGeometry(0.66, 0.65, 16), C.teal, 0, 7.0, 0))
  p.push(part(new THREE.SphereGeometry(0.15, 8, 6), C.gold, 0, 7.4, 0))
  p.push(part(new THREE.BoxGeometry(0.42, 0.62, 0.05), C.ink, 0, 1.15, 0.96))
  p.push(part(new THREE.BoxGeometry(0.22, 0.3, 0.05), C.ink, 0, 4.25, 0.72))
  eyes(p, 2.75, 0.78, 0.26, 0.2)
  return merged(p)
}

function palm(lean: number) {
  const p: THREE.BufferGeometry[] = []
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(0.11, 0.13, 0.42, 6), k % 2 ? C.wood : C.plank, lean * k * 0.12, 0.21 + k * 0.4, 0))
  const top = 2.05
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const leaf = new THREE.ConeGeometry(0.2, 1.1, 4).rotateZ(Math.PI / 2 + 0.35).translate(0.5, 0, 0).rotateY(a)
    p.push(part(leaf, k % 2 ? C.leaf : C.teal, lean * 0.6, top, 0))
  }
  for (let k = 0; k < 3; k++) p.push(part(new THREE.SphereGeometry(0.12, 6, 5), C.red, lean * 0.6 + Math.cos(k * 2.1) * 0.14, top - 0.15, Math.sin(k * 2.1) * 0.14))
  return merged(p)
}

function cottage() {
  const p = [
    part(new THREE.BoxGeometry(1.6, 1, 1.2), C.stone, 0, 0.5, 0),
    part(new THREE.ConeGeometry(1.25, 0.8, 4), C.red, 0, 1.4, 0, Math.PI / 4),
    part(new THREE.BoxGeometry(0.34, 0.6, 0.04), C.ink, -0.35, 0.3, 0.61),
    part(new THREE.BoxGeometry(0.16, 0.7, 0.16), C.wall, 0.45, 1.75, 0),
  ]
  eyes(p, 0.62, 0.62, 0.22, 0.13)
  return merged(p)
}

function countingHouse() {
  const p = [
    part(new THREE.BoxGeometry(2.8, 0.25, 2), C.wall, 0, 0.12, 0),
    part(new THREE.BoxGeometry(2.4, 1.5, 1.6), C.stone, 0, 1, 0),
    part(new THREE.ConeGeometry(1.95, 1.1, 4), C.teal, 0, 2.3, 0, Math.PI / 4),
    part(new THREE.BoxGeometry(0.8, 0.7, 0.8), C.stone, 0, 3.05, 0),
    part(new THREE.ConeGeometry(0.66, 0.6, 4), C.teal, 0, 3.7, 0, Math.PI / 4),
    part(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16).rotateX(Math.PI / 2), C.gold, 0, 3.08, 0.42),
    part(new THREE.BoxGeometry(0.03, 0.22, 0.02), C.ink, 0, 3.14, 0.46),
    part(new THREE.BoxGeometry(0.16, 0.03, 0.02), C.ink, 0.06, 3.08, 0.46),
    part(new THREE.BoxGeometry(0.5, 0.75, 0.04), C.ink, 0, 0.62, 0.81),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), C.ink, 0, 4.4, 0),
    part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.5, -0.12), new THREE.Vector2(0, -0.26)])), C.red, 0.02, 4.82, 0),
  ]
  eyes(p, 1.25, 0.82, 0.62, 0.24)
  for (const x of [-0.62, 0.62]) p.push(part(new THREE.BoxGeometry(0.46, 0.07, 0.06).rotateZ(x * 0.45), C.ink, x, 1.62, 0.84))
  return merged(p)
}

function crane() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 10), C.wall, 0, 0.15, 0))
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]])
    p.push(part(new THREE.BoxGeometry(0.1, CRANE_H, 0.1), C.wood, x, 0.3 + CRANE_H / 2, z))
  for (let k = 1; k < 4; k++) p.push(part(new THREE.BoxGeometry(0.6, 0.06, 0.6), C.plank, 0, 0.3 + (k * CRANE_H) / 4, 0))
  return merged(p)
}

function desk() {
  const p = [
    part(new THREE.BoxGeometry(1.6, 0.7, 0.8), C.wood, 0, 0.35, 0),
    part(new THREE.BoxGeometry(1.7, 0.08, 0.9), C.plank, 0, 0.74, 0),
    part(new THREE.BoxGeometry(0.5, 0.3, 0.4), C.stone, -0.5, 0.93, -0.1),
    part(new THREE.BoxGeometry(0.36, 0.04, 0.3), C.mint, -0.5, 1.1, -0.1),
    part(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), C.ink, 0.75, 0.8, -0.3),
    part(new THREE.BoxGeometry(0.7, 0.4, 0.03), C.stone, 0.75, 1.45, -0.3),
    part(new THREE.BoxGeometry(0.5, 0.06, 0.035), C.red, 0.75, 1.5, -0.28),
  ]
  return merged(p)
}

function pen() {
  const p: THREE.BufferGeometry[] = []
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    p.push(part(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 5), C.wood, Math.cos(a) * 1.3, 0.4, Math.sin(a) * 1.3))
  }
  p.push(part(new THREE.TorusGeometry(1.3, 0.04, 4, 24).rotateX(Math.PI / 2), C.plank, 0, 0.65, 0))
  p.push(part(new THREE.TorusGeometry(1.3, 0.04, 4, 24).rotateX(Math.PI / 2), C.plank, 0, 0.35, 0))
  p.push(part(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 4), C.ink, 1.7, 0.65, 0.5))
  p.push(part(new THREE.BoxGeometry(0.9, 0.5, 0.05), C.gold, 1.7, 1.3, 0.5))
  p.push(part(new THREE.BoxGeometry(0.7, 0.08, 0.06), C.ink, 1.7, 1.38, 0.53, 0.5))
  p.push(part(new THREE.BoxGeometry(0.7, 0.08, 0.06), C.ink, 1.7, 1.38, 0.53, -0.5))
  return merged(p)
}

function pier() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(13, 0.18, 1.2), C.plank, 0, 0.3, 0))
  for (let k = -6; k <= 6; k += 1.5) {
    p.push(part(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 5), C.wood, k, 0.15, 0.55))
    p.push(part(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 5), C.wood, k, 0.15, -0.55))
  }
  return merged(p)
}

function stack(n: number) {
  const p: THREE.BufferGeometry[] = []
  for (let row = 0; row < n; row++)
    for (let k = 0; k < n - row; k++) {
      const x = (k - (n - row - 1) / 2) * 0.9
      p.push(part(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12).rotateX(Math.PI / 2), row % 2 ? C.deep : C.red, x, 0.45 + row * 0.75, 0))
      p.push(part(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 10).rotateX(Math.PI / 2), C.deep, x, 0.45 + row * 0.75, 0))
    }
  return merged(p)
}

function shed() {
  const p = [
    part(new THREE.BoxGeometry(2.2, 1.1, 1.4), C.wall, 0, 0.55, 0),
    part(new THREE.BoxGeometry(2.4, 0.12, 1.7), C.red, 0, 1.2, 0, 0),
    part(new THREE.BoxGeometry(0.8, 0.8, 0.04), C.ink, 0, 0.4, 0.71),
  ]
  eyes(p, 0.92, 0.72, 0.5, 0.12)
  return merged(p)
}

const FLAGS = [C.red, C.mint, C.gold, C.white, C.teal]
const DOWN = new THREE.Vector3(0, -UP_Y, -UP_Z)

function bunting(a: THREE.Vector3, b: THREE.Vector3, n: number, sag: number) {
  const pos: number[] = []
  const col: number[] = []
  const at = (t: number) => a.clone().lerp(b, t).addScaledVector(DOWN, sag * 4 * t * (1 - t))
  for (let k = 0; k < n; k++) {
    const p0 = at(k / n + 0.1 / n)
    const p1 = at((k + 0.9) / n)
    const tip = p0.clone().lerp(p1, 0.5).addScaledVector(DOWN, 20)
    pos.push(...p0.toArray(), ...p1.toArray(), ...tip.toArray())
    const c = new THREE.Color(FLAGS[k % FLAGS.length])
    for (let j = 0; j < 3; j++) col.push(c.r, c.g, c.b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

const local = (dx: number, dy: number, h: number) => lift(new THREE.Vector3(), dx, dy, h)

export function harbourGeometry() {
  const { light, count, pen: islet } = ATOLL
  const g: THREE.BufferGeometry[] = [
    stood(lighthouse(), light.at[0], light.at[1] + 10, TOWER),
    stood(cottage(), light.at[0] - 150, light.at[1] + 70, 48, 0.4),
    stood(palm(1), light.at[0] + 140, light.at[1] - 40, 60, 0.3),
    stood(palm(-1), light.at[0] - 130, light.at[1] - 85, 55, 1.2),
    stood(palm(1), light.at[0] + 95, light.at[1] + 120, 50, 2),
    stood(countingHouse(), count.at[0] + 30, count.at[1] + 35, 72),
    stood(palm(-1), count.at[0] + 140, count.at[1] - 60, 55, 0.6),
    stood(palm(1), count.at[0] - 120, count.at[1] + 95, 48, 2.4),
    stood(crane(), CRANE[0], CRANE[1], CRANE_SIZE),
    stood(desk(), DESK[0], DESK[1], 52, -0.25),
    stood(pen(), islet.at[0], islet.at[1], 52),
    stood(palm(-1), islet.at[0] + 70, islet.at[1] - 80, 46, 1),
    stood(pier(), PIER[0], PIER[1], 46),
    stood(stack(4), PIER[0] - 170, PIER[1] + 90, 40, 0.2),
    stood(stack(3), PIER[0] + 60, PIER[1] + 110, 40, -0.3),
    stood(shed(), PIER[0] + 260, PIER[1] + 80, 60, -0.2),
  ]
  const gallery = local(light.at[0] + 0.85 * TOWER, light.at[1] + 10, 5.3 * TOWER)
  const jib = local(CRANE[0], CRANE[1], (CRANE_H + 0.9) * CRANE_SIZE)
  const mast = local(count.at[0] + 30, count.at[1] + 35, 4.75 * 72)
  const roof = local(PIER[0] + 260, PIER[1] + 80, 1.3 * 60)
  const pole = local(PIER[0] - 290, PIER[1], 40)
  g.push(bunting(gallery, jib, 9, 40), bunting(jib, mast, 7, 35), bunting(pole, roof, 16, 30))
  return merged(g)
}

export const LAMP_AT = { h: LAMP_H * TOWER }
