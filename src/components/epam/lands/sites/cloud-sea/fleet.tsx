'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { DOCK } from './harbour'
import { flatAt, heading, pose, UP_Y, UP_Z } from './kit'
import { LOOKOUT, loop, MAST, TRAWLER } from './map'
import { balloon, flame, fluff, lookout, propeller, trawler } from './models'
import { draw, push, trail, trailGeometry } from './trails'

const SHIP = 130
const SPY = 112
const BALLOON = 100
const BALE = 72
const BACK = -2.15
const PEACH = new THREE.Color('#ffb59a')
const BLUE = new THREE.Color('#9fd4ff')

const p3 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const ship = new THREE.Matrix4()
const local = new THREE.Matrix4()
const tip = new THREE.Vector3()
const end = new THREE.Vector3()

type Way = ReturnType<typeof loop>
type At = { x: number; y: number; a: number }
const now: At = { x: 0, y: 0, a: 0 }
const prev: At = { x: 0, y: 0, a: 0 }

function sail(way: Way, t: number, fear: number, out: At) {
  const u = ((((t * way.r.speed) / way.len + way.r.phase) % 1) + 1) % 1
  way.curve.getPointAt(u, p3)
  way.curve.getTangentAt(u, v3)
  const k = 1 - fear * 0.45
  out.x = MAST[0] + (p3.x - MAST[0]) * k
  out.y = MAST[1] + (p3.y - MAST[1]) * k
  out.a = heading(v3.x, v3.y)
  return out
}

function turnRate(a: number, b: number) {
  return Math.max(-0.4, Math.min(0.4, ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI))
}

export function Fleet({ clock, shade, alarm }: { clock: RefObject<number>; shade: THREE.Texture; alarm: RefObject<number> }) {
  const shapes = useMemo(() => ({ ship: trawler(), spy: lookout(), prop: propeller(), balloon: balloon(), flame: flame(), bale: fluff() }), [])
  const ways = useMemo(() => ({ trawl: loop(TRAWLER), spy: loop(LOOKOUT) }), [])
  const rope = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), [])
  const wake = useMemo(() => trailGeometry(), [])
  useEffect(() => () => [...Object.values(shapes), rope, wake].forEach((g) => g.dispose()), [shapes, rope, wake])
  const trails = useRef([trail(), trail()])
  const ships = useRef<THREE.InstancedMesh>(null)
  const spy = useRef<THREE.Mesh>(null)
  const props = useRef<THREE.InstancedMesh>(null)
  const ball = useRef<THREE.Mesh>(null)
  const fire = useRef<THREE.Mesh>(null)
  const bale = useRef<THREE.Mesh>(null)
  const shadows = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const t = clock.current
    const fear = alarm.current
    const sh = ships.current
    const pr = props.current
    const fl = shadows.current
    if (!sh || !pr || !fl) return
    const [tw, sw] = trails.current
    const tt = t * (1 + fear)
    sail(ways.trawl, tt - 0.8, fear, prev)
    sail(ways.trawl, tt, fear, now)
    const h = TRAWLER.h + Math.sin(t * 0.7) * 25
    ship.copy(pose(now.x, now.y, h, SHIP, now.a, turnRate(now.a, prev.a), Math.sin(t * 0.5) * 0.04))
    sh.setMatrixAt(0, ship)
    pr.setMatrixAt(0, local.makeRotationX(t * 14).setPosition(BACK, 0, 0).premultiply(ship))
    fl.setMatrixAt(0, flatAt(now.x, now.y, 3, SHIP * 4.2, SHIP * 1.5))
    tip.set(BACK, 0, 0).applyMatrix4(ship)
    push(tw, t, tip.x, tip.y, tip.z - 20)
    tip.set(-1.0, -0.95, 0).applyMatrix4(ship)
    sail(ways.trawl, tt - 2.8, fear, prev)
    const bm = pose(prev.x, prev.y, h - 240 + Math.sin(t * 1.3) * 15, BALE, t * 0.3, Math.sin(t) * 0.2)
    bale.current?.matrix.copy(bm)
    end.set(0, 0.55, 0).applyMatrix4(bm)
    const pos = rope.getAttribute('position') as THREE.BufferAttribute
    pos.setXYZ(0, tip.x, tip.y, tip.z)
    pos.setXYZ(1, end.x, end.y, end.z)
    pos.needsUpdate = true
    fl.setMatrixAt(4, flatAt(prev.x, prev.y, 3, BALE * 2, BALE * 1.4))

    const swing = Math.sin(t * 0.13) * 0.5 + Math.sin(t * 0.31) * 0.15
    ship.copy(pose(DOCK[0], DOCK[1], DOCK[2] + Math.sin(t * 0.4) * 6, SHIP * 0.95, Math.PI - 0.35 + swing, Math.sin(t * 0.6) * 0.05))
    ship.multiply(local.makeTranslation(-2.0, 0, 0))
    sh.setMatrixAt(1, ship)
    pr.setMatrixAt(1, local.makeRotationX(t * 0.8).setPosition(BACK, 0, 0).premultiply(ship))
    v3.set(0, 0, 0).applyMatrix4(ship)
    const hh = v3.z / UP_Z
    fl.setMatrixAt(1, flatAt(v3.x, hh * UP_Y - v3.y, 3, SHIP * 3.8, SHIP * 1.4))

    const st = t * (1 - fear * 0.3)
    sail(ways.spy, st - 0.8, fear, prev)
    sail(ways.spy, st, fear, now)
    ship.copy(pose(now.x, now.y, LOOKOUT.h + Math.sin(t * 0.9 + 2) * 30, SPY, now.a, turnRate(now.a, prev.a), Math.sin(t * 0.8) * 0.05))
    spy.current?.matrix.copy(ship)
    pr.setMatrixAt(2, local.makeRotationX(t * 18).setPosition(-1.82, 0, 0).premultiply(ship))
    fl.setMatrixAt(2, flatAt(now.x, now.y, 3, SPY * 3.4, SPY * 1.2))
    tip.set(-1.82, 0, 0).applyMatrix4(ship)
    push(sw, t, tip.x, tip.y, tip.z - 20)

    const burn = Math.max(0, Math.sin(t * 0.45)) ** 6
    const bx = -1350 + Math.sin(t * 0.05) * 380 * (1 - fear * 0.7) + fear * 250
    const by = -900 + Math.sin(t * 0.1) * 220 * (1 - fear * 0.7) + fear * 1350
    const bz = 380 + Math.sin(t * 0.45 - 1.4) * 110 - fear * 250
    ship.copy(pose(bx, by, bz, BALLOON, 0.3 + Math.sin(t * 0.2) * 0.3, Math.sin(t * 0.7) * 0.04))
    ball.current?.matrix.copy(ship)
    const f = 0.3 + burn * 1.6 + Math.sin(t * 23) * 0.08
    fire.current?.matrix.copy(local.makeScale(1, f, 1).setPosition(0, 1.02, 0).premultiply(ship))
    fl.setMatrixAt(3, flatAt(bx, by, 3, BALLOON * 2.6, BALLOON * 2))

    draw(wake, 0, tw, 24, 0.85, PEACH)
    draw(wake, 1, sw, 22, 0.85, BLUE)
    sh.instanceMatrix.needsUpdate = true
    pr.instanceMatrix.needsUpdate = true
    fl.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={shadows} args={[undefined, undefined, 5]} frustumCulled={false} renderOrder={41}>
        <planeGeometry />
        <meshBasicMaterial map={shade} transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
      <mesh geometry={wake} frustumCulled={false} renderOrder={46}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={ships} args={[shapes.ship, undefined, 2]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <mesh ref={spy} geometry={shapes.spy} matrixAutoUpdate={false} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </mesh>
      <instancedMesh ref={props} args={[shapes.prop, undefined, 3]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <mesh ref={ball} geometry={shapes.balloon} matrixAutoUpdate={false} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>
      <mesh ref={fire} geometry={shapes.flame} matrixAutoUpdate={false} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial vertexColors transparent opacity={0.9} />
      </mesh>
      <mesh ref={bale} geometry={shapes.bale} matrixAutoUpdate={false} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.95} emissive="#8c84b8" emissiveIntensity={0.35} />
      </mesh>
      <lineSegments geometry={rope} frustumCulled={false} renderOrder={47}>
        <lineBasicMaterial color="#2a1630" />
      </lineSegments>
    </group>
  )
}
