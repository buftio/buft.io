'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useState, type RefObject } from 'react'
import { Vector3 } from 'three'
import { type Carpet, type RugDesign } from './design'
import { type Run, type WorkshopClock } from './workshop-state'
import { journeyLayout, GROUND_SINE } from './journey-layout'
import { type PartyLayout } from './party-layout'
import Journey from './journey'
import { PartyDecor } from './party-decor'
import { PartyGuest } from './party-guest'

type Props = {
  design: RugDesign
  queue: Run[]
  guests: Carpet[]
  wide: PartyLayout
  narrow: PartyLayout
  clock: RefObject<WorkshopClock>
  marker: RefObject<HTMLSpanElement | null>
  route: RefObject<HTMLDivElement | null>
  party: RefObject<HTMLElement | null>
  controls: RefObject<Map<string, HTMLButtonElement>>
  reduced: boolean
  onFly: (id: string) => void
  onReady: () => void
}

const tilt = Math.atan2(30, 38) - Math.atan2(30, 44)

function Environment(props: Props) {
  const { camera, size, gl, setDpr } = useThree()
  const [regions, setRegions] = useState({ route: 0, party: 0 })
  const narrow = window.matchMedia('(max-width: 650px)').matches
  const width = narrow ? 6.7 : 11
  const unit = size.width / width
  const height = size.height / unit
  const party = narrow ? props.narrow : props.wide
  const partyScale = width / party.width
  const routeZ = (regions.route / 2 - size.height / 2) / unit / GROUND_SINE
  const partyZ =
    (regions.party +
      (party.height * size.width) / party.width / 2 -
      size.height / 2) /
    unit /
    GROUND_SINE
  const route = useMemo(
    () => journeyLayout(width, regions.route / unit, narrow),
    [width, regions.route, unit, narrow],
  )
  const origin = useMemo(
    () =>
      new Vector3(...route.owner)
        .add(new Vector3(0, 0.045, routeZ - partyZ))
        .applyAxisAngle(new Vector3(1, 0, 0), -tilt)
        .divideScalar(partyScale)
        .add(new Vector3(0, 0, party.focus)),
    [route, routeZ, partyZ, partyScale, party.focus],
  )
  useLayoutEffect(() => {
    const route = props.route.current
    const party = props.party.current
    if (!route || !party) return
    const observer = new ResizeObserver(() =>
      setRegions({ route: route.offsetHeight, party: party.offsetTop }),
    )
    observer.observe(route)
    observer.observe(party)
    return () => observer.disconnect()
  }, [props.route, props.party])
  useLayoutEffect(() => {
    const distance = Math.max(100, height * 2)
    camera.position.set(0, 30, 44).normalize().multiplyScalar(distance)
    camera.lookAt(0, 0, 0)
    camera.zoom = unit
    camera.updateProjectionMatrix()
    setDpr(
      Math.min(
        window.devicePixelRatio,
        1.5,
        gl.capabilities.maxTextureSize / size.height,
      ),
    )
  }, [camera, unit, height, gl, setDpr, size.height])
  if (!regions.route) return null
  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#fff4dc', '#7b9288', 1.2]} />
      <directionalLight
        position={[-10, 50 + height, 40 + height]}
        intensity={2.5}
        color="#fff1d7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-width * 2}
        shadow-camera-right={width * 2}
        shadow-camera-top={height}
        shadow-camera-bottom={-height}
        shadow-camera-far={300 + height * 4}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
      <group position={[0, 0, routeZ]}>
        <Journey
          design={props.design}
          queue={props.queue}
          guestIds={props.guests.map((rug) => rug.id)}
          layout={route}
          narrow={narrow}
          clock={props.clock}
          marker={props.marker}
          reduced={props.reduced}
          paused={props.reduced}
          onReady={props.onReady}
        />
      </group>
      <group
        position={[0, 0, partyZ]}
        rotation={[tilt, 0, 0]}
        scale={partyScale}
      >
        <group position={[0, 0, -party.focus]}>
          <PartyDecor layout={party} />
          {props.guests.map((carpet, index) => (
            <PartyGuest
              key={carpet.id}
              carpet={carpet}
              index={index}
              place={party.places[index]}
              run={props.queue.find((run) => run.id === carpet.id)}
              clock={props.clock}
              origin={origin}
              originScale={1 / partyScale}
              originTilt={-tilt}
              partyTop={regions.party}
              marker={props.marker}
              focused={props.queue[0]?.id === carpet.id}
              paused={props.reduced}
              controls={props.controls}
              onFly={props.onFly}
            />
          ))}
        </group>
      </group>
    </>
  )
}

export default function WorkshopScene(props: Props) {
  return (
    <Canvas
      shadows="soft"
      resize={{ offsetSize: true, debounce: 0 }}
      orthographic
      camera={{ position: [0, 100, 150], zoom: 70, near: 0.1, far: 2000 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Environment {...props} />
    </Canvas>
  )
}
