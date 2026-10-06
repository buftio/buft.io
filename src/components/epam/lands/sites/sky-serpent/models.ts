import * as THREE from 'three'
import { blob, C, eyes, merged, part, rod } from './kit'

type G = THREE.BufferGeometry
export const EYE = { x: 74, y: 50, z: 34 }
export const NOSE = { x: 228, y: 17, z: 34 }
export const HAND = { x: 160, y: -16, z: 36 }

export function headGeometry() {
  const p: G[] = [
    blob(C.hide, 80, 86, 42, 40, 0, 4),
    blob(C.crown, 58, 54, 24, 30, 0, 24),
    blob(C.hide, 96, 50, 28, 150, 0, 4),
    blob(C.muzzle, 84, 32, 16, 156, 0, 18),
    blob(C.belly, 86, 46, 12, 156, 0, -16),
    blob(C.hide, 36, 48, 26, 222, 0, 8),
    blob(C.mane, 28, 40, 12, 222, 0, 24),
  ]
  for (const s of [-1, 1]) {
    p.push(blob(C.ink, 11, 9, 6, NOSE.x, s * NOSE.y, NOSE.z - 2))
    p.push(blob(C.flame, 30, 10, 6, EYE.x + 4, s * (EYE.y + 26), EYE.z + 2))
    p.push(blob(C.hide, 30, 28, 22, EYE.x, s * EYE.y, EYE.z - 10))
    p.push(rod(C.horn, [16, s * 40, 44], [-1, s * 0.5, 0.45], 180, 15, 2))
    p.push(rod(C.horn, [-40, s * 66, 70], [-0.3, s * 1, 0.5], 60, 7, 1))
    p.push(rod(C.flame, [56, s * 76, 6], [-0.5, s * 1, 0], 90, 20, 1, 5))
    p.push(rod(C.mane, [106, s * 52, 2], [-0.2, s * 1, 0], 54, 13, 1, 5))
    p.push(rod(C.horn, [206, s * 44, 0], [0.35, s * 0.9, -0.3], 36, 9, 0, 5))
    p.push(blob(C.belly, 84, 4, 4, 140, s * 50, -2, 6, 4))
  }
  for (let k = 0; k < 11; k++) {
    const a = ((k - 5) / 5) * 1.35
    const len = 140 - Math.abs(k - 5) * 9
    p.push(rod(k % 2 ? C.flame : C.mane, [0, Math.sin(a) * 56, 24 + Math.cos(a) * 14], [-1, Math.sin(a) * 1.2, 0.2], len, 26, 2, 6))
  }
  return merged(p)
}

export function eyeGeometry() {
  return merged([
    blob(C.cream, 24, 24, 18, 0, 0, 0),
    blob(C.flame, 15, 16, 5, 6, 0, 15),
    blob(C.ink, 5, 11, 3, 9, 0, 19, 8, 6),
  ])
}

export function lidGeometry() {
  const lash = new THREE.TorusGeometry(25, 5, 5, 12, Math.PI)
  const p: G[] = [blob(C.lid, 30, 30, 26, 0, 0, 2), part(lash, C.cream, 2, 0, 14, 0, 0, -Math.PI / 2)]
  for (const a of [-0.9, -0.3, 0.3, 0.9]) p.push(rod(C.cream, [2 + Math.cos(a) * 27, Math.sin(a) * 27, 14], [Math.cos(a), Math.sin(a), 0.3], 13, 3, 0.5, 4))
  return merged(p)
}

export function legGeometry() {
  const p: G[] = [
    blob(C.hide, 22, 18, 16, 0, 6, -4),
    rod(C.hide, [0, 10, -6], [-0.9, 0.55, -0.35], 40, 13, 11, 7),
    rod(C.flank, [-34, 32, -20], [-0.75, 0.15, -0.1], 30, 11, 9, 7),
    blob(C.belly, 13, 12, 8, -62, 36, -22),
  ]
  for (let k = -1; k <= 1; k++) p.push(rod(C.gold, [-68, 36 + k * 8, -22], [-1, k * 0.55, -0.15], 16, 4, 0, 5))
  return merged(p)
}

export function bucketGeometry() {
  return merged([
    part(new THREE.CylinderGeometry(0.5, 0.38, 0.6, 10), C.leather, 0, -0.3, 0),
    blob(C.gold, 0.46, 0.2, 0.46, 0, 0.02, 0, 10, 6),
    part(new THREE.TorusGeometry(0.42, 0.05, 4, 10, Math.PI), C.ink, 0, 0, 0),
  ])
}

export function tuftGeometry() {
  return merged([
    rod(C.mane, [0, 0, 0], [-0.75, 0, 0.66], 1, 0.38, 0.02, 6),
    rod(C.flame, [-0.38, 0, 0.36], [-0.8, 0, 0.6], 0.5, 0.16, 0.01, 5),
    rod(C.flame, [0, 0.1, 0], [-0.7, 0.55, 0.45], 0.62, 0.2, 0.01, 5),
    rod(C.flame, [0, -0.1, 0], [-0.7, -0.55, 0.45], 0.62, 0.2, 0.01, 5),
  ])
}

export function girthGeometry() {
  return part(new THREE.TorusGeometry(1, 0.09, 5, 18), C.leather, 0, 0, 0, 0, Math.PI / 2)
}

export function houseGeometry() {
  const p: G[] = [
    part(new THREE.CylinderGeometry(0.52, 0.6, 0.12, 14), C.mane, 0, 0.06, 0),
    part(new THREE.CylinderGeometry(0.44, 0.46, 0.48, 14), C.canvas, 0, 0.36, 0),
    part(new THREE.ConeGeometry(0.58, 0.5, 14), C.mane, 0, 0.85, 0),
    part(new THREE.CylinderGeometry(0.585, 0.585, 0.06, 14), C.gold, 0, 0.62, 0),
    part(new THREE.SphereGeometry(0.08, 8, 6), C.gold, 0, 1.13, 0),
    part(new THREE.BoxGeometry(0.2, 0.28, 0.04), C.ink, 0, 0.26, 0.45),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), C.ink, 0, 1.38, 0),
  ]
  const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.32, -0.08), new THREE.Vector2(0, -0.17)])
  p.push(part(new THREE.ShapeGeometry(flag), C.teal, 0.02, 1.62, 0))
  eyes(p, 0.47, 0.42, 0.13, 0.08)
  return merged(p)
}

export function folkGeometry() {
  const p: G[] = [
    part(new THREE.SphereGeometry(0.5, 14, 10), C.folk, 0, 0.55, 0),
    part(new THREE.SphereGeometry(0.13, 8, 6), C.ink, -0.2, 0.08, 0.1),
    part(new THREE.SphereGeometry(0.13, 8, 6), C.ink, 0.2, 0.08, 0.1),
    part(new THREE.TorusGeometry(0.36, 0.09, 5, 14), C.teal, 0, 0.36, 0, Math.PI / 2),
    part(new THREE.ConeGeometry(0.16, 0.4, 6), C.teal, 0.3, 0.3, -0.3, 0.6, 0, -0.9),
  ]
  eyes(p, 0.66, 0.4, 0.17, 0.15)
  return merged(p)
}

export function birdGeometry() {
  return merged([
    blob(C.white, 1, 0.42, 0.36),
    blob(C.white, 0.34, 0.3, 0.3, 0.86, 0, 0.12),
    rod(C.beak, [1.12, 0, 0.1], [1, 0, -0.1], 0.36, 0.1, 0, 5),
    blob(C.ink, 0.07, 0.07, 0.07, 1.0, 0.15, 0.26, 6, 4),
    blob(C.ink, 0.07, 0.07, 0.07, 1.0, -0.15, 0.26, 6, 4),
    rod(C.white, [-0.8, 0, 0], [-1, 0, 0.1], 0.6, 0.22, 0.05, 4),
  ])
}

export function wingGeometry() {
  const s = new THREE.Shape([
    new THREE.Vector2(-0.3, 0),
    new THREE.Vector2(0.4, 0),
    new THREE.Vector2(0.2, 0.9),
    new THREE.Vector2(-0.4, 1.7),
    new THREE.Vector2(-0.5, 0.8),
  ])
  return part(new THREE.ShapeGeometry(s), C.white)
}

export function nestGeometry() {
  return merged([
    part(new THREE.TorusGeometry(0.7, 0.3, 6, 14), C.twig),
    blob(C.twig, 0.6, 0.6, 0.15, 0, 0, -0.15),
    blob(C.egg, 0.24, 0.18, 0.18, -0.22, 0.12, 0.1, 8, 6),
    blob(C.egg, 0.24, 0.18, 0.18, 0.18, 0.18, 0.1, 8, 6),
    blob(C.egg, 0.24, 0.18, 0.18, 0, -0.22, 0.1, 8, 6),
  ])
}

export function zedGeometry() {
  const s = new THREE.Shape([
    new THREE.Vector2(-0.5, 0.5),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.5, 0.32),
    new THREE.Vector2(-0.18, -0.32),
    new THREE.Vector2(0.5, -0.32),
    new THREE.Vector2(0.5, -0.5),
    new THREE.Vector2(-0.5, -0.5),
    new THREE.Vector2(-0.5, -0.32),
    new THREE.Vector2(0.18, 0.32),
    new THREE.Vector2(-0.5, 0.32),
  ])
  return new THREE.ShapeGeometry(s)
}

export function puffGeometry() {
  return merged([
    blob(C.white, 0.6, 0.6, 0.4, 0, 0, 0, 10, 7),
    blob(C.white, 0.45, 0.45, 0.32, 0.5, 0.1, 0, 10, 7),
    blob(C.white, 0.45, 0.45, 0.32, -0.45, -0.1, 0, 10, 7),
    blob(C.white, 0.38, 0.38, 0.3, 0.1, 0.45, 0.05, 10, 7),
  ])
}

export function ropeGeometry() {
  const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 1, true)
  g.deleteAttribute('uv')
  return g
}

export function featherGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.quadraticCurveTo(0.35, 0.18, 1, 0.08)
  s.quadraticCurveTo(0.4, -0.16, 0, 0)
  return merged([part(new THREE.ShapeGeometry(s, 8), C.mint), rod(C.ink, [0, 0, 0.01], [1, 0, 0], 0.9, 0.012, 0.012, 4)])
}

export function pegGeometry() {
  const p: G[] = [
    part(new THREE.CylinderGeometry(0.08, 0.05, 1, 6), C.leather, 0, 0.5, 0),
    part(new THREE.TorusGeometry(0.2, 0.07, 5, 10), C.horn, 0, 0.1, 0, Math.PI / 2),
  ]
  const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.45, -0.1), new THREE.Vector2(0, -0.24)])
  p.push(part(new THREE.ShapeGeometry(flag), C.mane, 0.06, 0.98, 0))
  return merged(p)
}
