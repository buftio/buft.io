import * as THREE from 'three'
import { ease, sample, track, wrap } from './kit'
import { BODY, SEA, SLIDE, SWIM } from './map'

const body = track(BODY)
const swim = track(SWIM, false, 128)
const sea = track(SEA, true)
const a = new THREE.Vector3()
const b = new THREE.Vector3()

export const KIDS = 6
const SLIDE_T = 4.5
const JUMP_T = 0.7
const SWIM_T = 11
const CLIMB_T = 1.6
const LOOP = SLIDE_T + JUMP_T + SWIM_T + CLIMB_T

export function kid(time: number, i: number, out: THREE.Vector3, dir: THREE.Vector3) {
  const t = wrap((time + i * 3.3 + (i % 2) * 1.1) / LOOP) * LOOP
  if (t < SLIDE_T) {
    const u = SLIDE[0] + (SLIDE[1] - SLIDE[0]) * Math.pow(t / SLIDE_T, 1.7)
    sample(body, u, out, dir)
    out.x += dir.y * 20
    out.y -= dir.x * 20
    out.z = 34
    return 0
  }
  if (t < SLIDE_T + JUMP_T) {
    const k = (t - SLIDE_T) / JUMP_T
    sample(body, SLIDE[1], a)
    sample(swim, 0, b)
    out.lerpVectors(a, b, k)
    out.z = 34 + Math.sin(k * Math.PI) * 120
    dir.subVectors(b, a).setZ(0).normalize()
    return 1
  }
  if (t < SLIDE_T + JUMP_T + SWIM_T) {
    const k = (t - SLIDE_T - JUMP_T) / SWIM_T
    sample(swim, k, out, dir)
    out.x += Math.sin(time * 1.7 + i) * 12
    out.z = 4 + Math.sin(time * 6 + i) * 3
    return 2
  }
  const k = ease((t - SLIDE_T - JUMP_T - SWIM_T) / CLIMB_T)
  sample(swim, 1, a)
  sample(body, SLIDE[0], b)
  out.lerpVectors(a, b, k)
  out.z = 6 + k * 28
  dir.subVectors(b, a).setZ(0).normalize()
  return 3
}

export const HUMPS = 5
const GAP = 165
const SPEED = 70

export function pip(time: number, k: number, out: THREE.Vector3, dir: THREE.Vector3) {
  const u = wrap((time * SPEED - k * GAP) / sea.len)
  return sample(sea, u, out, dir)
}
