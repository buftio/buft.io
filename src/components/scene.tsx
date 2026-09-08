'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { projects, projectAngle, projectPosition } from '@/lib/projects'
import { Flower } from './three/flower'
import { FireCircle } from './three/fire'
import { Rock, Samurai } from './three/samurai'
import { GardenBloom } from './three/garden-bloom'
import { advanceRail } from './three/rail-motion'

export type SceneProps = {
  progress: React.RefObject<number>
  active: number
  selected: number | null
  reduced: boolean
  onOpen: (index: number) => void
}

function CameraRail({ progress, selected, reduced }: SceneProps) {
  const current = useRef({
    position: selected ?? progress.current,
    velocity: 0,
  })
  const desired = useRef(new THREE.Vector3())
  const framing = useRef({
    distance: 11.8,
    shift: -1.8,
    forward: 1.2,
    height: 2.5,
    lookY: -0.2,
    parallax: 0,
  })
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
    if (reduced) {
      current.current.position = target
      current.current.velocity = 0
    } else advanceRail(current.current, target, delta)
    const a = projectAngle(current.current.position)
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
    const frame = framing.current
    const settle = (from: number, to: number) =>
      reduced ? to : THREE.MathUtils.damp(from, to, 3.5, step)
    frame.distance = settle(frame.distance, distance)
    frame.shift = settle(frame.shift, shift)
    frame.forward = settle(frame.forward, forward)
    frame.height = settle(frame.height, selected !== null ? 2 - dive : 2.5)
    frame.lookY = settle(frame.lookY, -0.2 - dive * 0.5)
    frame.parallax = settle(
      frame.parallax,
      !reduced && selected === null ? pointer.x * 0.1 : 0,
    )
    camera.position.set(
      Math.sin(a) * frame.distance + frame.parallax,
      frame.height,
      Math.cos(a) * frame.distance,
    )
    desired.current.set(
      Math.sin(a) * frame.forward + Math.cos(a) * frame.shift,
      frame.lookY,
      Math.cos(a) * frame.forward - Math.sin(a) * frame.shift,
    )
    camera.lookAt(desired.current)
  })
  return null
}

function FlowerLights({ active, reduced }: SceneProps) {
  const lights = useRef<THREE.PointLight[]>([])
  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05)
    lights.current.forEach((light, i) => {
      if (!light) return
      const index = Math.max(0, active) + i - 1
      const inside = index >= 0 && index < projects.length
      const [x, y, z] = projectPosition(inside ? index : Math.max(0, active))
      const target = inside ? (i === 1 && active >= 0 ? 4 : 1.2) : 0
      if (reduced) {
        light.position.set(x, y + 0.5, z)
        light.intensity = target
        return
      }
      light.position.x = THREE.MathUtils.damp(light.position.x, x, 5, step)
      light.position.z = THREE.MathUtils.damp(light.position.z, z, 5, step)
      light.position.y = y + 0.5
      light.intensity = THREE.MathUtils.damp(light.intensity, target, 5, step)
    })
  })
  return (
    <>
      {[0, 1, 2].map((i) => (
        <pointLight
          key={i}
          ref={(node) => {
            if (node) lights.current[i] = node
          }}
          color="#ff7b26"
          distance={3}
        />
      ))}
    </>
  )
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
      {projects.map((project, index) => (
        <Flower
          key={project.id}
          project={project}
          index={index}
          active={props.active === index}
          near={Math.abs(index - Math.max(0, props.active)) <= 1}
          open={props.selected === index}
          reduced={props.reduced}
          onOpen={() => props.onOpen(index)}
        />
      ))}
      <FlowerLights {...props} />
      <CameraRail {...props} />
      <GardenBloom />
    </Canvas>
  )
}
