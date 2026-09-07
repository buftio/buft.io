'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { type Carpet } from './design'
import { partyLayout, type PartyLayout } from './party-layout'
import { PartyGuest } from './party-guest'
import { PartyDecor } from './party-decor'

function Party({
  carpets,
  wide,
  narrow,
  paused,
  controls,
  onFly,
}: {
  carpets: Carpet[]
  wide: PartyLayout
  narrow: PartyLayout
  paused: boolean
  controls: RefObject<Map<string, HTMLButtonElement>>
  onFly: (id: string) => void
}) {
  const { camera, size } = useThree()
  const layout = window.matchMedia('(max-width: 650px)').matches ? narrow : wide
  useEffect(() => {
    camera.position.set(0, 30, 38 + layout.focus)
    camera.lookAt(0, 0, layout.focus)
    camera.zoom = size.width / layout.width
    camera.updateProjectionMatrix()
  }, [camera, size.width, layout])
  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#fff1d5', '#829780', 1.3]} />
      <directionalLight
        position={[-8, 20, 12]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
        shadow-normalBias={0.025}
        shadow-bias={-0.0002}
        shadow-radius={4}
      />
      <PartyDecor layout={layout} />
      {carpets.map((carpet, index) => (
        <PartyGuest
          key={carpet.id}
          carpet={carpet}
          index={index}
          place={layout.places[index]}
          paused={paused}
          controls={controls}
          onFly={onFly}
        />
      ))}
    </>
  )
}

export default function Collection({
  carpets,
  paused,
  onFly,
}: {
  carpets: Carpet[]
  paused: boolean
  onFly: (id: string) => void
}) {
  const controls = useRef(new Map<string, HTMLButtonElement>())
  const wide = useMemo(() => partyLayout(carpets, false), [carpets])
  const narrow = useMemo(() => partyLayout(carpets, true), [carpets])
  return (
    <div
      className="carpet-party-world"
      style={
        {
          '--party-ratio': `${wide.width} / ${wide.height}`,
          '--party-mobile-ratio': `${narrow.width} / ${narrow.height}`,
        } as React.CSSProperties
      }
    >
      <Canvas
        shadows="soft"
        resize={{ offsetSize: true, debounce: 0 }}
        orthographic
        camera={{ position: [0, 30, 38], zoom: 70, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <Party
          carpets={carpets}
          wide={wide}
          narrow={narrow}
          paused={paused}
          controls={controls}
          onFly={onFly}
        />
      </Canvas>
      {carpets.map((carpet, i) => (
        <button
          key={carpet.id}
          className="party-hit"
          ref={(element) => {
            if (element) controls.current.set(carpet.id, element)
            else controls.current.delete(carpet.id)
          }}
          onClick={() => onFly(carpet.id)}
          aria-label={`Fly ${carpet.name}`}
          aria-pressed={carpet.flying ?? i % 3 === 2}
        />
      ))}
    </div>
  )
}
