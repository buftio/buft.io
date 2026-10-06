'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { ISLES, shore } from './isles'
import { C, LAMP, eyes, folk, hands, merged, part } from './kit'
import { FISHER, LIGHT, STOP, lift } from './plan'

const CALM = new THREE.Color('#fff2b8')
const ALARM = new THREE.Color('#ff3b30')
const tint = new THREE.Color()

function beamGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const L = 950
  const w = 0.13
  for (const s of [0, Math.PI]) {
    pos.push(0, 0, 0, Math.cos(s - w) * L, Math.sin(s - w) * L, 0, Math.cos(s + w) * L, Math.sin(s + w) * L, 0)
    col.push(1, 1, 1, 0.5, 1, 1, 1, 0, 1, 1, 1, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return g
}

function captain() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, 0, '', 18)
  p.push(part(new THREE.CylinderGeometry(13, 14, 9, 10), C.navy, 0, 38, 0))
  p.push(part(new THREE.CylinderGeometry(14.5, 14.5, 3, 10), C.white, 0, 43, 0))
  p.push(part(new THREE.BoxGeometry(18, 2, 8), C.ink, 0, 34, 12))
  p.push(part(new THREE.SphereGeometry(5, 6, 4), C.white, -5, 14, 15))
  p.push(part(new THREE.SphereGeometry(5, 6, 4), C.white, 5, 14, 15))
  return merged(p)
}

function watchArm() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.CylinderGeometry(3, 3, 18, 5), C.folk, 0, 9, 0))
  p.push(part(new THREE.CylinderGeometry(6, 6, 2.5, 10), C.gold, 0, 20, 3, 0, 0, Math.PI / 2))
  p.push(part(new THREE.CylinderGeometry(4.6, 4.6, 2.5, 10), C.white, 0, 20, 3.6, 0, 0, Math.PI / 2))
  return merged(p)
}

function angler() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, 0, C.gold, 14)
  p.push(part(new THREE.ConeGeometry(20, 6, 8), C.thatch, 0, 31, 0))
  eyes(p, 17, 12, 5, 4)
  return merged(p)
}

export function Keeper({ danger, reduced }: { danger: RefObject<number>; reduced: boolean }) {
  const shapes = useMemo(
    () => ({ beam: beamGeometry(), captain: captain(), arm: watchArm(), angler: angler(), grab: hands(false) }),
    [],
  )
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const beam = useRef<THREE.Mesh>(null)
  const lamp = useRef<THREE.Mesh>(null)
  const big = useRef<THREE.Mesh>(null)
  const small = useRef<THREE.Mesh>(null)
  const man = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Mesh>(null)
  const rod = useRef<THREE.Group>(null)
  const bob = useRef<THREE.Mesh>(null)
  const grab = useRef<THREE.Mesh>(null)
  const spin = useRef(0)

  const [lx, ly] = ISLES[LIGHT]
  const [up] = lift(LAMP)
  const [sx, sy] = ISLES[STOP]
  const [fx, fy] = shore(ISLES[FISHER], Math.PI * 0.55, -16)

  useFrame((state, dt) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    const d = danger.current ?? 0
    const alarm = d > 0.05 ? 1 : 0
    spin.current += reduced ? 0 : dt * (0.35 + alarm * 1.6)
    tint.copy(CALM).lerp(ALARM, alarm)
    if (beam.current) {
      beam.current.rotation.z = spin.current
      const m = beam.current.material as THREE.MeshBasicMaterial
      m.color.copy(tint)
      m.opacity = 0.14 + alarm * 0.5 + Math.sin(t * 9) * 0.12 * alarm
    }
    if (lamp.current) (lamp.current.material as THREE.MeshBasicMaterial).color.copy(tint)
    if (big.current) big.current.rotation.z = -t * 2.3
    if (small.current) small.current.rotation.z = -t * 0.41 + Math.sin(t * 3) * 0.6
    const cycle = (t + 1.3) % 7
    const look = THREE.MathUtils.smoothstep(cycle, 0.5, 1.2) * (1 - THREE.MathUtils.smoothstep(cycle, 3.4, 3.9))
    const shrug = cycle > 4 && cycle < 5.4 ? Math.sin(((cycle - 4) / 1.4) * Math.PI) : 0
    if (arm.current) arm.current.rotation.z = 0.6 + look * 1.9
    if (man.current) {
      man.current.position.y = shrug * 7 + Math.abs(Math.sin(t * 9)) * 2 * alarm
      man.current.rotation.z = Math.sin(t * 0.7) * 0.04 - look * 0.12
    }
    const fish = (t + 2) % 11
    const strike = fish > 8 ? Math.sin(((fish - 8) / 3) * Math.PI) : 0
    if (rod.current) rod.current.rotation.x = -0.25 - Math.sin(t * 1.3) * 0.05 - strike * 0.45
    if (bob.current) bob.current.position.y = 2 + Math.sin(t * 2.4) * 1.5 - strike * 4
    if (grab.current) grab.current.scale.setScalar(Math.max(0.001, strike * 1.15))
  })

  return (
    <group>
      <mesh ref={beam} geometry={shapes.beam} position={[lx, -(ly + 30) + up, 3]} renderOrder={47}>
        <meshBasicMaterial vertexColors transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Stand at={[lx, ly + 30]} size={1}>
        <mesh ref={lamp} position={[0, LAMP, 0]} renderOrder={48}>
          <cylinderGeometry args={[14, 14, 26, 10]} />
          <meshBasicMaterial color="#fff2b8" />
        </mesh>
      </Stand>
      <Stand at={[sx - 26, sy - 6]} size={1.5}>
        <group position={[0, 112, 0.6]}>
          <mesh ref={big} renderOrder={49}>
            <boxGeometry args={[2.2, 14, 1]} />
            <meshBasicMaterial color={C.ink} />
          </mesh>
          <mesh ref={small} renderOrder={49}>
            <boxGeometry args={[3, 9, 1]} />
            <meshBasicMaterial color={C.coral} />
          </mesh>
        </group>
      </Stand>
      <Stand at={[sx + 26, sy + 8]} size={1}>
        <group ref={man}>
          <mesh geometry={shapes.captain}>
            <meshStandardMaterial vertexColors flatShading roughness={0.7} />
          </mesh>
          <mesh ref={arm} geometry={shapes.arm} position={[-14, 16, 6]}>
            <meshStandardMaterial vertexColors flatShading roughness={0.5} />
          </mesh>
        </group>
      </Stand>
      <Stand at={[fx, fy]} size={1}>
        <mesh geometry={shapes.angler}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
        <group ref={rod} position={[10, 18, 10]}>
          <mesh position={[0, 0, 38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1, 1.8, 78, 4]} />
            <meshBasicMaterial color={C.trunk} />
          </mesh>
          <mesh position={[0, -14, 77]}>
            <boxGeometry args={[0.8, 30, 0.8]} />
            <meshBasicMaterial color={C.ink} />
          </mesh>
        </group>
        <mesh ref={bob} position={[10, 2, 92]}>
          <sphereGeometry args={[4, 6, 4]} />
          <meshBasicMaterial color={C.coral} />
        </mesh>
        <mesh ref={grab} geometry={shapes.grab} position={[10, 0, 98]} scale={0.001}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
      </Stand>
    </group>
  )
}
