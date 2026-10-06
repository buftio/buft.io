import * as THREE from 'three'
import { SPOT } from './build'
import { K } from './fortress-shade'
import {
  ball,
  box,
  FAT,
  folk,
  HOOP,
  INK,
  lying,
  merged,
  pane,
  part,
  RIND,
  rod,
  SMOKE,
  STILL,
  STONE,
  TAU,
  WALL,
  WHITE,
  WOOD,
  type Parts,
  type V3,
} from './kit'

export const PROP = 1500
const RIM = SPOT / PROP
const TILT = Math.sin((50 * Math.PI) / 180)
const WATER = '#8fd8f0'
const BEAD = '#e2475a'
const PINK = '#ff9ad5'
const BONE = '#fbf3e6'
const CANVAS = '#efe2c8'

const rim = (a: number, r = 1.02, y = 0): V3 => [
  Math.cos(a) * r * RIM,
  y,
  (Math.sin(a) * r * RIM) / TILT,
]

function hive(parts: Parts) {
  const [x, , z] = rim(-2.4, 1.1)
  for (let k = 0; k < 5; k++)
    parts.push(
      part(
        new THREE.TorusGeometry(0.17 - k * 0.028, 0.045, 6, 18).rotateX(
          Math.PI / 2,
        ),
        k % 2 ? RIND : HOOP,
        [x, 0.05 + k * 0.07, z],
      ),
    )
  parts.push(part(ball(0.04), INK, [x, 0.08, z + 0.17]))
  for (let k = 0; k < 4; k++) {
    const at: V3 = [x, 0.38 + k * 0.05, z]
    const fly = { k: K.look, ph: k * 1.6, at }
    parts.push(
      part(ball(0.03, 6, 5).scale(1.3, 1, 1), FAT, [x + 0.25, at[1], z], fly),
    )
    parts.push(
      part(
        ball(0.022, 6, 4).scale(1, 0.4, 1.6),
        WHITE,
        [x + 0.25, at[1] + 0.03, z],
        fly,
      ),
    )
  }
  for (let k = 0; k < 3; k++) {
    const at = rim(0.2 + k * 0.22, 1.05)
    folk(parts, at, 0.07, { k: K.bob, ph: k, a: 3, b: 0.02 }, FAT)
    parts.push(
      part(new THREE.CylinderGeometry(0.04, 0.03, 0.06, 8), WOOD, [
        at[0] + 0.08,
        0.03,
        at[2] + 0.04,
      ]),
    )
  }
  for (const a of [1.6, 2.2, 2.8])
    parts.push(
      part(
        new THREE.CylinderGeometry(0.1, 0.1, 0.04, 6),
        RIND,
        rim(a, 1.15, 0.02),
      ),
    )
}

function stall(parts: Parts) {
  const [x, , z] = rim(-0.8, 1.25)
  for (const [dx, dz] of [
    [-0.22, -0.12],
    [0.22, -0.12],
    [-0.22, 0.12],
    [0.22, 0.12],
  ])
    parts.push(part(rod(0.015, 0.4), WOOD, [x + dx, 0.2, z + dz]))
  for (let k = 0; k < 6; k++)
    parts.push(
      part(
        box(0.08, 0.02, 0.32),
        k % 2 ? WHITE : PINK,
        [x - 0.2 + k * 0.08, 0.42, z],
        STILL,
      ),
    )
  parts.push(part(box(0.48, 0.12, 0.08), WOOD, [x, 0.06, z + 0.13]))
  for (let k = 0; k < 4; k++)
    parts.push(
      part(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), FAT, [
        x - 0.15 + k * 0.1,
        0.15,
        z + 0.13,
      ]),
    )
  folk(
    parts,
    [x, 0.08, z - 0.02],
    0.075,
    { k: K.look, at: [x, 0.08, z - 0.02] },
    PINK,
  )
  for (let k = 0; k < 6; k++) {
    const a = -1.4 + k * 0.5
    parts.push(
      part(
        ball(0.05 + (k % 3) * 0.015, 10, 8),
        k % 2 ? '#c8f2ff' : '#ffe3f4',
        rim(a, 0.9 + (k % 2) * 0.25, 0.25 + k * 0.05),
        {
          k: K.bob,
          ph: k,
          a: 1.2 + k * 0.2,
          b: 0.12,
        },
      ),
    )
  }
}

function well(parts: Parts) {
  const [x, , z] = rim(-0.25, 1.2)
  parts.push(
    part(new THREE.CylinderGeometry(0.17, 0.19, 0.16, 14, 1, true), STONE, [
      x,
      0.08,
      z,
    ]),
  )
  parts.push(
    part(
      new THREE.TorusGeometry(0.18, 0.025, 4, 18).rotateX(Math.PI / 2),
      WALL,
      [x, 0.16, z],
    ),
  )
  parts.push(
    part(
      new THREE.CircleGeometry(0.16, 14).rotateX(-Math.PI / 2),
      FAT,
      [x, 0.1, z],
      { k: K.glow, a: 1, b: 0.4 },
    ),
  )
  for (const side of [-1, 1]) {
    parts.push(part(box(0.03, 0.42, 0.03), WOOD, [x + side * 0.17, 0.25, z]))
    parts.push(
      part(box(0.24, 0.02, 0.34).rotateZ(side * -0.5), '#16b3a0', [
        x + side * 0.1,
        0.5,
        z,
      ]),
    )
  }
  const axle: V3 = [x, 0.36, z]
  parts.push(part(lying(rod(0.025, 0.34, 8)), WOOD, axle))
  parts.push(
    part(box(0.02, 0.12, 0.02).translate(0, 0.06, 0), INK, [x + 0.2, 0.36, z], {
      k: K.spin,
      a: 1.2,
      at: [x + 0.2, 0.36, z],
    }),
  )
  parts.push(part(rod(0.004, 0.14), INK, [x, 0.27, z]))
  parts.push(
    part(new THREE.CylinderGeometry(0.04, 0.032, 0.06, 8), WOOD, [x, 0.18, z], {
      k: K.bob,
      a: 1.2,
      b: 0.08,
    }),
  )
  for (let k = 0; k < 2; k++)
    parts.push(
      part(ball(0.012, 6, 4), FAT, [x, 0.15, z], {
        k: K.drip,
        ph: k / 2,
        a: 1.5,
        b: 0.06,
      }),
    )
  const keeper = rim(0.15, 1.28)
  folk(parts, keeper, 0.075, { k: K.look, at: keeper }, '#16b3a0')
  const sign = rim(-1.05, 1.18)
  parts.push(part(rod(0.012, 0.36), WOOD, [sign[0], 0.18, sign[2]]))
  parts.push(
    part(box(0.2, 0.06, 0.015), CANVAS, [sign[0] + 0.07, 0.33, sign[2]]),
  )
  parts.push(
    part(new THREE.ConeGeometry(0.035, 0.05, 3).rotateZ(-Math.PI / 2), CANVAS, [
      sign[0] + 0.19,
      0.33,
      sign[2],
    ]),
  )
}

function dock(parts: Parts) {
  const [x, , z] = rim(2.5, 0.95)
  parts.push(
    part(box(0.5, 0.03, 0.14), WOOD, [x + 0.15, 0.04, z], STILL, -0.45),
  )
  for (let k = 0; k < 3; k++) {
    const at = rim(2.0 + k * 0.6, 1.12)
    const top: V3 = [at[0], 0.42, at[2]]
    const sway = {
      k: K.rock,
      ph: k,
      a: 1.1,
      b: 0.08,
      at: [at[0], 0, at[2]] as V3,
    }
    parts.push(part(rod(0.012, 0.42), WOOD, [at[0], 0.21, at[2]], sway))
    parts.push(
      part(lying(rod(0.008, 0.12)), WOOD, [at[0] + 0.05, 0.42, at[2]], sway),
    )
    parts.push(
      part(
        new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8),
        FAT,
        [top[0] + 0.1, 0.36, top[2]],
        { ...sway, k: K.glow, a: 1, b: 1.4 },
      ),
    )
  }
  const boat: V3 = [0.05, 0.04, (0.3 * RIM) / TILT]
  const rock = { k: K.rock, a: 1.3, b: 0.1, at: boat }
  parts.push(part(ball(0.18, 12, 6).scale(1.5, 0.4, 0.7), WOOD, boat, rock))
  folk(parts, [boat[0] + 0.06, 0.1, boat[2]], 0.065, rock, '#7a4a52')
  parts.push(part(rod(0.01, 0.18), INK, [boat[0] - 0.12, 0.18, boat[2]], rock))
  parts.push(
    part(
      new THREE.CylinderGeometry(0.03, 0.035, 0.06, 8),
      FAT,
      [boat[0] - 0.12, 0.29, boat[2]],
      { ...rock, k: K.glow, a: 1, b: 1.2 },
    ),
  )
}

function mill(parts: Parts) {
  const [x, , z] = rim(Math.PI, 1.3)
  parts.push(part(box(0.32, 0.3, 0.3), WALL, [x - 0.05, 0.15, z - 0.1]))
  parts.push(
    part(
      new THREE.ConeGeometry(0.28, 0.2, 4),
      '#d8524a',
      [x - 0.05, 0.4, z - 0.1],
      STILL,
      Math.PI / 4,
    ),
  )
  pane(parts, [x - 0.05, 0.18, z + 0.055], 0, 1.2)
  const hub: V3 = [x + 0.16, 0.2, z + 0.1]
  const turn = { k: K.spin, a: 1.6, at: hub }
  parts.push(part(new THREE.TorusGeometry(0.18, 0.018, 4, 18), WOOD, hub, turn))
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    parts.push(
      part(
        box(0.03, 0.08, 0.06).translate(0, 0.18, 0).rotateZ(a),
        WOOD,
        hub,
        turn,
      ),
    )
  }
  parts.push(part(ball(0.03), INK, hub))
  parts.push(
    part(box(0.5, 0.03, 0.08), WATER, [x + 0.45, 0.02, z + 0.12], STILL, 0.2),
  )
  for (let k = 0; k < 3; k++)
    parts.push(
      part(
        ball(0.035, 8, 6),
        BEAD,
        [x + 0.3 + k * 0.13, 0.05, z + 0.12 - k * 0.03],
        { k: K.bob, ph: k, a: 3, b: 0.025 },
      ),
    )
  folk(
    parts,
    rim(Math.PI + 0.55, 1.2),
    0.07,
    { k: K.bob, a: 3.5, b: 0.03 },
    '#d8524a',
  )
}

function hut(parts: Parts) {
  const [x, , z] = rim(-2.0, 1.32)
  parts.push(part(box(0.26, 0.2, 0.22), WOOD, [x, 0.1, z]))
  parts.push(
    part(
      new THREE.ConeGeometry(0.24, 0.18, 4),
      '#6b8f5a',
      [x, 0.29, z],
      STILL,
      Math.PI / 4,
    ),
  )
  parts.push(part(box(0.05, 0.12, 0.05), STONE, [x + 0.07, 0.36, z - 0.03]))
  for (let k = 0; k < 3; k++)
    parts.push(
      part(ball(0.04, 8, 6), SMOKE, [x + 0.07, 0.44, z - 0.03], {
        k: K.smoke,
        ph: k / 3,
        a: 0.2,
      }),
    )
  pane(parts, [x, 0.12, z + 0.115], 0, 2)
  const seat = rim(0.5, 1.05)
  parts.push(
    part(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8), WOOD, [
      seat[0],
      0.03,
      seat[2],
    ]),
  )
  folk(parts, [seat[0], 0.12, seat[2]], 0.07, STILL, '#6b8f5a')
  const grip: V3 = [seat[0] - 0.05, 0.16, seat[2]]
  const cast = { k: K.rock, a: 0.6, b: 0.1, at: grip }
  const pole = rod(0.006, 0.5).rotateZ(0.9)
  parts.push(part(pole, WOOD, [grip[0] - 0.19, 0.31, grip[2]], cast))
  parts.push(part(rod(0.002, 0.28), INK, [grip[0] - 0.39, 0.3, grip[2]], cast))
  parts.push(
    part(ball(0.025, 8, 6), '#ff5a3d', [grip[0] - 0.39, 0.03, grip[2]], {
      k: K.bob,
      a: 1.6,
      b: 0.02,
    }),
  )
}

function ribs(parts: Parts) {
  const from = parts.length
  for (let k = 0; k < 5; k++) {
    const x = -0.7 + k * 0.35
    const r = 0.55 + 0.15 * Math.sin((k / 4) * Math.PI)
    parts.push(
      part(
        new THREE.TorusGeometry(r, 0.04, 5, 20, Math.PI * 0.9)
          .rotateY(Math.PI / 2)
          .rotateX(0.05 * TAU),
        BONE,
        [x, 0, 0],
      ),
    )
  }
  for (let k = 0; k < 9; k++)
    parts.push(
      part(ball(0.06, 8, 6).scale(1.3, 1, 1), BONE, [
        -0.8 + k * 0.2,
        0.62 + 0.08 * Math.sin((k / 8) * Math.PI),
        -0.05,
      ]),
    )
  parts.push(part(ball(0.16, 10, 8).scale(1.4, 0.9, 1), BONE, [-1.05, 0.55, 0]))
  parts.push(part(ball(0.035), INK, [-1.15, 0.6, 0.13]))
  const span = RIM * 1.1
  parts.slice(from).forEach((g) => g.scale(span, span, span))
  for (let k = 0; k < 2; k++) {
    const at: V3 = [(-0.35 + k * 0.7) * span, 0.72 * span + 0.04, 0]
    folk(
      parts,
      at,
      0.06,
      { k: K.bob, ph: k * 2, a: 4, b: 0.06 },
      k ? PINK : FAT,
    )
  }
}

function camp(parts: Parts) {
  const [x, , z] = rim(-1.9, 1.25)
  parts.push(
    part(
      new THREE.ConeGeometry(0.24, 0.32, 4),
      CANVAS,
      [x, 0.16, z],
      STILL,
      Math.PI / 4,
    ),
  )
  parts.push(part(box(0.08, 0.14, 0.01), INK, [x, 0.07, z + 0.17]))
  const fire = rim(-0.9, 1.15)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU
    parts.push(
      part(ball(0.035, 6, 4), STONE, [
        fire[0] + Math.sin(a) * 0.09,
        0.02,
        fire[2] + Math.cos(a) * 0.09,
      ]),
    )
  }
  for (const [c, s, ph] of [
    ['#ff8a3c', 0.07, 0],
    ['#ffd36b', 0.045, 1.3],
  ] as const) {
    const base: V3 = [fire[0], 0.02, fire[2]]
    parts.push(
      part(
        new THREE.ConeGeometry(s, s * 2.6, 6),
        c,
        [fire[0], 0.02 + s * 1.3, fire[2]],
        { k: K.fire, ph, at: base },
      ),
    )
  }
  const man = rim(-0.35, 1.2)
  folk(parts, man, 0.075, { k: K.bob, a: 2, b: 0.02 }, HOOP)
  const swing: V3 = [man[0] + 0.07, 0.15, man[2]]
  const dig = { k: K.rock, a: 3, b: 0.5, at: swing }
  parts.push(
    part(
      rod(0.008, 0.24).rotateZ(-0.6),
      WOOD,
      [swing[0] + 0.07, 0.25, swing[2]],
      dig,
    ),
  )
  parts.push(
    part(
      box(0.14, 0.02, 0.02).rotateZ(-0.6),
      INK,
      [swing[0] + 0.14, 0.35, swing[2]],
      dig,
    ),
  )
  for (const [dx, dz] of [
    [0.25, -0.1],
    [0.36, 0.0],
  ])
    parts.push(
      part(ball(0.06, 8, 6).scale(1, 1.2, 1), CANVAS, [x + dx, 0.06, z + dz]),
    )
}

const PROPS: Record<string, (parts: Parts) => void> = {
  'mother-lode': hive,
  'bazaar-spring': stall,
  'first-well': well,
  'lantern-pool': dock,
  'millrace-pond': mill,
  'hermits-tarn': hut,
  'rib-pool': ribs,
  'last-drip': camp,
}

export function seepGeometry(id: string) {
  const parts: Parts = []
  PROPS[id]?.(parts)
  return parts.length ? merged(parts) : null
}
