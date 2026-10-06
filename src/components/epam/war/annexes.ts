import * as THREE from 'three'
import { K } from './fortress-shade'
import {
  arch,
  ball,
  box,
  FAT,
  folk,
  INK,
  lying,
  part,
  pennant,
  rod,
  STILL,
  STONE,
  TAU,
  WALL,
  WHITE,
  WOOD,
  type Parts,
  type V3,
} from './kit'
import type { Look } from './keeps'

const WATER = '#8fd8f0'
const SAIL = '#fff4dc'

export function windmill(parts: Parts) {
  const hub: V3 = [-1.05, 1.12, 0.12]
  parts.push(
    part(
      new THREE.CylinderGeometry(0.14, 0.24, 0.95, 8),
      WALL,
      [-1.05, 0.47, 0],
    ),
  )
  parts.push(
    part(new THREE.ConeGeometry(0.2, 0.26, 8), '#e8a23a', [-1.05, 1.06, 0]),
  )
  arch(parts, [-1.05, 0, 0.21], 0.1, 0.1)
  parts.push(part(ball(0.05), INK, hub))
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU
    const blade = new THREE.BoxGeometry(0.12, 0.5, 0.015)
      .translate(0.04, 0.3, 0)
      .rotateZ(a)
    parts.push(part(blade, SAIL, hub, { k: K.spin, a: 1.4, at: hub }))
    const spar = new THREE.BoxGeometry(0.02, 0.56, 0.02)
      .translate(0, 0.28, 0.01)
      .rotateZ(a)
    parts.push(part(spar, WOOD, hub, { k: K.spin, a: 1.4, at: hub }))
  }
  for (const [x, z] of [
    [-0.82, 0.55],
    [-0.98, 0.42],
  ]) {
    parts.push(
      part(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 10), WOOD, [
        x,
        0.06,
        z,
      ]),
    )
    parts.push(
      part(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 10), FAT, [
        x,
        0.125,
        z,
      ]),
    )
  }
  folk(parts, [-0.78, 0.07, 0.75], 0.07, { k: K.bob, a: 3, b: 0.03 }, FAT)
}

export function drawbridge(parts: Parts) {
  parts.push(
    part(
      new THREE.TorusGeometry(1.38, 0.13, 4, 48)
        .rotateX(Math.PI / 2)
        .scale(1, 0.15, 1),
      WATER,
      [0, 0.01, 0],
    ),
  )
  const hinge: V3 = [0, 0.03, 0.82]
  parts.push(
    part(box(0.28, 0.025, 0.74), WOOD, [0, 0.03, 1.19], {
      k: K.rock,
      a: 0.3,
      b: 0.06,
      at: hinge,
    }),
  )
  for (const side of [-1, 1]) {
    parts.push(part(rod(0.006, 0.6), INK, [side * 0.13, 0.32, 1.0]))
    parts.push(
      part(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 8), STONE, [
        side * 0.22,
        0.18,
        1.6,
      ]),
    )
    parts.push(
      part(ball(0.04), FAT, [side * 0.22, 0.4, 1.6], {
        k: K.glow,
        a: 1,
        b: 1.2,
      }),
    )
  }
  const goose: V3 = [0.97, 0.04, 0.97]
  const paddle = { k: K.walk, ph: 0.4, a: 0, b: 0.2 }
  parts.push(part(ball(0.07, 10, 8).scale(1.4, 0.8, 1), WHITE, goose, paddle))
  parts.push(
    part(rod(0.015, 0.12), WHITE, [goose[0] + 0.07, 0.12, goose[2]], paddle),
  )
  parts.push(part(ball(0.03), WHITE, [goose[0] + 0.08, 0.19, goose[2]], paddle))
  parts.push(
    part(
      new THREE.ConeGeometry(0.015, 0.05, 5).rotateZ(-Math.PI / 2),
      '#ff9a3c',
      [goose[0] + 0.12, 0.19, goose[2]],
      paddle,
    ),
  )
}

export function harbour(parts: Parts) {
  parts.push(part(box(0.9, 0.04, 0.24), WOOD, [0.95, 0.04, 0.85]))
  for (let k = 0; k < 4; k++)
    parts.push(part(rod(0.02, 0.16), WOOD, [0.55 + k * 0.27, 0, 0.97]))
  const boat: V3 = [1.12, 0.06, 1.15]
  const rock = { k: K.rock, a: 1.2, b: 0.12, at: boat }
  parts.push(
    part(ball(0.2, 12, 6).scale(1.6, 0.45, 0.7), '#3a7bd5', boat, rock),
  )
  parts.push(part(rod(0.012, 0.5), INK, [boat[0], 0.3, boat[2]], rock))
  parts.push(
    part(
      new THREE.ShapeGeometry(
        new THREE.Shape([
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.24, 0),
          new THREE.Vector2(0, 0.36),
        ]),
      ),
      SAIL,
      [boat[0] + 0.01, 0.12, boat[2]],
      rock,
    ),
  )
  const top: V3 = [0.78, 0.82, 0.62]
  parts.push(part(box(0.06, 0.8, 0.06), WOOD, [0.78, 0.4, 0.62]))
  parts.push(
    part(box(0.5, 0.05, 0.05), WOOD, [0.98, 0.82, 0.62], {
      k: K.rock,
      a: 0.5,
      b: 0.2,
      at: top,
    }),
  )
  parts.push(
    part(rod(0.005, 0.3), INK, [1.2, 0.66, 0.62], {
      k: K.rock,
      a: 0.5,
      b: 0.2,
      at: top,
    }),
  )
  parts.push(
    part(ball(0.08, 8, 6), WHITE, [1.2, 0.48, 0.62], {
      k: K.rock,
      a: 0.5,
      b: 0.2,
      at: top,
    }),
  )
  for (let k = 0; k < 3; k++)
    parts.push(
      part(ball(0.09 - k * 0.015, 8, 6), WHITE, [0.55, 0.08 + k * 0.13, 0.82]),
    )
}

export function watchtower(parts: Parts, look: Look) {
  const [x, z] = [1.0, -0.35]
  parts.push(
    part(new THREE.CylinderGeometry(0.16, 0.22, 1.9, 10), STONE, [x, 0.95, z]),
  )
  for (let k = 0; k < 3; k++)
    parts.push(
      part(
        new THREE.CylinderGeometry(0.2 - k * 0.015, 0.2 - k * 0.015, 0.06, 10),
        look.roof,
        [x, 0.4 + k * 0.5, z],
      ),
    )
  parts.push(
    part(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), WOOD, [x, 1.92, z]),
  )
  parts.push(
    part(new THREE.ConeGeometry(0.32, 0.4, 12), look.roof, [x, 2.38, z]),
  )
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.4
    parts.push(
      part(rod(0.015, 0.28), INK, [
        x + Math.sin(a) * 0.27,
        2.05,
        z + Math.cos(a) * 0.27,
      ]),
    )
  }
  const bell: V3 = [x, 2.16, z]
  parts.push(
    part(new THREE.CylinderGeometry(0.04, 0.09, 0.12, 10), FAT, [x, 2.08, z], {
      k: K.rock,
      a: 4,
      b: 0.25,
      at: bell,
    }),
  )
  const spot: V3 = [x + 0.12, 2.02, z + 0.18]
  folk(parts, spot, 0.07, { k: K.look, at: spot }, look.roof)
  parts.push(
    part(
      lying(rod(0.018, 0.2, 8)),
      FAT,
      [spot[0] + 0.1, spot[1] + 0.02, spot[2] + 0.06],
      { k: K.look, at: spot },
    ),
  )
  parts.push(
    part(
      new THREE.ConeGeometry(0.07, 0.14, 6),
      '#ff8a3c',
      [x - 0.2, 1.98, z + 0.14],
      { k: K.fire, at: [x - 0.2, 1.94, z + 0.14] },
    ),
  )
  pennant(parts, [x, 2.82, z], 0.28, 1.1, look.flag)
}

export function observatory(parts: Parts, look: Look) {
  const [x, z] = [-1.0, -0.3]
  parts.push(
    part(new THREE.CylinderGeometry(0.36, 0.38, 0.5, 14), STONE, [x, 0.25, z]),
  )
  parts.push(
    part(new THREE.SphereGeometry(0.36, 16, 8, 0, TAU, 0, Math.PI / 2), WHITE, [
      x,
      0.5,
      z,
    ]),
  )
  parts.push(part(box(0.1, 0.3, 0.02), INK, [x, 0.66, z + 0.33], STILL, 0))
  const scope: V3 = [x, 0.7, z]
  const turn = { k: K.look, at: scope }
  parts.push(
    part(
      rod(0.06, 0.6, 10).rotateX(-0.75),
      look.roof,
      [x, 0.86, z + 0.18],
      turn,
    ),
  )
  parts.push(
    part(rod(0.075, 0.06, 10).rotateX(-0.75), FAT, [x, 1.08, z + 0.42], turn),
  )
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU
    parts.push(
      part(
        new THREE.OctahedronGeometry(0.05),
        FAT,
        [
          x + Math.sin(a) * 0.55,
          1.4 + 0.15 * Math.cos(a * 2),
          z + Math.cos(a) * 0.3,
        ],
        {
          k: K.glow,
          ph: k,
          a: 1,
          b: 1.6,
        },
      ),
    )
  }
  folk(
    parts,
    [x + 0.42, 0.06, z + 0.4],
    0.08,
    { k: K.look, at: [x + 0.42, 0.06, z + 0.4] },
    look.roof,
  )
}
