import * as THREE from 'three'
import type { Kit } from './kit'
import { bell, C } from './models'

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)

export function cottage(k: Kit) {
  bell(k, 340, 0, false)
  k.add(new THREE.BoxGeometry(84, 128, 8), C.ink, 0, 60, 184, -0.48)
  k.add(new THREE.BoxGeometry(66, 114, 8), C.wood, 0, 58, 189, -0.48)
  k.add(new THREE.SphereGeometry(7, 6, 4), C.hot, 22, 56, 196)
  k.add(new THREE.BoxGeometry(62, 54, 6), C.ink, -82, 152, 114, -0.26, -0.6)
  k.add(new THREE.BoxGeometry(48, 40, 6), C.hot, -84, 152, 118, -0.26, -0.6)
  k.add(new THREE.BoxGeometry(4, 40, 4), C.ink, -86, 152, 122, -0.26, -0.6)
  k.add(new THREE.BoxGeometry(70, 8, 22), C.dark, -86, 124, 126, 0, -0.6)
  k.add(new THREE.CylinderGeometry(14, 14, 120, 6), C.dark, 60, 330, 0)
  k.add(new THREE.CylinderGeometry(19, 19, 14, 6), C.brick, 60, 392, 0)
  const crack = [
    [30, 270],
    [10, 230],
    [36, 200],
    [16, 160],
  ]
  for (let i = 0; i < crack.length - 1; i++)
    k.rod(
      V(crack[i][0] + 30, crack[i][1], 124),
      V(crack[i + 1][0] + 30, crack[i + 1][1], 126),
      4,
      C.ink,
      4,
    )
  k.add(new THREE.BoxGeometry(90, 6, 40), C.patina, 0, 3, 224)
  k.rod(V(140, 150, 120), V(290, 110, 170), 2.5, C.rope, 3)
  k.rod(V(290, 0, 170), V(290, 118, 170), 5, C.dark, 4)
  for (const [x, c] of [
    [180, C.mint],
    [220, C.white],
    [258, C.brick],
  ] as const) {
    const u = (x - 140) / 150
    k.add(
      new THREE.BoxGeometry(26, 32, 3),
      c,
      x,
      150 - u * 40 - 17,
      120 + u * 50,
      0,
      -0.3,
    )
  }
}

export function heap(k: Kit, n: number, r: number, seed = 1) {
  let s = seed
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2
    const d = rnd() * r
    const size = r * (0.25 + rnd() * 0.25) * (1 - (d / r) * 0.5)
    k.add(
      new THREE.IcosahedronGeometry(size, 0),
      rnd() > 0.5 ? C.ore : '#a7738c',
      Math.cos(a) * d,
      size * 0.6 + (r - d) * 0.25,
      Math.sin(a) * d * 0.6,
      rnd(),
      rnd(),
      rnd(),
    )
  }
}

export function relayPost(k: Kit) {
  k.add(new THREE.CylinderGeometry(9, 12, 300, 6), C.wood, 0, 150, 0)
  k.add(new THREE.BoxGeometry(110, 14, 16), C.dark, 0, 280, 0)
  k.add(new THREE.ConeGeometry(70, 60, 4), C.patina, 0, 318, 0, 0, Math.PI / 4)
  k.add(new THREE.CylinderGeometry(40, 46, 14, 8), C.soot, 0, 7, 0)
  k.rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-60, 0, 50), 5, C.dark, 4)
  k.rod(
    new THREE.Vector3(0, 90, 0),
    new THREE.Vector3(-60, 0, 50),
    5,
    C.dark,
    4,
  )
}
