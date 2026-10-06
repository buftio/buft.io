'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { ramAngle, type Life } from './clock'
import { lift, TILT } from './kit'
import { RELAY_AT, SPEED } from './fx'
import { GANTRY, LISTENER, MUFFS, RAM_PIVOT, RELAYS, TEAM } from './layout'
import { flag, greatBell, ram, relayBell } from './models'
import { listener, muffGuy } from './statics'

const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const d = new THREE.Vector3()
const MINT = new THREE.Color('#7dffe6')
const RED = new THREE.Color('#ff4a3a')
const SOURCE = lift(GANTRY, 0, 450, 0)
const HEARD =
  (Math.hypot(LISTENER[0] - SOURCE.x, -LISTENER[1] - SOURCE.y) - 110) / SPEED

function stretch(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) {
  mesh.position.addVectors(from, to).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(Y, d.subVectors(to, from).normalize())
  mesh.scale.set(1, from.distanceTo(to), 1)
}

export function Gantry({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(
    () => ({
      bell: greatBell(),
      ram: ram(),
      muff: muffGuy(),
      ear: listener(),
      flag: flag(),
    }),
    [],
  )
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const bell = useRef<THREE.Group>(null)
  const log = useRef<THREE.Group>(null)
  const rope = useRef<THREE.Mesh>(null)
  const tail = useRef<THREE.Mesh>(null)
  const muff = useRef<THREE.Group>(null)
  const ear = useRef<THREE.Group>(null)
  const pennant = useRef<THREE.Group>(null)
  const cloth = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const L = life.current
    if (
      !bell.current ||
      !log.current ||
      !rope.current ||
      !tail.current ||
      !muff.current ||
      !ear.current ||
      !pennant.current ||
      !cloth.current
    )
      return
    const since = L.t - L.hit
    bell.current.rotation.z =
      -(0.11 + 0.08 * L.alarm) * Math.exp(-since / 1.5) * Math.sin(since * 5.5)
    const ang = ramAngle(L.ram)
    log.current.rotation.z = ang
    const pull = Math.max(0, ang) / 0.5
    a.set(140, -200, 0)
      .applyAxisAngle(Z, ang)
      .add(b.set(RAM_PIVOT[0], RAM_PIVOT[1], 0))
    b.set(TEAM[0] + pull * 40, 14, 52)
    stretch(rope.current, a, b)
    a.set(TEAM[2] + pull * 56 + 18, 14, 88)
    stretch(tail.current, b, a)
    const squash =
      since < 0.6 ? Math.sin((since / 0.6) * Math.PI) * Math.exp(-since * 2) : 0
    muff.current.scale.set(1 + squash * 0.5, 1 - squash * 0.55, 1)
    muff.current.rotation.z = Math.sin(L.t * 3) * 0.05 + squash * 0.3
    const heard = L.t - L.hit - HEARD
    const up =
      heard > 0 && heard < 1.8
        ? Math.min(1, heard * 6) * Math.min(1, (1.8 - heard) * 3)
        : 0
    const jump =
      heard > 0 && heard < 0.45 ? Math.sin((heard / 0.45) * Math.PI) : 0
    ear.current.position.y = 0.2 + jump * 1.3
    ear.current.rotation.z = jump * 0.25
    pennant.current.scale.set(1, Math.max(0.001, up), 1)
    cloth.current.color.copy(MINT).lerp(RED, L.alarm)
  })

  return (
    <group>
      <Stand at={GANTRY.at} size={GANTRY.size}>
        <group ref={bell} position={[0, 640, 0]}>
          <mesh geometry={geos.bell}>
            <meshStandardMaterial
              vertexColors
              flatShading
              roughness={0.35}
              metalness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
        <group ref={log} position={[RAM_PIVOT[0], RAM_PIVOT[1], 0]}>
          <mesh geometry={geos.ram}>
            <meshStandardMaterial vertexColors flatShading roughness={0.8} />
          </mesh>
        </group>
        <mesh ref={rope}>
          <cylinderGeometry args={[3.5, 3.5, 1, 4]} />
          <meshStandardMaterial color="#e3cc9c" roughness={0.9} />
        </mesh>
        <mesh ref={tail}>
          <cylinderGeometry args={[3.5, 3.5, 1, 4]} />
          <meshStandardMaterial color="#e3cc9c" roughness={0.9} />
        </mesh>
      </Stand>
      <Stand at={MUFFS} size={22} turn={0.35}>
        <group ref={muff}>
          <mesh geometry={geos.muff}>
            <meshStandardMaterial vertexColors flatShading roughness={0.7} />
          </mesh>
        </group>
      </Stand>
      <Stand at={LISTENER} size={22} turn={0.3}>
        <group ref={ear}>
          <mesh geometry={geos.ear}>
            <meshStandardMaterial
              vertexColors
              flatShading
              roughness={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          <group ref={pennant} position={[1.1, 1.4, -0.2]}>
            <mesh geometry={geos.flag}>
              <meshStandardMaterial
                ref={cloth}
                vertexColors
                flatShading
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      </Stand>
    </group>
  )
}

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const r = new THREE.Quaternion()
const one = new THREE.Vector3(1, 1, 1)
const HANG = RELAYS.map((at) => lift({ at, size: 1 }, 0, 268, 0))

export function Relays({ life }: { life: RefObject<Life> }) {
  const geo = useMemo(() => relayBell(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)
  useFrame(() => {
    const L = life.current
    const mesh = ref.current
    if (!mesh) return
    RELAY_AT.forEach((delay, k) => {
      const age = L.t - L.hit - delay
      const swing =
        age > 0 && age < 3 ? 0.45 * Math.exp(-age * 1.6) * Math.sin(age * 9) : 0
      q.copy(TILT).multiply(r.setFromAxisAngle(Z, swing))
      mesh.setMatrixAt(k, m.compose(HANG[k], q, one))
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={ref}
      args={[geo, undefined, RELAYS.length]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.4}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}
