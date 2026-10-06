import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { K } from './fortress-shade'

export const STONE = '#f3ebf4'
export const WALL = '#dccbe4'
export const ROOF = '#16b3a0'
export const FLAG = '#7dffe6'
export const INK = '#2a1630'
export const WHITE = '#ffffff'
export const FOLK = '#4b36a8'
export const WOOD = '#7a4a52'
export const PANE = '#4a2c3c'
export const BAR = '#9aa3b8'
export const SMOKE = '#cfc3d8'
export const FAT = '#ffd36b'
export const RIND = '#e0a93a'
export const HOOP = '#a8722c'

export type V3 = [number, number, number]
export type Move = { k: number; ph?: number; a?: number; b?: number; at?: V3 }
export type Parts = THREE.BufferGeometry[]

export const STILL: Move = { k: K.still }
export const TAU = Math.PI * 2

function fill(g: THREE.BufferGeometry, name: string, v: number[]) {
  const n = g.getAttribute('position').count
  g.setAttribute(
    name,
    new THREE.BufferAttribute(
      Float32Array.from({ length: n * v.length }, (_, i) => v[i % v.length]),
      v.length,
    ),
  )
}

export function part(
  shape: THREE.BufferGeometry,
  color: string,
  [x, y, z]: V3 = [0, 0, 0],
  move: Move = STILL,
  turn = 0,
) {
  const g = shape.index ? shape.toNonIndexed() : shape
  g.rotateY(turn)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  fill(g, 'color', [c.r, c.g, c.b])
  fill(g, 'aAnim', [move.k, move.ph ?? 0, move.a ?? 0, move.b ?? 0])
  fill(g, 'aPivot', move.at ?? [x, y, z])
  return g
}

export const box = (w: number, h: number, d: number) =>
  new THREE.BoxGeometry(w, h, d)
export const ball = (r: number, w = 8, h = 6) =>
  new THREE.SphereGeometry(r, w, h)
export const rod = (r: number, h: number, n = 5) =>
  new THREE.CylinderGeometry(r, r, h, n)
export const lying = (g: THREE.BufferGeometry) => g.rotateZ(Math.PI / 2)
export const facing = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2)

export function eyes(parts: Parts, y: number, z: number, gap = 0.14) {
  for (const side of [-1, 1]) {
    parts.push(part(ball(0.12, 14, 10), WHITE, [side * gap, y, z]))
    parts.push(
      part(ball(0.06, 10, 8), INK, [side * gap * 0.93, y - 0.04, z + 0.1]),
    )
  }
}

export function folk(
  parts: Parts,
  [x, y, z]: V3,
  r: number,
  move: Move,
  hat = ROOF,
) {
  const m = { at: [x, y, z] as V3, ...move }
  parts.push(part(ball(r, 10, 8), FOLK, [x, y, z], m))
  parts.push(
    part(
      new THREE.SphereGeometry(r * 0.78, 10, 4, 0, TAU, 0, Math.PI / 2),
      hat,
      [x, y + r * 0.42, z],
      m,
    ),
  )
  for (const side of [-1, 1]) {
    parts.push(
      part(
        ball(r * 0.34),
        WHITE,
        [x + side * r * 0.4, y + r * 0.12, z + r * 0.78],
        m,
      ),
    )
    parts.push(
      part(
        ball(r * 0.17, 6, 4),
        INK,
        [x + side * r * 0.38, y + r * 0.08, z + r * 1.08],
        m,
      ),
    )
  }
}

export function pennant(
  parts: Parts,
  [x, y, z]: V3,
  long: number,
  ph: number,
  color = FLAG,
) {
  const tail = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(long, -long * 0.18),
    new THREE.Vector2(long * 0.78, -long * 0.3),
    new THREE.Vector2(long, -long * 0.45),
    new THREE.Vector2(0, -long * 0.5),
  ])
  parts.push(part(rod(0.012, long * 1.1), INK, [x, y - long * 0.35, z]))
  parts.push(
    part(new THREE.ShapeGeometry(tail), color, [x + 0.012, y + long * 0.2, z], {
      k: K.flag,
      ph,
      a: 3,
    }),
  )
}

export function swallow(w: number, h: number) {
  return new THREE.Shape([
    new THREE.Vector2(-w / 2, 0),
    new THREE.Vector2(w / 2, 0),
    new THREE.Vector2(w / 2, -h),
    new THREE.Vector2(0, -h * 0.8),
    new THREE.Vector2(-w / 2, -h),
  ])
}

export function pane(
  parts: Parts,
  at: V3,
  turn: number,
  ph: number,
  w = 0.07,
  h = 0.12,
) {
  parts.push(
    part(box(w, h, 0.03), PANE, at, { k: K.glow, ph, a: 0, b: 1 }, turn),
  )
}

export function arch(parts: Parts, [x, y, z]: V3, w: number, h: number) {
  parts.push(part(box(w, h, 0.04), WOOD, [x, y + h / 2, z]))
  parts.push(
    part(
      new THREE.CylinderGeometry(
        w / 2,
        w / 2,
        0.04,
        10,
        1,
        false,
        -Math.PI / 2,
        Math.PI,
      ).rotateX(-Math.PI / 2),
      WOOD,
      [x, y + h, z],
    ),
  )
}

export function merged(parts: Parts) {
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}
