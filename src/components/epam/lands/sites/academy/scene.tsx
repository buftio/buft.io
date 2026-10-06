'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../../registry'
import { Stand } from '../../stand'
import { threat } from '../../threat'
import { BANNER_UV, BOARD_UV, drawSheet, sheetPlane, sheetTexture } from './board'
import { bubbleGeometry, cadetGeometry, costumeGeometry, deanGeometry, dummyGeometry, hatGeometry, professorGeometry, sergeantGeometry, targetGeometry, tasselGeometry } from './folk'
import { hallsGeometry } from './halls'
import { C, UPRIGHT } from './kit'
import { BOARD, DUMMIES, GRADS, HALL, STAGE, TARGETS, THROWERS } from './layout'
import { marksGeometry } from './marks'
import { CHASERS, commute, COMMUTERS, graduation, JOGGERS, joggers, lecture, range, romp, sergeant, sparring, STUDENTS, type Mood } from './motion'

const SPAR = JOGGERS
const STUD = SPAR + DUMMIES.length
const GRAD = STUD + STUDENTS
const THROW = GRAD + GRADS.length
const CHASE = THROW + THROWERS.length
const WALK = CHASE + CHASERS
const CADETS = WALK + COMMUTERS
const CHALK = DUMMIES.length + TARGETS.length
const ALARM = new THREE.Color(C.red)
const CALM = new THREE.Color(C.mint)

function Folk({ geo, count, refTo }: { geo: THREE.BufferGeometry; count: number; refTo: React.RefObject<THREE.InstancedMesh | null> }) {
  return (
    <instancedMesh ref={refTo} args={[geo, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial vertexColors flatShading roughness={0.75} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

export function Academy({ land, reduced }: SceneProps) {
  const geo = useMemo(
    () => ({
      halls: hallsGeometry(),
      marks: marksGeometry(),
      cadet: cadetGeometry(),
      prof: professorGeometry(),
      sarge: sergeantGeometry(),
      dean: deanGeometry(),
      dummy: dummyGeometry(),
      hat: hatGeometry(),
      target: targetGeometry(),
      tassel: tasselGeometry(),
      costume: costumeGeometry(),
      bubble: bubbleGeometry(),
      board: sheetPlane(2.9, 1.42, BOARD_UV),
      banner: sheetPlane(2.3, 0.44, BANNER_UV),
    }),
    [],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const cadets = useRef<THREE.InstancedMesh>(null)
  const prof = useRef<THREE.InstancedMesh>(null)
  const sarge = useRef<THREE.InstancedMesh>(null)
  const dean = useRef<THREE.InstancedMesh>(null)
  const dummies = useRef<THREE.InstancedMesh>(null)
  const hats = useRef<THREE.InstancedMesh>(null)
  const targets = useRef<THREE.InstancedMesh>(null)
  const chalk = useRef<THREE.InstancedMesh>(null)
  const costume = useRef<THREE.InstancedMesh>(null)
  const shout = useRef<THREE.InstancedMesh>(null)
  const tassel = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.MeshBasicMaterial>(null)
  const boardMat = useRef<THREE.MeshBasicMaterial>(null)
  const bannerMat = useRef<THREE.MeshBasicMaterial>(null)
  const sheet = useRef<THREE.CanvasTexture | null>(null)
  const clock = useRef({ t: 0, lap: 0, romp: 0, poll: -1, mood: { alarm: false, flee: 0 } as Mood })

  useEffect(() => {
    const tex = sheetTexture()
    sheet.current = tex
    for (const mat of [boardMat.current, bannerMat.current]) {
      if (!mat) continue
      mat.map = tex
      mat.needsUpdate = true
    }
    return () => {
      tex.dispose()
      sheet.current = null
    }
  }, [])

  useFrame((_, delta) => {
    const c = clock.current
    const dt = Math.min(delta, 0.1) * (reduced ? 0.08 : 1)
    c.t += dt
    const t = c.t
    if (t - c.poll > 1 || c.poll < 0) {
      c.poll = t
      const v = threat(land.x, land.y, land.radius)
      const alarm = v > 0.04
      if (alarm !== c.mood.alarm && sheet.current) {
        drawSheet(sheet.current.image as HTMLCanvasElement, alarm)
        sheet.current.needsUpdate = true
      }
      c.mood.alarm = alarm
      if (v > 0.3 && !c.mood.flee) c.mood.flee = t
      if (v < 0.15) c.mood.flee = 0
    }
    const pace = c.mood.alarm ? 1.6 : 1
    c.lap += dt * 0.4 * pace
    const scared = t % 15 > 11
    c.romp += dt * (scared ? -0.8 : 0.5)
    const all = [cadets, prof, sarge, dean, dummies, hats, targets, chalk, costume, shout].map((r) => r.current)
    const [cd, pr, sg, dn, dm, ht, tg, ch, cs, sh] = all
    if (!cd || !pr || !sg || !dn || !dm || !ht || !tg || !ch || !cs || !sh) return
    joggers(cd, t, c.mood, c.lap)
    sparring(cd, SPAR, dm, ch, t, pace)
    sergeant(sg, sh, t, pace)
    romp(cs, cd, CHASE, t, c.romp, scared)
    commute(cd, WALK, t)
    lecture(cd, STUD, pr, t)
    graduation(cd, GRAD, ht, dn, t)
    range(cd, THROW, tg, ch, t, pace)
    for (const mesh of all) if (mesh) mesh.instanceMatrix.needsUpdate = true
    const swing = tassel.current
    if (swing) {
      swing.rotation.z = Math.sin(t * 1.3 * pace) * 0.28 + Math.sin(t * 3.1) * 0.05
      swing.rotation.x = Math.sin(t * 0.9 + 1) * 0.12
    }
    if (lamp.current) {
      const on = c.mood.alarm ? (Math.sin(t * 9) > 0 ? 1 : 0.15) : 0.55 + Math.sin(t * 1.5) * 0.2
      lamp.current.color.copy(c.mood.alarm ? ALARM : CALM).multiplyScalar(on)
    }
  })

  return (
    <group>
      <mesh geometry={geo.marks} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent opacity={0.88} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.halls}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <Stand at={[BOARD.x, BOARD.y]} size={BOARD.s}>
        <mesh geometry={geo.board} position={[0, 1.12, -0.025]}>
          <meshBasicMaterial ref={boardMat} color="#ffffff" />
        </mesh>
      </Stand>
      <Stand at={[STAGE.x, STAGE.y]} size={STAGE.s}>
        <mesh geometry={geo.banner} position={[0, 1.42, -0.41]}>
          <meshBasicMaterial ref={bannerMat} color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </Stand>
      <group position={[HALL.x, -HALL.y, 0]} rotation={[UPRIGHT, 0, 0]} scale={HALL.s}>
        <group ref={tassel} position={[0, 1.5, 1.56]}>
          <mesh geometry={geo.tassel}>
            <meshStandardMaterial vertexColors flatShading roughness={0.6} />
          </mesh>
        </group>
        <mesh position={[1.3, 0.93, 0.15]}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshBasicMaterial ref={lamp} color={C.mint} />
        </mesh>
      </group>
      <Folk geo={geo.cadet} count={CADETS} refTo={cadets} />
      <Folk geo={geo.prof} count={1} refTo={prof} />
      <Folk geo={geo.sarge} count={1} refTo={sarge} />
      <Folk geo={geo.dean} count={1} refTo={dean} />
      <Folk geo={geo.dummy} count={DUMMIES.length} refTo={dummies} />
      <Folk geo={geo.hat} count={GRADS.length} refTo={hats} />
      <Folk geo={geo.target} count={TARGETS.length} refTo={targets} />
      <Folk geo={geo.costume} count={1} refTo={costume} />
      <instancedMesh ref={shout} args={[geo.bubble, undefined, 1]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={chalk} args={[undefined, undefined, CHALK]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={C.chalk} transparent opacity={0.75} />
      </instancedMesh>
    </group>
  )
}
