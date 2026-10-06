import * as THREE from 'three'
import { BELL, GOOSE, LARD, NET, STAR } from './kinds'
import {
  at,
  BELLY,
  BODY,
  BRASS,
  cap,
  GOLD,
  GUARD,
  HAND,
  HELM,
  INK,
  own,
  part,
  type Shape,
  SHAFT,
  SHIELD,
  SPEAR,
  then,
  tilt,
  WOOD,
} from './warrior-part'

const CREAM = '#fff4dc'
const PAIL = '#a9b4c8'
const FEATHER = '#f4efe6'
const BEAK = '#ff9a3c'
const OILSKIN = '#f2c14e'
const ROPE = '#e9dfc4'
const CORK = '#ff6b5a'
const BRANCH = '#ffe0f0'
const BUD = '#ff8fab'
const NIGHT = '#2a1a5e'

const O = [0, 0, 0]
const Y = new THREE.Vector3(0, 1, 0)
const forward = (lean: number) => (g: Shape) => g.rotateX(Math.PI / 2 - lean)

function rod(r: number, a: number[], b: number[], segments: number) {
  const from = new THREE.Vector3(...a)
  const dir = new THREE.Vector3(...b).sub(from)
  const g = new THREE.CylinderGeometry(r, r, dir.length(), segments)
  g.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize()),
  )
  const mid = new THREE.Vector3(...a)
    .add(new THREE.Vector3(...b))
    .multiplyScalar(0.5)
  g.translate(mid.x, mid.y, mid.z)
  return g
}

function lard(fine: boolean, u: number, v: number) {
  const [hx, , hz] = HAND
  const parts = [
    part(
      new THREE.SphereGeometry(0.36, u, v),
      BELLY,
      BODY,
      O,
      at(0, 0.32, 0.3, 1.1, 0.95, 0.62),
    ),
    part(
      new THREE.SphereGeometry(
        0.37,
        u,
        v,
        Math.PI / 2 - 0.95,
        1.9,
        Math.PI / 2 - 0.02,
        1.0,
      ),
      CREAM,
      BODY,
      O,
      at(0, 0.3, 0.3, 1.16, 1, 0.68),
    ),
    part(
      new THREE.CylinderGeometry(0.2, 0.17, 0.2, u),
      CREAM,
      HELM,
      O,
      tilt(0.94),
    ),
    part(
      new THREE.SphereGeometry(0.27, u, v),
      CREAM,
      HELM,
      O,
      tilt(1.1, 1, 0.55),
    ),
    part(
      new THREE.CylinderGeometry(0.17, 0.12, 0.26, fine ? 10 : 5),
      PAIL,
      SPEAR,
      HAND,
      at(hx + 0.05, 0.22, hz + 0.04),
    ),
    part(
      new THREE.SphereGeometry(0.15, fine ? 8 : 4, fine ? 5 : 3),
      GOLD,
      SPEAR,
      HAND,
      at(hx + 0.05, 0.36, hz + 0.04, 1, 0.5, 1),
    ),
  ]
  return own(LARD, parts)
}

function goose(fine: boolean, u: number, v: number) {
  const [hx, , hz] = HAND
  const parts = [
    part(cap(0.33, u, v), FEATHER, HELM, O, tilt(0.84, 1, 0.75)),
    part(
      new THREE.SphereGeometry(0.15, u, v),
      FEATHER,
      HELM,
      O,
      then(at(0, 0, 0.14), tilt(1.12)),
    ),
    part(
      new THREE.ConeGeometry(0.09, 0.34, 6),
      BEAK,
      HELM,
      O,
      then(forward(0), at(0, -0.02, 0.4), tilt(1.12)),
    ),
    part(
      new THREE.BoxGeometry(0.07, 0.07, 0.6),
      WOOD,
      SPEAR,
      HAND,
      at(hx, 0.46, hz + 0.16),
    ),
    part(
      new THREE.TorusGeometry(0.28, 0.025, 4, fine ? 12 : 6, Math.PI * 0.8),
      WOOD,
      SPEAR,
      HAND,
      then((g) => g.rotateZ(Math.PI * 0.1), forward(0), at(hx, 0.46, hz + 0.2)),
    ),
  ]
  if (fine) {
    parts.push(
      part(
        new THREE.CylinderGeometry(0.022, 0.022, 0.24, 5),
        GOLD,
        SPEAR,
        HAND,
        then(forward(0), at(hx, 0.52, hz + 0.3)),
      ),
    )
    for (const side of [-1, 1])
      parts.push(
        part(
          new THREE.CylinderGeometry(0.022, 0.022, 0.13, 5),
          GOLD,
          SPEAR,
          HAND,
          then(
            (g) => g.translate(0, 0.065, 0),
            (g) => g.rotateZ(side * 0.6),
            forward(0),
            at(hx, 0.52, hz + 0.42),
          ),
        ),
      )
  }
  return own(GOOSE, parts)
}

function net(fine: boolean, u: number, v: number) {
  const s = fine ? 6 : 3
  const parts = [
    part(
      new THREE.CylinderGeometry(0.46, 0.46, 0.04, u),
      OILSKIN,
      HELM,
      O,
      tilt(0.86),
    ),
    part(cap(0.3, u, v), OILSKIN, HELM, O, tilt(0.86, 1, 0.7)),
    part(rod(0.03, HAND, [0.25, 1.25, -0.4], s), WOOD, SPEAR, HAND),
    part(
      new THREE.IcosahedronGeometry(0.28, fine ? 1 : 0),
      ROPE,
      SPEAR,
      HAND,
      at(0.22, 1.02, -0.45, 1, 1.2, 1),
    ),
  ]
  if (fine)
    parts.push(
      part(
        new THREE.SphereGeometry(0.06, 6, 4),
        CORK,
        SPEAR,
        HAND,
        at(0.38, 1.0, -0.3),
      ),
    )
  return own(NET, parts)
}

function bell(fine: boolean, u: number, v: number) {
  const [hx, , hz] = HAND
  const [gx, gy, gz] = GUARD
  const spikes = fine ? [-1.1, -0.55, 0, 0.55, 1.1] : [-0.8, 0, 0.8]
  const parts = [
    part(cap(0.26, u, v), BRANCH, HELM, O, tilt(0.84, 1, 0.7)),
    part(
      new THREE.CylinderGeometry(0.06, 0.085, 0.5, fine ? 8 : 4),
      BRASS,
      SPEAR,
      HAND,
      then(forward(0.6), at(hx, 0.58, hz + 0.18)),
    ),
    part(
      new THREE.CylinderGeometry(0.07, 0.19, 0.24, fine ? 12 : 6, 1, true),
      GOLD,
      SHIELD,
      GUARD,
      at(gx, gy, gz + 0.08),
    ),
  ]
  spikes.forEach((a, i) => {
    const len = i % 2 ? 0.3 : 0.38
    const lean = (i % 2 ? 1 : -1) * 0.3
    const out = then(
      (g) => g.translate(0, len / 2, 0),
      (g) => g.rotateX(lean),
      (g) => g.rotateZ(a),
      tilt(0.98),
    )
    parts.push(
      part(new THREE.ConeGeometry(0.045, len, 5), BRANCH, HELM, O, out),
    )
    if (fine)
      parts.push(
        part(
          new THREE.SphereGeometry(0.05, 6, 4),
          BUD,
          HELM,
          O,
          then((g) => g.translate(0, len / 2, 0), out),
        ),
      )
  })
  if (fine)
    parts.push(
      part(
        new THREE.SphereGeometry(0.06, 6, 4),
        GOLD,
        SHIELD,
        GUARD,
        at(gx, gy + 0.14, gz + 0.08),
      ),
      part(
        new THREE.SphereGeometry(0.05, 6, 4),
        INK,
        SHIELD,
        GUARD,
        at(gx, gy - 0.12, gz + 0.08),
      ),
    )
  return own(BELL, parts)
}

function star(fine: boolean, u: number) {
  const [hx, , hz] = HAND
  const stars = fine
    ? [
        [0, 0.44, 0, 1.3],
        [0.08, -0.22, 0.22, 1],
        [-0.07, 0.02, 0.124, 0.8],
      ]
    : [[0, 0.44, 0, 1.3]]
  const parts = [
    part(
      new THREE.CylinderGeometry(0.42, 0.42, 0.04, u),
      NIGHT,
      HELM,
      O,
      tilt(0.85),
    ),
    part(new THREE.ConeGeometry(0.3, 0.8, u), NIGHT, HELM, O, tilt(1.24)),
    part(
      rod(0.035, [hx, 0, hz], [hx, 1.3, hz], fine ? 6 : 3),
      SHAFT,
      SPEAR,
      HAND,
    ),
    part(
      new THREE.CylinderGeometry(0.055, 0.075, 0.42, fine ? 8 : 4),
      BRASS,
      SPEAR,
      HAND,
      then(forward(0.7), at(hx, 1.36, hz + 0.05)),
    ),
    ...stars.map(([x, y, z, s]) =>
      part(
        new THREE.OctahedronGeometry(0.07 * s),
        GOLD,
        HELM,
        O,
        then(at(x, y, z), tilt(1.24)),
      ),
    ),
  ]
  return own(STAR, parts)
}

export function gear(fine: boolean, u: number, v: number): Shape[] {
  return [
    ...lard(fine, u, v),
    ...goose(fine, u, v),
    ...net(fine, u, v),
    ...bell(fine, u, v),
    ...star(fine, u),
  ]
}
