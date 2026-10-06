import * as THREE from 'three'
import { type Agent, agent, angle, PADDLE } from './agents'
import { QUEEN_MOUTH } from './kit'
import type { P } from './layout'
import { flier, model } from './pose'

export type QueenRig = { queen: THREE.Object3D; body: THREE.Object3D; asleep: THREE.Object3D; awake: THREE.Object3D; zz: THREE.InstancedMesh }

export const QUEEN = 150
const ZS = 3
const m = new THREE.Matrix4()
const mouth = new THREE.Vector3()

export class Queen {
  fans: Agent[]

  constructor(folk: Agent[]) {
    this.fans = [agent(-300, 90, PADDLE), agent(300, 90, PADDLE)]
    for (const a of this.fans) a.grip = 2.2
    folk.push(...this.fans)
  }

  step(t: number, centre: P, open: boolean, alarm: number, rig: QueenRig) {
    const [cx, cy] = centre
    const awake = open
    rig.queen.position.set(cx, -cy, 0)
    const breath = awake ? 0.02 * Math.sin(t * 7) : 0.04 * Math.sin(t * 1.25)
    rig.body.scale.set(QUEEN * (1 - breath * 0.5), QUEEN * (1 + breath), QUEEN)
    rig.asleep.visible = !awake
    rig.awake.visible = awake
    const pace = alarm > 0.5 ? 16 : awake ? 9 : 5
    this.fans.forEach((a, k) => {
      const s = k ? 1 : -1
      a.x = cx + s * 300
      a.y = cy + 90
      a.turn = angle(a.turn, Math.atan2(cx - a.x, cy - a.y) - s * 0.5, 0.1)
      a.ax = 1.1
      a.az = s * (0.5 + Math.sin(t * pace + k * Math.PI) * 0.6)
      a.hop = awake ? Math.abs(Math.sin(t * 6 + k)) * 14 : 0
      a.lean = Math.sin(t * pace * 0.5) * 0.06
    })
    mouth.set(...QUEEN_MOUTH).applyMatrix4(model(m, centre, QUEEN))
    for (let k = 0; k < ZS; k++) {
      const age = (t / 3.2 + k / ZS) % 1
      const s = awake ? 0 : (16 + age * 30) * Math.min(1, age * 6) * (1 - age ** 5)
      rig.zz.setMatrixAt(k, flier(m, mouth.x + 30 + age * 110 + Math.sin(age * 9) * 18, -mouth.y - 40 - age * 230, mouth.z + 60 + age * 100, Math.sin(age * 5 + k) * 0.35, s))
    }
    rig.zz.instanceMatrix.needsUpdate = true
  }
}
