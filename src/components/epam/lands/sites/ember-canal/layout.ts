import * as THREE from 'three'
import { campGeometry, C, gateGeometry, merged, part, tollGeometry } from './geo'
import {
  along,
  BOLLARD,
  BOT_GATE,
  CAMP,
  fore,
  laneOf,
  PITCH,
  S_BOT,
  S_TOP,
  shown,
  slotOf,
  slotS,
  TOLL,
  TOP_GATE,
  UP,
  yawAhead,
  yawSide,
  type Spot,
} from './map'

export type Mood = { now: number; cyc: number; calm: number; threat: number; poll: number }

const spot: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
const yawQ = new THREE.Quaternion()
const q = new THREE.Quaternion()
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const lift = new THREE.Vector3()

export const standQ = (yaw: number, out: THREE.Quaternion) => out.copy(PITCH).multiply(yawQ.setFromAxisAngle(UP, yaw))

function gate(g: { at: [number, number]; half: number }, s: number) {
  along(s, spot)
  const px = spot.ty > 0 ? spot.ty : -spot.ty
  const py = spot.ty > 0 ? -spot.tx : spot.tx
  const yaw = yawSide(px, py)
  const w = (2 * g.half) / fore(yaw)
  const matrix = new THREE.Matrix4().compose(new THREE.Vector3(g.at[0], -g.at[1], 0), standQ(yaw, new THREE.Quaternion()), new THREE.Vector3(1, 1, 1))
  const inner = w / 2 - 42
  return { matrix, w, inner, leaf: inner / Math.cos(0.1) }
}

export const GATES = [gate(TOP_GATE, S_TOP), gate(BOT_GATE, S_BOT)]
export const TOLL_M = new THREE.Matrix4().compose(new THREE.Vector3(TOLL[0], -TOLL[1], 0), standQ(-0.22, new THREE.Quaternion()), new THREE.Vector3(1, 1, 1))
export const LAMPS: [number, number][] = [
  [672, 30],
  [560, 470],
  [40, 420],
  [620, -330],
]

const local = (m: THREE.Matrix4, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(m)

export const FIRES = [
  ...GATES.flatMap((g) => [-1, 1].map((s) => ({ p: local(g.matrix, (s * g.w) / 2, 244, 0), r: 17 }))),
  ...LAMPS.map(([x, y]) => ({ p: new THREE.Vector3(0, 78, 0).applyQuaternion(PITCH).add(new THREE.Vector3(x, -y, 0)), r: 6 })),
]
export const WINDOW = local(TOLL_M, 20, 40, 40)
export const CAMP_SIZE = 1.4
export const CAMP_FIRE = { p: new THREE.Vector3(0, 6 * CAMP_SIZE, 0).applyQuaternion(PITCH).add(new THREE.Vector3(CAMP[0], -CAMP[1], 0)), r: 11 * CAMP_SIZE }
FIRES.push(CAMP_FIRE)

function lamp([x, y]: [number, number]) {
  const g = merged([
    part(new THREE.CylinderGeometry(3, 4, 70, 6), C.char, 0, 35, 0),
    part(new THREE.CylinderGeometry(9, 7, 4, 6), C.char, 0, 70, 0),
    part(new THREE.CylinderGeometry(4, 9, 6, 6), C.brass, 0, 90, 0),
  ])
  return g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, -y, 0), PITCH, new THREE.Vector3(1, 1, 1)))
}

function bollard() {
  const g = merged([part(new THREE.CylinderGeometry(9, 11, 22, 8), C.char, 0, 11, 0), part(new THREE.CylinderGeometry(12, 12, 5, 8), C.brass, 0, 23, 0)])
  return g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(BOLLARD[0], -BOLLARD[1], 0), PITCH, new THREE.Vector3(1, 1, 1)))
}

export function staticGeometry() {
  return merged([
    gateGeometry(GATES[0].w, true).applyMatrix4(GATES[0].matrix),
    gateGeometry(GATES[1].w, false).applyMatrix4(GATES[1].matrix),
    tollGeometry().applyMatrix4(TOLL_M),
    bollard(),
    campGeometry().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(CAMP[0], -CAMP[1], 0), PITCH, new THREE.Vector3(CAMP_SIZE, CAMP_SIZE, CAMP_SIZE))),
    ...LAMPS.map(lamp),
  ])
}

export function bargeMatrix(i: number, c: number, p: number, mood: Mood, out: THREE.Matrix4) {
  const u = slotOf(i, c, p)
  const sl = slotS(u)
  along(sl, spot)
  const side = laneOf(i, sl)
  const argue = Math.abs(u) < 0.02 && p < 0.47 ? Math.abs(Math.sin(mood.now * 8)) * 7 * mood.calm : 0
  const bob = Math.sin(mood.now * 1.7 + i * 1.3) * 1.5 + argue
  standQ(yawAhead(spot.tx, spot.ty) + Math.PI + Math.sin(mood.now * 0.9 + i) * 0.09, q)
  lift.set(0, bob, 0).applyQuaternion(PITCH)
  const v = shown(u) * 1.25
  return out.compose(at.set(spot.x - spot.ty * side, spot.y + spot.tx * side, 0).add(lift), q, size.set(v, v, v))
}
