import * as THREE from 'three'
import { beam, CANVAS, type G, GOLD, HAZARD, INK, merged, MINT, part, PLANK, SACK, TEAL, TIMBER, WHITE } from './kit'

export function stack() {
  const p: G[] = [
    part(new THREE.BoxGeometry(2.6, 1.6, 2.2), PLANK, [-0.6, 3.2, 0]),
    part(new THREE.BoxGeometry(2.0, 1.3, 1.8), '#e85d8a', [-0.4, 4.65, 0.1], [0, 0.3, 0]),
    part(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 10), SACK, [-0.7, 6.0, 0]),
    part(new THREE.BoxGeometry(1.5, 0.18, 1.4), TIMBER, [-0.6, 6.8, 0], [0, 0, 0.1]),
  ]
  for (const [x, z] of [[-1.2, -0.5], [-0.1, -0.5], [-1.2, 0.5], [-0.1, 0.5]]) p.push(beam([x, 6.8, z], [x, 7.6, z], 0.07, TIMBER, 4))
  p.push(part(new THREE.BoxGeometry(1.4, 1.2, 0.14), TIMBER, [-0.6, 8.2, -0.55]))
  p.push(part(new THREE.SphereGeometry(0.75, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MINT, [-0.6, 8.0, 0.2]))
  p.push(part(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 10), TEAL, [-0.6, 8.0, 0.2]))
  p.push(part(new THREE.SphereGeometry(0.7, 10, 8), INK, [-0.6, 9.3, 0.15], [0, 0, 0], [1.1, 0.85, 1]))
  for (const sx of [-1, 1]) {
    p.push(part(new THREE.ConeGeometry(0.22, 0.5, 4), INK, [-0.6 + sx * 0.38, 9.95, 0.15]))
    p.push(part(new THREE.SphereGeometry(0.16, 6, 4), MINT, [-0.6 + sx * 0.25, 9.4, 0.75]))
  }
  p.push(beam([-1.25, 9.1, -0.2], [-1.9, 9.9, -0.4], 0.08, INK, 4))
  p.push(part(new THREE.SphereGeometry(0.42, 8, 6), CANVAS, [0.6, 5.6, 0.6]))
  return merged(p)
}

export function wheel() {
  const g = new THREE.CylinderGeometry(1, 1, 0.7, 14, 1, false, 0.4, Math.PI * 2 - 0.8)
  return merged([
    part(g, GOLD, [0, 0, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.CylinderGeometry(0.98, 0.98, 0.04, 14), '#ffd36b', [0, 0, 0.36], [Math.PI / 2, 0, 0]),
    part(new THREE.SphereGeometry(0.16, 5, 4), '#e09a00', [-0.4, 0.3, 0.38]),
    part(new THREE.SphereGeometry(0.12, 5, 4), '#e09a00', [0.1, -0.45, 0.38]),
    part(new THREE.SphereGeometry(0.1, 5, 4), '#e09a00', [-0.5, -0.3, 0.38]),
  ])
}

export function lookout() {
  const p: G[] = [
    part(new THREE.SphereGeometry(1, 12, 9), '#4b37a6', [0, 1, 0], [0, 0, 0], [1, 0.92, 1]),
    part(new THREE.SphereGeometry(0.85, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, [0, 1.6, 0], [-0.2, 0, 0]),
    part(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 4), INK, [0, 2.45, -0.1]),
    part(new THREE.SphereGeometry(0.14, 6, 4), HAZARD, [0, 2.8, -0.1]),
    part(new THREE.SphereGeometry(0.34, 10, 8), WHITE, [-0.34, 1.3, 0.74]),
    part(new THREE.SphereGeometry(0.17, 8, 6), INK, [-0.34, 1.25, 1.03]),
    part(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 10), PLANK, [0.34, 1.35, 1.45], [Math.PI / 2 - 0.25, 0, 0]),
    part(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 10), GOLD, [0.34, 1.57, 2.3], [Math.PI / 2 - 0.25, 0, 0]),
    part(new THREE.SphereGeometry(0.2, 8, 6), '#dff9ff', [0.34, 1.59, 2.4]),
  ]
  for (const sx of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.28, 6, 4), INK, [sx * 0.45, 0.14, 0.2], [0, 0, 0], [1, 0.6, 1.3]))
  return merged(p)
}

export function arm() {
  const p: G[] = []
  for (let k = 0; k < 8; k++) p.push(part(new THREE.BoxGeometry(0.16, 0.16, 0.45), k % 2 ? WHITE : HAZARD, [0, 0, 0.225 + k * 0.45]))
  p.push(part(new THREE.SphereGeometry(0.2, 8, 6), '#ff3b5c', [0, 0, 3.65]))
  p.push(part(new THREE.BoxGeometry(0.22, 0.22, 0.6), INK, [0, 0, -0.3]))
  return merged(p)
}

export function pennant() {
  const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1, -0.18), new THREE.Vector2(0.86, -0.27), new THREE.Vector2(1, -0.36), new THREE.Vector2(0, -0.5)])
  return new THREE.ShapeGeometry(s)
}

export function chute() {
  return merged([
    part(new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2.4), WHITE, [0, 2.2, 0], [0, 0, 0], [1, 0.6, 1]),
    beam([-0.9, 2.2, 0], [0, 0, 0], 0.03, INK, 3),
    beam([0.9, 2.2, 0], [0, 0, 0], 0.03, INK, 3),
    beam([0, 2.2, 0.9], [0, 0, 0], 0.03, INK, 3),
  ])
}
