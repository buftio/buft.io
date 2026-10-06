import * as THREE from 'three'
import { CLAY, CORAL, eyes, GOLD, INK, merged, MINT, part, stand, STONE, TEAL, WALL, WHITE } from './kit'
import { along, BATH, HALF, LENGTH, TOWER, type Spot } from './plan'

export const TOWER_SIZE = 125
export const FACE_Y = 3.6
export const LAMP_Y = 4.68
export const VANE_Y = 6.85

function tower() {
  const p = [
    part(new THREE.BoxGeometry(1.5, 0.3, 1.5), WALL, [0, 0.15, 0]),
    part(new THREE.BoxGeometry(1, 4, 1), STONE, [0, 2.3, 0]),
    part(new THREE.BoxGeometry(1.12, 0.12, 1.12), WALL, [0, 1.6, 0]),
    part(new THREE.BoxGeometry(1.12, 0.12, 1.12), WALL, [0, 3.0, 0]),
    part(new THREE.PlaneGeometry(0.36, 0.62), INK, [0, 0.6, 0.505]),
    part(new THREE.CircleGeometry(0.42, 24), WHITE, [0, FACE_Y, 0.51]),
    part(new THREE.RingGeometry(0.42, 0.5, 24), INK, [0, FACE_Y, 0.512]),
    part(new THREE.BoxGeometry(1.14, 0.1, 1.14), WALL, [0, 4.32, 0]),
    part(new THREE.BoxGeometry(1.2, 0.14, 1.2), WALL, [0, 5.06, 0]),
    part(new THREE.ConeGeometry(0.86, 1.7, 4), CLAY, [0, 5.98, 0], [0, Math.PI / 4, 0]),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), INK, [0, 6.95, 0]),
    part(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 10), GOLD, [0, 4.4, 0]),
  ]
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const big = k % 3 === 0
    p.push(part(new THREE.PlaneGeometry(big ? 0.05 : 0.03, big ? 0.1 : 0.06), INK, [Math.sin(a) * 0.35, FACE_Y + Math.cos(a) * 0.35, 0.514], [0, 0, -a]))
  }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.push(part(new THREE.BoxGeometry(0.13, 0.66, 0.13), STONE, [x * 0.45, 4.7, z * 0.45]))
  eyes(p, 0.23, 2.25, 0.505, 0.19, [0.25, -0.3])
  return merged(p)
}

function pillar() {
  const p = [
    part(new THREE.CylinderGeometry(0.42, 0.48, 1.7, 10), STONE, [0, 0.85, 0]),
    part(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 10), WALL, [0, 1.75, 0]),
    part(new THREE.ConeGeometry(0.58, 0.9, 10), CLAY, [0, 2.28, 0]),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 4), INK, [0, 2.9, 0]),
    part(new THREE.PlaneGeometry(0.5, 0.26), MINT, [0.26, 3.1, 0]),
    part(new THREE.PlaneGeometry(0.34, 0.7), TEAL, [0, 1.0, 0.47]),
  ]
  eyes(p, 0.13, 1.42, 0.45, 0.1)
  return merged(p)
}

function bathhouse() {
  const p = [
    part(new THREE.BoxGeometry(1.5, 0.8, 1), '#f6e7ef', [0, 0.4, 0]),
    part(new THREE.SphereGeometry(0.62, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, [0, 0.8, 0]),
    part(new THREE.SphereGeometry(0.08, 8, 5), GOLD, [0, 1.46, 0]),
    part(new THREE.PlaneGeometry(0.34, 0.5), INK, [0, 0.25, 0.505]),
    part(new THREE.BoxGeometry(1.7, 0.08, 0.2), CORAL, [0, 0.82, 0.48]),
  ]
  for (const x of [-0.62, -0.38, 0.38, 0.62]) p.push(part(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 6), WHITE, [x, 0.39, 0.56]))
  eyes(p, 0.17, 1.08, 0.52, 0.11)
  return merged(p)
}

const m = new THREE.Matrix4()

function placed(g: THREE.BufferGeometry, dx: number, dy: number, size: number, turn = 0) {
  g.applyMatrix4(stand(m, dx, dy, 0, size, size, size, turn))
  return g
}

function duck() {
  const p = [
    part(new THREE.SphereGeometry(0.5, 10, 6), GOLD, [0, 0.3, 0], [0, 0, 0], [1.2, 0.7, 0.9]),
    part(new THREE.SphereGeometry(0.3, 10, 6), GOLD, [0.38, 0.78, 0.05]),
    part(new THREE.ConeGeometry(0.12, 0.3, 6), CORAL, [0.72, 0.74, 0.08], [0, 0, -Math.PI / 2]),
    part(new THREE.ConeGeometry(0.14, 0.3, 5), GOLD, [-0.6, 0.55, 0], [0, 0, 0.9]),
  ]
  eyes(p, 0.1, 0.84, 0.32, 0.08, [0.3, 0], 7)
  return merged(p)
}

export function townShape() {
  const parts = [
    placed(tower(), TOWER[0], TOWER[1], TOWER_SIZE),
    placed(bathhouse(), BATH[0] - 150, BATH[1] - 80, 115),
    placed(duck(), BATH[0] + (BATH[2] - BATH[0]) * 0.62, BATH[1] + (BATH[3] - BATH[1]) * 0.62 - 20, 38, -0.3),
  ]
  const o: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
  for (const s of [40, LENGTH - 40]) {
    along(s, o)
    for (const side of [-1, 1]) {
      const lat = side * (HALF + 52)
      parts.push(placed(pillar(), o.x - o.ty * lat, o.y + o.tx * lat, 95))
    }
  }
  return merged(parts)
}

export function handShape(len: number, wide: number) {
  return merged([part(new THREE.PlaneGeometry(wide, len), INK, [0, len / 2 - 0.04, 0])])
}

export function vaneShape() {
  const pts: [number, number][] = [
    [-0.4, 0],
    [0.44, 0],
    [0.5, 0.14],
    [0.48, 0.36],
    [0.4, 0.26],
    [0.34, 0.36],
    [0.3, 0.2],
    [-0.38, 0.2],
    [-0.52, 0.42],
    [-0.6, 0.4],
    [-0.46, 0.14],
  ]
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))
  return merged([part(new THREE.ShapeGeometry(s), INK, [0, 0.05, 0]), part(new THREE.ConeGeometry(0.06, 0.12, 4), GOLD, [0, 0, 0])])
}
