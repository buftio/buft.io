import * as THREE from 'three'
import {
  drawbridge,
  harbour,
  observatory,
  watchtower,
  windmill,
} from './annexes'
import { K } from './fortress-shade'
import {
  arch,
  ball,
  BAR,
  box,
  eyes,
  FAT,
  folk,
  INK,
  lying,
  merged,
  pane,
  part,
  pennant,
  rod,
  SMOKE,
  STILL,
  STONE,
  swallow,
  TAU,
  WALL,
  WOOD,
  type Parts,
  type V3,
} from './kit'

export type Look = {
  roof: string
  flag: string
  dome: 'cone' | 'onion' | 'flat'
}

const KEEP_Z = -0.08

export function onion(r: number, h: number) {
  const profile = [
    [0, 0],
    [r * 0.85, 0.04 * h],
    [r, 0.25 * h],
    [r * 0.82, 0.5 * h],
    [r * 0.35, 0.78 * h],
    [r * 0.08, 0.95 * h],
    [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(profile, 12)
}

function cap(parts: Parts, look: Look, [x, y, z]: V3, r: number) {
  if (look.dome === 'onion')
    parts.push(part(onion(r * 1.05, r * 2), look.roof, [x, y - 0.03, z]))
  else if (look.dome === 'flat')
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU
      parts.push(
        part(box(0.08, 0.09, 0.08), STONE, [
          x + Math.sin(a) * r * 0.85,
          y + 0.02,
          z + Math.cos(a) * r * 0.85,
        ]),
      )
    }
  else
    parts.push(
      part(new THREE.ConeGeometry(r, r * 1.55, 12), look.roof, [
        x,
        y + r * 0.75,
        z,
      ]),
    )
}

function walls(parts: Parts) {
  for (const [x, z, along] of [
    [0, 0.7, true],
    [0, -0.7, true],
    [0.7, 0, false],
    [-0.7, 0, false],
  ] as const) {
    parts.push(
      part(box(along ? 1.4 : 0.12, 0.5, along ? 0.12 : 1.4), WALL, [
        x,
        0.25,
        z,
      ]),
    )
    const out = Math.sign(x + z) * 0.04
    for (let k = -2; k <= 2; k++) {
      const t = k * 0.22
      parts.push(
        part(
          box(0.1, 0.1, 0.05),
          WALL,
          [along ? t : x + out, 0.55, along ? z + out : t],
          STILL,
          along ? 0 : Math.PI / 2,
        ),
      )
    }
  }
  const guards: [V3, number, number][] = [
    [[-0.26, 0.565, 0.67], 0, 0.17],
    [[0.26, 0.565, 0.67], 0, 0.17],
    [[-0.67, 0.565, 0.1], 1, 0.3],
    [[0.67, 0.565, -0.05], 1, 0.3],
  ]
  guards.forEach(([at, axis, range], k) => {
    const move = { k: K.walk, ph: k * 2.3, a: axis, b: range }
    folk(parts, at, 0.065, move)
    parts.push(
      part(rod(0.007, 0.24), INK, [at[0] + 0.075, at[1] + 0.06, at[2]], move),
    )
    parts.push(
      part(
        new THREE.ConeGeometry(0.018, 0.05, 4),
        BAR,
        [at[0] + 0.075, at[1] + 0.2, at[2]],
        move,
      ),
    )
  })
}

export function gate(parts: Parts, look: Look, z = 0.77, y = 0) {
  arch(parts, [0, y, z], 0.26, 0.2)
  for (let k = -1; k <= 1; k++)
    parts.push(
      part(box(0.018, 0.3, 0.02), BAR, [k * 0.07, y + 0.16, z + 0.025]),
    )
  parts.push(part(box(0.24, 0.018, 0.02), BAR, [0, y + 0.2, z + 0.025]))
  for (const side of [-1, 1]) {
    parts.push(part(rod(0.012, 0.14), INK, [side * 0.2, y + 0.3, z + 0.02]))
    parts.push(
      part(
        new THREE.ConeGeometry(0.03, 0.07, 6),
        FAT,
        [side * 0.2, y + 0.4, z + 0.02],
        {
          k: K.glow,
          ph: side,
          a: 1,
          b: 1.4,
        },
      ),
    )
    const hang: V3 = [side * 0.38, y + 0.47, z + 0.015]
    const sway = { k: K.banner, ph: side * 1.7, at: hang }
    parts.push(
      part(new THREE.ShapeGeometry(swallow(0.13, 0.32)), look.roof, hang, sway),
    )
    parts.push(
      part(
        ball(0.03, 6, 4).scale(1, 1, 0.3),
        look.flag,
        [hang[0], y + 0.36, z + 0.025],
        sway,
      ),
    )
    parts.push(part(lying(rod(0.008, 0.16)), INK, hang))
  }
}

function frame(parts: Parts, look: Look) {
  for (const [i, [a, b]] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].entries()) {
    const [x, z] = [a * 0.7, b * 0.7]
    parts.push(
      part(new THREE.CylinderGeometry(0.2, 0.23, 0.78, 12), STONE, [
        x,
        0.39,
        z,
      ]),
    )
    parts.push(
      part(new THREE.CylinderGeometry(0.26, 0.26, 0.09, 12), STONE, [
        x,
        0.82,
        z,
      ]),
    )
    cap(parts, look, [x, 0.86, z], 0.3)
    pennant(
      parts,
      [x, look.dome === 'flat' ? 1.12 : 1.52, z],
      0.2,
      i * 1.3,
      look.flag,
    )
    pane(parts, [x, b > 0 ? 0.36 : 0.66, z + 0.215], 0, i * 0.7 + 0.3)
    pane(parts, [x + a * 0.215, 0.62, z], Math.PI / 2, i * 1.9)
  }
  walls(parts)
  gate(parts, look)
  parts.push(part(box(0.26, 0.02, 0.3), WOOD, [0, 0.01, 0.94]))
  parts.push(part(box(0.64, 1, 0.64), STONE, [0, 0.5, KEEP_Z]))
  parts.push(
    part(
      new THREE.ConeGeometry(0.5, 0.6, 4),
      look.roof,
      [0, 1.3, KEEP_Z],
      STILL,
      Math.PI / 4,
    ),
  )
  parts.push(part(box(0.09, 0.26, 0.09), WALL, [0.2, 1.33, KEEP_Z - 0.12]))
  parts.push(part(box(0.12, 0.03, 0.12), STONE, [0.2, 1.47, KEEP_Z - 0.12]))
  for (let k = 0; k < 4; k++)
    parts.push(
      part(ball(0.08, 10, 8), SMOKE, [0.2, 1.5, KEEP_Z - 0.12], {
        k: K.smoke,
        ph: k / 4,
        a: 0.22,
      }),
    )
  for (const side of [-1, 1]) {
    pane(parts, [side * 0.2, 0.93, KEEP_Z + 0.33], 0, side + 4, 0.08, 0.1)
    pane(parts, [side * 0.33, 0.72, KEEP_Z + 0.1], Math.PI / 2, side * 2 + 5)
    pane(parts, [side * 0.33, 0.72, KEEP_Z - 0.12], Math.PI / 2, side * 3 + 6)
  }
  pennant(parts, [0, 2.02, KEEP_Z], 0.42, 0.5, look.flag)
  eyes(parts, 0.72, KEEP_Z + 0.33)
}

const EXTRAS: Record<
  string,
  { look: Look; add?: (parts: Parts, look: Look) => void }
> = {
  'fatline-keep': {
    look: { roof: '#e8a23a', flag: '#fff1b8', dome: 'cone' },
    add: windmill,
  },
  bandgate: {
    look: { roof: '#8a3fa0', flag: '#ff9ad5', dome: 'flat' },
    add: drawbridge,
  },
  northmere: {
    look: { roof: '#3a7bd5', flag: '#bfe3ff', dome: 'cone' },
    add: harbour,
  },
  rimwatch: {
    look: { roof: '#d8524a', flag: '#ffd0c8', dome: 'cone' },
    add: watchtower,
  },
  starfold: {
    look: { roof: '#4b4fc0', flag: '#c8c2ff', dome: 'onion' },
    add: observatory,
  },
}

const PLAIN: Look = { roof: '#16b3a0', flag: '#7dffe6', dome: 'cone' }

export function keepGeometry(id: string) {
  const parts: Parts = []
  const site = EXTRAS[id] ?? { look: PLAIN }
  frame(parts, site.look)
  site.add?.(parts, site.look)
  return merged(parts)
}
