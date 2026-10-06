import * as THREE from 'three'
import { stand } from './kit'
import { CLOD, DERRICK, LIFT, QUARRY, STEPS, TOWERS } from './layout'

export type Job = 'cut' | 'boss' | 'lunch' | 'stack' | 'pull' | 'carry' | 'load' | 'push' | 'wait' | 'bribe' | 'crank' | 'basket' | 'ride'

export type Folk = { job: Job; base: THREE.Matrix4; x: number; y: number; z: number; face: number; seed: number; rate: number }

const ground = (dx: number, dy: number) => stand(dx, dy, 1, 0, LIFT)

export function crew() {
  const list: Folk[] = []
  let n = 0
  const add = (job: Job, base: THREE.Matrix4, x: number, y: number, z: number, face = 0) =>
    list.push({ job, base, x, y, z, face, seed: n++ * 1.37, rate: 0.55 + ((n * 0.618) % 1) * 0.6 })
  for (let i = 1; i < 4; i++) {
    const s = STEPS[i]
    const low = STEPS[i - 1].h
    for (const side of [-1, 1]) add('cut', QUARRY, s.c + side * s.w * (0.4 + i * 0.06), low + 60, s.front + 34, side * 0.35)
  }
  STEPS.forEach((s, i) => {
    const z0 = i < 3 ? STEPS[i + 1].front : -330
    const z = (z0 + s.front) / 2
    add('cut', QUARRY, s.c + (i % 2 ? -1 : 1) * s.w * 0.28, s.h, z, (i % 2 ? 1 : -1) * 0.3)
    if (i === 0) add('cut', QUARRY, s.c - s.w * 0.62, s.h, z, 0.2)
  })
  add('boss', QUARRY, 0, STEPS[3].h, -270)
  add('lunch', QUARRY, STEPS[2].c + 150, STEPS[2].h - 16, STEPS[2].front + 8)
  add('stack', QUARRY, 300, 8, 380, 1.2)
  for (const [x, z] of [[-10, 300], [60, 380], [-60, 410]]) add('pull', QUARRY, x, 8, z, Math.PI / 2 + 0.2)
  add('stack', QUARRY, 590, 0, 360, -1.1)
  for (let i = 0; i < 5; i++) add('carry', ground(0, 0), 0, 0, 0)
  add('load', TOWERS[0].m, -20, 30, 72)
  add('load', TOWERS[3].m, -40, 30, 82, -0.6)
  add('load', TOWERS[3].m, 50, 30, 70, -1.2)
  add('push', ground(CLOD.x + 160, CLOD.y + 175), 0, 0, 0, -2.2)
  add('push', ground(CLOD.x + 215, CLOD.y + 140), 0, 0, 0, -2.3)
  add('wait', ground(CLOD.x - 140, CLOD.y + 285), 0, 0, 0, 0.3)
  add('bribe', ground(CLOD.x - 50, CLOD.y + 240), 0, 0, 0, 0.7)
  add('crank', DERRICK, 50, 16, -70, Math.PI)
  add('basket', ground(0, 0), 0, 0, 0)
  add('ride', ground(0, 0), 0, 0, 0)
  return list
}
