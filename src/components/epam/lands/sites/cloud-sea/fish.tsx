'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { C, eye, fade, hash, heading, merged, paint, part, pose } from './kit'
import type { Drift } from './sky'

const SIZE = 30
const SCHOOLS = [
  { cloud: 6, n: 9, r: 330, speed: 0.33, h: 220 },
  { cloud: 1, n: 8, r: 300, speed: -0.28, h: 260 },
  { cloud: 5, n: 7, r: 280, speed: 0.3, h: 200 },
]
const CREAM = new THREE.Color(C.cream)
const ALL = SCHOOLS.reduce((a, s) => a + s.n, 0)

function minnow() {
  const p: THREE.BufferGeometry[] = []
  const body = new THREE.SphereGeometry(0.5, 10, 6).scale(1.15, 0.72, 0.5)
  p.push(paint(body, (x, y, _z, out) => {
    fade(C.gold, C.coral, (-x + 0.2) / 0.7, out)
    if (y < -0.12) out.lerp(CREAM, 0.6)
  }))
  const fin = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.45, 0.32), new THREE.Vector2(-0.36, 0), new THREE.Vector2(-0.45, -0.32)])
  p.push(part(new THREE.ShapeGeometry(fin), C.coral, -0.5, 0, 0))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.2, 0), new THREE.Vector2(0.15, 0), new THREE.Vector2(-0.25, 0.28)])), C.teal, 0, 0.3, 0))
  eye(p, 0.3, 0.08, 0.2, 0.13, 0.4, 5)
  eye(p, 0.3, 0.08, -0.2, 0.13, Math.PI - 0.4, 5)
  return merged(p)
}

export function Fish({ clock, alarm, drift }: { clock: RefObject<number>; alarm: RefObject<number>; drift: RefObject<Drift> }) {
  const shape = useMemo(() => minnow(), [])
  useEffect(() => () => shape.dispose(), [shape])
  const fish = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const mesh = fish.current
    if (!mesh) return
    const t = clock.current
    const d = drift.current
    const hide = 1 - alarm.current * 0.85
    let i = 0
    SCHOOLS.forEach((s, j) => {
      const cx = d.x[s.cloud]
      const cy = d.y[s.cloud]
      const ch = d.h[s.cloud]
      for (let k = 0; k < s.n; k++) {
        const w = hash(j * 31 + k)
        const late = k === s.n - 1 ? 0.5 + Math.sin(t * 0.7) * 0.25 : 0
        const a = t * s.speed - k * 0.17 - late
        const wob = Math.sin(t * 1.3 + w * 7) * 45
        const r = (s.r + wob + (w - 0.5) * 90) * hide
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r * 0.55
        const h = ch + s.h * hide + Math.sin(a * 2 + w * 5) * 70 + (w - 0.5) * 60
        const dir = Math.sign(s.speed)
        const turn = heading(-Math.sin(a) * dir, Math.cos(a) * 0.55 * dir)
        const wig = Math.sin(t * 9 + w * 20) * 0.25
        mesh.setMatrixAt(i++, pose(x, y, h, SIZE * (0.8 + w * 0.4), turn + wig, 0, Math.sin(a * 2 + w * 5) * 0.3))
      }
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={fish} args={[shape, undefined, ALL]} frustumCulled={false} renderOrder={47}>
      <meshStandardMaterial vertexColors roughness={0.5} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
