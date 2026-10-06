import * as THREE from 'three'
import { PITCH } from '../../stand'

type V3 = [number, number, number]

const PQ = new THREE.Quaternion().setFromEuler(PITCH)
const UP = new THREE.Vector3(0, 1, 0).applyQuaternion(PQ)
const AY = new THREE.Vector3(0, 1, 0)
const AZ = new THREE.Vector3(0, 0, 1)
const ONE = new THREE.Quaternion()
const q = new THREE.Quaternion()
const qa = new THREE.Quaternion()
const at = new THREE.Vector3()
const dir = new THREE.Vector3()
const sc = new THREE.Vector3()
const rot = new THREE.Euler()
const local = new THREE.Matrix4()

export function stand(out: THREE.Matrix4, x: number, y: number, z: number, turn: number, size: number, hop = 0, lean = 0) {
  q.copy(PQ).multiply(qa.setFromAxisAngle(AY, turn)).multiply(qa.setFromAxisAngle(AZ, lean))
  at.set(x, -y, z).addScaledVector(UP, hop)
  return out.compose(at, q, sc.setScalar(size))
}

export function held(out: THREE.Matrix4, body: THREE.Matrix4, hand: V3, ax: number, az = 0) {
  local.makeRotationFromEuler(rot.set(ax, 0, az)).setPosition(hand[0], hand[1], hand[2])
  return out.multiplyMatrices(body, local)
}

export function blob(out: THREE.Matrix4, x: number, y: number, z: number, s: number) {
  return out.compose(at.set(x, -y, z), ONE, sc.setScalar(s))
}

export function point(out: THREE.Matrix4, p: THREE.Vector3, s: number) {
  return out.compose(p, ONE, sc.setScalar(s))
}

export function stream(out: THREE.Matrix4, a: THREE.Vector3, b: THREE.Vector3, w: number) {
  dir.subVectors(b, a)
  const len = dir.length()
  q.setFromUnitVectors(AY, dir.multiplyScalar(1 / Math.max(len, 1e-3)))
  at.addVectors(a, b).multiplyScalar(0.5)
  return out.compose(at, q, sc.set(w, len / 2, w))
}

export function flier(out: THREE.Matrix4, x: number, y: number, z: number, yaw: number, s: number, squash = 1) {
  q.setFromAxisAngle(AZ, yaw)
  return out.compose(at.set(x, -y, z), q, sc.set(s, s * squash, s))
}

export function along(out: THREE.Matrix4, p: THREE.Vector3, tangent: THREE.Vector3, s: number) {
  q.setFromUnitVectors(AZ, tangent)
  return out.compose(p, q, sc.setScalar(s))
}

export function model(out: THREE.Matrix4, at2: [number, number], size: number) {
  return out.compose(at.set(at2[0], -at2[1], 0), PQ, sc.setScalar(size))
}
