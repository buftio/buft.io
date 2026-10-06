'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { cliffGeometry, shadowGeometry, signGeometry, SIGNS } from './rose-cliffs/cliff'
import { Clod } from './rose-cliffs/clod'
import { TILT } from './rose-cliffs/kit'
import { BEACON, LANES } from './rose-cliffs/layout'
import { Life } from './rose-cliffs/life'

function signTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  if (g)
    SIGNS.forEach((text, i) => {
      const y = i * 32
      g.fillStyle = '#5a3418'
      g.fillRect(0, y, 256, 32)
      g.fillStyle = '#f6e3c4'
      g.fillRect(3, y + 3, 250, 26)
      g.fillStyle = '#2a1630'
      g.font = 'bold 21px ui-rounded, system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, 128, y + 17)
    })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function cableGeometry() {
  const pts: number[] = []
  for (const lane of LANES)
    for (let i = 1; i < lane.length; i++) pts.push(lane[i - 1].x, lane[i - 1].y, lane[i - 1].z, lane[i].x, lane[i].y, lane[i].z)
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
}

export default function Scene({ land, reduced }: SceneProps) {
  const res = useMemo(
    () => ({ cliff: cliffGeometry(), shadow: shadowGeometry(), signs: signGeometry(), cable: cableGeometry(), tex: signTexture() }),
    [],
  )
  useEffect(() => () => Object.values(res).forEach((r) => r.dispose()), [res])
  const alarm = useRef(0)
  const want = useRef({ v: 0, next: 0, t: 0, fire: 0 })
  const flame = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const w = want.current
    w.t += delta
    w.fire += delta * (reduced ? 0.1 : 1)
    if (w.t > w.next) {
      w.next = w.t + 1
      w.v = Math.min(1, threat(land.x, land.y, land.radius) * 6)
    }
    alarm.current += (w.v - alarm.current) * Math.min(1, delta * 0.7)
    const a = alarm.current
    if (!flame.current || !halo.current) return
    flame.current.visible = halo.current.visible = a > 0.02
    const f = a * (1 + Math.sin(w.fire * 13) * 0.12 + Math.sin(w.fire * 7.3) * 0.08)
    flame.current.scale.set(46 * a, 120 * f, 46 * a)
    halo.current.scale.setScalar(420 * f + 1e-3)
  })

  return (
    <group>
      <mesh geometry={res.shadow} renderOrder={44}>
        <meshBasicMaterial vertexColors transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh geometry={res.cliff} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} />
      </mesh>
      <mesh geometry={res.signs} renderOrder={47}>
        <meshBasicMaterial map={res.tex} toneMapped={false} />
      </mesh>
      <lineSegments geometry={res.cable} renderOrder={46}>
        <lineBasicMaterial color="#2a1630" />
      </lineSegments>
      <mesh ref={halo} position={[BEACON.x, BEACON.y, 4]} visible={false} renderOrder={44}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#ffa04d" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={flame} position={[BEACON.x, BEACON.y + 40, BEACON.z]} quaternion={TILT} visible={false} renderOrder={49}>
        <coneGeometry args={[1, 1, 7]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </mesh>
      <Life alarm={alarm} reduced={reduced} />
      <Clod alarm={alarm} reduced={reduced} />
    </group>
  )
}
