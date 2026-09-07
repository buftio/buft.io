'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { Group, MathUtils, Vector3 } from 'three'
import { Shopper, shopperParts } from './models/people'
import { FloorCushion, TeaTray } from './models/party-props'
import { Rug } from './rug'
import { colorsFor, type Carpet } from './design'
import { ARRIVAL_END, type Run, type WorkshopClock } from './workshop-state'
import { type PartyPlace } from './party-layout'

export function PartyGuest({
  carpet,
  index,
  place,
  run,
  clock,
  origin,
  originScale,
  originTilt,
  partyTop,
  marker,
  focused,
  paused,
  controls,
  onFly,
}: {
  carpet: Carpet
  index: number
  place: PartyPlace
  run?: Run
  clock: RefObject<WorkshopClock>
  origin: Vector3
  originScale: number
  originTilt: number
  partyTop: number
  marker: RefObject<HTMLSpanElement | null>
  focused: boolean
  paused: boolean
  controls: RefObject<Map<string, HTMLButtonElement>>
  onFly: (id: string) => void
}) {
  const { camera, size, gl } = useThree()
  const root = useRef<Group>(null)
  const person = useRef<Group>(null)
  const shadow = useRef<Group>(null)
  const time = useRef(index * 1.7)
  const flying = carpet.flying ?? index % 3 === 2
  const lift = useRef(flying ? 1.8 : 0.045)
  const v = useMemo(() => new Vector3(), [])
  const target = useMemo(() => new Vector3(), [])
  const colors = colorsFor(carpet.design)
  const activity = index % 4
  const pose = run
    ? 'sit'
    : flying
      ? 'fly'
      : activity === 0
        ? 'sit'
        : activity === 1
          ? 'dance'
          : activity === 2
            ? 'recline'
            : 'wave'
  useFrame((_, delta) => {
    if (!root.current) return
    if (!paused) time.current += Math.min(delta, 0.05)
    const t = time.current
    const progress =
      clock.current.runs.find((r) => r.id === carpet.id)?.progress ??
      ARRIVAL_END
    const arriving = progress < ARRIVAL_END
    const flight = MathUtils.clamp((progress - 1) / (ARRIVAL_END - 1), 0, 1)
    const eased =
      paused && progress >= 1 ? 1 : MathUtils.smoothstep(flight, 0, 1)
    root.current.visible = progress >= 0.95
    if (shadow.current) shadow.current.visible = !arriving
    lift.current = paused
      ? flying
        ? 1.8
        : 0.045
      : MathUtils.damp(lift.current, flying ? 1.8 : 0.045, 4, delta)
    target.set(
      place.x + (flying && !paused ? Math.sin(t * 0.65) * 0.22 : 0),
      lift.current + (flying && !paused ? Math.sin(t * 1.5) * 0.14 : 0),
      place.z + (flying && !paused ? Math.cos(t * 0.6) * 0.16 : 0),
    )
    root.current.position.lerpVectors(origin, target, eased)
    root.current.position.y += Math.sin(eased * Math.PI) * 2.4
    root.current.position.x +=
      Math.sin(eased * Math.PI) * (place.x - origin.x > 0 ? 0.8 : -0.8)
    root.current.scale.setScalar(MathUtils.lerp(originScale, 1, eased))
    root.current.rotation.set(
      originTilt * (1 - eased) +
        (flying && !paused ? Math.sin(t * 1.3) * 0.035 * eased : 0),
      MathUtils.lerp(-0.3, place.angle, eased),
      Math.sin(eased * Math.PI) * 0.12 +
        (flying && !paused ? Math.sin(t) * 0.07 * eased : 0),
    )
    if (person.current) {
      person.current.position.y =
        0.025 +
        (!flying && activity === 1 && !paused
          ? Math.abs(Math.sin(t * 3)) * 0.1
          : 0)
      person.current.position.z = activity === 0 && !flying ? -0.43 * eased : 0
      const upper = person.current.getObjectByName(shopperParts.upper)
      if (upper)
        upper.rotation.z =
          !flying && activity === 1 && !paused ? Math.sin(t * 3) * 0.16 : 0
      const arm = person.current.getObjectByName(shopperParts.armR)
      if (arm && !flying && activity === 3)
        arm.rotation.z = 2.35 + (paused ? 0 : Math.sin(t * 5) * 0.3)
    }
    root.current.updateWorldMatrix(true, false)
    const control = controls.current.get(carpet.id)
    if (control) {
      v.set(0, 0.55, 0).applyMatrix4(root.current.matrixWorld).project(camera)
      control.style.transform = `translate(${((v.x + 1) * size.width) / 2 - 50}px, ${((1 - v.y) * size.height) / 2 - partyTop - 55}px)`
      control.style.zIndex = String(Math.round(100 - v.z * 50))
    }
    if (focused && marker.current && progress >= 0.95) {
      root.current.getWorldPosition(v).project(camera)
      marker.current.style.transform = `translate(${((v.x + 1) * size.width) / 2}px, ${((1 - v.y) * size.height) / 2}px)`
    }
  })
  return (
    <group>
      <group ref={shadow} visible={!run}>
        <mesh
          position={[place.x, -0.012, place.z]}
          rotation={[-Math.PI / 2, 0, place.angle]}
          scale={[0.7, 1, 1]}
        >
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            color="#617258"
            opacity={0.12}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
      <group
        ref={root}
        name={`party-guest-${carpet.id}`}
        visible={!run || run.progress >= 0.95}
        position={[place.x, flying ? 1.8 : 0.045, place.z]}
        rotation={[0, place.angle, 0]}
        onClick={(event) => {
          event.stopPropagation()
          if (run) return
          onFly(carpet.id)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          gl.domElement.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = ''
        }}
      >
        <Rug design={carpet.design} width={1.35} length={1.85} />
        <group
          ref={person}
          position={[0, 0.025, activity === 0 && !flying ? -0.43 : 0]}
          scale={0.8}
        >
          <Shopper pose={pose} color={colors[2]} variant={index} />
        </group>
        {!run && !flying && activity === 0 && (
          <>
            <group
              position={[0, 0.025, 0.55]}
              rotation={[0, Math.PI, 0]}
              scale={0.7}
            >
              <Shopper pose="sit" color={colors[1]} variant={index + 3} />
            </group>
            <group position={[0.16, 0.022, 0.07]} scale={0.55}>
              <TeaTray color={colors[1]} cups={2} />
            </group>
          </>
        )}
        {!run && !flying && activity === 2 && (
          <group position={[0, 0.025, -0.48]} scale={[0.75, 0.4, 0.75]}>
            <FloorCushion color={colors[1]} />
          </group>
        )}
      </group>
    </group>
  )
}
