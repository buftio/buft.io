import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { repeat } from './fortress-shade'

export const BODY = 0
export const SPEAR = 1
export const PUPIL = 2
export const SHIELD = 3
export const FOOT = 4
export const BANNER = 5
export const SHADOW = 6
export const EYE = 7
export const HELM = 8

const SKIN = '#6a4fd0'
const BELLY = '#8f7cf0'
const SOLE = '#2e1f73'
const ROOF = '#16b3a0'
const FLAG = '#7dffe6'
const STONE = '#f3ebf4'
const SHAFT = '#c9b7d6'
const INK = '#2a1630'
const WHITE = '#ffffff'

type Shape = THREE.BufferGeometry
type Bend = (g: Shape) => void

function part(
  shape: Shape,
  color: string,
  kind: number,
  pivot: number[],
  bend?: Bend,
) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  bend?.(g)
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const fill = (values: number[]) => repeat(values, n)
  g.setAttribute('color', new THREE.BufferAttribute(fill([c.r, c.g, c.b]), 3))
  g.setAttribute('aPart', new THREE.BufferAttribute(fill([kind]), 1))
  g.setAttribute('aPivot', new THREE.BufferAttribute(fill(pivot), 3))
  return g
}

const at =
  (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): Bend =>
  (g) => {
    g.scale(sx, sy, sz)
    g.translate(x, y, z)
  }

const tilt =
  (y: number, sx = 1, sy = 1): Bend =>
  (g) => {
    g.scale(sx, sy, sx)
    g.translate(0, y - 0.84, 0)
    g.rotateX(-0.45)
    g.translate(0, 0.82, -0.14)
  }

export function warriorGeometry(fine: boolean) {
  const [u, v] = fine ? [14, 10] : [7, 5]
  const [eu, ev] = fine ? [10, 8] : [5, 4]
  const parts: Shape[] = [
    part(
      new THREE.SphereGeometry(0.5, u, v),
      SKIN,
      BODY,
      [0, 0, 0],
      at(0, 0.5, 0, 1, 1.02, 0.95),
    ),
    part(
      new THREE.SphereGeometry(
        0.32,
        u,
        Math.ceil(v / 2),
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      ),
      ROOF,
      HELM,
      [0, 0, 0],
      tilt(0.84, 1, 0.8),
    ),
    part(
      new THREE.CylinderGeometry(0.37, 0.37, 0.05, u),
      ROOF,
      HELM,
      [0, 0, 0],
      tilt(0.85),
    ),
    part(
      new THREE.ConeGeometry(0.07, 0.22, 6),
      FLAG,
      HELM,
      [0, 0, 0],
      tilt(1.2),
    ),
    part(
      new THREE.CircleGeometry(0.52, fine ? u : 6),
      INK,
      SHADOW,
      [0, 0, 0],
      at(0, 0, 0, 1, 0.62, 1),
    ),
  ]
  if (fine)
    parts.push(
      part(
        new THREE.SphereGeometry(0.3, 10, 6),
        BELLY,
        BODY,
        [0, 0, 0],
        at(0, 0.3, 0.27, 1, 0.8, 0.45),
      ),
    )
  for (const side of [-1, 1]) {
    const eye = [side * 0.18, 0.66, 0.37]
    parts.push(
      part(
        new THREE.SphereGeometry(0.17, eu, ev),
        WHITE,
        EYE,
        eye,
        at(eye[0], eye[1], eye[2]),
      ),
    )
    parts.push(
      part(
        new THREE.SphereGeometry(0.085, fine ? 8 : 5, fine ? 6 : 3),
        INK,
        PUPIL,
        eye,
        at(eye[0], eye[1] + 0.03, eye[2] + 0.11),
      ),
    )
    if (fine)
      parts.push(
        part(
          new THREE.SphereGeometry(0.14, 8, 5),
          SOLE,
          FOOT,
          [side * 0.2, 0, 0],
          at(side * 0.2, 0.05, 0.06, 1, 0.5, 1.3),
        ),
      )
  }
  const hand = [0.5, 0.4, 0.14]
  parts.push(
    part(
      new THREE.SphereGeometry(0.11, fine ? 8 : 4, fine ? 6 : 3),
      SKIN,
      SPEAR,
      hand,
      at(hand[0], hand[1], hand[2]),
    ),
    part(
      new THREE.CylinderGeometry(0.035, 0.035, 1.4, fine ? 6 : 3, 1, !fine),
      SHAFT,
      SPEAR,
      hand,
      at(hand[0], 0.62, hand[2]),
    ),
    part(
      new THREE.ConeGeometry(0.085, 0.24, fine ? 6 : 4),
      FLAG,
      SPEAR,
      hand,
      at(hand[0], 1.44, hand[2]),
    ),
  )
  const flag = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.42, -0.1),
    new THREE.Vector2(0, -0.26),
  ])
  parts.push(
    part(
      new THREE.ShapeGeometry(flag),
      ROOF,
      BANNER,
      hand,
      at(hand[0] + 0.03, 1.28, hand[2]),
    ),
  )
  const guard = [-0.48, 0.38, 0.16]
  const face: Bend = (g) => {
    g.rotateX(Math.PI / 2)
    g.rotateY(-0.45)
    g.translate(guard[0], guard[1], guard[2])
  }
  parts.push(
    part(
      new THREE.CylinderGeometry(0.28, 0.28, 0.07, fine ? 12 : 7),
      ROOF,
      SHIELD,
      guard,
      face,
    ),
  )
  const band: Bend = (g) => {
    g.translate(0, 0.02, 0)
    face(g)
  }
  if (fine)
    parts.push(
      part(new THREE.BoxGeometry(0.44, 0.07, 0.09), STONE, SHIELD, guard, band),
      part(new THREE.BoxGeometry(0.09, 0.07, 0.44), STONE, SHIELD, guard, band),
    )
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}
