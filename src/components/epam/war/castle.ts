import * as THREE from 'three'
import { K } from './fortress-shade'
import {
  arch,
  ball,
  box,
  eyes,
  facing,
  FAT,
  FLAG,
  FOLK,
  folk,
  HOOP,
  INK,
  lying,
  merged,
  pane,
  part,
  pennant,
  RIND,
  rod,
  ROOF,
  STONE,
  swallow,
  TAU,
  WALL,
  WHITE,
  WOOD,
  type V3,
} from './kit'

export function mineGeometry() {
  const parts = [
    part(new THREE.CylinderGeometry(0.6, 0.66, 0.36, 18), RIND, [0, 0.18, 0]),
    part(new THREE.CylinderGeometry(0.67, 0.67, 0.03, 18), HOOP, [0, 0.07, 0]),
    part(new THREE.CylinderGeometry(0.625, 0.625, 0.03, 18), HOOP, [0, 0.3, 0]),
    part(
      new THREE.SphereGeometry(0.52, 18, 10, 0, TAU, 0, Math.PI / 2),
      FAT,
      [0, 0.34, 0],
      { k: K.bob, a: 1.3, b: 0.025 },
    ),
  ]
  const pivot: V3 = [0.42, 1.0, -0.36]
  const beam = { k: K.rock, a: 1.6, b: 0.28, at: pivot }
  parts.push(part(box(0.06, 1.0, 0.06), INK, [0.42, 0.5, -0.36]))
  parts.push(part(box(0.32, 0.05, 0.18), WOOD, [0.42, 0.025, -0.36]))
  parts.push(part(box(0.86, 0.07, 0.07), WOOD, pivot, beam))
  parts.push(part(box(0.1, 0.24, 0.09), RIND, [0.0, 0.94, -0.36], beam))
  parts.push(part(rod(0.012, 0.36), INK, [-0.03, 0.72, -0.36], beam))
  parts.push(
    part(
      facing(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12)),
      FAT,
      [0.85, 0.96, -0.36],
      beam,
    ),
  )
  parts.push(
    part(ball(0.04), FAT, [0.42, 1.06, -0.36], { k: K.glow, a: 1, b: 1.2 }),
  )
  parts.push(part(lying(rod(0.035, 0.34, 8)), INK, [-0.72, 0.44, 0.24]))
  parts.push(part(rod(0.035, 0.1, 8), INK, [-0.87, 0.4, 0.24]))
  parts.push(
    part(
      new THREE.CylinderGeometry(0.12, 0.1, 0.18, 10),
      WOOD,
      [-0.87, 0.09, 0.24],
    ),
  )
  parts.push(
    part(
      new THREE.CylinderGeometry(0.11, 0.11, 0.02, 10),
      FAT,
      [-0.87, 0.17, 0.24],
      { k: K.bob, a: 2, b: 0.008 },
    ),
  )
  for (let k = 0; k < 3; k++)
    parts.push(
      part(ball(0.022, 6, 5).scale(1, 1.5, 1), FAT, [-0.87, 0.33, 0.24], {
        k: K.drip,
        ph: k / 3,
        a: 1.4,
        b: 0.15,
      }),
    )
  for (const [x, ph] of [
    [-0.34, 0.1],
    [-0.1, 0.55],
    [0.18, 0.3],
    [0.4, 0.8],
  ])
    parts.push(
      part(
        ball(0.03, 6, 5).scale(1, 1.6, 0.6),
        FAT,
        [x, 0.36, Math.sqrt(0.64 ** 2 - x * x) + 0.01],
        { k: K.drip, ph, a: 0.45, b: 0.26 },
      ),
    )
  folk(parts, [-0.62, 0.09, 0.6], 0.09, { k: K.bob, a: 4, b: 0.03 }, FAT)
  eyes(parts, 0.62, 0.4, 0.17)
  return merged(parts)
}

export function lighthouseGeometry() {
  const parts = [
    part(new THREE.CylinderGeometry(0.5, 0.56, 0.16, 16), WALL, [0, 0.08, 0]),
  ]
  const bands = 4
  const tall = 1.5
  for (let k = 0; k < bands; k++) {
    const r = (u: number) => 0.4 - 0.12 * u
    parts.push(
      part(
        new THREE.CylinderGeometry(
          r((k + 1) / bands),
          r(k / bands),
          tall / bands,
          16,
        ),
        k % 2 ? ROOF : STONE,
        [0, 0.16 + ((k + 0.5) * tall) / bands, 0],
      ),
    )
  }
  parts.push(
    part(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16), WOOD, [0, 1.69, 0]),
  )
  parts.push(
    part(
      new THREE.TorusGeometry(0.4, 0.014, 4, 24).rotateX(Math.PI / 2),
      INK,
      [0, 1.86, 0],
    ),
  )
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    parts.push(
      part(rod(0.012, 0.16), INK, [Math.sin(a) * 0.4, 1.78, Math.cos(a) * 0.4]),
    )
  }
  parts.push(
    part(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12), FAT, [0, 1.89, 0], {
      k: K.glow,
      a: 1,
      b: 1.6,
    }),
  )
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU
    parts.push(
      part(rod(0.014, 0.36), INK, [
        Math.sin(a) * 0.225,
        1.89,
        Math.cos(a) * 0.225,
      ]),
    )
  }
  parts.push(part(new THREE.ConeGeometry(0.3, 0.3, 12), ROOF, [0, 2.21, 0]))
  parts.push(part(ball(0.06), INK, [0, 2.38, 0]))
  pennant(parts, [0, 2.62, 0], 0.24, 0.4)
  arch(parts, [0, 0.16, 0.39], 0.16, 0.14)
  pane(parts, [0, 1.3, 0.31], 0, 1.3)
  const look = { k: K.look, at: [0.2, 1.78, 0.24] as V3 }
  folk(parts, [0.2, 1.78, 0.24], 0.08, look)
  const top: V3 = [-0.56, 1.5, 0.1]
  parts.push(
    part(new THREE.ShapeGeometry(swallow(0.2, 0.62)), ROOF, top, {
      k: K.banner,
      ph: 0.3,
      at: top,
    }),
  )
  parts.push(
    part(
      ball(0.045, 6, 4).scale(1, 1, 0.3),
      FLAG,
      [top[0], 1.36, top[2] + 0.01],
      { k: K.banner, ph: 0.3, at: top },
    ),
  )
  parts.push(part(lying(rod(0.014, 0.3)), WOOD, [-0.44, 1.5, 0.1]))
  parts.push(part(lying(rod(0.01, 0.24)), INK, top))
  eyes(parts, 0.95, 0.33)
  return merged(parts)
}

export function carrierGeometry() {
  const parts = [part(ball(0.5, 14, 10), FOLK, [0, 0.5, 0])]
  for (const side of [-1, 1]) {
    parts.push(part(ball(0.17, 12, 8), WHITE, [side * 0.2, 0.6, 0.38]))
    parts.push(part(ball(0.085, 10, 6), INK, [side * 0.19, 0.58, 0.53]))
    parts.push(
      part(ball(0.14, 8, 6).scale(1.3, 0.6, 1.6), INK, [
        side * 0.22,
        0.04,
        0.1,
      ]),
    )
    parts.push(part(ball(0.12, 8, 6), FOLK, [side * 0.44, 1.02, 0.1]))
  }
  const fat = { k: K.glow, a: 1, b: 0.45 }
  parts.push(part(ball(0.48, 16, 12).scale(1, 0.88, 1), FAT, [0, 1.36, 0], fat))
  parts.push(
    part(new THREE.ConeGeometry(0.27, 0.42, 14), FAT, [0, 1.84, 0], fat),
  )
  parts.push(part(ball(0.11, 8, 6), WHITE, [-0.17, 1.5, 0.34]))
  return merged(parts)
}
