import * as THREE from 'three'
import { BOARD, DESKS, HALL, RANGE, STAGE, TRACK } from './layout'
import { C, eyes, merged, part, stood, UPRIGHT } from './kit'

const Q = Math.PI / 4

function mortar(parts: THREE.BufferGeometry[], w: number, y: number, x = 0, z = 0) {
  parts.push(part(new THREE.CylinderGeometry(w * 0.3, w * 0.32, w * 0.16, 16), C.ink, x, y, z))
  parts.push(part(new THREE.BoxGeometry(w, w * 0.03, w), C.ink, x, y + w * 0.09, z, Q))
  parts.push(part(new THREE.CylinderGeometry(w * 0.04, w * 0.04, w * 0.03, 8), C.mint, x, y + w * 0.12, z))
}

function hall() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(2.8, 0.1, 1.6), C.wall, 0, 0.05, 0))
  for (let k = 0; k < 3; k++) p.push(part(new THREE.BoxGeometry(1.2 - k * 0.2, 0.05, 0.12), C.stone, 0, 0.025 + k * 0.05, 0.9 - k * 0.1))
  p.push(part(new THREE.BoxGeometry(2.0, 0.78, 1.0), C.chalk, 0, 0.49, -0.05))
  for (let k = 0; k < 6; k++) {
    const x = -0.85 + k * 0.34
    p.push(part(new THREE.CylinderGeometry(0.065, 0.075, 0.7, 10), C.stone, x, 0.45, 0.58))
    p.push(part(new THREE.BoxGeometry(0.17, 0.05, 0.17), C.wall, x, 0.12, 0.58))
  }
  p.push(part(new THREE.BoxGeometry(2.15, 0.12, 1.3), C.wall, 0, 0.86, 0.05))
  p.push(part(new THREE.BoxGeometry(0.36, 0.48, 0.03), C.ink, 0, 0.34, 0.46))
  p.push(part(new THREE.CylinderGeometry(0.75, 0.8, 0.55, 24), C.ink, 0, 1.18, 0))
  p.push(part(new THREE.BoxGeometry(2.2, 0.07, 2.2), C.ink, 0, 1.47, 0, Q))
  p.push(part(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), C.mint, 0, 1.53, 0))
  p.push(part(new THREE.BoxGeometry(0.03, 0.03, 1.56), C.mint, 0, 1.52, 0.78))
  eyes(p, 0.6, 0.53, 0.34, 0.2, 16)
  for (const s of [-1, 1]) {
    p.push(part(new THREE.CylinderGeometry(0.22, 0.25, 1.1, 14), C.stone, s * 1.3, 0.55, -0.1))
    p.push(part(new THREE.BoxGeometry(0.16, 0.22, 0.03), C.slate, s * 1.3, 0.62, 0.15))
    mortar(p, 0.62, 1.12, s * 1.3, -0.1)
    p.push(part(new THREE.ConeGeometry(0.05, 0.22, 6), C.mint, s * 1.3 + s * 0.3, 1.1, -0.1 + 0.3))
  }
  return p
}

function board() {
  const p: THREE.BufferGeometry[] = []
  for (const s of [-1, 1]) p.push(part(new THREE.BoxGeometry(0.09, 1.9, 0.09), C.wood, s * 1.5, 0.95, -0.05))
  p.push(part(new THREE.BoxGeometry(3.2, 1.62, 0.06), C.wood, 0, 1.12, -0.06))
  p.push(part(new THREE.BoxGeometry(2.9, 0.06, 0.16), C.wood, 0, 0.36, 0.04))
  for (let k = 0; k < 4; k++) p.push(part(new THREE.BoxGeometry(0.12, 0.035, 0.035), [C.chalk, C.pink, C.sun, C.sky][k], -1 + k * 0.2, 0.41, 0.06))
  return p
}

function stage() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(2.7, 0.25, 1.1), C.stone, 0, 0.125, 0))
  p.push(part(new THREE.BoxGeometry(2.72, 0.07, 0.02), C.teal, 0, 0.2, 0.56))
  p.push(part(new THREE.BoxGeometry(0.7, 0.012, 1.0), C.teal, 0.2, 0.256, 0))
  for (let k = 0; k < 3; k++) p.push(part(new THREE.BoxGeometry(0.6, 0.08, 0.14), C.wall, 0.2, 0.04 + k * 0.08, 0.76 - k * 0.12))
  for (const s of [-1, 1]) {
    p.push(part(new THREE.CylinderGeometry(0.05, 0.05, 1.45, 8), C.wood, s * 1.25, 0.95, -0.42))
    p.push(part(new THREE.SphereGeometry(0.08, 8, 6), C.mint, s * 1.25, 1.7, -0.42))
  }
  p.push(part(new THREE.BoxGeometry(0.34, 0.5, 0.28), C.oak, -0.72, 0.5, 0.05))
  p.push(part(new THREE.BoxGeometry(0.42, 0.04, 0.34), C.wood, -0.72, 0.76, 0.05, 0, -0.2))
  for (let k = 0; k < 9; k++) {
    const x = -1.1 + k * 0.275
    const tri = new THREE.Shape([new THREE.Vector2(-0.09, 0), new THREE.Vector2(0.09, 0), new THREE.Vector2(0, -0.16)])
    p.push(part(new THREE.ShapeGeometry(tri), [C.pink, C.sun, C.sky, C.mint][k % 4], x, 1.06 - Math.sin((k / 8) * Math.PI) * 0.08, -0.4))
  }
  return p
}

function desk() {
  return [
    part(new THREE.BoxGeometry(0.9, 0.06, 0.35), C.oak, 0, 0.42, 0),
    part(new THREE.BoxGeometry(0.06, 0.42, 0.3), C.wood, -0.38, 0.21, 0),
    part(new THREE.BoxGeometry(0.06, 0.42, 0.3), C.wood, 0.38, 0.21, 0),
    part(new THREE.BoxGeometry(0.22, 0.02, 0.16), C.chalk, 0.15, 0.46, 0.02, 0.3),
  ]
}

function rail() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(6.4, 0.08, 0.08), C.wood, 0, 0.32, 0))
  for (let k = 0; k <= 4; k++) p.push(part(new THREE.BoxGeometry(0.08, 0.36, 0.08), C.wood, -3.2 + k * 1.6, 0.18, 0))
  return p
}

function placed(parts: THREE.BufferGeometry[], dx: number, dy: number, s: number, turn = 0) {
  return stood(merged(parts), dx, dy, s, turn)
}

export function hallsGeometry() {
  const all = [
    stood(merged(hall()), HALL.x, HALL.y, HALL.s, 0, UPRIGHT),
    placed(board(), BOARD.x, BOARD.y, BOARD.s),
    placed(stage(), STAGE.x, STAGE.y, STAGE.s),
    placed(rail(), RANGE.x, RANGE.y + 70, 66),
    ...DESKS.map((d) => placed(desk(), d.x, d.y - 26, 95)),
  ]
  return merged(all)
}

export const TRACK_LIFT = 3
export { TRACK }
