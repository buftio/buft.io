import * as THREE from 'three'
import { repeat } from './fortress-shade'

export const BODY = 0
export const SPEAR = 1
export const PUPIL = 2
export const SHIELD = 3
export const FOOT = 4
export const BANNER = 5
export const SHADOW = 6
export const EYE = 7
export const HELM = 8

export const SKIN = '#6a4fd0'
export const BELLY = '#8f7cf0'
export const SOLE = '#2e1f73'
export const ROOF = '#16b3a0'
export const FLAG = '#7dffe6'
export const STONE = '#f3ebf4'
export const SHAFT = '#c9b7d6'
export const INK = '#2a1630'
export const WHITE = '#ffffff'
export const GOLD = '#ffd166'
export const BRASS = '#d9a74a'
export const WOOD = '#8a5a3c'

export const HAND = [0.5, 0.4, 0.14]
export const GUARD = [-0.48, 0.38, 0.16]

export type Shape = THREE.BufferGeometry
export type Bend = (g: Shape) => void

const paint = (color: string) => (color === SKIN ? 1 : color === BELLY ? 2 : 0)

export function part(
  shape: Shape,
  color: string,
  kind: number,
  pivot: number[],
  bend?: Bend,
) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  bend?.(g)
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const fill = (values: number[]) => repeat(values, n)
  g.setAttribute('color', new THREE.BufferAttribute(fill([c.r, c.g, c.b]), 3))
  g.setAttribute('aPart', new THREE.BufferAttribute(fill([kind]), 1))
  g.setAttribute('aPivot', new THREE.BufferAttribute(fill(pivot), 3))
  g.setAttribute('aTag', new THREE.BufferAttribute(fill([-1, paint(color)]), 2))
  return g
}

export function own(kind: number, parts: Shape[]) {
  for (const g of parts) {
    const tag = g.getAttribute('aTag') as THREE.BufferAttribute
    for (let i = 0; i < tag.count; i++) tag.setX(i, kind)
  }
  return parts
}

export const at =
  (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): Bend =>
  (g) => {
    g.scale(sx, sy, sz)
    g.translate(x, y, z)
  }

export const tilt =
  (y: number, sx = 1, sy = 1): Bend =>
  (g) => {
    g.scale(sx, sy, sx)
    g.translate(0, y - 0.84, 0)
    g.rotateX(-0.45)
    g.translate(0, 0.82, -0.14)
  }

export const then =
  (...bends: Bend[]): Bend =>
  (g) =>
    bends.forEach((b) => b(g))

export const cap = (r: number, u: number, v: number) =>
  new THREE.SphereGeometry(
    r,
    u,
    Math.ceil(v / 2),
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  )
