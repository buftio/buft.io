'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { Life } from './clock'
import { air, C, Kit, netTexture, TILE } from './kit'
import { FENCE, type P } from './layout'

const LOW = 18
const HIGH = 250
const v = new THREE.Vector3()

function skirt(pts: P[], pos: number[], uv: number[]) {
  const out = 1.11
  let run = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay)
    const c = (x: number, y: number, s: number, far: boolean) => {
      const k = far ? out : 1
      pos.push(x * k, -y * k, 2)
      uv.push((run + s * l) / (TILE * 0.6), far ? 180 / (TILE * 0.6) : 0)
    }
    c(ax, ay, 0, false)
    c(bx, by, 1, false)
    c(ax, ay, 0, true)
    c(bx, by, 1, false)
    c(bx, by, 1, true)
    c(ax, ay, 0, true)
    run += l
  }
}

function panels(pts: P[]) {
  const pos: number[] = []
  const uv: number[] = []
  let run = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[i + 1]
    const l = Math.hypot(bx - ax, by - ay)
    const sag = 26
    const S = 6
    for (let j = 0; j < S; j++) {
      const s0 = j / S
      const s1 = (j + 1) / S
      const corner = (s: number, top: boolean) => {
        const h = top ? HIGH - sag * 4 * s * (1 - s) : LOW
        air(ax + (bx - ax) * s, ay + (by - ay) * s, h, v)
        pos.push(v.x, v.y, v.z)
        uv.push((run + s * l) / (TILE * 0.6), h / (TILE * 0.6))
      }
      corner(s0, false)
      corner(s1, false)
      corner(s0, true)
      corner(s1, false)
      corner(s1, true)
      corner(s0, true)
    }
    run += l
  }
  skirt(pts, pos, uv)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

function posts(pts: P[]) {
  const k = new Kit()
  const out: THREE.BufferGeometry[] = []
  pts.forEach((at, i) => {
    k.add(new THREE.CylinderGeometry(20, 26, HIGH + 30, 6), C.oak, 0, (HIGH + 30) / 2, 0)
    k.add(new THREE.SphereGeometry(32, 8, 6), i % 2 ? C.teal : C.magenta, 0, HIGH + 36, 0)
    if (i % 3 === 1) {
      k.add(new THREE.CylinderGeometry(2.5, 2.5, 90, 4), C.ink, 0, HIGH + 80, 0)
      k.add(new THREE.BoxGeometry(60, 34, 2), C.magenta, 30, HIGH + 108, 0)
    }
    out.push(k.stand(at, 1))
  })
  return out
}

export function Fence({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(() => {
    const k = new Kit()
    k.parts = posts(FENCE)
    return { net: panels(FENCE), posts: k.geo() }
  }, [])
  const tex = useMemo(() => netTexture(), [])
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      tex.dispose()
    },
    [geos, tex],
  )
  const net = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null)
  useFrame(() => {
    const n = net.current
    if (!n) return
    const L = life.current
    n.material.opacity = 0.85 + 0.15 * Math.sin(L.t * 3) * L.alarm
    n.material.color.setRGB(1, 1 - 0.3 * L.alarm, 1 - 0.2 * L.alarm)
  })
  return (
    <group>
      <mesh ref={net} geometry={geos.net} renderOrder={46}>
        <meshBasicMaterial map={tex} transparent side={2} depthWrite={false} />
      </mesh>
      <mesh geometry={geos.posts}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
    </group>
  )
}
