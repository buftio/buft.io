import * as THREE from 'three'
import { CORAL, eyes, GOLD, INK, merged, MINT, part, RIND, TEAL, WHITE, type V3 } from './kit'

const SKIN = '#5b3fb8'
const BLUSH = '#ff8fb0'

type Look = { robe: string; trim: string; extra: (p: THREE.BufferGeometry[]) => void }

function base(robe: string, trim: string) {
  const p = [
    part(new THREE.CylinderGeometry(0.3, 0.6, 1.5, 12), robe, [0, 0.75, 0]),
    part(new THREE.CylinderGeometry(0.62, 0.62, 0.09, 12), trim, [0, 0.05, 0]),
    part(new THREE.SphereGeometry(0.34, 12, 6), robe, [0, 1.48, 0], [0, 0, 0], [1, 0.55, 1]),
    part(new THREE.PlaneGeometry(0.34, 0.15), INK, [0, 0.55, 0.5], [-0.2, 0, 0]),
    part(new THREE.SphereGeometry(0.07, 6, 4), INK, [-0.14, 0.02, 0.5]),
    part(new THREE.SphereGeometry(0.07, 6, 4), INK, [0.14, 0.02, 0.5]),
    part(new THREE.SphereGeometry(0.42, 14, 10), SKIN, [0, 1.98, 0]),
    part(new THREE.CircleGeometry(0.06, 8), BLUSH, [-0.26, 1.86, 0.33]),
    part(new THREE.CircleGeometry(0.06, 8), BLUSH, [0.26, 1.86, 0.33]),
    part(new THREE.TorusGeometry(0.09, 0.022, 4, 8, Math.PI), INK, [0, 1.84, 0.4], [0, 0, Math.PI]),
  ]
  for (const side of [-1, 1]) {
    p.push(part(new THREE.CylinderGeometry(0.07, 0.08, 0.7, 6), robe, [side * 0.42, 1.22, 0.08], [0, 0, side * 0.55]))
    p.push(part(new THREE.SphereGeometry(0.1, 8, 6), SKIN, [side * 0.6, 0.93, 0.14]))
  }
  eyes(p, 0.16, 2.03, 0.39, 0.15, [0.2, -0.3])
  eyes(p, 0.06, 0.56, 0.52, 0.045, [0, 0])
  return p
}

const at = (x: number, y: number, z: number): V3 => [x, y, z]

const LOOKS: Look[] = [
  {
    robe: TEAL,
    trim: MINT,
    extra: (p) => {
      p.push(part(new THREE.SphereGeometry(0.45, 12, 8), WHITE, at(0, 2.1, -0.1), [0, 0, 0], [1, 0.85, 0.9]))
      p.push(part(new THREE.SphereGeometry(0.19, 10, 6), WHITE, at(0, 2.5, -0.12)))
      p.push(part(new THREE.PlaneGeometry(0.42, 0.62), WHITE, at(0, 0.9, 0.45), [-0.2, 0, 0]))
      for (const side of [-1, 1])
        p.push(part(new THREE.TorusGeometry(0.15, 0.02, 4, 12), INK, at(side * 0.16, 2.03, 0.43)))
    },
  },
  {
    robe: GOLD,
    trim: RIND,
    extra: (p) => {
      p.push(part(new THREE.SphereGeometry(0.4, 12, 8), GOLD, at(0, 0.95, 0.24), [0, 0, 0], [1, 1, 0.8]))
      p.push(part(new THREE.CylinderGeometry(0.5, 0.52, 0.08, 12), RIND, at(0, 0.82, 0.02)))
      p.push(part(new THREE.CylinderGeometry(0.37, 0.37, 0.05, 12), INK, at(0, 2.34, 0)))
      p.push(part(new THREE.CylinderGeometry(0.23, 0.23, 0.5, 12), INK, at(0, 2.6, 0)))
      p.push(part(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 12), GOLD, at(0, 2.42, 0)))
      for (const side of [-1, 1])
        p.push(part(new THREE.SphereGeometry(0.1, 8, 5), WHITE, at(side * 0.09, 1.91, 0.4), [0, 0, side * 0.4], [1.4, 0.5, 0.6]))
    },
  },
  {
    robe: CORAL,
    trim: GOLD,
    extra: (p) => {
      p.push(part(new THREE.SphereGeometry(0.46, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, at(0, 2.08, 0)))
      p.push(part(new THREE.ConeGeometry(0.13, 0.6, 6), MINT, at(0.05, 2.7, -0.05), [0, 0, -0.25]))
      for (let k = 0; k < 3; k++) p.push(part(new THREE.SphereGeometry(0.05, 6, 4), GOLD, at(0, 0.7 + k * 0.25, 0.5 - k * 0.05)))
      p.push(part(new THREE.BoxGeometry(0.06, 0.9, 0.04), '#c9a27a', at(0.62, 1.4, 0.16)))
      p.push(part(new THREE.BoxGeometry(0.26, 0.05, 0.06), GOLD, at(0.62, 1.0, 0.16)))
      for (const side of [-1, 1])
        p.push(part(new THREE.BoxGeometry(0.17, 0.035, 0.02), INK, at(side * 0.16, 2.21, 0.42), [0, 0, side * 0.3]))
    },
  },
  {
    robe: '#b48be0',
    trim: GOLD,
    extra: (p) => {
      p.push(part(new THREE.CylinderGeometry(0.3, 0.27, 0.2, 10, 1, true), GOLD, at(0, 2.42, 0)))
      p.push(part(new THREE.ConeGeometry(0.11, 0.26, 4), GOLD, at(-0.2, 2.64, 0)))
      p.push(part(new THREE.ConeGeometry(0.11, 0.26, 4), GOLD, at(0.2, 2.64, 0)))
      p.push(part(new THREE.SphereGeometry(0.22, 10, 7), '#f09a4a', at(0, 1.12, 0.46), [0, 0, 0], [1.2, 0.9, 0.8]))
      p.push(part(new THREE.SphereGeometry(0.14, 10, 7), '#f09a4a', at(0.02, 1.36, 0.55)))
      p.push(part(new THREE.ConeGeometry(0.05, 0.1, 4), '#f09a4a', at(-0.07, 1.5, 0.55)))
      p.push(part(new THREE.ConeGeometry(0.05, 0.1, 4), '#f09a4a', at(0.1, 1.5, 0.55)))
      for (const side of [-1, 1]) p.push(part(new THREE.CircleGeometry(0.03, 6), INK, at(0.02 + side * 0.05, 1.38, 0.69)))
    },
  },
]

export function giantShape(k: number) {
  const look = LOOKS[k]
  const p = base(look.robe, look.trim)
  look.extra(p)
  return merged(p)
}
