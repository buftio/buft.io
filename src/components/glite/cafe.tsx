'use client'

import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { MathUtils } from 'three'
import {
  Clay,
  DesertEnvironment,
  DesertHat,
  Reveal,
} from '../three/glite-desert'

type Props = {
  corrected: boolean
  evening: boolean
  paused: boolean
  onReady: () => void
  onLamp: () => void
}

export function clearCafe() {
  useGLTF.clear('/glite-room.glb')
}

function Plate({ corrected, paused }: Pick<Props, 'corrected' | 'paused'>) {
  return (
    <group position={[0, 0.78, 0]}>
      <mesh>
        <cylinderGeometry args={[0.47, 0.42, 0.045, 48]} />
        <meshStandardMaterial color="#fcf0d5" roughness={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
        <torusGeometry args={[0.42, 0.023, 12, 48]} />
        <meshStandardMaterial color="#4a9384" roughness={0.6} />
      </mesh>
      <Reveal show={!corrected} paused={paused}>
        <Clay
          position={[0, 0.05, 0]}
          scale={[0.36, 0.09, 0.34]}
          color="#e2b066"
        />
        <Clay
          position={[-0.12, 0.11, 0.08]}
          scale={[0.21, 0.14, 0.19]}
          color="#eac38b"
        />
        <Clay
          position={[0.16, 0.08, -0.08]}
          scale={[0.15, 0.1, 0.22]}
          color="#eac38b"
        />
        <group position={[0.06, 0.16, -0.08]}>
          <Clay
            position={[0, 0.16, 0]}
            scale={[0.066, 0.25, 0.062]}
            color="#51856b"
          />
          <Clay
            position={[-0.075, 0.12, 0]}
            scale={[0.09, 0.035, 0.035]}
            color="#51856b"
          />
          <Clay
            position={[-0.14, 0.17, 0]}
            scale={[0.035, 0.085, 0.035]}
            color="#51856b"
          />
          <Clay
            position={[0.07, 0.21, 0]}
            scale={[0.08, 0.035, 0.035]}
            color="#51856b"
          />
          <Clay
            position={[0.13, 0.25, 0]}
            scale={[0.035, 0.075, 0.035]}
            color="#51856b"
          />
        </group>
      </Reveal>
      <Reveal show={corrected} paused={paused}>
        {[0.07, 0.15, 0.23].map((y, i) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.29, 0.29, 0.08, 48]} />
            <meshStandardMaterial
              color={i === 1 ? '#a74946' : '#ebc78e'}
              roughness={0.9}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.3, 0.29, 0.06, 48]} />
          <meshStandardMaterial color="#fff2d5" roughness={0.8} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return (
            <Clay
              key={i}
              position={[Math.sin(a) * 0.25, 0.3, Math.cos(a) * 0.25]}
              scale={[0.055, 0.04, 0.055]}
              color="#fff2d5"
            />
          )
        })}
        <Clay
          position={[0, 0.37, 0]}
          scale={[0.09, 0.11, 0.075]}
          color="#bb4f42"
        />
        <Clay
          position={[0, 0.47, 0]}
          scale={[0.085, 0.018, 0.065]}
          color="#4f815c"
        />
      </Reveal>
    </group>
  )
}

function Characters({
  corrected,
  paused,
  onReady,
  onLamp,
}: Pick<Props, 'corrected' | 'paused' | 'onReady' | 'onLamp'>) {
  const source = useGLTF('/glite-room.glb')
  const scene = useMemo(() => {
    const result = clone(source.scene)
    const keep = new Set([
      'Table',
      'StoolA',
      'StoolB',
      'Lamp',
      'Plant',
      'BookStack',
      'Rug',
      'RugInner',
    ])
    const room = result.getObjectByName('Room')
    room?.children.forEach((item) => {
      item.visible = keep.has(item.name)
    })
    const table = result.getObjectByName('Table')
    table?.children.forEach((item) => {
      if (item.name.includes('Notebook') || item.name.includes('Pencil'))
        item.visible = false
    })
    return result
  }, [source.scene])
  const decor = useMemo(
    () =>
      ['Plant', 'BookStack', 'Rug', 'RugInner']
        .map((name) => scene.getObjectByName(name))
        .filter((item) => item !== undefined)
        .map((object) => ({ object, scale: object.scale.clone() })),
    [scene],
  )
  const lamp = scene.getObjectByName('Lamp')
  const lampBase = scene.getObjectByName('LampBase')
  const head = scene.getObjectByName('TutorHead')
  const decorAmount = useRef(corrected ? 1 : 0.001)
  useFrame((_, delta) => {
    const speed = paused ? 1000 : 7
    decorAmount.current = paused
      ? corrected
        ? 1
        : 0.001
      : MathUtils.damp(
          decorAmount.current,
          corrected ? 1 : 0.001,
          speed,
          Math.min(delta, 0.05),
        )
    for (const { object, scale } of decor) {
      object.scale.copy(scale).multiplyScalar(decorAmount.current)
      object.visible = decorAmount.current > 0.005
    }
    if (lampBase) lampBase.visible = corrected
    if (lamp) {
      lamp.position.y = MathUtils.damp(
        lamp.position.y,
        corrected ? 0 : -0.8,
        speed,
        Math.min(delta, 0.05),
      )
      lamp.rotation.z = MathUtils.damp(
        lamp.rotation.z,
        corrected ? 0 : -0.5,
        speed,
        Math.min(delta, 0.05),
      )
    }
  })
  const { actions } = useAnimations(source.animations, scene)
  useEffect(() => {
    actions.Conversation?.play()
    return () => {
      actions.Conversation?.stop()
    }
  }, [actions])
  useEffect(() => {
    if (actions.Conversation) actions.Conversation.paused = paused
  }, [actions, paused])
  useEffect(onReady, [onReady])
  return (
    <>
      <primitive
        object={scene}
        onClick={(event: {
          object: { name: string }
          stopPropagation: () => void
        }) => {
          if (event.object.name.startsWith('Lamp')) {
            event.stopPropagation()
            onLamp()
          }
        }}
      />
      {head &&
        createPortal(<DesertHat show={!corrected} paused={paused} />, head)}
    </>
  )
}

function Camera() {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(4.2, 4.4, 6)
    camera.lookAt(0, 0.85, -0.2)
    camera.zoom = Math.min(size.width / 6, size.height / 4.2)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Lighting({
  corrected,
  evening,
  paused,
}: Pick<Props, 'corrected' | 'evening' | 'paused'>) {
  const lamp = useRef<import('three').PointLight>(null)
  const sun = useRef<import('three').DirectionalLight>(null)
  useFrame((_, delta) => {
    if (sun.current)
      sun.current.intensity = MathUtils.damp(
        sun.current.intensity,
        corrected ? 2.5 : 3.4,
        paused ? 1000 : 5,
        Math.min(delta, 0.05),
      )
    if (lamp.current)
      lamp.current.intensity = MathUtils.damp(
        lamp.current.intensity,
        evening ? 4 : 0,
        paused ? 1000 : 5,
        Math.min(delta, 0.05),
      )
  })
  return (
    <>
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#fff1d3', '#768374', 1.4]} />
      <directionalLight
        ref={sun}
        position={[3, 6, 5]}
        intensity={2.5}
        color="#ffe9c3"
      />
      <pointLight
        ref={lamp}
        position={[1.65, 1.6, -1.35]}
        color="#ffb858"
        distance={5}
        decay={2}
      />
    </>
  )
}

export default function Cafe(props: Props) {
  return (
    <Canvas
      orthographic
      camera={{ position: [4.2, 4.4, 6], zoom: 85 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Camera />
      <Lighting
        corrected={props.corrected}
        evening={props.evening}
        paused={props.paused}
      />
      <Suspense fallback={null}>
        <Characters
          corrected={props.corrected}
          paused={props.paused}
          onReady={props.onReady}
          onLamp={props.onLamp}
        />
        <Plate corrected={props.corrected} paused={props.paused} />
        <DesertEnvironment show={!props.corrected} paused={props.paused} />
        <ContactShadows
          position={[0, -0.04, 0]}
          opacity={0.3}
          scale={7}
          blur={2.5}
          far={3}
          resolution={256}
          frames={props.paused ? 1 : 120}
        />
      </Suspense>
    </Canvas>
  )
}
