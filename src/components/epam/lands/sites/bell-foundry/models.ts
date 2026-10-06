import * as THREE from 'three'
import { Kit } from './kit'

export const C = {
  bronze: '#c98a3c',
  bright: '#f2bb62',
  deep: '#7d4a22',
  patina: '#3fc4a8',
  soot: '#45283a',
  brick: '#b5523e',
  wood: '#6b3b28',
  dark: '#3e2120',
  rope: '#e3cc9c',
  ink: '#2a1630',
  white: '#ffffff',
  folk: '#4a36aa',
  teal: '#16b3a0',
  mint: '#7dffe6',
  leather: '#8a5634',
  hot: '#ffc35a',
  ore: '#c48aa0',
}

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)

const BELL = [
  [0, 1],
  [0.2, 0.99],
  [0.31, 0.95],
  [0.36, 0.87],
  [0.37, 0.72],
  [0.39, 0.55],
  [0.44, 0.36],
  [0.52, 0.18],
  [0.6, 0.06],
  [0.63, 0],
].map(([r, y]) => new THREE.Vector2(r, y))

export function eyes(k: Kit, y: number, z: number, r: number, gap: number) {
  for (const side of [-1, 1]) {
    k.add(new THREE.SphereGeometry(r, 8, 6), C.white, side * gap, y, z)
    k.add(
      new THREE.SphereGeometry(r * 0.5, 6, 4),
      C.ink,
      side * gap * 0.92,
      y - r * 0.3,
      z + r * 0.75,
    )
  }
}

export function bell(
  k: Kit,
  h: number,
  y = 0,
  face = true,
  x = 0,
  z = 0,
  tip = 0,
) {
  const at = (g: THREE.BufferGeometry, color: string, gy: number, rx = 0) => {
    g.rotateX(rx)
    g.translate(0, gy, 0)
    g.rotateZ(tip)
    k.add(g, color, x, y, z)
  }
  at(new THREE.LatheGeometry(BELL, 18).scale(h, h, h), C.bronze, 0)
  at(
    new THREE.TorusGeometry(0.62 * h, 0.04 * h, 5, 18),
    C.deep,
    0.04 * h,
    Math.PI / 2,
  )
  at(
    new THREE.TorusGeometry(0.4 * h, 0.025 * h, 4, 18),
    C.patina,
    0.52 * h,
    Math.PI / 2,
  )
  at(
    new THREE.TorusGeometry(0.37 * h, 0.02 * h, 4, 18),
    C.bright,
    0.78 * h,
    Math.PI / 2,
  )
  at(new THREE.TorusGeometry(0.11 * h, 0.035 * h, 5, 10), C.deep, 1.05 * h)
  if (face) {
    for (const side of [-1, 1]) {
      at(
        new THREE.SphereGeometry(0.1 * h, 10, 8).translate(
          side * 0.14 * h,
          0,
          0.4 * h,
        ),
        C.white,
        0.64 * h,
      )
      at(
        new THREE.SphereGeometry(0.05 * h, 8, 6).translate(
          side * 0.13 * h,
          -0.03 * h,
          0.48 * h,
        ),
        C.ink,
        0.64 * h,
      )
    }
    at(
      new THREE.TorusGeometry(0.07 * h, 0.015 * h, 4, 8, Math.PI)
        .rotateZ(Math.PI)
        .translate(0, 0, 0.42 * h),
      C.ink,
      0.47 * h,
    )
  }
}

export function greatBell() {
  const k = new Kit()
  bell(k, 360, -372)
  k.add(new THREE.BoxGeometry(80, 26, 46), C.dark, 0, -6, 0)
  k.add(new THREE.SphereGeometry(40, 10, 8), C.ink, 0, -360, 0)
  return k.merge()
}

export function gantry(k: Kit) {
  const top = 640
  for (const x of [-290, 660]) {
    for (const z of [-170, 170]) {
      k.rod(V(x, 0, z), V(x, top, 0), 16, C.wood)
      for (const f of [0.3, 0.62])
        k.add(
          new THREE.TorusGeometry(17, 3.5, 4, 8),
          C.ink,
          x,
          top * f,
          z * (1 - f),
          Math.PI / 2 - Math.sign(z) * 0.26,
        )
    }
    k.add(new THREE.BoxGeometry(26, 26, 300), C.dark, x, 210, 0)
    k.add(new THREE.BoxGeometry(70, 30, 380), C.soot, x, 15, 0)
  }
  k.add(new THREE.BoxGeometry(1010, 34, 40), C.wood, 185, top + 4, 0)
  k.add(new THREE.BoxGeometry(1040, 12, 46), C.dark, 185, top + 26, 0)
  k.rod(V(-290, 470, 0), V(-120, top, 0), 9, C.dark)
  k.rod(V(660, 470, 0), V(490, top, 0), 9, C.dark)
  k.add(
    new THREE.ConeGeometry(70, 70, 4),
    C.patina,
    185,
    top + 66,
    0,
    0,
    Math.PI / 4,
  )
  k.rod(V(185, top + 100, 0), V(185, top + 230, 0), 4, C.ink)
  k.add(
    new THREE.ShapeGeometry(
      new THREE.Shape(
        [V(0, 0), V(110, -24), V(0, -48)].map(
          (p) => new THREE.Vector2(p.x, p.y),
        ),
      ),
    ),
    C.mint,
    189,
    top + 228,
    0,
  )
}

export function ram() {
  const k = new Kit()
  k.add(
    new THREE.CylinderGeometry(30, 34, 280, 10),
    C.wood,
    0,
    -200,
    0,
    0,
    0,
    Math.PI / 2,
  )
  k.add(
    new THREE.CylinderGeometry(36, 36, 18, 10),
    C.ink,
    -140,
    -200,
    0,
    0,
    0,
    Math.PI / 2,
  )
  k.add(
    new THREE.CylinderGeometry(36, 36, 18, 10),
    C.patina,
    140,
    -200,
    0,
    0,
    0,
    Math.PI / 2,
  )
  for (const x of [-90, 90])
    k.rod(V(x, -200, 0), V(x * 0.5, 0, 0), 3.5, C.rope, 4)
  return k.merge()
}

const KILN = [
  [0.44, 0],
  [0.48, 0.1],
  [0.49, 0.26],
  [0.44, 0.43],
  [0.32, 0.6],
  [0.19, 0.76],
  [0.14, 0.88],
  [0.16, 0.96],
  [0.16, 1],
].map(([r, y]) => new THREE.Vector2(r, y))

export function kiln(k: Kit, h: number) {
  k.add(new THREE.LatheGeometry(KILN, 16).scale(h, h, h), C.soot)
  k.add(
    new THREE.TorusGeometry(0.485 * h, 0.035 * h, 4, 16),
    C.brick,
    0,
    0.14 * h,
    0,
    Math.PI / 2,
  )
  k.add(
    new THREE.TorusGeometry(0.45 * h, 0.03 * h, 4, 16),
    C.brick,
    0,
    0.41 * h,
    0,
    Math.PI / 2,
  )
  k.add(
    new THREE.TorusGeometry(0.165 * h, 0.025 * h, 4, 12),
    C.brick,
    0,
    0.98 * h,
    0,
    Math.PI / 2,
  )
  k.add(
    new THREE.CylinderGeometry(0.13 * h, 0.13 * h, 0.02 * h, 12),
    C.ink,
    0,
    0.995 * h,
    0,
  )
  k.add(
    new THREE.BoxGeometry(0.2 * h, 0.16 * h, 0.06 * h),
    C.hot,
    0,
    0.1 * h,
    0.46 * h,
  )
  k.add(
    new THREE.BoxGeometry(0.26 * h, 0.03 * h, 0.08 * h),
    C.ink,
    0,
    0.19 * h,
    0.47 * h,
  )
  eyes(k, 0.58 * h, 0.34 * h, 0.05 * h, 0.075 * h)
}

export function crane(k: Kit) {
  k.add(new THREE.BoxGeometry(310, 22, 22), C.wood, -85, 370, 0)
  k.rod(V(0, 250, 0), V(-150, 370, 0), 7, C.dark)
  k.add(new THREE.BoxGeometry(60, 50, 50), C.ink, 75, 350, 0)
  k.rod(V(-220, 370, 0), V(-220, 205, 0), 3, C.rope, 4)
}

export function crucible() {
  const k = new Kit()
  const cup = [
    [0.5, 0],
    [0.62, 0.15],
    [0.72, 0.6],
    [0.78, 1],
    [0.7, 1],
  ].map(([r, y]) => new THREE.Vector2(r * 60, y * 90 - 90))
  k.add(new THREE.LatheGeometry(cup, 12), C.ink)
  k.add(new THREE.CylinderGeometry(42, 42, 4, 12), C.hot, 0, -6, 0)
  k.add(new THREE.TorusGeometry(48, 5, 4, 12, Math.PI), C.dark, 0, 0, 0)
  k.add(
    new THREE.ConeGeometry(16, 30, 4),
    C.ink,
    -52,
    -10,
    0,
    0,
    0,
    Math.PI / 2,
  )
  return k.merge()
}

export function folk(extra?: (k: Kit) => void) {
  const k = new Kit()
  k.add(
    new THREE.SphereGeometry(1, 10, 7).scale(1, 1.05, 0.95),
    C.folk,
    0,
    1,
    0,
  )
  k.add(
    new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    C.teal,
    0,
    1.58,
    -0.1,
    -0.25,
  )
  k.add(
    new THREE.BoxGeometry(1.15, 0.85, 0.12),
    C.leather,
    0,
    0.62,
    0.86,
    -0.12,
  )
  eyes(k, 1.35, 0.72, 0.36, 0.36)
  k.add(
    new THREE.SphereGeometry(0.22, 6, 5).scale(1, 0.7, 1),
    C.folk,
    -0.9,
    0.2,
    0.2,
  )
  k.add(
    new THREE.SphereGeometry(0.22, 6, 5).scale(1, 0.7, 1),
    C.folk,
    0.9,
    0.2,
    0.2,
  )
  extra?.(k)
  return k.merge()
}

export function muffs(k: Kit) {
  k.add(new THREE.TorusGeometry(1.05, 0.09, 4, 12, Math.PI), C.ink, 0, 1.3, 0)
  for (const side of [-1, 1])
    k.add(
      new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10),
      C.patina,
      side * 1.02,
      1.25,
      0,
      0,
      0,
      Math.PI / 2,
    )
}

export function trumpet(k: Kit) {
  k.add(
    new THREE.ConeGeometry(0.75, 2.2, 10, 1, true),
    C.bright,
    -2.1,
    1.5,
    0.3,
    0,
    0,
    -Math.PI / 2,
  )
  k.add(
    new THREE.CylinderGeometry(0.12, 0.12, 0.9, 5),
    C.bronze,
    -0.75,
    1.5,
    0.2,
    0,
    0,
    Math.PI / 2,
  )
  k.add(new THREE.CylinderGeometry(0.9, 0.9, 0.25, 8), C.wood, 0, -0.15, 0)
  for (const [x, z] of [
    [-0.6, -0.4],
    [0.6, -0.4],
    [0, 0.6],
  ])
    k.add(new THREE.CylinderGeometry(0.1, 0.1, 1, 4), C.dark, x, -0.75, z)
}

export function flag() {
  const k = new Kit()
  k.add(new THREE.CylinderGeometry(0.08, 0.08, 3, 4), C.ink, 0, 1.5, 0)
  k.add(
    new THREE.ShapeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1.6, -0.5),
        new THREE.Vector2(0, -1),
      ]),
    ),
    C.white,
    0.06,
    3,
    0,
  )
  return k.merge()
}

export function cart() {
  const k = new Kit()
  k.add(new THREE.BoxGeometry(1.5, 0.14, 0.9), C.wood, 0, 0.42, 0)
  for (const x of [-0.45, 0.45]) {
    for (const z of [-0.5, 0.5])
      k.add(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10),
        C.dark,
        x,
        0.3,
        z,
        Math.PI / 2,
      )
  }
  k.rod(V(0.75, 0.42, 0), V(1.35, 0.3, 0), 0.04, C.rope, 4)
  bell(k, 0.8, 0.49, true)
  k.rod(V(-0.6, 0.5, 0), V(-0.6, 1.5, 0), 0.03, C.ink, 4)
  k.add(
    new THREE.ShapeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.5, -0.15),
        new THREE.Vector2(0, -0.3),
      ]),
    ),
    C.mint,
    -0.58,
    1.5,
    0,
  )
  return k.merge()
}

export function lump() {
  const k = new Kit()
  k.add(new THREE.IcosahedronGeometry(0.55, 0), C.ore, 0, 0, 0, 0.4, 0.2)
  k.add(
    new THREE.IcosahedronGeometry(0.3, 0),
    '#e7b0c4',
    0.35,
    0.25,
    0.2,
    1,
    0.5,
  )
  return k.merge()
}

export function relayBell() {
  const k = new Kit()
  bell(k, 70, -74)
  return k.merge()
}
