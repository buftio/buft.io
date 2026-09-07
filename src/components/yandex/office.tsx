'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Group, MathUtils } from 'three'
import { Clay } from '../marketdata/models/clay'
import { Shopper, shopperParts } from '../marketdata/models/people'

export type OfficeStage =
  | 'review'
  | 'interview'
  | 'security'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'closed'
type Props = {
  candidate: number
  stage: OfficeStage
  hired: number[]
  paused: boolean
  onReady: () => void
}

function Furniture() {
  return (
    <group>
      <Clay color="#9da99f" size={[13, 0.2, 7]} position={[0, -0.18, 0]} />
      <Clay color="#d6dacd" size={[13, 4.5, 0.2]} position={[0, 2, -2.7]} />
      <group position={[-3.7, 1.2, -2.4]}>
        <Clay color="#50675f" size={[2, 2.3, 0.5]} />
        {[0.62, 0, -0.62].map((y) => (
          <group key={y} position={[0, y, 0.29]}>
            <Clay color="#81958b" size={[1.83, 0.53, 0.11]} />
            <Clay
              color="#d3c19b"
              size={[0.48, 0.085, 0.1]}
              position={[0, 0, 0.1]}
            />
            <Clay
              color="#ebe8d7"
              size={[0.26, 0.1, 0.025]}
              position={[0.57, 0.07, 0.08]}
            />
          </group>
        ))}
      </group>
      <group position={[0.2, 2.6, -2.47]}>
        <Clay color="#f1eee0" size={[3.6, 1.7, 0.14]} />
        <Clay
          color="#a8c9c8"
          size={[3.36, 1.49, 0.1]}
          position={[0, 0, 0.12]}
        />
        <Clay
          color="#f1eee0"
          size={[0.075, 1.5, 0.13]}
          position={[0, 0, 0.18]}
        />
        <Clay
          color="#f1eee0"
          size={[3.4, 0.075, 0.13]}
          position={[0, 0, 0.18]}
        />
        <Clay
          color="#f1eee0"
          size={[3.8, 0.12, 0.42]}
          position={[0, -0.9, 0.1]}
        />
      </group>
      <group position={[4.3, 0.4, -1.8]}>
        <Clay shape="cylinder" color="#ad7450" size={[0.6, 0.8, 0.6]} />
        <Clay
          shape="cylinder"
          color="#345b46"
          size={[0.09, 1.2, 0.09]}
          position={[0, 0.85, 0]}
        />
        {[-1, 0, 1].map((side) => (
          <Clay
            key={side}
            shape="sphere"
            color={side === 0 ? '#618565' : '#769573'}
            size={[0.8, 1, 0.45]}
            position={[side * 0.25, 1.2 + (side === 0 ? 0.45 : 0), 0]}
            rotation={[0, 0, -side * 0.6]}
          />
        ))}
      </group>
      <Clay color="#65523b" size={[11, 0.24, 2.4]} position={[0, 0.65, 1.35]} />
      <Clay
        color="#aa8858"
        size={[11, 0.09, 2.45]}
        position={[0, 0.81, 1.35]}
      />
      <Clay
        color="#5d6151"
        size={[9.2, 0.03, 1.6]}
        position={[0, 0.875, 1.7]}
      />
      <group position={[-3.5, 0.9, 0.8]} rotation={[0, 0.2, 0]}>
        <Clay color="#d3cdb6" size={[1.3, 1.05, 0.9]} position={[0, 0.62, 0]} />
        <Clay
          color="#334b45"
          size={[1.1, 0.72, 0.05]}
          position={[0, 0.72, 0.47]}
        />
        <Clay
          color="#aec4aa"
          size={[0.78, 0.045, 0.02]}
          position={[-0.07, 0.89, 0.51]}
        />
        <Clay
          color="#aec4aa"
          size={[0.45, 0.045, 0.02]}
          position={[-0.23, 0.73, 0.51]}
        />
        <Clay
          color="#e5b647"
          size={[0.15, 0.045, 0.02]}
          position={[-0.38, 0.57, 0.51]}
        />
        <Clay
          color="#c9c1a7"
          size={[1.38, 0.1, 0.48]}
          position={[0, 0.06, 0.6]}
        />
        {[0, 1, 2].map((i) => (
          <Clay
            key={i}
            color="#918a77"
            size={[1.04, 0.014, 0.045]}
            position={[0, 0.12, 0.46 + i * 0.12]}
          />
        ))}
      </group>
      <group position={[3.5, 0.9, 1]}>
        <Clay
          shape="cylinder"
          color="#bd8c26"
          size={[0.7, 0.12, 0.7]}
          position={[0, 0.02, 0]}
        />
        <Clay
          shape="cylinder"
          color="#dfb83c"
          size={[0.08, 1.1, 0.08]}
          position={[0, 0.53, 0]}
          rotation={[0, 0, -0.3]}
        />
        <Clay
          shape="cone"
          color="#eabe3e"
          size={[0.8, 0.45, 0.8]}
          position={[0.22, 1.17, 0]}
          rotation={[0.2, 0, -0.4]}
        />
        <pointLight
          position={[0.35, 1, 0.2]}
          intensity={3}
          color="#ffd58c"
          distance={4}
        />
      </group>
      <group position={[2.3, 0.9, 1.4]} rotation={[0, -0.2, 0]}>
        <Clay color="#efe8d1" size={[0.85, 0.12, 1.1]} />
        <Clay
          color="#b94e45"
          size={[0.3, 0.07, 0.12]}
          position={[0.19, 0.08, -0.32]}
        />
      </group>
    </group>
  )
}

function Office({ candidate, stage, hired, paused, onReady }: Props) {
  const { camera, size } = useThree()
  const person = useRef<Group>(null)
  const scanner = useRef<Group>(null)
  const time = useRef(0)
  useEffect(() => {
    camera.position.set(0, 3.5, 9)
    camera.lookAt(0, 1.3, 0)
    camera.zoom = size.width / (size.width < 550 ? 8 : 12)
    camera.updateProjectionMatrix()
  }, [camera, size.width])
  useEffect(onReady, [onReady])
  useFrame((_, delta) => {
    if (!paused) time.current += Math.min(delta, 0.05)
    const t = time.current
    if (person.current) {
      person.current.visible = stage !== 'closed'
      const leaving = stage === 'rejected' ? -5.5 : stage === 'hired' ? 3.1 : 0
      person.current.position.x = paused
        ? leaving
        : MathUtils.damp(person.current.position.x, leaving, 2.5, delta)
      const head = person.current.getObjectByName(shopperParts.head)
      if (head)
        head.rotation.z = paused
          ? 0
          : Math.sin(t * (stage === 'interview' ? 3 : 1.2)) * 0.06
      person.current.rotation.y = stage === 'rejected' ? -0.9 : 0
    }
    if (scanner.current) {
      scanner.current.visible = stage === 'security'
      scanner.current.position.x = paused ? 0 : Math.sin(t * 4) * 0.44
    }
  })
  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#fff2d5', '#567463', 1.4]} />
      <directionalLight
        position={[-6, 10, 8]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-normalBias={0.035}
        shadow-bias={-0.0002}
      />
      <Furniture />
      <group key={candidate} ref={person} position={[0, 0, -0.1]} scale={1.7}>
        <Shopper
          variant={candidate + 1}
          pose={stage === 'hired' || stage === 'offer' ? 'wave' : 'stand'}
          color={
            ['#45677a', '#a95245', '#6d7950', '#bd9050', '#837595', '#48847d'][
              candidate % 6
            ]
          }
        />
      </group>
      <group position={[0, 0.9, 1.4]} rotation={[0, 0.13, 0]}>
        <Clay color="#f4eedb" size={[1.3, 0.02, 0.75]} />
        {[0, 1, 2].map((i) => (
          <Clay
            key={i}
            color="#8f9484"
            size={[0.5 + i * 0.2, 0.012, 0.015]}
            position={[0, 0.018, -0.12 + i * 0.11]}
          />
        ))}
        <group ref={scanner}>
          <Clay
            color="#9bc9a7"
            size={[0.025, 0.02, 0.72]}
            position={[0, 0.04, 0]}
          />
        </group>
      </group>
      {hired.map((variant, i) => (
        <group
          key={variant}
          position={[2.2 + i * 0.95, 0.16, -1.75]}
          scale={1.05}
        >
          <Clay
            color="#c4973d"
            size={[0.6, 0.2, 0.65]}
            position={[0, -0.08, 0]}
          />
          <Shopper variant={variant + 1} pose="sit" color="#7e9675" />
        </group>
      ))}
    </>
  )
}

export default function HiringOffice(props: Props) {
  return (
    <Canvas
      orthographic
      shadows="soft"
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ position: [0, 3.5, 9], zoom: 70, near: 0.1, far: 60 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Office {...props} />
    </Canvas>
  )
}
