'use client'

import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { MeshBasicMaterial, type Group, type Mesh } from 'three'
import { Clay, geo } from '../marketdata/models/clay'
import { Bake } from './bake'
import { gold } from './docking'
import { DROP_FALL, DROP_LIFE, type Drop, type Game } from './defense'
import { Flash } from './fx'

const HOVER = 1.1
const SKY = 8
const hit = new MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
})
const shade = new MeshBasicMaterial({
  color: '#1f2a3d',
  transparent: true,
  opacity: 0,
  depthWrite: false,
})

function Pill() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Clay
        shape="cylinder"
        color="#ffc94a"
        size={[0.3, 0.26, 0.3]}
        position={[0, 0.13, 0]}
      />
      <Clay
        shape="cylinder"
        color="#fbf6ec"
        size={[0.3, 0.26, 0.3]}
        position={[0, -0.13, 0]}
      />
      <Clay shape="sphere" color="#ffc94a" size={0.3} position={[0, 0.26, 0]} />
      <Clay
        shape="sphere"
        color="#fbf6ec"
        size={0.3}
        position={[0, -0.26, 0]}
      />
    </group>
  )
}

/** A golden capsule that drops from the sky and hovers until it is clicked or fades. Clicking it arms the shotgun. */
export function Capsule({
  drop,
  game,
  onCollect,
}: {
  drop: Drop
  game: RefObject<Game>
  onCollect: () => void
}) {
  const body = useRef<Group>(null)
  const halo = useRef<Mesh>(null)
  const shadow = useRef<Mesh>(null)
  useEffect(() => () => void (document.body.style.cursor = ''), [])
  useFrame(() => {
    const group = body.current
    if (!group) return
    const t = game.current.time - drop.at
    const fall = Math.min(1, t / DROP_FALL)
    const y = SKY + (HOVER - SKY) * fall * fall
    const landed = t > DROP_FALL
    const bob = landed ? Math.sin(t * 3) * 0.12 : 0
    group.position.set(drop.x, y + bob, drop.z)
    group.rotation.set(0, t * 2.5, landed ? Math.sin(t * 2) * 0.25 : t * 9)
    const left = DROP_FALL + DROP_LIFE - t
    group.visible = left > 1.6 || Math.sin(left * 22) > -0.3
    if (halo.current) {
      halo.current.rotation.set(Math.PI / 2 + Math.sin(t * 2) * 0.4, 0, -t * 4)
      halo.current.scale.setScalar(1.05 + Math.sin(t * 6) * 0.06)
    }
    if (shadow.current) {
      shadow.current.visible = group.visible
      shadow.current.scale.set(0.3 + fall * 0.5, 0.01, 0.3 + fall * 0.5)
      shade.opacity = 0.1 + fall * 0.15
    }
  })
  return (
    <>
      <group ref={body} position={[drop.x, SKY, drop.z]}>
        <group scale={1.5}>
          <Bake>
            <Pill />
          </Bake>
        </group>
        <mesh ref={halo} geometry={geo.torus} material={gold} castShadow />
        <mesh
          geometry={geo.sphere}
          material={hit}
          scale={1.5}
          onPointerDown={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation()
            onCollect()
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        />
      </group>
      <mesh
        ref={shadow}
        geometry={geo.sphere}
        material={shade}
        position={[drop.x, 0.03, drop.z]}
      />
      <Flash
        position={[drop.x, HOVER, drop.z]}
        size={1.1}
        life={0.5}
        at={DROP_FALL}
      />
    </>
  )
}
