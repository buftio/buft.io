import * as THREE from 'three'
import { at, merge, paint } from './kit'

export const INK = '#2a1630'
export const JADE = '#0d8c7c'
export const SAFFRON = '#ffb43a'
export const CORAL = '#e8578f'
export const CREAM = '#fff1e0'

const PI = Math.PI

export function fin() {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0)
  s.quadraticCurveTo(-0.15, 0.55, 0.42, 1)
  s.quadraticCurveTo(0.3, 0.45, 0.5, 0)
  s.lineTo(-0.5, 0)
  return paint(new THREE.ShapeGeometry(s, 6), [JADE, SAFFRON])
}

export function eyeWhite() {
  return merge([
    paint(new THREE.SphereGeometry(1, 20, 14), '#ffffff'),
    paint(new THREE.TorusGeometry(0.98, 0.07, 6, 28), INK, at(0, 0, 0.12)),
  ])
}

export const pupil = () => paint(new THREE.SphereGeometry(0.46, 14, 10), INK, at(0, 0, 0, 0, 0, 0, 1, 1, 0.5))

export const lid = (skin: string) =>
  merge([
    paint(new THREE.SphereGeometry(1.07, 20, 10, 0, PI * 2, 0, PI / 2), [skin, '#f7a3c4']),
    paint(new THREE.TorusGeometry(1.07, 0.07, 5, 28), INK, at(0, 0, 0, PI / 2, 0, 0)),
  ])

export function folkBody() {
  return merge([
    paint(new THREE.SphereGeometry(0.5, 10, 7), '#ffffff', at(0, 0.46, 0, 0, 0, 0, 1, 0.92, 1)),
    paint(new THREE.SphereGeometry(0.15, 5, 3), '#d8d8e8', at(-0.2, 0.06, 0.12)),
    paint(new THREE.SphereGeometry(0.15, 5, 3), '#d8d8e8', at(0.2, 0.06, 0.12)),
  ])
}

export function folkEyes() {
  const parts: THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.SphereGeometry(0.18, 8, 6), '#ffffff', at(side * 0.17, 0.62, 0.34)))
    parts.push(paint(new THREE.SphereGeometry(0.085, 6, 4), INK, at(side * 0.16, 0.6, 0.5)))
  }
  return merge(parts)
}

export const hat = () =>
  merge([
    paint(new THREE.ConeGeometry(0.5, 0.28, 12), '#ffffff', at(0, 0.98, 0)),
    paint(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), '#ffffff', at(0, 1.14, 0)),
  ])

export function note() {
  return merge([
    paint(new THREE.CircleGeometry(0.32, 12), '#ffffff', at(0, 0, 0, 0, 0, 0.5, 1.2, 0.85, 1)),
    paint(new THREE.PlaneGeometry(0.08, 1), '#ffffff', at(0.32, 0.5, 0)),
    paint(new THREE.PlaneGeometry(0.4, 0.14), '#ffffff', at(0.48, 0.92, 0, 0, 0, -0.6)),
  ])
}

export const star = () => {
  const s = new THREE.Shape()
  for (let k = 0; k < 8; k++) {
    const r = k % 2 ? 0.22 : 1
    const a = (k / 8) * PI * 2
    if (k) s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.moveTo(r, 0)
  }
  return paint(new THREE.ShapeGeometry(s), '#ffffff')
}

export function head(body: [string, string], frill: string) {
  const parts = [
    paint(new THREE.SphereGeometry(0.5, 16, 12), body, at(0, 0.45, 0.05, 0, 0, 0, 1, 0.85, 1.25)),
    paint(new THREE.SphereGeometry(0.34, 14, 10), body, at(0, 0.35, 0.55, 0, 0, 0, 1, 0.7, 1)),
    paint(new THREE.SphereGeometry(0.06, 6, 5), INK, at(-0.12, 0.47, 0.83)),
    paint(new THREE.SphereGeometry(0.06, 6, 5), INK, at(0.12, 0.47, 0.83)),
    paint(new THREE.TorusGeometry(0.22, 0.03, 4, 14, PI), INK, at(0, 0.32, 0.8, PI, 0, 0)),
  ]
  for (let k = -2; k <= 2; k++)
    parts.push(paint(new THREE.ConeGeometry(0.1, 0.42 - Math.abs(k) * 0.07, 6), frill, at(k * 0.17, 0.8, -0.3 - Math.abs(k) * 0.05, -0.5, 0, -k * 0.35)))
  return merge(parts)
}

export function hump() {
  const parts = [paint(new THREE.TorusGeometry(1, 0.36, 10, 22, PI), ['#1769a8', '#5fd6e6'])]
  for (let k = 1; k < 6; k++) {
    const a = (k / 6) * PI
    parts.push(paint(new THREE.ConeGeometry(0.13, 0.42, 5), SAFFRON, at(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, 0, 0, a - PI / 2)))
  }
  return merge(parts)
}

export function charmer() {
  const parts = [
    paint(new THREE.SphereGeometry(0.5, 14, 10), ['#3b2a8f', '#5b3fb8'], at(0, 0.44, 0, 0, 0, 0, 1, 0.9, 1)),
    paint(new THREE.SphereGeometry(0.22, 8, 6), '#3b2a8f', at(-0.32, 0.1, 0.25, 0, 0, 0, 1.4, 0.6, 1)),
    paint(new THREE.SphereGeometry(0.22, 8, 6), '#3b2a8f', at(0.32, 0.1, 0.25, 0, 0, 0, 1.4, 0.6, 1)),
    paint(new THREE.TorusGeometry(0.34, 0.15, 8, 16), SAFFRON, at(0, 0.86, 0, PI / 2, 0, 0)),
    paint(new THREE.SphereGeometry(0.3, 12, 8), '#ffd36b', at(0, 1.02, 0)),
    paint(new THREE.SphereGeometry(0.08, 6, 5), '#e8335a', at(0, 0.98, 0.32)),
    paint(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 6), '#9a5a2a', at(0.05, 0.42, 0.6, 1.2, 0, 0)),
    paint(new THREE.SphereGeometry(0.14, 10, 8), '#ffb43a', at(0.05, 0.48, 0.36)),
    paint(new THREE.SphereGeometry(0.07, 6, 5), '#9a5a2a', at(0.05, 0.31, 0.88)),
  ]
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.SphereGeometry(0.17, 10, 8), '#ffffff', at(side * 0.17, 0.64, 0.33)))
    parts.push(paint(new THREE.SphereGeometry(0.08, 8, 6), INK, at(side * 0.16, 0.66, 0.48)))
  }
  return merge(parts)
}

export function hatchling() {
  const parts = [head(['#f07aa8', '#ffc2d6'], SAFFRON)]
  const shell = new THREE.SphereGeometry(0.62, 14, 8, 0, PI * 2, 0, PI * 0.42)
  parts.push(paint(shell, ['#fff6ea', CREAM], at(0, 0.62, 0, -0.3, 0, 0.2)))
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.SphereGeometry(0.17, 10, 8), '#ffffff', at(side * 0.2, 0.74, 0.42)))
    parts.push(paint(new THREE.SphereGeometry(0.08, 8, 6), INK, at(side * 0.19, 0.72, 0.57)))
  }
  return merge(parts)
}

export function tongue() {
  const s = new THREE.Shape()
  s.moveTo(-0.06, 0)
  s.lineTo(-0.06, 0.7)
  s.lineTo(-0.22, 1)
  s.lineTo(-0.1, 1)
  s.lineTo(0, 0.82)
  s.lineTo(0.1, 1)
  s.lineTo(0.22, 1)
  s.lineTo(0.06, 0.7)
  s.lineTo(0.06, 0)
  return paint(new THREE.ShapeGeometry(s), ['#c81e4a', '#ff4f7a'])
}

export function zed() {
  const pts = [[-0.5, 0.5], [0.5, 0.5], [0.5, 0.3], [-0.12, -0.3], [0.5, -0.3], [0.5, -0.5], [-0.5, -0.5], [-0.5, -0.3], [0.12, 0.3], [-0.5, 0.3]]
  return paint(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), '#ffffff')
}

export function kite() {
  const s = new THREE.Shape([new THREE.Vector2(0, 1), new THREE.Vector2(0.55, 0.15), new THREE.Vector2(0, -0.7), new THREE.Vector2(-0.55, 0.15)])
  const parts = [
    paint(new THREE.ShapeGeometry(s), [JADE, '#3cc7b0']),
    paint(new THREE.ShapeGeometry(s), [SAFFRON, '#ffe08a'], at(0, 0.12, 0.01, 0, 0, 0, 0.6, 0.6, 1)),
    paint(new THREE.PlaneGeometry(0.04, 1.6), '#6b4325', at(0, 0.15, 0.02)),
    paint(new THREE.PlaneGeometry(1.0, 0.04), '#6b4325', at(0, 0.15, 0.02)),
  ]
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.CircleGeometry(0.13, 12), '#ffffff', at(side * 0.16, 0.45, 0.03)))
    parts.push(paint(new THREE.CircleGeometry(0.065, 10), INK, at(side * 0.15, 0.42, 0.04)))
  }
  return merge(parts)
}

export const bow = () => paint(new THREE.CircleGeometry(0.5, 3), '#ffffff')
