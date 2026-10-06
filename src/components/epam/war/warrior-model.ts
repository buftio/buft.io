import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { gear } from './warrior-gear'
import {
  at,
  BANNER,
  BELLY,
  BODY,
  cap,
  EYE,
  FLAG,
  FOOT,
  GUARD,
  HAND,
  HELM,
  INK,
  own,
  part,
  PUPIL,
  ROOF,
  SHADOW,
  SHAFT,
  SHIELD,
  SKIN,
  SOLE,
  SPEAR,
  STONE,
  tilt,
  WHITE,
  type Bend,
  type Shape,
} from './warrior-part'

function crown(fine: boolean, u: number, v: number) {
  const parts: Shape[] = [
    part(cap(0.32, u, v), ROOF, HELM, [0, 0, 0], tilt(0.84, 1, 0.8)),
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
      new THREE.CylinderGeometry(0.035, 0.035, 1.4, fine ? 6 : 3, 1, !fine),
      SHAFT,
      SPEAR,
      HAND,
      at(HAND[0], 0.62, HAND[2]),
    ),
    part(
      new THREE.ConeGeometry(0.085, 0.24, fine ? 6 : 4),
      FLAG,
      SPEAR,
      HAND,
      at(HAND[0], 1.44, HAND[2]),
    ),
  ]
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
      HAND,
      at(HAND[0] + 0.03, 1.28, HAND[2]),
    ),
  )
  const face: Bend = (g) => {
    g.rotateX(Math.PI / 2)
    g.rotateY(-0.45)
    g.translate(GUARD[0], GUARD[1], GUARD[2])
  }
  parts.push(
    part(
      new THREE.CylinderGeometry(0.28, 0.28, 0.07, fine ? 12 : 7),
      ROOF,
      SHIELD,
      GUARD,
      face,
    ),
  )
  const band: Bend = (g) => {
    g.translate(0, 0.02, 0)
    face(g)
  }
  if (fine)
    parts.push(
      part(new THREE.BoxGeometry(0.44, 0.07, 0.09), STONE, SHIELD, GUARD, band),
      part(new THREE.BoxGeometry(0.09, 0.07, 0.44), STONE, SHIELD, GUARD, band),
    )
  return own(0, parts)
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
      new THREE.CircleGeometry(0.52, fine ? u : 6),
      INK,
      SHADOW,
      [0, 0, 0],
      at(0, 0, 0, 1, 0.62, 1),
    ),
    part(
      new THREE.SphereGeometry(0.11, fine ? 8 : 4, fine ? 6 : 3),
      SKIN,
      SPEAR,
      HAND,
      at(HAND[0], HAND[1], HAND[2]),
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
  parts.push(...crown(fine, u, v), ...gear(fine, u, v))
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}
