import * as THREE from 'three'
import { C, merged, paint, part, rng } from './kit'
import { L, MAIN_Z, deckY, half, zOf } from './wreck'

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export function gangGeometry() {
  const a = v(half(-0.36) - 4, deckY(-0.36) + 4, zOf(-0.36))
  const b = v(half(-0.36) + 260, 0, zOf(-0.36) + 60)
  const len = a.distanceTo(b)
  const cleats: THREE.BufferGeometry[] = [
    part(new THREE.BoxGeometry(len, 5, 34), C.fresh),
  ]
  for (let k = 0; k < 7; k++)
    cleats.push(
      part(
        new THREE.BoxGeometry(5, 4, 34),
        C.freshD,
        -len / 2 + 30 + k * ((len - 60) / 6),
        4,
        0,
      ),
    )
  const m = merged(cleats)
  const dir = b.clone().sub(a).normalize()
  const flat = v(dir.x, 0, dir.z).normalize()
  m.rotateZ(-Math.asin(Math.abs(dir.y)))
  m.rotateY(-Math.atan2(flat.z, flat.x))
  m.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
  return m
}

export const SAIL = {
  w: 310,
  h: 288,
  y: () => deckY(MAIN_Z / (L / 2)) + 556,
  z: MAIN_Z + 22,
}

export function sailGeometry() {
  const nx = 6
  const ny = 5
  const colours = [
    C.sail,
    C.coral,
    C.teal,
    C.sail,
    C.gold,
    '#ff9a7a',
    C.sail,
    C.glass,
  ]
  const roll = rng(9)
  const pos: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  const P = (i: number, j: number): [number, number, number] => {
    const u = i / nx
    const w = j / ny
    return [
      (u - 0.5) * SAIL.w * (1 + 0.08 * w),
      -w * SAIL.h,
      Math.sin(Math.PI * u) * (0.35 + 0.65 * w) * 46,
    ]
  }
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      if (i === 4 && j === 3) continue
      c.set(colours[Math.floor(roll() * colours.length)])
      const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]
      for (const k of [0, 2, 1, 0, 3, 2]) {
        pos.push(...q[k])
        col.push(c.r, c.g, c.b)
      }
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

export function pennantGeometry() {
  const s = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(120, -18),
    new THREE.Vector2(96, -26),
    new THREE.Vector2(120, -36),
    new THREE.Vector2(0, -44),
  ])
  const g = new THREE.ShapeGeometry(s)
  g.deleteAttribute('uv')
  paint(g, C.coral)
  const col = g.getAttribute('color')
  const c = new THREE.Color(C.gold)
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++)
    if (p.getX(i) > 70) col.setXYZ(i, c.r, c.g, c.b)
  return g
}

export function lanternGeometry() {
  const parts = [
    part(new THREE.BoxGeometry(26, 30, 26), C.gold, 0, 0, 0),
    part(new THREE.ConeGeometry(22, 18, 4), C.ink, 0, 24, 0, Math.PI / 4),
    part(new THREE.BoxGeometry(30, 4, 30), C.ink, 0, -16, 0),
  ]
  return merged(parts)
}

export function glowGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const r of [40, 75, 120])
    parts.push(part(new THREE.CircleGeometry(r, 20), C.gold))
  return merged(parts)
}
