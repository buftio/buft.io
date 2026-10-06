'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { at, merge, paint, TILT, UP, wrap } from './kit'
import { EGGS, LAGOON } from './map'
import { head, hatchling, hump, INK, SAFFRON, star } from './models'
import { HUMPS, KIDS, kid, pip } from './motion'
import { flames, scenery } from './scenery'

type Live = { alarm: RefObject<number>; reduced: boolean }

const p = new THREE.Vector3()
const d = new THREE.Vector3()
const q = new THREE.Quaternion()
const tq = new THREE.Quaternion()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()
const col = new THREE.Color()
const deep = new THREE.Color('#2aa7b8')
const glass = new THREE.Color('#e6e1ea')
const Z = new THREE.Vector3(0, 0, 1)

function pipHead() {
  const parts = [head(['#1769a8', '#5fd6e6'], SAFFRON)]
  for (const side of [-1, 1]) {
    parts.push(paint(new THREE.SphereGeometry(0.2, 12, 10), '#ffffff', at(side * 0.22, 0.78, 0.25)))
    parts.push(paint(new THREE.SphereGeometry(0.1, 8, 6), INK, at(side * 0.21, 0.76, 0.43)))
  }
  return merge(parts)
}

function inside(x: number, y: number) {
  let hit = false
  for (let i = 0, j = LAGOON.length - 1; i < LAGOON.length; j = i++) {
    const [xi, yi] = LAGOON[i]
    const [xj, yj] = LAGOON[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

function sparkles() {
  const out: (readonly [number, number, number])[] = []
  for (let k = 0; out.length < 16 && k < 400; k++) {
    const x = -50 + ((k * 197) % 1140)
    const y = -1750 + ((k * 331) % 1400)
    if (inside(x, y)) out.push([x, -y, (k * 0.61) % 1] as const)
  }
  return out
}

export function Shore({ alarm, reduced }: Live) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape(LAGOON.map(([x, y]) => new THREE.Vector2(x, -y)))
    return {
      land: scenery(),
      lagoon: new THREE.ShapeGeometry(shape, 8),
      star: star(),
      ring: new THREE.RingGeometry(0.82, 1, 32),
      hump: hump(),
      head: pipHead(),
      chick: hatchling(),
      flame: new THREE.SphereGeometry(1, 8, 6),
    }
  }, [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const lights = useMemo(() => flames(), [])
  const spark = useMemo(() => sparkles(), [])
  const sparks = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const humps = useRef<THREE.InstancedMesh>(null)
  const pipRef = useRef<THREE.Mesh>(null)
  const chick = useRef<THREE.Mesh>(null)
  const fire = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const [sp, rg, hu, hd, ch, fi] = [sparks.current, rings.current, humps.current, pipRef.current, chick.current, fire.current]
    if (!sp || !rg || !hu || !hd || !ch || !fi) return
    const time = reduced ? 4 : state.clock.elapsedTime
    const a = alarm.current
    spark.forEach(([x, y, o], k) => {
      const s = Math.max(0, Math.sin(time * 1.3 + o * 20)) * 22 + 0.001
      sp.setMatrixAt(k, m.compose(p.set(x, y, 6), q.setFromAxisAngle(Z, time * 0.5 + o), sc.set(s, s, 1)))
    })
    sp.instanceMatrix.needsUpdate = true
    let r = 0
    for (let k = 0; k < HUMPS; k++) {
      pip(time, k + 1, p, d)
      const wide = 0.45 + 0.55 * Math.abs(d.x)
      const tall = 0.85 + 0.2 * Math.sin(time * 2.2 - k)
      const size = k === HUMPS - 1 ? 64 : 100 - k * 6
      hu.setMatrixAt(k, m.compose(p.setZ(0), TILT, sc.set(size * wide, size * tall, size)))
      for (const side of [-1, 1]) {
        const g = wrap(time * 0.7 + k * 0.31 + side * 0.25)
        const s = size * (0.5 + g * 1.1)
        rg.setMatrixAt(r, m.compose(p.set(p.x + side * size * wide, p.y, 1), q.identity(), sc.set(s, s * 0.6, 1)))
        rg.setColorAt(r++, col.copy(deep).lerp(glass, g))
        pip(time, k + 1, p, d)
      }
    }
    for (let k = 0; k < KIDS; k++) {
      const mode = kid(time, k, p, d)
      const g = wrap(time * 0.9 + k * 0.4)
      const s = mode === 2 ? 30 + g * 30 : 0.001
      rg.setMatrixAt(r, m.compose(p.setZ(2), q.identity(), sc.set(s, s, 1)))
      rg.setColorAt(r++, col.copy(deep).lerp(glass, g))
    }
    rg.instanceMatrix.needsUpdate = true
    if (rg.instanceColor) rg.instanceColor.needsUpdate = true
    hu.instanceMatrix.needsUpdate = true
    pip(time, 0, p, d)
    hd.position.set(p.x, p.y, 10 + Math.sin(time * 2.2) * 8)
    hd.quaternion.copy(TILT).multiply(tq.setFromAxisAngle(UP, Math.atan2(d.x, -d.y)))
    const [ex, ey] = EGGS[3].at
    const k = wrap(time / 7)
    const pop = k < 0.5 ? Math.sin((k / 0.5) * Math.PI) : 0
    ch.position.set(ex - 10, -ey + 100 + pop * 40, 10)
    ch.scale.setScalar(60 * Math.min(1, pop * 2.5) + 0.001)
    ch.rotation.set((50 * Math.PI) / 180, Math.sin(time * 4) * 0.4 * pop, 0)
    lights.forEach(([x, y, z], k) => {
      const s = (k < 2 ? 9 : 8) * (1 + 0.25 * Math.sin(time * 9 + k * 1.7)) * (1 - a * (k > 2 ? 1 : 0)) + 0.001
      fi.setMatrixAt(k, m.compose(p.set(x, y, z + 6), q.identity(), sc.set(s, s * 1.4, s)))
    })
    fi.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={geo.land} renderOrder={45}>
        <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.lagoon} position={[0, 0, 2]} renderOrder={44}>
        <meshBasicMaterial color="#4fd1c5" opacity={0.3} transparent depthWrite={false} />
      </mesh>
      <instancedMesh ref={sparks} args={[geo.star, undefined, spark.length]} frustumCulled={false} renderOrder={45}>
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={rings} args={[geo.ring, undefined, HUMPS * 2 + KIDS]} frustumCulled={false} renderOrder={44}>
        <meshBasicMaterial color="#ffffff" opacity={0.85} transparent depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={humps} args={[geo.hump, undefined, HUMPS]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.45} />
      </instancedMesh>
      <mesh ref={pipRef} geometry={geo.head} scale={160} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.45} />
      </mesh>
      <mesh ref={chick} geometry={geo.chick} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </mesh>
      <instancedMesh ref={fire} args={[geo.flame, undefined, lights.length]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial color="#ffcf5a" />
      </instancedMesh>
    </group>
  )
}
