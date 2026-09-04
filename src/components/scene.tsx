'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { projects, projectAngle } from '@/lib/projects'
import { Flower } from './three/flower'
import { FireCircle } from './three/fire'
import { Rock, Samurai } from './three/samurai'

export type SceneProps = {
  progress: React.RefObject<number>
  active: number
  selected: number | null
  reduced: boolean
  onOpen: (index: number) => void
}

function CameraRail({ progress, selected, reduced }: SceneProps) {
  const current = useRef(-1)
  const look = useRef(new THREE.Vector3(-1.5, -0.1, 0))
  const desired = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  const entry = useRef({ project: selected, time: 1 })
  useFrame(({ camera, size, pointer }, delta) => {
    const step = Math.min(delta, 0.05)
    if (entry.current.project !== selected)
      entry.current = { project: selected, time: 0 }
    entry.current.time = Math.min(1, entry.current.time + step / 1.1)
    const dive =
      selected !== null && !reduced
        ? Math.sin(entry.current.time * Math.PI) ** 2
        : 0
    const target = selected ?? progress.current
    current.current = reduced
      ? target
      : THREE.MathUtils.damp(current.current, target, 3.5, step)
    const a = projectAngle(current.current)
    const mobile = size.width < 700
    const distance =
      selected !== null
        ? (mobile ? 11 : 9.6) - dive * 2.2
        : mobile
          ? 14.8
          : 11.8
    const shift =
      selected !== null
        ? mobile
          ? 0
          : 3.6 * (1 - dive * 0.55)
        : mobile
          ? 0
          : -1.8
    const forward = 1.2 + dive * 2.6
    destination.current.set(
      Math.sin(a) * distance,
      selected !== null ? 2.0 - dive : 2.5,
      Math.cos(a) * distance,
    )
    desired.current.set(
      Math.sin(a) * forward + Math.cos(a) * shift,
      -0.2 - dive * 0.5,
      Math.cos(a) * forward - Math.sin(a) * shift,
    )
    if (!reduced && selected === null) destination.current.x += pointer.x * 0.1
    camera.position.lerp(
      destination.current,
      reduced ? 1 : 1 - Math.exp(-step * 3.5),
    )
    look.current.lerp(desired.current, reduced ? 1 : 1 - Math.exp(-step * 3.5))
    camera.lookAt(look.current)
  })
  return null
}

export function Scene(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [-6.5, 2.5, 10], fov: 43 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={['#10090b']} />
      <fog attach="fog" args={['#10090b', 13, 34]} />
      <ambientLight intensity={0.36} color="#e5d2c9" />
      <hemisphereLight args={['#b9d6ff', '#382015', 0.7]} />
      <directionalLight position={[-3, 6, 5]} intensity={2.2} color="#f3c59b" />
      <directionalLight position={[4, 4, -5]} intensity={1.2} color="#8b99ba" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
        <circleGeometry args={[35, 80]} />
        <meshStandardMaterial
          color="#10090b"
          roughness={0.82}
          metalness={0.2}
        />
      </mesh>
      {[2.65, 5.2, 7.7].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.12, 0]}>
          <ringGeometry args={[r, r + 0.012, 128]} />
          <meshBasicMaterial
            color={i === 0 ? '#ac5427' : '#694333'}
            transparent
            opacity={0.28}
          />
        </mesh>
      ))}
      <Suspense fallback={null}>
        <group
          rotation={[0, -Math.PI / 2, 0]}
          scale={1.22}
          position={[0, 0.46, 0]}
        >
          <group scale={1.55} position={[0, -0.32, 0]}>
            <Samurai reduced={props.reduced} />
          </group>
          <Rock />
        </group>
      </Suspense>
      <FireCircle reduced={props.reduced} />
      {projects.map(
        (project, index) =>
          Math.abs(index - Math.max(0, props.active)) <= 1 && (
            <Flower
              key={project.id}
              project={project}
              index={index}
              active={props.active === index}
              open={props.selected === index}
              reduced={props.reduced}
              onOpen={() => props.onOpen(index)}
            />
          ),
      )}
      <CameraRail {...props} />
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={1} intensity={0.65} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
