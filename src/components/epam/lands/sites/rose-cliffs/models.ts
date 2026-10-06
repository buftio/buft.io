import * as THREE from 'three'
import { Kit } from './kit'

export const INK = '#2a1630'
export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const STONE = '#f3ebf4'
export const WOOD = '#b97a3e'
export const PLANK = '#dba062'
export const FAT = '#ffd36b'

const ball = (r: number, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b)

export function folkGeometry() {
  const k = new Kit()
  k.add(ball(0.5, 12, 8), '#4b34a8', 0, 0.5, 0, { sy: 0.95 })
  for (const s of [-1, 1]) {
    k.add(ball(0.22), '#ffffff', s * 0.19, 0.6, 0.36)
    k.add(ball(0.1, 6, 4), INK, s * 0.18, 0.6, 0.57)
    k.add(ball(0.13, 6, 4), INK, s * 0.2, 0.05, 0.12, { sz: 1.4, sy: 0.6 })
  }
  k.add(new THREE.SphereGeometry(0.36, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, 0, 0.86, -0.1, { rx: -0.35, top: MINT })
  k.add(ball(0.07, 6, 4), FAT, 0, 1.04, 0.12)
  return k.build()
}

export function hammerGeometry() {
  return new Kit()
    .box(0.08, 0.7, 0.08, '#8a5a2b', 0, 0.35, 0)
    .box(0.38, 0.2, 0.2, '#3b3346', 0, 0.72, 0, { top: '#8d84a0' })
    .build()
}

export function gondolaGeometry() {
  return new Kit()
    .box(26, 12, 16, INK, 0, 0, 0)
    .box(4, 70, 4, INK, 0, -36, 0)
    .box(72, 40, 54, TEAL, 0, -90, 0, { top: MINT })
    .box(75, 7, 57, STONE, 0, -79, 0)
    .build()
}

export function blockGeometry() {
  return new Kit().box(1, 1, 1, '#de6f96', 0, 0, 0, { top: '#f7b3ca' }).build()
}
