import * as THREE from 'three'
import { K } from './fortress-shade'
import { gate, onion } from './keeps'
import {
  arch,
  ball,
  BAR,
  box,
  eyes,
  FAT,
  FLAG,
  folk,
  INK,
  merged,
  pane,
  part,
  pennant,
  rod,
  ROOF,
  STILL,
  STONE,
  swallow,
  TAU,
  WALL,
  WHITE,
  WOOD,
  type Parts,
  type V3,
} from './kit'

const GOLD = '#f5b833'
const WATER = '#8fd8f0'
const LEAF = '#5fcf8f'
const LOOK = { roof: ROOF, flag: FLAG, dome: 'onion' as const }
const RING = 1.0
const BASE = 0.2

function terraces(parts: Parts) {
  parts.push(
    part(
      new THREE.CylinderGeometry(1.32, 1.4, 0.12, 8),
      WALL,
      [0, 0.06, 0],
      STILL,
      TAU / 16,
    ),
  )
  parts.push(
    part(
      new THREE.CylinderGeometry(1.18, 1.24, 0.08, 8),
      STONE,
      [0, 0.16, 0],
      STILL,
      TAU / 16,
    ),
  )
  for (let k = 0; k < 4; k++)
    parts.push(
      part(box(0.5 - k * 0.04, 0.05, 0.12), k % 2 ? STONE : WALL, [
        0,
        0.025 + k * 0.05,
        1.42 - k * 0.1,
      ]),
    )
}

function ramparts(parts: Parts) {
  const corners = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * TAU + TAU / 16
    return [Math.sin(a) * RING, Math.cos(a) * RING] as const
  })
  corners.forEach(([x0, z0], k) => {
    const [x1, z1] = corners[(k + 1) % 8]
    const [mx, mz] = [(x0 + x1) / 2, (z0 + z1) / 2]
    const long = Math.hypot(x1 - x0, z1 - z0)
    const turn = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2
    if (k === 7) return
    parts.push(
      part(box(long, 0.42, 0.11), WALL, [mx, BASE + 0.21, mz], STILL, turn),
    )
    parts.push(
      part(box(long, 0.03, 0.13), GOLD, [mx, BASE + 0.43, mz], STILL, turn),
    )
    for (let j = -1; j <= 1; j++)
      parts.push(
        part(
          box(0.09, 0.08, 0.06),
          STONE,
          [
            mx + ((x1 - x0) / long) * j * 0.22,
            BASE + 0.49,
            mz + ((z1 - z0) / long) * j * 0.22,
          ],
          STILL,
          turn,
        ),
      )
    const at: V3 = [mx * 0.98, BASE + 0.51, mz * 0.98]
    if (k % 2 === 0) folk(parts, at, 0.06, { k: K.look, ph: k, at })
  })
  corners.forEach(([x, z], k) => {
    if (k === 7 || k === 0) return
    parts.push(
      part(new THREE.CylinderGeometry(0.16, 0.19, 0.9, 12), STONE, [
        x,
        BASE + 0.45,
        z,
      ]),
    )
    parts.push(
      part(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12), GOLD, [
        x,
        BASE + 0.62,
        z,
      ]),
    )
    parts.push(
      part(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), STONE, [
        x,
        BASE + 0.92,
        z,
      ]),
    )
    parts.push(part(onion(0.22, 0.48), ROOF, [x, BASE + 0.95, z]))
    parts.push(
      part(ball(0.035), GOLD, [x, BASE + 1.45, z], {
        k: K.glow,
        ph: k,
        a: 1,
        b: 0.8,
      }),
    )
    pennant(parts, [x, BASE + 1.68, z], 0.2, k * 1.1, k % 2 ? FAT : FLAG)
    pane(
      parts,
      [x, BASE + 0.5, z + 0.17 * Math.sign(z || 1)],
      0,
      k * 0.9,
      0.06,
      0.11,
    )
  })
}

function gatehouse(parts: Parts) {
  const z = RING * Math.cos(TAU / 16) + 0.02
  for (const side of [-1, 1]) {
    const x = side * 0.3
    parts.push(
      part(new THREE.CylinderGeometry(0.14, 0.16, 0.95, 10), STONE, [
        x,
        BASE + 0.47,
        z,
      ]),
    )
    parts.push(
      part(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 10), GOLD, [
        x,
        BASE + 0.7,
        z,
      ]),
    )
    parts.push(
      part(new THREE.ConeGeometry(0.18, 0.36, 10), ROOF, [x, BASE + 1.13, z]),
    )
    parts.push(part(ball(0.03), GOLD, [x, BASE + 1.33, z]))
  }
  parts.push(part(box(0.46, 0.55, 0.16), WALL, [0, BASE + 0.27, z]))
  parts.push(part(box(0.5, 0.03, 0.18), GOLD, [0, BASE + 0.56, z]))
  gate(parts, LOOK, z + 0.08, BASE)
  const crest: V3 = [0, BASE + 0.66, z + 0.1]
  parts.push(part(new THREE.CircleGeometry(0.08, 16), GOLD, crest))
  parts.push(
    part(new THREE.CircleGeometry(0.05, 6), ROOF, [
      crest[0],
      crest[1],
      crest[2] + 0.005,
    ]),
  )
}

function palace(parts: Parts) {
  const z = -0.2
  parts.push(part(box(0.98, 0.62, 0.7), STONE, [0, BASE + 0.31, z]))
  parts.push(part(box(1.02, 0.04, 0.74), GOLD, [0, BASE + 0.62, z]))
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue
    arch(parts, [k * 0.13, BASE + 0.12, z + 0.355], 0.06, 0.12)
    pane(parts, [k * 0.13, BASE + 0.44, z + 0.355], 0, k * 1.7, 0.06, 0.12)
  }
  arch(parts, [0, BASE, z + 0.355], 0.16, 0.2)
  for (let k = 0; k < 5; k++)
    parts.push(
      part(box(0.18, 0.08, 0.06), STONE, [
        -0.4 + k * 0.2,
        BASE + 0.68,
        z + 0.33,
      ]),
    )
  const deck = BASE + 0.66
  parts.push(part(box(0.38, 0.03, 0.2), STONE, [0, deck, z + 0.44]))
  parts.push(part(box(0.38, 0.08, 0.02), GOLD, [0, deck + 0.05, z + 0.54]))
  const queen: V3 = [0, deck + 0.1, z + 0.44]
  folk(parts, queen, 0.08, { k: K.look, at: queen }, '#b8337a')
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU
    parts.push(
      part(
        new THREE.ConeGeometry(0.018, 0.06, 4),
        GOLD,
        [Math.sin(a) * 0.05, deck + 0.2, z + 0.44 + Math.cos(a) * 0.05],
        {
          k: K.look,
          at: queen,
        },
      ),
    )
  }
  for (const side of [-1, 1]) {
    const hang: V3 = [side * 0.32, BASE + 0.6, z + 0.36]
    const sway = { k: K.banner, ph: side * 1.3, at: hang }
    parts.push(
      part(
        new THREE.ShapeGeometry(swallow(0.16, 0.48)),
        side > 0 ? GOLD : ROOF,
        hang,
        sway,
      ),
    )
    parts.push(
      part(
        new THREE.CircleGeometry(0.035, 6),
        WHITE,
        [hang[0], BASE + 0.36, hang[2] + 0.005],
        sway,
      ),
    )
  }
}

function crown(parts: Parts) {
  const z = -0.28
  parts.push(
    part(new THREE.CylinderGeometry(0.3, 0.34, 0.6, 14), STONE, [
      0,
      BASE + 0.95,
      z,
    ]),
  )
  parts.push(
    part(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 14), GOLD, [
      0,
      BASE + 1.26,
      z,
    ]),
  )
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    pane(
      parts,
      [Math.sin(a) * 0.31, BASE + 1.02, z + Math.cos(a) * 0.31],
      a,
      k * 2.3,
      0.06,
      0.14,
    )
  }
  eyes(parts, BASE + 1.1, z + 0.34, 0.12)
  for (const [x, dz] of [
    [-0.36, 0.1],
    [0.36, 0.1],
  ]) {
    parts.push(
      part(new THREE.CylinderGeometry(0.08, 0.09, 0.5, 8), STONE, [
        x,
        BASE + 1.0,
        z + dz,
      ]),
    )
    parts.push(part(onion(0.1, 0.24), ROOF, [x, BASE + 1.24, z + dz]))
    parts.push(part(ball(0.025), GOLD, [x, BASE + 1.5, z + dz]))
  }
  parts.push(
    part(new THREE.CylinderGeometry(0.22, 0.28, 0.42, 12), WALL, [
      0,
      BASE + 1.48,
      z,
    ]),
  )
  parts.push(
    part(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 12), GOLD, [
      0,
      BASE + 1.7,
      z,
    ]),
  )
  parts.push(part(onion(0.3, 0.62), ROOF, [0, BASE + 1.7, z]))
  parts.push(
    part(new THREE.ConeGeometry(0.04, 0.3, 6), GOLD, [0, BASE + 2.42, z]),
  )
  const flame: V3 = [0, BASE + 2.72, z]
  parts.push(
    part(new THREE.OctahedronGeometry(0.15).scale(1, 1.6, 1), FAT, flame, {
      k: K.glow,
      a: 1,
      b: 2.2,
    }),
  )
  parts.push(
    part(
      new THREE.TorusGeometry(0.26, 0.012, 4, 32).rotateX(Math.PI / 2 - 0.35),
      GOLD,
      flame,
      {
        k: K.look,
        at: flame,
      },
    ),
  )
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU
    parts.push(
      part(
        new THREE.OctahedronGeometry(0.03),
        FAT,
        [
          Math.sin(a) * 0.26,
          flame[1] + Math.cos(a) * 0.09,
          z + Math.cos(a) * 0.26,
        ],
        {
          k: K.glow,
          ph: k,
          a: 1,
          b: 1.4,
        },
      ),
    )
  }
  pennant(parts, [0.06, BASE + 3.12, z], 0.36, 0.7, GOLD)
}

function fountain(parts: Parts) {
  const at: V3 = [0.78, 0.05, 1.35]
  parts.push(part(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 16), STONE, at))
  parts.push(
    part(
      new THREE.CylinderGeometry(0.17, 0.17, 0.02, 16),
      WATER,
      [at[0], 0.1, at[2]],
      { k: K.bob, a: 2, b: 0.006 },
    ),
  )
  parts.push(part(rod(0.025, 0.3, 8), STONE, [at[0], 0.22, at[2]]))
  parts.push(
    part(new THREE.CylinderGeometry(0.08, 0.04, 0.04, 12), GOLD, [
      at[0],
      0.38,
      at[2],
    ]),
  )
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU
    parts.push(
      part(
        ball(0.02, 6, 5).scale(1, 1.5, 1),
        WATER,
        [at[0] + Math.sin(a) * 0.1, 0.38, at[2] + Math.cos(a) * 0.1],
        {
          k: K.drip,
          ph: k / 6,
          a: 1.6,
          b: 0.26,
        },
      ),
    )
  }
  folk(
    parts,
    [at[0] - 0.28, 0.1, at[2] + 0.05],
    0.06,
    { k: K.bob, a: 5, b: 0.03 },
    FAT,
  )
}

function garden(parts: Parts) {
  for (const [x, z, r] of [
    [-0.62, 1.32, 0.12],
    [-0.86, 1.12, 0.1],
    [-0.42, 1.52, 0.08],
    [1.08, 1.0, 0.1],
    [-1.25, 0.55, 0.11],
    [1.28, 0.4, 0.09],
  ]) {
    parts.push(part(rod(0.02, r * 1.4), WOOD, [x, r * 0.7, z]))
    parts.push(
      part(ball(r, 10, 8), LEAF, [x, r * 1.6, z], {
        k: K.rock,
        ph: x,
        a: 0.8,
        b: 0.05,
        at: [x, 0, z],
      }),
    )
    parts.push(
      part(ball(r * 0.3, 6, 4), '#ff9ad5', [x + r * 0.5, r * 1.9, z + r * 0.6]),
    )
  }
}

function balloon(parts: Parts) {
  const at: V3 = [-1.25, 2.1, -0.75]
  const lift = { k: K.bob, a: 0.9, b: 0.12 }
  parts.push(part(ball(0.34, 16, 12).scale(1, 1.15, 1), ROOF, at, lift))
  for (const dy of [-0.12, 0.12])
    parts.push(
      part(
        new THREE.TorusGeometry(0.33 * Math.cos(dy * 2.4), 0.03, 4, 24).rotateX(
          Math.PI / 2,
        ),
        GOLD,
        [at[0], at[1] + dy, at[2]],
        lift,
      ),
    )
  parts.push(
    part(box(0.16, 0.12, 0.16), WOOD, [at[0], at[1] - 0.6, at[2]], lift),
  )
  for (const [dx, dz] of [
    [-0.07, -0.07],
    [0.07, -0.07],
    [-0.07, 0.07],
    [0.07, 0.07],
  ])
    parts.push(
      part(rod(0.005, 0.3), INK, [at[0] + dx, at[1] - 0.42, at[2] + dz], lift),
    )
  folk(
    parts,
    [at[0], at[1] - 0.5, at[2] + 0.04],
    0.05,
    { ...lift, at: [at[0], at[1] - 0.5, at[2]] },
    GOLD,
  )
  const tether = new THREE.Vector3(at[0] + 0.25, BASE + 1.0, -0.6)
  const top = new THREE.Vector3(at[0], at[1] - 0.66, at[2])
  const line = rod(0.006, tether.distanceTo(top)).applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      top.clone().sub(tether).normalize(),
    ),
  )
  parts.push(
    part(
      line,
      BAR,
      [(at[0] + tether.x) / 2, (top.y + tether.y) / 2, (at[2] + tether.z) / 2],
      lift,
    ),
  )
}

export function capitalGeometry() {
  const parts: Parts = []
  terraces(parts)
  ramparts(parts)
  gatehouse(parts)
  palace(parts)
  crown(parts)
  fountain(parts)
  garden(parts)
  balloon(parts)
  for (let k = 0; k < 3; k++)
    parts.push(
      part(
        new THREE.SphereGeometry(0.08, 10, 8),
        WHITE,
        [-0.6 + k * 0.05, BASE + 1.05, -0.55],
        {
          k: K.smoke,
          ph: k / 3,
          a: 0.2,
        },
      ),
    )
  return merged(parts)
}
