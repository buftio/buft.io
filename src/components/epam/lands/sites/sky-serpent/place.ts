import * as THREE from 'three'
import { smooth } from './kit'
import { sample, type Spine } from './spine'

export type Rig = {
  body: THREE.BufferGeometry
  shadow: THREE.BufferGeometry
  head: THREE.Group
  lids: THREE.InstancedMesh
  feather: THREE.Mesh
  tufts: THREE.InstancedMesh
  girths: THREE.InstancedMesh
  houses: THREE.InstancedMesh
  folk: THREE.InstancedMesh
  birds: THREE.InstancedMesh
  wings: THREE.InstancedMesh
  nests: THREE.InstancedMesh
  zeds: THREE.InstancedMesh
  puffs: THREE.InstancedMesh
  ropes: THREE.InstancedMesh
  beads: THREE.InstancedMesh
  pegs: THREE.InstancedMesh
  legs: THREE.InstancedMesh
  buckets: THREE.InstancedMesh
}

export type Mood = { time: number; breath: number; wake: number; zoom: number; pegs: [number, number][] }

export const FOLK = 34
const v = new THREE.Vector3()
export const P = { x: 0, y: 0, z: 0 }
export const top = (sp: Spine, t: number, up = 0.85) => {
  const a = sample(sp, t)
  P.x = a.x
  P.y = a.y
  P.z = a.z + a.r * up
  return P
}
export const inHead = (h: THREE.Group, x: number, y: number, z: number) => {
  v.set(x, y, z).applyMatrix4(h.matrix)
  P.x = v.x
  P.y = v.y
  P.z = v.z
  return P
}
export const heading = (sp: Spine, t: number) => {
  const a = sample(sp, t)
  return Math.atan2(a.ty, a.tx)
}
export const pong = (x: number) => {
  const f = x % 2
  return f < 1 ? f : 2 - f
}

const SNEEZE = 24

export type Beat = { pre: number; blast: number; age: number }

export function beat(time: number, wake: number): Beat {
  const s = (time + 8) % SNEEZE
  if (wake > 0.5) return { pre: 0, blast: 0, age: -1 }
  const go = SNEEZE - 7.5
  const pre = s < go ? smooth((s - go + 3.5) / 3.5) : 0
  const age = s - go
  return { pre, blast: age >= 0 ? Math.exp(-age * 2.2) : 0, age: age >= 0 ? age : -1 }
}

export function hop(b: Beat, k: number) {
  if (b.age < 0) return 0
  const u = (b.age - k * 0.05) / 0.7
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0
}

