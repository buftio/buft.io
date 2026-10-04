'use client'

import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { MeshBasicMaterial, type Group, type Mesh } from 'three'
import { geo } from '../marketdata/models/clay'
import { Bake } from './bake'
import { Boom } from './boom'
import {
  aimAt,
  fire,
  gait,
  RISE,
  settle,
  step,
  TOUGH,
  type Dart,
  type Game,
  type Virus as VirusState,
} from './defense'
import { ARENA, GUN, gunAt } from './layout'
import { Dart as Model, Syringe } from './syringe'
import { Virus } from './virus'

const hidden = new MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
})
const SIZE = 1.7
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const backOut = (p: number) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2

function Walker({ virus, game }: { virus: VirusState; game: RefObject<Game> }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const portal = useRef<Group>(null)
  const flash = useRef<Mesh>(null)
  useFrame(() => {
    const group = root.current
    const inner = body.current
    if (!group || !inner) return
    const now = game.current.time
    const t = now - virus.born
    const rise = clamp(t / RISE)
    const pace = (gait(virus, now) - 0.45) / 1.1
    const hop =
      Math.abs(Math.sin(t * 7 + virus.id)) * (0.06 + pace * 0.16) * rise
    group.position.set(virus.x, -0.5 + backOut(rise) * 1.05 + hop, virus.z)
    group.rotation.y =
      Math.atan2(-virus.x, -virus.z) + Math.sin(t * 3 + virus.seed * 9) * 0.25
    const h = now - virus.hit
    const knock = h < 0.45 ? Math.exp(-h * 9) * Math.cos(h * 30) : 0
    const size =
      (virus.kind === TOUGH ? (virus.hp > 1 ? 1.3 : 1.1) : 1) *
      Math.max(0.0001, backOut(rise))
    const squish = Math.sin(t * 14) * 0.05 * rise
    inner.scale.set(
      size * (1 + squish + knock * 0.3),
      size * (1 - squish - knock * 0.35),
      size * (1 + knock * 0.3),
    )
    inner.rotation.set(-knock * 0.6, 0, Math.sin(t * 5 + virus.id) * 0.18)
    if (flash.current) {
      flash.current.visible = h < 0.3
      ;(flash.current.material as MeshBasicMaterial).opacity =
        0.9 * (1 - h / 0.3)
    }
    if (portal.current) {
      const open = clamp(t * 5) * clamp((RISE + 0.35 - t) * 4)
      portal.current.visible = open > 0
      portal.current.position.set(virus.x, 0.02, virus.z)
      portal.current.scale.setScalar(Math.max(0.0001, open * 0.75))
      portal.current.rotation.y = t * 4
    }
  })
  return (
    <>
      <group ref={root} position={[virus.x, -1, virus.z]}>
        <group ref={body} scale={0.0001}>
          <Bake>
            <Virus kind={virus.kind} />
          </Bake>
          <mesh ref={flash} geometry={geo.sphere} scale={0.95} visible={false}>
            <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
          </mesh>
        </group>
      </group>
      <group ref={portal} visible={false}>
        <mesh
          geometry={geo.sphere}
          scale={[1, 0.01, 1]}
          material={portalMaterials.hole}
        />
        <mesh
          geometry={geo.torus}
          rotation={[-Math.PI / 2, 0, 0]}
          material={portalMaterials.rim}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            geometry={geo.sphere}
            material={portalMaterials.rim}
            position={[
              Math.cos(i * 1.26) * 0.62,
              0.03,
              Math.sin(i * 1.26) * 0.62,
            ]}
            scale={0.09}
          />
        ))}
      </group>
    </>
  )
}

const portalMaterials = {
  hole: new MeshBasicMaterial({ color: '#3b2357' }),
  rim: new MeshBasicMaterial({ color: '#b48ad8' }),
}

function Flying({ dart }: { dart: Dart }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const group = ref.current
    if (!group) return
    group.position.set(dart.x, dart.y, dart.z)
    group.rotation.set(0, Math.atan2(-dart.vz, dart.vx), 0)
  })
  return (
    <group ref={ref} scale={SIZE}>
      <Bake>
        <Model />
      </Bake>
    </group>
  )
}

const snapshot = (state: Game) => ({
  viruses: [...state.viruses],
  darts: [...state.darts],
  pops: [...state.pops],
})

/** Runs the virus game. `onChange` fires when anything the page shows has changed. */
export function Arena({
  game,
  playing,
  onChange,
}: {
  game: RefObject<Game>
  playing: boolean
  onChange: () => void
}) {
  const turret = useRef<Group>(null)
  const [shown, setShown] = useState(() => snapshot(game.current))
  const seen = useRef('')
  const trigger = useRef<{ x: number; z: number } | null>(null)
  useEffect(() => {
    const release = () => (trigger.current = null)
    window.addEventListener('pointerup', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('blur', release)
    }
  }, [])
  useFrame((_, dt) => {
    const state = game.current
    if (playing) step(state, Math.min(dt, 0.05))
    else settle(state, Math.min(dt, 0.05))
    if (playing && trigger.current) fire(state, trigger.current, gunAt)
    const signature = `${state.ids}:${state.viruses.length}:${state.darts.length}:${state.pops.length}:${state.lives}:${state.popped}:${Math.floor(state.time)}:${state.status}`
    if (signature !== seen.current) {
      seen.current = signature
      setShown(snapshot(state))
      onChange()
    }
    const gun = turret.current
    if (gun) {
      let delta = state.aim - gun.rotation.y
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      gun.rotation.y += delta * Math.min(1, dt * 18)
    }
  })
  const local = (event: ThreeEvent<PointerEvent>) => ({
    x: event.point.x - ARENA[0],
    z: event.point.z - ARENA[2],
  })
  return (
    <>
      <group ref={turret} position={GUN}>
        <Syringe />
      </group>
      {playing && (
        <mesh
          geometry={geo.slab}
          material={hidden}
          position={[0, 0.55, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[40, 40, 0.01]}
          onPointerDown={(event) => {
            trigger.current = local(event)
            fire(game.current, trigger.current, gunAt)
          }}
          onPointerMove={(event) => {
            const at = local(event)
            aimAt(game.current, at, gunAt)
            if (trigger.current) trigger.current = at
          }}
        />
      )}
      {shown.viruses.map((virus) => (
        <Walker key={virus.id} virus={virus} game={game} />
      ))}
      {shown.darts.map((dart) => (
        <Flying key={dart.id} dart={dart} />
      ))}
      {shown.pops.map((pop) => (
        <Boom key={pop.id} pop={pop} game={game} />
      ))}
    </>
  )
}
