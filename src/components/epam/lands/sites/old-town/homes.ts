import * as THREE from 'three'
import { stand } from './kit'
import type { House } from './plan'

const base = new THREE.Matrix4()
const tmp = new THREE.Matrix4()

export function roofMatrix(h: House, m: THREE.Matrix4) {
  stand(base, h.x, h.y, 0, 1, 1, 1, h.turn, h.lean)
  const flip = !h.hip && h.roof % 2 === 1
  m.copy(base).multiply(tmp.makeTranslation(0, h.h, 0))
  if (flip) m.multiply(tmp.makeRotationY(Math.PI / 2))
  return m.multiply(tmp.makeScale(flip ? h.d : h.w, h.rh, flip ? h.w : h.d))
}

export function bodyMatrix(h: House, m: THREE.Matrix4) {
  return stand(m, h.x, h.y, 0, h.w, h.h, h.d, h.turn, h.lean)
}
